import { validateEpisodeFormat } from '../../utils/episode';

interface EpisodeInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
}

export function EpisodeInput({ value, onChange, error }: EpisodeInputProps) {
  const handleChange = (newValue: string) => {
    const upperValue = newValue.toUpperCase();
    onChange(upperValue);
  };

  const isValid = value === '' || validateEpisodeFormat(value);

  return (
    <div className="form-group">
      <label htmlFor="firstSeen">First Seen (Episode)</label>
      <input
        id="firstSeen"
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="S01E01"
        maxLength={6}
        className={!isValid || error ? 'input-error' : ''}
      />
      {!isValid && <span className="error-message">Format: SxxExx</span>}
      {error && isValid && <span className="error-message">{error}</span>}
      <span className="help-text">
        Episode when this location/feature first appears
      </span>
    </div>
  );
}
