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
    const isApiKeyError =
      loadError.message.includes('API key') ||
      loadError.message.includes('not found');

    return (
      <div className="map-container map-error">
        <h3>Error loading Google Maps</h3>
        <p className="error-detail">{loadError.message}</p>
        {isApiKeyError && (
          <div className="api-key-help">
            <h4>Setup Instructions:</h4>
            <ol>
              <li>
                Get an API key from{' '}
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google Cloud Console
                </a>
              </li>
              <li>Enable the <strong>Maps JavaScript API</strong></li>
              <li>Copy <code>.env.example</code> to <code>.env</code></li>
              <li>Add your API key to <code>VITE_GOOGLE_MAPS_API_KEY</code></li>
              <li>Restart the dev server</li>
            </ol>
          </div>
        )}
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
