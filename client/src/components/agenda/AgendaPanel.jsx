import { useState } from 'react';
import { useAgenda } from '../../hooks/useAgenda';
import Button from '../common/Button';
import './Agenda.css';

export default function AgendaPanel({ readOnly }) {
  const { items, loading, error, create, update, remove } = useAgenda();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setAdding(true);
    try {
      await create({ title: title.trim(), notes: notes.trim() || null });
      setTitle('');
      setNotes('');
    } finally {
      setAdding(false);
    }
  };

  const open = items.filter((i) => !i.done);
  const done = items.filter((i) => i.done);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Nächste Besprechung</h2>
      </div>

      {!readOnly && (
        <form className="agenda-add-form" onSubmit={handleAdd}>
          <input
            placeholder="Thema hinzufügen…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            placeholder="Notiz (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Button type="submit" disabled={adding || !title.trim()}>
            + Hinzufügen
          </Button>
        </form>
      )}

      {error && <div className="form-error">{error}</div>}
      {loading && <div className="task-empty">Lädt…</div>}
      {!loading && items.length === 0 && <div className="task-empty">Noch keine Themen gesammelt</div>}

      {open.length > 0 && (
        <ul className="agenda-list">
          {open.map((item) => (
            <li key={item.id} className="agenda-item">
              <label className="agenda-item-check">
                <input
                  type="checkbox"
                  checked={false}
                  disabled={readOnly}
                  onChange={() => update(item.id, { done: true })}
                />
              </label>
              <div className="agenda-item-body">
                <div className="agenda-item-title">{item.title}</div>
                {item.notes && <div className="agenda-item-notes">{item.notes}</div>}
                {item.addedBy && <div className="agenda-item-meta">von {item.addedBy}</div>}
              </div>
              {!readOnly && (
                <button className="agenda-item-delete" onClick={() => remove(item.id)} title="Löschen">
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {done.length > 0 && (
        <div className="agenda-done-group">
          <div className="agenda-done-title">Besprochen ({done.length})</div>
          <ul className="agenda-list">
            {done.map((item) => (
              <li key={item.id} className="agenda-item agenda-item-done">
                <label className="agenda-item-check">
                  <input
                    type="checkbox"
                    checked
                    disabled={readOnly}
                    onChange={() => update(item.id, { done: false })}
                  />
                </label>
                <div className="agenda-item-body">
                  <div className="agenda-item-title">{item.title}</div>
                  {item.addedBy && <div className="agenda-item-meta">von {item.addedBy}</div>}
                </div>
                {!readOnly && (
                  <button className="agenda-item-delete" onClick={() => remove(item.id)} title="Löschen">
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
