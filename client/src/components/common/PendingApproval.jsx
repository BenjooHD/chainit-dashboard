export default function PendingApproval() {
  return (
    <div className="panel" style={{ maxWidth: 480, margin: '3rem auto', textAlign: 'center' }}>
      <h2 style={{ marginTop: 0 }}>Warte auf Freischaltung</h2>
      <p style={{ color: 'var(--color-text-muted)' }}>
        Dein Account ist bestätigt, aber du hast noch keinen Zugriff auf einen Bereich. Ein Admin muss
        dir zuerst Rechte für Kalender, Aufgaben und/oder Kontakte geben.
      </p>
      <p style={{ color: 'var(--color-text-muted)' }}>
        Du kannst unten schon mit einem Admin chatten, um Bescheid zu geben.
      </p>
    </div>
  );
}
