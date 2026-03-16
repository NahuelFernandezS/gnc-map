import { supabase } from './supabaseClient';

export interface GncStation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance?: number;
  isOpen: boolean;
}

/**
 * Fetches nearby GNC stations from the Supabase database using PostGIS.
 */
export const getNearbyStations = async (
  lat: number,
  lng: number,
  radiusKm: number
): Promise<GncStation[]> => {
  const radiusMeters = radiusKm * 1000;

  try {
    const { data, error } = await supabase.rpc('get_nearby_stations', {
      user_lat: lat,
      user_lon: lng,
      radius_meters: radiusMeters,
    });

    if (error) {
      console.error('Error fetching nearby stations from Supabase:', error.message, error.details);
      throw new Error(error.message);
    }

    if (!data) {
      return [];
    }

    // Map the returned SQL row structure to our GncStation interface
    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      address: row.address,
      latitude: row.lat,
      longitude: row.lng,
      distance: row.distance_meters / 1000, // convert meters back to kilometers for the UI
      isOpen: row.is_open,
    }));
  } catch (err: any) {
    console.error('Fetch exception:', err);
    throw new Error('No se pudo conectar a Supabase. Falta VITE_SUPABASE_URL en tus variables de entorno.');
  }
};
