'use client';

interface QuickNavProps {
  sections: { key: string; label: string; active: boolean; onClick: () => void }[];
}

export default function QuickNav({ sections }: QuickNavProps) {
  return (
    <nav className="quick-nav">
      {sections.map(s => (
        <button
          key={s.key}
          className={`quick-nav-item ${s.active ? 'quick-nav-item-active' : ''}`}
          onClick={s.onClick}
        >
          {s.label}
        </button>
      ))}
      <button
        className="quick-nav-top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        title="Back to top"
      >
        ↑
      </button>
    </nav>
  );
}
