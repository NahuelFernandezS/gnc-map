import { useRef, useEffect } from 'react';
import Map, { Marker, Popup } from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Fuel } from 'lucide-react';
import type { GncStation } from '../services/stationService';

interface StationMapProps {
  coordinates: { lat: number; lng: number } | null;
  stations: GncStation[];
  selectedStation: GncStation | null;
  onStationSelect: (station: GncStation | null) => void;
  isLoading: boolean;
  error: string | null;
}

export const StationMap = ({ 
  coordinates, 
  stations, 
  selectedStation, 
  onStationSelect,
  isLoading,
  error 
}: StationMapProps) => {

  const mapRef = useRef<MapRef>(null);

  useEffect(() => {
    if (selectedStation && mapRef.current) {
      mapRef.current.flyTo({
        center: [selectedStation.longitude, selectedStation.latitude],
        zoom: 16,
        essential: true,
      });
    }
  }, [selectedStation]);

  if (isLoading && !coordinates) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-slate-100">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!coordinates) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-slate-100">
        <p className="text-red-500 font-semibold">{error || 'No se pudo obtener la ubicación.'}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: coordinates.lng,
          latitude: coordinates.lat,
          zoom: 14,
        }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        style={{ width: '100%', height: '100%' }}
      >
        {/* User Location Marker */}
        <Marker longitude={coordinates.lng} latitude={coordinates.lat} anchor="center">
          <div className="w-6 h-6 bg-blue-500 border-2 border-white rounded-full shadow-lg shadow-blue-500/50 animate-pulse cursor-pointer" />
        </Marker>

        {/* Stations Markers */}
        {stations.map((station) => (
          <Marker 
            key={station.id} 
            longitude={station.longitude} 
            latitude={station.latitude} 
            anchor="bottom"
            onClick={(e: any) => {
              e.originalEvent.stopPropagation();
              onStationSelect(station);
            }}
          >
            <div className="relative flex items-center justify-center w-10 h-10 cursor-pointer group">
              <div className={`absolute inset-0 rounded-full animate-ping opacity-75 ${station.isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
              <div className={`relative border-2 border-white rounded-full p-2 shadow-lg transform transition-transform group-hover:scale-110 ${station.isOpen ? 'bg-green-600' : 'bg-red-600'}`}>
                <Fuel className="w-4 h-4 text-white" />
              </div>
            </div>
          </Marker>
        ))}

        {/* Selected Station Popup */}
        {selectedStation && (
          <Popup
            longitude={selectedStation.longitude}
            latitude={selectedStation.latitude}
            anchor="top"
            onClose={() => onStationSelect(null)}
            closeOnClick={false}
            className="z-50"
            offset={[0, -40]}
          >
            <div className="p-2 text-slate-800 flex flex-col items-center text-center">
              <h3 className="font-bold text-lg leading-tight mb-1">{selectedStation.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{selectedStation.address}</p>
              
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${selectedStation.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {selectedStation.isOpen ? 'ABIERTO' : 'CERRADO'}
                </span>
                {selectedStation.distance !== undefined && (
                  <span className="text-xs text-gray-500 font-medium">
                    a {selectedStation.distance.toFixed(1)} km
                  </span>
                )}
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
};
