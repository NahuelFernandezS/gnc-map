import { useState, useEffect } from 'react';
import { MainLayout } from './components/MainLayout';
import { StationMap } from './components/StationMap';
import { StationSidebar } from './components/StationSidebar';
import { useUserLocation } from './hooks/useUserLocation';
import { getNearbyStations } from './services/stationService';
import type { GncStation } from './services/stationService';

function App() {
  const { coordinates, isLoading: isLocationLoading, error: locationError } = useUserLocation();
  const [stations, setStations] = useState<GncStation[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<GncStation | null>(null);

  useEffect(() => {
    if (coordinates) {
      setIsDataLoading(true);
      setDataError(null);
      getNearbyStations(coordinates.lat, coordinates.lng, 10)
        .then(setStations)
        .catch((err) => setDataError(err.message))
        .finally(() => setIsDataLoading(false));
    }
  }, [coordinates]);

  const handleStationClick = (station: GncStation | null) => {
    setSelectedStation(station);
  };

  const isLoading = isLocationLoading || (isDataLoading && stations.length === 0);
  const error = locationError || dataError;

  return (
    <MainLayout>
      <div className="relative w-full h-full flex flex-col md:flex-row">
        {/* Sidebar Component */}
        <StationSidebar
          stations={stations}
          onStationClick={handleStationClick}
          isLoading={isLoading}
        />

        {/* Map Component */}
        <div className="flex-1 w-full h-2/3 md:h-full relative">
          <StationMap
            coordinates={coordinates}
            stations={stations}
            selectedStation={selectedStation}
            onStationSelect={handleStationClick}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </div>
    </MainLayout>
  );
}

export default App;
