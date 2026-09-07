export default function CalendarDayCell({
  date,
  inMonth,
  isToday,
  events,
  tasksDue = [],
  projectsDue = [],
  onAdd,
  onSelectEvent,
  readOnly = false,
}) {
  return (
    <div className={`cal-cell ${inMonth ? '' : 'cal-cell-outside'} ${isToday ? 'cal-cell-today' : ''}`}>
      <div className="cal-cell-header">
        <span className="cal-cell-date">{date.getDate()}</span>
        {!readOnly && (
          <button className="cal-cell-add" onClick={() => onAdd(date)} title="Termin hinzufügen">
            +
          </button>
        )}
      </div>
      <div className="cal-cell-events">
        {events.slice(0, 3).map((ev) =>
          readOnly ? (
            <div
              key={ev.id}
              className={`cal-event-pill cal-event-pill-${ev.priority || 'medium'} cal-event-pill-readonly`}
              title={ev.title}
            >
              {ev.title}
            </div>
          ) : (
            <button
              key={ev.id}
              className={`cal-event-pill cal-event-pill-${ev.priority || 'medium'}`}
              onClick={() => onSelectEvent(ev)}
              title={ev.title}
            >
              {ev.title}
            </button>
          )
        )}
        {events.length > 3 && <div className="cal-event-more">+{events.length - 3} mehr</div>}

        {tasksDue.slice(0, 2).map((t) => {
          const unfinished = t.status !== 'done';
          return (
            <div
              key={`task-${t.id}`}
              className={`cal-task-pill ${unfinished ? 'cal-task-pill-unfinished' : ''}`}
              title={`Aufgabe fällig: ${t.title}`}
            >
              {unfinished ? t.title : `✓ ${t.title}`}
            </div>
          );
        })}
        {tasksDue.length > 2 && <div className="cal-event-more">+{tasksDue.length - 2} Aufgabe(n)</div>}

        {projectsDue.slice(0, 2).map((p) => {
          const unfinished = p.status !== 'done';
          return (
            <div
              key={`project-${p.id}`}
              className={`cal-project-pill ${unfinished ? 'cal-project-pill-unfinished' : ''}`}
              style={unfinished ? undefined : { borderLeftColor: p.color }}
              title={`Projekt-Deadline: ${p.name}`}
            >
              📁 {p.name}
            </div>
          );
        })}
        {projectsDue.length > 2 && <div className="cal-event-more">+{projectsDue.length - 2} Projekt(e)</div>}
      </div>
    </div>
  );
}
