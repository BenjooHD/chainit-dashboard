import './Kpi.css';

export default function KpiTile({ label, value, accent, onClick }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag className={`kpi-tile ${onClick ? 'kpi-tile-clickable' : ''}`} onClick={onClick}>
      <div className="kpi-value" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      <div className="kpi-label">{label}</div>
    </Tag>
  );
}
