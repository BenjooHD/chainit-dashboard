import './QuickNav.css';

export default function QuickNav({ sections }) {
  const scrollTo = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const visible = sections.filter((s) => s.show);
  if (visible.length === 0) return null;

  return (
    <nav className="quick-nav">
      {visible.map((s) => (
        <button key={s.key} className="quick-nav-item" onClick={() => scrollTo(s.ref)}>
          {s.label}
        </button>
      ))}
    </nav>
  );
}
