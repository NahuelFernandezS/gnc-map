import { useState, useEffect } from 'react';

interface Coordinates {
  lat: number;
  lng: number;
}

interface UserLocationState {
  coordinates: Coordinates | null;
  isLoading: boolean;
  error: string | null;
}

export const useUserLocation = () => {
  const [location, setLocation] = useState<UserLocationState>({
    coordinates: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    if (!navigator.geolocation) {
      setLocation({
        coordinates: null,
        isLoading: false,
        error: 'Geolocation is not supported by your browser.',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (isMounted) {
          setLocation({
            coordinates: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
            isLoading: false,
            error: null,
          });
        }
      },
      (geoError) => {
        if (isMounted) {
          setLocation({
            coordinates: null,
            isLoading: false,
            error: geoError.message || 'Location permission denied or unavailable.',
          });
        }
      }
    );

    return () => {
      isMounted = false;
    };
  }, []);

  return location;
};
