import { useState, useEffect, useCallback } from 'react';
import { useBosData } from '../../hooks/useBosData';
import { LAYER_CONFIG, type BosLayer, type DrawingMode } from '../../types/bos';
import { createFeature } from '../../utils/geojson';
import {
  checkEpisodeGate,
  validateEpisodeFormat,
  type EpisodeGateWarning,
} from '../../utils/episode';
import { EpisodeInput } from './EpisodeInput';

interface FeatureFormProps {
  onClose: () => void;
}

const LAYERS: { value: BosLayer; label: string }[] = [
  { value: 'geography', label: 'Geography (Point)' },
  { value: 'institutions', label: 'Institutions (Point)' },
  { value: 'flows', label: 'Flows (Line)' },
  { value: 'borders', label: 'Borders (Polygon)' },
];

export function FeatureForm({ onClose }: FeatureFormProps) {
  const { state, addFeature, setDrawingMode, trackAddition } = useBosData();

  const [layer, setLayer] = useState<BosLayer>('geography');
  const [title, setTitle] = useState('');
  const [firstSeen, setFirstSeen] = useState(state.currentEpisode);
  const [notes, setNotes] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [geometry, setGeometry] = useState<
    [number, number][] | [number, number] | null
  >(null);
  const [warnings, setWarnings] = useState<EpisodeGateWarning[]>([]);

  // Calculate warnings when relevant fields change
  useEffect(() => {
    if (firstSeen && validateEpisodeFormat(firstSeen)) {
      const gateWarnings = checkEpisodeGate(
        state.currentEpisode,
        firstSeen,
        layer,
        state.sessionAdditions
      );
      setWarnings(gateWarnings);
    } else {
      setWarnings([]);
    }
  }, [firstSeen, layer, state.currentEpisode, state.sessionAdditions]);

  const getDrawingMode = useCallback((): DrawingMode => {
    const geomType = LAYER_CONFIG[layer].geometryType;
    switch (geomType) {
      case 'Point':
        return 'point';
      case 'LineString':
        return 'line';
      case 'Polygon':
        return 'polygon';
      default:
        return 'none';
    }
  }, [layer]);

  const handleStartDrawing = () => {
    setIsDrawing(true);
    setGeometry(null);
    const mode = getDrawingMode();
    setDrawingMode(mode);

    // Set up callback for geometry completion
    const setCallback = (
      window as unknown as {
        __bosSetGeometryCallback?: (
          cb: ((coords: [number, number][] | [number, number]) => void) | null
        ) => void;
      }
    ).__bosSetGeometryCallback;

    if (setCallback) {
      setCallback((coords) => {
        setGeometry(coords);
        setIsDrawing(false);
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      return;
    }

    if (!geometry) {
      return;
    }

    const geomType = LAYER_CONFIG[layer].geometryType;
    let bosGeometry;

    if (geomType === 'Point') {
      const coords = geometry as [number, number];
      bosGeometry = {
        type: 'Point' as const,
        coordinates: coords,
      };
    } else if (geomType === 'LineString') {
      const coords = geometry as [number, number][];
      bosGeometry = {
        type: 'LineString' as const,
        coordinates: coords,
      };
    } else {
      const coords = geometry as [number, number][];
      bosGeometry = {
        type: 'Polygon' as const,
        coordinates: [coords],
      };
    }

    const feature = createFeature(layer, title.trim(), bosGeometry, {
      firstSeen: firstSeen || undefined,
      notes: notes.trim() || undefined,
    });

    addFeature(feature);

    // Track the addition for episode gating
    if (state.currentEpisode) {
      trackAddition(state.currentEpisode, layer);
    }

    onClose();
  };

  const handleClose = () => {
    if (isDrawing) {
      setDrawingMode('none');
    }
    onClose();
  };

  const canSubmit = title.trim() && geometry;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Feature</h2>
          <button className="btn-close" onClick={handleClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {warnings.length > 0 && (
              <div className="warnings">
                {warnings.map((warning, index) => (
                  <div key={index} className="warning">
                    {warning.message}
                  </div>
                ))}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="layer">Layer</label>
              <select
                id="layer"
                value={layer}
                onChange={(e) => {
                  setLayer(e.target.value as BosLayer);
                  setGeometry(null);
                  if (isDrawing) {
                    setDrawingMode('none');
                    setIsDrawing(false);
                  }
                }}
              >
                {LAYERS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter feature title"
                required
              />
            </div>

            <EpisodeInput value={firstSeen} onChange={setFirstSeen} />

            <div className="form-group">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes about this feature"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>Geometry</label>
              {geometry ? (
                <div className="geometry-status geometry-complete">
                  Geometry set
                  <button
                    type="button"
                    className="btn btn-link"
                    onClick={() => {
                      setGeometry(null);
                      setIsDrawing(false);
                    }}
                  >
                    Clear
                  </button>
                </div>
              ) : isDrawing ? (
                <div className="geometry-status geometry-drawing">
                  Drawing... (click on the map)
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleStartDrawing}
                >
                  Place on Map
                </button>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn" onClick={handleClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!canSubmit}
            >
              Add Feature
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
