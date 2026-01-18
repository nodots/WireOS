import { useEffect, useRef } from 'react';
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
  const { state } = useBosData();
  const overlaysRef = useRef<Map<string, MapOverlay>>(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

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
        // Update visibility of existing overlay
        if ('setVisible' in existingOverlay) {
          existingOverlay.setVisible(isVisible);
        } else if ('map' in existingOverlay) {
          // AdvancedMarkerElement uses map property
          existingOverlay.map = isVisible ? map : null;
        }
        return;
      }

      // Create new overlay
      const color = LAYER_CONFIG[layer].color;
      const overlay = createOverlay(feature, map, color, infoWindowRef.current);

      if (overlay) {
        if (!isVisible) {
          if ('setVisible' in overlay) {
            overlay.setVisible(false);
          } else if ('map' in overlay) {
            overlay.map = null;
          }
        }
        overlaysRef.current.set(id, overlay);
      }
    });

    // Remove overlays that no longer exist in data
    overlaysRef.current.forEach((overlay, id) => {
      if (!currentFeatureIds.has(id)) {
        removeOverlay(overlay);
        overlaysRef.current.delete(id);
      }
    });
  }, [map, state.data, state.visibleLayers]);

  // Cleanup on unmount
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
  infoWindow: google.maps.InfoWindow | null
): MapOverlay | null {
  const { geometry, properties } = feature;

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
        if (infoWindow) {
          infoWindow.setContent(createInfoContent(properties));
          infoWindow.open(map, marker);
        }
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
        if (infoWindow && e.latLng) {
          infoWindow.setContent(createInfoContent(properties));
          infoWindow.setPosition(e.latLng);
          infoWindow.open(map);
        }
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
        if (infoWindow && e.latLng) {
          infoWindow.setContent(createInfoContent(properties));
          infoWindow.setPosition(e.latLng);
          infoWindow.open(map);
        }
      });

      return polygon;
    }

    case 'MultiPolygon': {
      // For simplicity, render as multiple polygons but return the first one
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
        if (infoWindow && e.latLng) {
          infoWindow.setContent(createInfoContent(properties));
          infoWindow.setPosition(e.latLng);
          infoWindow.open(map);
        }
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
  content += `</div>`;
  return content;
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
