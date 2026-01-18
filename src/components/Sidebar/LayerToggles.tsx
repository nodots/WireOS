import { useBosData } from '../../hooks/useBosData';
import { LAYER_CONFIG, type BosLayer } from '../../types/bos';
import { Toggle } from '../common/Toggle';

const LAYERS: { key: BosLayer; label: string }[] = [
  { key: 'geography', label: 'Geography' },
  { key: 'institutions', label: 'Institutions' },
  { key: 'flows', label: 'Flows' },
  { key: 'borders', label: 'Borders' },
];

export function LayerToggles() {
  const { state, toggleLayer } = useBosData();

  return (
    <div className="layer-toggles">
      <h3>Layers</h3>
      {LAYERS.map(({ key, label }) => (
        <Toggle
          key={key}
          label={label}
          checked={state.visibleLayers[key]}
          onChange={() => toggleLayer(key)}
          color={LAYER_CONFIG[key].color}
        />
      ))}
    </div>
  );
}
