import { useEffect, useRef, useCallback } from 'react';
import { useDrawing } from '../../hooks/useDrawing';
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
  const { drawingMode, cancelDrawing, completeDrawing } = useDrawing();

  const drawingStateRef = useRef<DrawingState>({
    mode: 'none',
    vertices: [],
    markers: [],
    previewLine: null,
    previewPolygon: null,
  });

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
      completeDrawing([v.lng(), v.lat()]);
    } else if (ds.mode === 'line' && ds.vertices.length >= 2) {
      const coords: [number, number][] = ds.vertices.map((v) => [
        v.lng(),
        v.lat(),
      ]);
      completeDrawing(coords);
    } else if (ds.mode === 'polygon' && ds.vertices.length >= 3) {
      const coords: [number, number][] = ds.vertices.map((v) => [
        v.lng(),
        v.lat(),
      ]);
      // Close the polygon
      coords.push(coords[0]);
      completeDrawing(coords);
    }

    cleanup();
  }, [getMap, cleanup, completeDrawing]);

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

  // Sync drawing mode from context
  useEffect(() => {
    const ds = drawingStateRef.current;
    const map = getMap();

    if (drawingMode !== ds.mode) {
      cleanup();
      ds.mode = drawingMode;

      if (map) {
        if (drawingMode !== 'none') {
          map.setOptions({ draggableCursor: 'crosshair' });
        } else {
          map.setOptions({ draggableCursor: null });
        }
      }
    }
  }, [drawingMode, getMap, cleanup]);

  const handleCancel = useCallback(() => {
    cleanup();
    cancelDrawing();
  }, [cleanup, cancelDrawing]);

  if (drawingMode === 'none') {
    return null;
  }

  return (
    <div className="drawing-instructions">
      {drawingMode === 'point' && <p>Click on the map to place a point</p>}
      {drawingMode === 'line' && (
        <p>Click to add points, double-click to finish the line</p>
      )}
      {drawingMode === 'polygon' && (
        <p>Click to add points, double-click to close the polygon</p>
      )}
      <button className="btn btn-secondary" onClick={handleCancel}>
        Cancel
      </button>
    </div>
  );
}
