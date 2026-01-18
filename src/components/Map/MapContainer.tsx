import { useEffect, useRef, useCallback, useState } from 'react';
import { useGoogleMaps } from '../../hooks/useGoogleMaps';
import { useBosData } from '../../hooks/useBosData';
import { MapLayers } from './MapLayers';
import { DrawingManager } from './DrawingManager';

const BALTIMORE_CENTER = { lat: 39.2904, lng: -76.6122 };
const DEFAULT_ZOOM = 12;

export function MapContainer() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const { isLoaded, loadError } = useGoogleMaps();
  const { state } = useBosData();

  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) {
      return;
    }

    mapInstanceRef.current = new google.maps.Map(mapRef.current, {
      center: BALTIMORE_CENTER,
      zoom: DEFAULT_ZOOM,
      mapTypeId: 'roadmap',
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    setMapReady(true);
  }, [isLoaded]);

  const getMap = useCallback(() => mapInstanceRef.current, []);

  if (loadError) {
    return (
      <div className="map-container map-error">
        <p>Error loading Google Maps:</p>
        <p>{loadError.message}</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="map-container map-loading">
        <p>Loading map...</p>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="map-container map-error">
        <p>Error loading data:</p>
        <p>{state.error}</p>
      </div>
    );
  }

  return (
    <div className="map-container">
      <div ref={mapRef} className="map" />
      {mapReady && mapInstanceRef.current && (
        <>
          <MapLayers map={mapInstanceRef.current} />
          <DrawingManager getMap={getMap} />
        </>
      )}
    </div>
  );
}
