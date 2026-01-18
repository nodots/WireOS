import { useEffect, useRef, useCallback } from 'react';
import { useBosData } from '../../hooks/useBosData';
import type { BosFeature } from '../../types/bos';
import { LAYER_CONFIG } from '../../types/bos';

interface MapLayersProps {
  map: google.maps.Map;
}

type MapOverlay =
  | google.maps.marker.AdvancedMarkerElement
  | google.maps.Marker
  | google.maps.Polyline
  | google.maps.Polygon;

export function MapLayers({ map }: MapLayersProps) {
  const { state, setEditingFeature, deleteFeature } = useBosData();
  const overlaysRef = useRef<Map<string, MapOverlay>>(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const currentFeatureRef = useRef<BosFeature | null>(null);

  const handleEdit = useCallback(() => {
    if (currentFeatureRef.current) {
      setEditingFeature(currentFeatureRef.current);
      infoWindowRef.current?.close();
    }
  }, [setEditingFeature]);

  const handleDelete = useCallback(() => {
    if (currentFeatureRef.current) {
      const confirmed = window.confirm(
        `Delete "${currentFeatureRef.current.properties.title}"?`
      );
      if (confirmed) {
        deleteFeature(currentFeatureRef.current.properties.id);
        infoWindowRef.current?.close();
      }
    }
  }, [deleteFeature]);

  // Set up global handlers for info window buttons
  useEffect(() => {
    const win = window as Window & {
      __bosEditFeature?: () => void;
      __bosDeleteFeature?: () => void;
    };
    win.__bosEditFeature = handleEdit;
    win.__bosDeleteFeature = handleDelete;

    return () => {
      delete win.__bosEditFeature;
      delete win.__bosDeleteFeature;
    };
  }, [handleEdit, handleDelete]);

  useEffect(() => {
    if (!infoWindowRef.current) {
      infoWindowRef.current = new google.maps.InfoWindow();
    }

    const currentFeatureIds = new Set<string>();

    state.data.features.forEach((feature: BosFeature) => {
      const { id, layer } = feature.properties;
      currentFeatureIds.add(id);

      const isVisible = state.visibleLayers[layer];
      const existingOverlay = overlaysRef.current.get(id);

      if (existingOverlay) {
        // Cast to duck type because MapOverlay union doesn't expose setMap directly,
        // but all concrete types (Marker, Polyline, Polygon) have it
        const mapOverlay = existingOverlay as { setMap?: (map: google.maps.Map | null) => void };
        if (typeof mapOverlay.setMap === 'function') {
          mapOverlay.setMap(isVisible ? map : null);
        }
        return;
      }

      const color = LAYER_CONFIG[layer].color;
      const overlay = createOverlay(
        feature,
        map,
        color,
        infoWindowRef.current,
        currentFeatureRef
      );

      if (overlay) {
        if (!isVisible) {
          // Same duck type cast as above for newly created overlays
          const mapOverlay = overlay as { setMap?: (map: google.maps.Map | null) => void };
          if (typeof mapOverlay.setMap === 'function') {
            mapOverlay.setMap(null);
          }
        }
        overlaysRef.current.set(id, overlay);
      }
    });

    overlaysRef.current.forEach((overlay, id) => {
      if (!currentFeatureIds.has(id)) {
        removeOverlay(overlay);
        overlaysRef.current.delete(id);
      }
    });
  }, [map, state.data, state.visibleLayers]);

  useEffect(() => {
    const overlays = overlaysRef.current;
    const infoWindow = infoWindowRef.current;
    return () => {
      overlays.forEach((overlay) => {
        removeOverlay(overlay);
      });
      overlays.clear();
      if (infoWindow) {
        infoWindow.close();
      }
    };
  }, []);

  return null;
}

function createOverlay(
  feature: BosFeature,
  map: google.maps.Map,
  color: string,
  infoWindow: google.maps.InfoWindow | null,
  currentFeatureRef: React.MutableRefObject<BosFeature | null>
): MapOverlay | null {
  const { geometry, properties } = feature;

  const openInfoWindow = (
    position?: google.maps.LatLng | null,
    anchor?: google.maps.Marker
  ) => {
    if (!infoWindow) return;
    currentFeatureRef.current = feature;
    infoWindow.setContent(createInfoContent(properties));
    if (anchor) {
      infoWindow.open(map, anchor);
    } else if (position) {
      infoWindow.setPosition(position);
      infoWindow.open(map);
    }
  };

  switch (geometry.type) {
    case 'Point': {
      const [lng, lat] = geometry.coordinates;
      const marker = new google.maps.Marker({
        position: { lat, lng },
        map,
        title: properties.title,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: color,
          fillOpacity: 0.8,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      marker.addListener('click', () => {
        openInfoWindow(null, marker);
      });

      return marker;
    }

    case 'LineString': {
      const path = geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
      const polyline = new google.maps.Polyline({
        path,
        map,
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 4,
      });

      polyline.addListener('click', (e: google.maps.MapMouseEvent) => {
        openInfoWindow(e.latLng);
      });

      return polyline;
    }

    case 'Polygon': {
      const paths = geometry.coordinates.map((ring) =>
        ring.map(([lng, lat]) => ({ lat, lng }))
      );
      const polygon = new google.maps.Polygon({
        paths,
        map,
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: color,
        fillOpacity: 0.3,
      });

      polygon.addListener('click', (e: google.maps.MapMouseEvent) => {
        openInfoWindow(e.latLng);
      });

      return polygon;
    }

    case 'MultiPolygon': {
      const allPaths = geometry.coordinates.flatMap((poly) =>
        poly.map((ring) => ring.map(([lng, lat]) => ({ lat, lng })))
      );
      const polygon = new google.maps.Polygon({
        paths: allPaths,
        map,
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: color,
        fillOpacity: 0.3,
      });

      polygon.addListener('click', (e: google.maps.MapMouseEvent) => {
        openInfoWindow(e.latLng);
      });

      return polygon;
    }

    default:
      return null;
  }
}

function removeOverlay(overlay: MapOverlay): void {
  if ('setMap' in overlay) {
    overlay.setMap(null);
  } else if ('map' in overlay) {
    overlay.map = null;
  }
}

function createInfoContent(properties: BosFeature['properties']): string {
  let content = `<div class="info-window">`;
  content += `<h3>${escapeHtml(properties.title)}</h3>`;
  content += `<p><strong>Layer:</strong> ${escapeHtml(properties.layer)}</p>`;
  if (properties.firstSeen) {
    content += `<p><strong>First seen:</strong> ${escapeHtml(properties.firstSeen)}</p>`;
  }
  if (properties.notes) {
    content += `<p>${escapeHtml(properties.notes)}</p>`;
  }
  content += `<div class="info-window-actions">`;
  content += `<button onclick="window.__bosEditFeature()" class="btn-info-edit">Edit</button>`;
  content += `<button onclick="window.__bosDeleteFeature()" class="btn-info-delete">Delete</button>`;
  content += `</div>`;
  content += `</div>`;
  return content;
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
