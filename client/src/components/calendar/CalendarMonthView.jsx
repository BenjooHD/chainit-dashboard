import { useMemo, useState } from 'react';
import CalendarDayCell from './CalendarDayCell';
import EventFormModal from './EventFormModal';
import Button from '../common/Button';
import ConfirmDialog from '../common/ConfirmDialog';
import { useEvents } from '../../hooks/useEvents';
import './Calendar.css';

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function buildMonthGrid(monthDate) {
  const first = startOfMonth(monthDate);
  const firstWeekday = (first.getDay() + 6) % 7; // Monday = 0
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - firstWeekday);

  const days = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }
  return days;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function dateKey(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function CalendarMonthView({ onChange, readOnly = false }) {
  const [monthDate, setMonthDate] = useState(() => startOfMonth(new Date()));
  const { events, create, update, remove } = useEvents(monthDate, onChange);
  const [modalDate, setModalDate] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const days = useMemo(() => buildMonthGrid(monthDate), [monthDate]);
  const today = new Date();

  const eventsByDay = useMemo(() => {
    const map = {};
    for (const ev of events) {
      const start = new Date(ev.startAt);
      const end = new Date(ev.endAt);
      const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const lastDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      while (cursor <= lastDay) {
        const key = dateKey(cursor);
        if (!map[key]) map[key] = [];
        map[key].push(ev);
        cursor.setDate(cursor.getDate() + 1);
      }
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
    }
    return map;
  }, [events]);

  const monthLabel = monthDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

  const goPrev = () => setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goNext = () => setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const goToday = () => setMonthDate(startOfMonth(new Date()));

  const handleSave = async (payload) => {
    if (editingEvent) {
      await update(editingEvent.id, payload);
    } else {
      await create(payload);
    }
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Terminkalender</h2>
        <div className="cal-nav">
          <Button variant="secondary" onClick={goPrev}>
            ‹
          </Button>
          <Button variant="secondary" onClick={goToday}>
            Heute
          </Button>
          <Button variant="secondary" onClick={goNext}>
            ›
          </Button>
          <span className="cal-month-label">{monthLabel}</span>
        </div>
      </div>

      <div className="cal-grid cal-grid-header">
        {WEEKDAYS.map((w) => (
          <div key={w} className="cal-weekday">
            {w}
          </div>
        ))}
      </div>
      <div className="cal-grid">
        {days.map((d) => (
          <CalendarDayCell
            key={d.toISOString()}
            date={d}
            inMonth={d.getMonth() === monthDate.getMonth()}
            isToday={isSameDay(d, today)}
            events={eventsByDay[dateKey(d)] || []}
            onAdd={readOnly ? undefined : setModalDate}
            onSelectEvent={readOnly ? undefined : setEditingEvent}
            readOnly={readOnly}
          />
        ))}
      </div>

      {(modalDate || editingEvent) && (
        <EventFormModal
          event={editingEvent}
          defaultDate={modalDate ? dateKey(modalDate) : undefined}
          onClose={() => {
            setModalDate(null);
            setEditingEvent(null);
          }}
          onSave={handleSave}
          onDelete={(id) => {
            setPendingDelete(id);
            setEditingEvent(null);
          }}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Termin löschen"
          message="Diesen Termin wirklich löschen?"
          onCancel={() => setPendingDelete(null)}
          onConfirm={async () => {
            await remove(pendingDelete);
            setPendingDelete(null);
          }}
        />
      )}
    </section>
  );
}
