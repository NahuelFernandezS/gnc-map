import { MapPin } from 'lucide-react';
import type { GncStation } from '../services/stationService';

interface StationSidebarProps {
  stations: GncStation[];
  onStationClick: (station: GncStation) => void;
  isLoading?: boolean;
}

export const StationSidebar = ({ stations, onStationClick, isLoading = false }: StationSidebarProps) => {
  return (
    <div className="absolute left-0 bottom-0 md:top-0 md:bottom-auto w-full md:w-80 lg:w-96 h-1/3 md:h-full bg-white shadow-xl flex flex-col z-10 transition-all rounded-t-3xl md:rounded-none overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 text-white p-4 shrink-0 shadow-md">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-400" />
          Estaciones Cercanas
        </h2>
        <p className="text-sm text-slate-300 mt-1">
          {stations.length} gasolineras encontradas
        </p>
      </div>

      {/* List Container */}
      <div className="flex-1 overflow-y-auto p-2 bg-slate-50">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium">Buscando estaciones...</p>
          </div>
        ) : stations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
            <MapPin className="w-12 h-12 text-slate-300 mb-2" />
            <p className="font-medium">No se encontraron estaciones en esta área.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 relative">
            {stations.map((station) => (
              <button
                key={station.id}
                onClick={() => onStationClick(station)}
                className="w-full text-left bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-blue-300 hover:shadow-md hover:bg-slate-50 transition-all group focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors line-clamp-1">
                    {station.name}
                  </h3>
                  <div className={`px-2 py-0.5 text-xs font-bold rounded shadow-sm shrink-0 ml-2 ${station.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {station.isOpen ? 'ABIERTO' : 'CERRADO'}
                  </div>
                </div>

                <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                  {station.address}
                </p>

                {station.distance !== undefined && (
                  <div className="flex items-center text-xs font-semibold text-blue-500 bg-blue-50 inline-flex px-2 py-1 rounded-md">
                    A {station.distance.toFixed(1)} km de ti
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
