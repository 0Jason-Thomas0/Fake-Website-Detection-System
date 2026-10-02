export default function RiskBadge({ level }) {
  const config = {
    Low:    { cls: 'badge badge-low',    label: 'Low' },
    Medium: { cls: 'badge badge-medium', label: 'Medium' },
    High:   { cls: 'badge badge-high',   label: 'High' },
  }
  const { cls, label } = config[level] || config.High
  return <span className={cls}>{label}</span>
}
