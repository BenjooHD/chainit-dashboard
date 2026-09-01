const express = require('express');
const db = require('../db/connection');
const requirePermission = require('../middleware/requirePermission');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

const canView = requirePermission('invoices', 'view');
const canEdit = requirePermission('invoices', 'edit');
const VALID_VAT_MODE = ['standard', 'kleinunternehmer'];
const VALID_STATUS = ['offen', 'bezahlt', 'storniert'];

function serializeSettings(row) {
  return {
    companyName: row.company_name,
    companyAddress: row.company_address,
    taxId: row.tax_id,
    vatMode: row.vat_mode,
    defaultVatRate: row.default_vat_rate,
    bankName: row.bank_name,
    bankIban: row.bank_iban,
    bankBic: row.bank_bic,
    footerNote: row.footer_note,
    invoicePrefix: row.invoice_prefix,
  };
}

function getSettings() {
  return db.prepare('SELECT * FROM invoice_settings WHERE id = 1').get();
}

function computeTotals(items, vatMode, vatRate) {
  const subtotal = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
  const vatAmount = vatMode === 'kleinunternehmer' ? 0 : subtotal * (vatRate / 100);
  return { subtotal, vatAmount, total: subtotal + vatAmount };
}

function serializeInvoice(row, items) {
  const totals = computeTotals(
    items.map((it) => ({ quantity: it.quantity, unitPrice: it.unit_price })),
    row.vat_mode,
    row.vat_rate
  );
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    contactId: row.contact_id,
    customerName: row.customer_name,
    customerAddress: row.customer_address,
    issueDate: row.issue_date,
    serviceDate: row.service_date,
    dueDate: row.due_date,
    vatMode: row.vat_mode,
    vatRate: row.vat_rate,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    items: items.map((it) => ({
      id: it.id,
      position: it.position,
      description: it.description,
      quantity: it.quantity,
      unitPrice: it.unit_price,
    })),
    ...totals,
  };
}

function loadInvoice(id) {
  const row = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
  if (!row) return null;
  const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY position ASC').all(id);
  return serializeInvoice(row, items);
}

router.get('/settings', canView, (req, res) => {
  res.json(serializeSettings(getSettings()));
});

router.patch('/settings', requireAdmin, (req, res) => {
  const existing = getSettings();
  const b = req.body || {};
  const next = {
    company_name: b.companyName !== undefined ? b.companyName : existing.company_name,
    company_address: b.companyAddress !== undefined ? b.companyAddress : existing.company_address,
    tax_id: b.taxId !== undefined ? b.taxId : existing.tax_id,
    vat_mode: VALID_VAT_MODE.includes(b.vatMode) ? b.vatMode : existing.vat_mode,
    default_vat_rate: b.defaultVatRate !== undefined ? Number(b.defaultVatRate) : existing.default_vat_rate,
    bank_name: b.bankName !== undefined ? b.bankName : existing.bank_name,
    bank_iban: b.bankIban !== undefined ? b.bankIban : existing.bank_iban,
    bank_bic: b.bankBic !== undefined ? b.bankBic : existing.bank_bic,
    footer_note: b.footerNote !== undefined ? b.footerNote : existing.footer_note,
    invoice_prefix: b.invoicePrefix !== undefined && b.invoicePrefix.trim() ? b.invoicePrefix.trim() : existing.invoice_prefix,
  };

  db.prepare(
    `UPDATE invoice_settings SET company_name=?, company_address=?, tax_id=?, vat_mode=?, default_vat_rate=?,
     bank_name=?, bank_iban=?, bank_bic=?, footer_note=?, invoice_prefix=? WHERE id = 1`
  ).run(
    next.company_name,
    next.company_address,
    next.tax_id,
    next.vat_mode,
    next.default_vat_rate,
    next.bank_name,
    next.bank_iban,
    next.bank_bic,
    next.footer_note,
    next.invoice_prefix
  );

  res.json(serializeSettings(getSettings()));
});

router.get('/', canView, (req, res) => {
  const rows = db.prepare('SELECT * FROM invoices ORDER BY issue_date DESC, id DESC').all();
  const list = rows.map((row) => {
    const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(row.id);
    const totals = computeTotals(
      items.map((it) => ({ quantity: it.quantity, unitPrice: it.unit_price })),
      row.vat_mode,
      row.vat_rate
    );
    return {
      id: row.id,
      invoiceNumber: row.invoice_number,
      customerName: row.customer_name,
      issueDate: row.issue_date,
      dueDate: row.due_date,
      status: row.status,
      total: totals.total,
    };
  });
  res.json(list);
});

