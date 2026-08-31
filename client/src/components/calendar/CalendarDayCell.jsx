export default function CalendarDayCell({ date, inMonth, isToday, events, onAdd, onSelectEvent, readOnly = false }) {
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
      </div>
    </div>
  );
}
