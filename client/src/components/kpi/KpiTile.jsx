import './Kpi.css';

export default function KpiTile({ label, value, accent }) {
  return (
    <div className="kpi-tile">
      <div className="kpi-value" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      <div className="kpi-label">{label}</div>
    </div>
  );
}
