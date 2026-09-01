import './QuickNav.css';

export default function QuickNav({ sections }) {
  const handleClick = (s) => {
    if (s.onClick) {
      s.onClick();
    } else {
      s.ref?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const visible = sections.filter((s) => s.show);
  if (visible.length === 0) return null;

  return (
    <nav className="quick-nav">
      {visible.map((s) => (
        <button
          key={s.key}
          className={`quick-nav-item ${s.active ? 'quick-nav-item-active' : ''}`}
          onClick={() => handleClick(s)}
        >
          {s.label}
        </button>
      ))}
      <button
        className="quick-nav-top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        title="Nach oben"
      >
        ↑
      </button>
    </nav>
  );
}
