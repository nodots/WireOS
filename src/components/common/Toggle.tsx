interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  color?: string;
}

export function Toggle({ label, checked, onChange, color }: ToggleProps) {
  return (
    <label className="toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        className="toggle-slider"
        style={color && checked ? { backgroundColor: color } : undefined}
      />
      <span className="toggle-label">{label}</span>
    </label>
  );
}
