import { useEffect, useRef, useState } from 'react';
import { apiGet } from '../../api/client';

const GROUP_LABELS = {
  tasks: 'Aufgaben',
  contacts: 'Kontakte',
  projects: 'Projekte',
  documents: 'Unterlagen',
  agenda: 'Besprechung',
  costs: 'Kosten',
  invoices: 'Rechnungen',
};

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const data = await apiGet(`/search?q=${encodeURIComponent(query.trim())}`);
      setResults(data);
      setOpen(true);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const groups = results ? Object.entries(results).filter(([, items]) => items.length > 0) : [];

  return (
    <div className="header-search" ref={containerRef}>
      <input
        className="header-search-input"
        placeholder="Suchen…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.trim() && setOpen(true)}
      />
      {open && results && (
        <div className="header-search-results">
          {groups.length === 0 && <div className="task-empty">Keine Treffer</div>}
          {groups.map(([key, items]) => (
            <div key={key} className="header-search-group">
              <div className="header-search-group-title">{GROUP_LABELS[key] || key}</div>
              {items.map((item) => (
                <div key={item.id} className="header-search-item">
                  {item.title}
                  {item.subtitle && <span className="header-search-item-sub"> · {item.subtitle}</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
