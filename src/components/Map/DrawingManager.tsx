import { useEffect, useRef, useCallback } from 'react';
import { useBosData } from '../../hooks/useBosData';
import type { DrawingMode } from '../../types/bos';

interface DrawingManagerProps {
  getMap: () => google.maps.Map | null;
}

interface DrawingState {
  mode: DrawingMode;
  vertices: google.maps.LatLng[];
  markers: google.maps.Marker[];
  previewLine: google.maps.Polyline | null;
  previewPolygon: google.maps.Polygon | null;
}

export function DrawingManager({ getMap }: DrawingManagerProps) {
  const { state, dispatch } = useBosData();
  const drawingStateRef = useRef<DrawingState>({
    mode: 'none',
    vertices: [],
    markers: [],
    previewLine: null,
    previewPolygon: null,
  });

  const onGeometryComplete = useRef<
    ((coords: [number, number][] | [number, number]) => void) | null
  >(null);

  const cleanup = useCallback(() => {
    const ds = drawingStateRef.current;

    ds.markers.forEach((m) => m.setMap(null));
    ds.markers = [];
    ds.vertices = [];

    if (ds.previewLine) {
      ds.previewLine.setMap(null);
      ds.previewLine = null;
    }
    if (ds.previewPolygon) {
      ds.previewPolygon.setMap(null);
      ds.previewPolygon = null;
    }
  }, []);

  const finishDrawing = useCallback(() => {
    const ds = drawingStateRef.current;
    const map = getMap();

    if (!map || ds.vertices.length === 0) {
      cleanup();
      return;
    }

    if (ds.mode === 'point' && ds.vertices.length === 1) {
      const v = ds.vertices[0];
      if (onGeometryComplete.current) {
        onGeometryComplete.current([v.lng(), v.lat()]);
      }
    } else if (ds.mode === 'line' && ds.vertices.length >= 2) {
      const coords: [number, number][] = ds.vertices.map((v) => [
        v.lng(),
        v.lat(),
      ]);
      if (onGeometryComplete.current) {
        onGeometryComplete.current(coords);
      }
    } else if (ds.mode === 'polygon' && ds.vertices.length >= 3) {
      const coords: [number, number][] = ds.vertices.map((v) => [
        v.lng(),
        v.lat(),
      ]);
      // Close the polygon
      coords.push(coords[0]);
      if (onGeometryComplete.current) {
        onGeometryComplete.current(coords);
      }
    }

    cleanup();
    dispatch({ type: 'SET_DRAWING_MODE', payload: 'none' });
  }, [getMap, cleanup, dispatch]);

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      const map = getMap();
      const ds = drawingStateRef.current;

      if (!map || !e.latLng || ds.mode === 'none') {
        return;
      }

      const latLng = e.latLng;
      ds.vertices.push(latLng);

      if (ds.mode === 'point') {
        // For points, immediately finish
        finishDrawing();
        return;
      }

      // Add vertex marker
      const marker = new google.maps.Marker({
        position: latLng,
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: '#4285f4',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });
      ds.markers.push(marker);

      // Update preview
      const path = ds.vertices.map((v) => ({ lat: v.lat(), lng: v.lng() }));

      if (ds.mode === 'line') {
        if (!ds.previewLine) {
          ds.previewLine = new google.maps.Polyline({
            map,
            strokeColor: '#4285f4',
            strokeOpacity: 0.8,
            strokeWeight: 3,
          });
        }
        ds.previewLine.setPath(path);
      } else if (ds.mode === 'polygon') {
        if (!ds.previewPolygon) {
          ds.previewPolygon = new google.maps.Polygon({
            map,
            strokeColor: '#4285f4',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#4285f4',
            fillOpacity: 0.2,
          });
        }
        ds.previewPolygon.setPaths(path);
      }
    },
    [getMap, finishDrawing]
  );

  const handleMapDblClick = useCallback(() => {
    const ds = drawingStateRef.current;
    if (ds.mode === 'line' || ds.mode === 'polygon') {
      finishDrawing();
    }
  }, [finishDrawing]);

  // Set up map click listeners
  useEffect(() => {
    const map = getMap();
    if (!map) return;

    const clickListener = map.addListener('click', handleMapClick);
    const dblClickListener = map.addListener('dblclick', handleMapDblClick);

    return () => {
      google.maps.event.removeListener(clickListener);
      google.maps.event.removeListener(dblClickListener);
    };
  }, [getMap, handleMapClick, handleMapDblClick]);

  // Sync drawing mode from state
  useEffect(() => {
    const ds = drawingStateRef.current;
    const map = getMap();

    if (state.drawingMode !== ds.mode) {
      cleanup();
      ds.mode = state.drawingMode;

      // Change cursor based on mode
      if (map) {
        if (state.drawingMode !== 'none') {
          map.setOptions({ draggableCursor: 'crosshair' });
        } else {
          map.setOptions({ draggableCursor: null });
        }
      }
    }
  }, [state.drawingMode, getMap, cleanup]);

  // Expose callback setter for geometry completion
  useEffect(() => {
    // Store in window for access from FeatureForm
    // This is a simple approach; a more robust solution would use context
    (
      window as unknown as {
        __bosSetGeometryCallback: (
          cb: ((coords: [number, number][] | [number, number]) => void) | null
        ) => void;
      }
    ).__bosSetGeometryCallback = (cb) => {
      onGeometryComplete.current = cb;
    };

    return () => {
      delete (
        window as unknown as {
          __bosSetGeometryCallback?: unknown;
        }
      ).__bosSetGeometryCallback;
    };
  }, []);

  // Render drawing instructions when in drawing mode
  if (state.drawingMode === 'none') {
    return null;
  }

  return (
    <div className="drawing-instructions">
      {state.drawingMode === 'point' && <p>Click on the map to place a point</p>}
      {state.drawingMode === 'line' && (
        <p>Click to add points, double-click to finish the line</p>
      )}
      {state.drawingMode === 'polygon' && (
        <p>Click to add points, double-click to close the polygon</p>
      )}
      <button className="btn btn-secondary" onClick={() => {
        cleanup();
        dispatch({ type: 'SET_DRAWING_MODE', payload: 'none' });
      }}>
        Cancel
      </button>
    </div>
  );
}
