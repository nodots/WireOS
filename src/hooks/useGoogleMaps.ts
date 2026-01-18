import { useState, useEffect } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface UseGoogleMapsResult {
  isLoaded: boolean;
  loadError: Error | null;
}

let loaderPromise: Promise<typeof google> | null = null;

export function useGoogleMaps(): UseGoogleMapsResult {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setLoadError(
        new Error(
          'Google Maps API key not found. Set VITE_GOOGLE_MAPS_API_KEY in your .env file.'
        )
      );
      return;
    }

    if (!loaderPromise) {
      const loader = new Loader({
        apiKey,
        version: 'weekly',
        libraries: ['places'],
      });
      loaderPromise = loader.load();
    }

    loaderPromise
      .then(() => {
        setIsLoaded(true);
      })
      .catch((error) => {
        setLoadError(error);
      });
  }, []);

  return { isLoaded, loadError };
}
