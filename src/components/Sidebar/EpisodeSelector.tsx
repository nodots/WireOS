import { useState } from 'react';
import { useBosData } from '../../hooks/useBosData';
import { validateEpisodeFormat } from '../../utils/episode';

export function EpisodeSelector() {
  const { state, setCurrentEpisode } = useBosData();
  const [inputValue, setInputValue] = useState(state.currentEpisode);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (value: string) => {
    setInputValue(value.toUpperCase());
    setError(null);
  };

  const handleBlur = () => {
    if (inputValue === '') {
      setInputValue(state.currentEpisode);
      return;
    }

    if (validateEpisodeFormat(inputValue)) {
      setCurrentEpisode(inputValue);
      setError(null);
    } else {
      setError('Format: SxxExx (e.g., S01E01)');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className="episode-selector">
      <h3>Current Episode</h3>
      <div className="episode-input-wrapper">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="S01E01"
          maxLength={6}
          className={error ? 'input-error' : ''}
        />
        {error && <span className="error-message">{error}</span>}
      </div>
      <p className="help-text">
        Set your current viewing progress to enable episode gating.
      </p>
    </div>
  );
}
