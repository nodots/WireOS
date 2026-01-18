import { useState, useEffect, useCallback } from 'react';
import { useBosData } from '../../hooks/useBosData';
import {
  LAYER_CONFIG,
  type BosFeature,
  type BosLayer,
  type DrawingMode,
} from '../../types/bos';
import { createFeature } from '../../utils/geojson';
import {
  checkEpisodeGate,
  validateEpisodeFormat,
  type EpisodeGateWarning,
} from '../../utils/episode';
import { EpisodeInput } from './EpisodeInput';

interface FeatureFormProps {
  editingFeature?: BosFeature | null;
  onClose: () => void;
}

const LAYERS: { value: BosLayer; label: string }[] = [
  { value: 'geography', label: 'Geography (Point)' },
  { value: 'institutions', label: 'Institutions (Point)' },
  { value: 'flows', label: 'Flows (Line)' },
  { value: 'borders', label: 'Borders (Polygon)' },
];

export function FeatureForm({ editingFeature, onClose }: FeatureFormProps) {
  const { state, addFeature, updateFeature, setDrawingMode, trackAddition } =
    useBosData();

  const isEditing = editingFeature !== null && editingFeature !== undefined;

  const [layer, setLayer] = useState<BosLayer>(
    editingFeature?.properties.layer ?? 'geography'
  );
  const [title, setTitle] = useState(editingFeature?.properties.title ?? '');
  const [firstSeen, setFirstSeen] = useState(
    editingFeature?.properties.firstSeen ?? state.currentEpisode
  );
  const [notes, setNotes] = useState(editingFeature?.properties.notes ?? '');
  const [isDrawing, setIsDrawing] = useState(false);
  const [geometry, setGeometry] = useState<
    [number, number][] | [number, number] | null
  >(null);
  const [warnings, setWarnings] = useState<EpisodeGateWarning[]>([]);

  // When editing, geometry is already set
  const hasGeometry = isEditing || geometry !== null;

  useEffect(() => {
    if (firstSeen && validateEpisodeFormat(firstSeen) && !isEditing) {
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
  }, [firstSeen, layer, state.currentEpisode, state.sessionAdditions, isEditing]);

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

    if (!hasGeometry) {
      return;
    }

    if (isEditing) {
      // Update existing feature - keep original geometry and metadata
      const updatedFeature: BosFeature = {
        ...editingFeature,
        properties: {
          ...editingFeature.properties,
          title: title.trim(),
          firstSeen: firstSeen || undefined,
          notes: notes.trim() || undefined,
        },
      };
      updateFeature(updatedFeature);
    } else {
      // Create new feature
      if (!geometry) return;

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

      if (state.currentEpisode) {
        trackAddition(state.currentEpisode, layer);
      }
    }

    onClose();
  };

  const handleClose = () => {
    if (isDrawing) {
      setDrawingMode('none');
    }
    onClose();
  };

  const canSubmit = title.trim() && hasGeometry;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Edit Feature' : 'Add Feature'}</h2>
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
                disabled={isEditing}
              >
                {LAYERS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {isEditing && (
                <span className="help-text">
                  Layer cannot be changed when editing
                </span>
              )}
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

            {!isEditing && (
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
            )}
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
              {isEditing ? 'Save Changes' : 'Add Feature'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
