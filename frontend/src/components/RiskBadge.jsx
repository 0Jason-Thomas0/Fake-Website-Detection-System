/**
 * RiskBadge — Color-coded risk level indicator
 * Props: level = "Low" | "Medium" | "High"
 */
export default function RiskBadge({ level }) {
  const config = {
    Low:    { cls: 'badge badge-low',    icon: '✓', label: 'Low Risk' },
    Medium: { cls: 'badge badge-medium', icon: '⚠', label: 'Medium Risk' },
    High:   { cls: 'badge badge-high',   icon: '✕', label: 'High Risk' },
  }
  const { cls, icon, label } = config[level] || config.High

  return (
    <span className={cls}>
      <span>{icon}</span>
      {label}
    </span>
  )
}