router.get('/:id', canView, (req, res) => {
  const invoice = loadInvoice(req.params.id);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  res.json(invoice);
});

router.post('/', canEdit, (req, res) => {
  const { customerName, customerAddress, contactId, issueDate, serviceDate, dueDate, vatMode, vatRate, notes, items } =
    req.body || {};

  if (!customerName || !String(customerName).trim()) {
    return res.status(400).json({ error: 'customerName is required' });
  }
  if (!issueDate) return res.status(400).json({ error: 'issueDate is required' });
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'At least one line item is required' });
  }
  for (const it of items) {
    if (!it.description || !String(it.description).trim()) {
      return res.status(400).json({ error: 'Every item needs a description' });
    }
    if (!Number.isFinite(Number(it.quantity)) || !Number.isFinite(Number(it.unitPrice))) {
      return res.status(400).json({ error: 'Every item needs a numeric quantity and unit price' });
    }
  }

  const settings = getSettings();
  const finalVatMode = VALID_VAT_MODE.includes(vatMode) ? vatMode : settings.vat_mode === 'kleinunternehmer' ? 'kleinunternehmer' : 'standard';
  const finalVatRate = finalVatMode === 'kleinunternehmer' ? 0 : Number(vatRate) || settings.default_vat_rate;

  db.exec('BEGIN');
  try {
    const seq = settings.next_seq;
    const year = new Date(issueDate).getFullYear();
    const invoiceNumber = `${settings.invoice_prefix}-${year}-${String(seq).padStart(4, '0')}`;

    const result = db
      .prepare(
        `INSERT INTO invoices (user_id, invoice_number, contact_id, customer_name, customer_address, issue_date, service_date, due_date, vat_mode, vat_rate, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        req.session.userId,
        invoiceNumber,
        contactId || null,
        String(customerName).trim(),
        customerAddress || null,
        issueDate,
        serviceDate || null,
        dueDate || null,
        finalVatMode,
        finalVatRate,
        notes || null
      );

    const invoiceId = result.lastInsertRowid;
    const insertItem = db.prepare(
      'INSERT INTO invoice_items (invoice_id, position, description, quantity, unit_price) VALUES (?, ?, ?, ?, ?)'
    );
    items.forEach((it, i) => {
      insertItem.run(invoiceId, i + 1, String(it.description).trim(), Number(it.quantity), Number(it.unitPrice));
    });

    db.prepare('UPDATE invoice_settings SET next_seq = ? WHERE id = 1').run(seq + 1);
    db.exec('COMMIT');

    res.status(201).json(loadInvoice(invoiceId));
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('Invoice creation failed:', err);
    res.status(500).json({ error: 'Could not create invoice' });
  }
});

router.put('/:id', canEdit, (req, res) => {
  const existing = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Invoice not found' });

  const { customerName, customerAddress, contactId, issueDate, serviceDate, dueDate, vatMode, vatRate, notes, items } =
    req.body || {};

  if (!customerName || !String(customerName).trim()) {
    return res.status(400).json({ error: 'customerName is required' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'At least one line item is required' });
  }

  const finalVatMode = VALID_VAT_MODE.includes(vatMode) ? vatMode : existing.vat_mode;
  const finalVatRate = finalVatMode === 'kleinunternehmer' ? 0 : Number(vatRate) || existing.vat_rate;

  db.exec('BEGIN');
  try {
    db.prepare(
      `UPDATE invoices SET customer_name=?, customer_address=?, contact_id=?, issue_date=?, service_date=?, due_date=?, vat_mode=?, vat_rate=?, notes=? WHERE id = ?`
    ).run(
      String(customerName).trim(),
      customerAddress || null,
      contactId || null,
      issueDate || existing.issue_date,
      serviceDate || null,
      dueDate || null,
      finalVatMode,
      finalVatRate,
      notes || null,
      req.params.id
    );

    db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(req.params.id);
    const insertItem = db.prepare(
      'INSERT INTO invoice_items (invoice_id, position, description, quantity, unit_price) VALUES (?, ?, ?, ?, ?)'
    );
    items.forEach((it, i) => {
      insertItem.run(req.params.id, i + 1, String(it.description).trim(), Number(it.quantity), Number(it.unitPrice));
    });

    db.exec('COMMIT');
    res.json(loadInvoice(req.params.id));
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('Invoice update failed:', err);
    res.status(500).json({ error: 'Could not update invoice' });
  }
});

router.patch('/:id/status', canEdit, (req, res) => {
  const { status } = req.body || {};
  if (!VALID_STATUS.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const result = db.prepare('UPDATE invoices SET status = ? WHERE id = ?').run(status, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Invoice not found' });
  res.json(loadInvoice(req.params.id));
});

router.delete('/:id', canEdit, (req, res) => {
  const result = db.prepare('DELETE FROM invoices WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Invoice not found' });
  res.json({ ok: true });
});

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function formatMoney(n) {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDateDE(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

router.get('/:id/print', canView, (req, res) => {
  const invoice = loadInvoice(req.params.id);
  if (!invoice) return res.status(404).send('Invoice not found');
  const settings = serializeSettings(getSettings());

  const rowsHtml = invoice.items
    .map(
      (it) => `
      <tr>
        <td>${it.position}</td>
        <td>${escapeHtml(it.description)}</td>
        <td class="num">${it.quantity}</td>
        <td class="num">${formatMoney(it.unitPrice)} €</td>
        <td class="num">${formatMoney(it.quantity * it.unitPrice)} €</td>
      </tr>`
    )
    .join('');

  const vatHtml =
    invoice.vatMode === 'kleinunternehmer'
      ? `<p class="vat-note">Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.</p>`
      : `<div class="totals-row"><span>USt (${invoice.vatRate}%)</span><span>${formatMoney(invoice.vatAmount)} €</span></div>`;

  const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>${escapeHtml(invoice.invoiceNumber)}</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; max-width: 720px; margin: 40px auto; padding: 0 20px; }
  .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
  .company { font-size: 13px; color: #444; white-space: pre-line; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .meta { font-size: 13px; color: #444; margin-bottom: 24px; }
  .meta div { margin-bottom: 2px; }
  .customer { white-space: pre-line; font-size: 13px; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th, td { padding: 6px 8px; border-bottom: 1px solid #ddd; font-size: 13px; text-align: left; }
  th { text-transform: uppercase; font-size: 11px; color: #666; }
  .num { text-align: right; }
  .totals { max-width: 260px; margin-left: auto; font-size: 13px; }
  .totals-row { display: flex; justify-content: space-between; padding: 3px 0; }
  .totals-row.total { font-weight: bold; font-size: 15px; border-top: 1px solid #333; margin-top: 4px; padding-top: 6px; }
  .vat-note { font-size: 12px; color: #666; margin: 6px 0 0; }
  .footer { margin-top: 40px; font-size: 12px; color: #666; white-space: pre-line; }
  .bank { margin-top: 12px; font-size: 12px; color: #666; }
  @media print { .no-print { display: none; } }
  .no-print { margin: 20px 0; }
  button { padding: 8px 16px; cursor: pointer; }
</style>
</head>
<body>
  <div class="no-print"><button onclick="window.print()">Drucken / Als PDF speichern</button></div>
  <div class="header">
    <div class="company">${escapeHtml(settings.companyName || 'ChainIt Technologies')}${settings.companyAddress ? '\n' + escapeHtml(settings.companyAddress) : ''}${settings.taxId ? '\nSteuernummer: ' + escapeHtml(settings.taxId) : ''}</div>
  </div>
  <h1>Rechnung ${escapeHtml(invoice.invoiceNumber)}</h1>
  <div class="meta">
    <div>Rechnungsdatum: ${formatDateDE(invoice.issueDate)}</div>
    ${invoice.serviceDate ? `<div>Leistungsdatum: ${formatDateDE(invoice.serviceDate)}</div>` : ''}
    ${invoice.dueDate ? `<div>Fällig am: ${formatDateDE(invoice.dueDate)}</div>` : ''}
  </div>
  <div class="customer">${escapeHtml(invoice.customerName)}${invoice.customerAddress ? '\n' + escapeHtml(invoice.customerAddress) : ''}</div>
  <table>
    <thead>
      <tr><th>Pos.</th><th>Beschreibung</th><th class="num">Menge</th><th class="num">Einzelpreis</th><th class="num">Gesamt</th></tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <div class="totals">
    <div class="totals-row"><span>Zwischensumme</span><span>${formatMoney(invoice.subtotal)} €</span></div>
    ${vatHtml}
    <div class="totals-row total"><span>Gesamtbetrag</span><span>${formatMoney(invoice.total)} €</span></div>
  </div>
  ${
    settings.bankIban
      ? `<div class="bank">Bankverbindung: ${escapeHtml(settings.bankName || '')} · IBAN ${escapeHtml(settings.bankIban)}${settings.bankBic ? ' · BIC ' + escapeHtml(settings.bankBic) : ''}</div>`
      : ''
  }
  ${invoice.notes ? `<div class="footer">${escapeHtml(invoice.notes)}</div>` : ''}
  ${settings.footerNote ? `<div class="footer">${escapeHtml(settings.footerNote)}</div>` : ''}
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

module.exports = router;
