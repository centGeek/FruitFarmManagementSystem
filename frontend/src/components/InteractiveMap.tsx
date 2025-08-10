import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Download, Upload, Trash2, Square, Edit3, X } from 'lucide-react';

// Fix dla ikon Leaflet w Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const InteractiveMap = ({ rectangles, onRectanglesChange, onSectorsChange }) => {
  const mapRef = useRef(null);
  const drawnItemsRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [tempRect, setTempRect] = useState(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    // Utwórz grupę dla rysowanych elementów
    if (!drawnItemsRef.current) {
      drawnItemsRef.current = new L.FeatureGroup();
      map.addLayer(drawnItemsRef.current);
    }

    const drawnItems = drawnItemsRef.current;

    // Wyczyść wszystkie warstwy
    drawnItems.clearLayers();

    // Dodaj zapisane prostokąty
    rectangles.forEach((rect, index) => {
      const bounds = L.latLngBounds(rect.bounds[0], rect.bounds[1]);
      const rectangle = L.rectangle(bounds, {
        color: '#3388ff',
        weight: 2,
        fillColor: '#3388ff',
        fillOpacity: 0.2
      });
      
      rectangle.bindPopup(`
        <div style="font-weight: bold; margin-bottom: 5px;">${rect.name}</div>
        <div>Uprawa: ${rect.cropType || 'Nie określono'}</div>
        <div>Powierzchnia: ${rect.area} ha</div>
      `);

      drawnItems.addLayer(rectangle);
    });

    // Dodaj tymczasowy prostokąt podczas rysowania
    if (tempRect) {
      const rectangle = L.rectangle(tempRect, {
        color: '#ff7800',
        weight: 2,
        fillColor: '#ff7800',
        fillOpacity: 0.3,
        dashArray: '5, 5'
      });
      drawnItems.addLayer(rectangle);
    }

  }, [rectangles, tempRect]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    const handleMapClick = (e) => {
      if (!isDrawing) return;

      if (!startPoint) {
        // Pierwszy klik - ustaw punkt startowy
        setStartPoint([e.latlng.lat, e.latlng.lng]);
      } else {
        // Drugi klik - zakończ rysowanie
        const endPoint = [e.latlng.lat, e.latlng.lng];
        
        const bounds = [
          [Math.min(startPoint[0], endPoint[0]), Math.min(startPoint[1], endPoint[1])],
          [Math.max(startPoint[0], endPoint[0]), Math.max(startPoint[1], endPoint[1])]
        ];

        const newRect = {
          id: Date.now(),
          name: `Sektor ${rectangles.length + 1}`,
          bounds: bounds,
          cropType: '',
          area: calculateArea(bounds),
          workers: [],
          notes: ''
        };

        const updatedRectangles = [...rectangles, newRect];
        onRectanglesChange(updatedRectangles);
        onSectorsChange(updatedRectangles);

        // Reset stanu rysowania
        setIsDrawing(false);
        setStartPoint(null);
        setTempRect(null);
      }
    };

    const handleMouseMove = (e) => {
      if (!isDrawing || !startPoint) return;

      const currentPoint = [e.latlng.lat, e.latlng.lng];
      const bounds = [
        [Math.min(startPoint[0], currentPoint[0]), Math.min(startPoint[1], currentPoint[1])],
        [Math.max(startPoint[0], currentPoint[0]), Math.max(startPoint[1], currentPoint[1])]
      ];

      setTempRect(bounds);
    };

    if (isDrawing) {
      map.on('click', handleMapClick);
      map.on('mousemove', handleMouseMove);
      map.getContainer().style.cursor = 'crosshair';
    } else {
      map.getContainer().style.cursor = '';
    }

    return () => {
      map.off('click', handleMapClick);
      map.off('mousemove', handleMouseMove);
    };
  }, [isDrawing, startPoint, rectangles, onRectanglesChange, onSectorsChange]);

  const calculateArea = (bounds) => {
    const latDiff = Math.abs(bounds[1][0] - bounds[0][0]);
    const lngDiff = Math.abs(bounds[1][1] - bounds[0][1]);
    const areaKm2 = latDiff * lngDiff * 111.32 * 111.32;
    const areaHa = areaKm2 * 100;
    return areaHa.toFixed(2);
  };

  const startDrawing = () => {
    setIsDrawing(true);
    setStartPoint(null);
    setTempRect(null);
  };

  const cancelDrawing = () => {
    setIsDrawing(false);
    setStartPoint(null);
    setTempRect(null);
  };

  return (
    <div className="relative">
      {/* Instrukcje */}
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Jak rysować sektory:</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <div>1. Kliknij przycisk "Rysuj prostokąt" poniżej</div>
          <div>2. Kliknij pierwszy punkt na mapie (róg prostokąta)</div>
          <div>3. Kliknij drugi punkt na mapie (przeciwny róg)</div>
          <div>4. Prostokąt zostanie automatycznie utworzony</div>
          {isDrawing && (
            <div className="text-orange-700 font-medium mt-2">
              {!startPoint ? '🎯 Kliknij pierwszy punkt na mapie' : '🎯 Kliknij drugi punkt na mapie'}
            </div>
          )}
        </div>
      </div>

      <MapContainer
        center={[52.2297, 21.0122]}
        zoom={13}
        style={{ height: '500px', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      </MapContainer>

      {/* Kontrolki w lewym dolnym rogu */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-[1000]">
        {!isDrawing ? (
          <button
            onClick={startDrawing}
            className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg shadow-lg flex items-center gap-2 transition-colors"
            title="Rysuj prostokąt"
          >
            <Square size={20} />
            <span className="text-sm font-medium">Rysuj prostokąt</span>
          </button>
        ) : (
          <button
            onClick={cancelDrawing}
            className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg shadow-lg flex items-center gap-2 transition-colors"
            title="Anuluj rysowanie"
          >
            <X size={20} />
            <span className="text-sm font-medium">Anuluj</span>
          </button>
        )}

        {rectangles.length > 0 && (
          <div className="bg-white p-2 rounded-lg shadow-lg text-xs">
            <div className="font-semibold text-gray-700">Sektorów: {rectangles.length}</div>
            <div className="text-gray-500">Kliknij prostokąt na mapie aby zobaczyć szczegóły</div>
          </div>
        )}
      </div>
    </div>
  );
};

const OrchardMapSystem = () => {
  const [rectangles, setRectangles] = useState([]);
  const [sectors, setSectors] = useState([]);

  const handleRectanglesChange = (newRectangles) => {
    setRectangles(newRectangles);
  };

  const handleSectorsChange = (newSectors) => {
    setSectors(newSectors);
  };

  const exportData = () => {
    const data = {
      rectangles,
      sectors,
      exportDate: new Date().toISOString(),
      version: "1.0",
      totalArea: sectors.reduce((sum, sector) => sum + parseFloat(sector.area || 0), 0).toFixed(2)
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gospodarstwo-mapa-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.rectangles && Array.isArray(data.rectangles)) {
          setRectangles(data.rectangles);
          setSectors(data.rectangles);
        } else {
          alert('Nieprawidłowy format pliku');
        }
      } catch (error) {
        alert('Błąd podczas wczytywania pliku: ' + error.message);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const clearAll = () => {
    if (window.confirm('Czy na pewno chcesz usunąć wszystkie sektory?')) {
      setRectangles([]);
      setSectors([]);
    }
  };

  const updateSector = (index, field, value) => {
    const updatedSectors = sectors.map((sector, i) => 
      i === index ? { ...sector, [field]: value } : sector
    );
    setSectors(updatedSectors);
    setRectangles(updatedSectors);
  };

  const deleteSector = (index) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten sektor?')) {
      const updatedSectors = sectors.filter((_, i) => i !== index);
      setSectors(updatedSectors);
      setRectangles(updatedSectors);
    }
  };

  const totalArea = sectors.reduce((sum, sector) => sum + parseFloat(sector.area || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          System Zarządzania Gospodarstwem Sadowniczym
        </h1>
        <p className="text-gray-600 mb-4">
          Mapowanie i zarządzanie sektorami upraw
        </p>
        
        {/* Statystyki */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{sectors.length}</div>
            <div className="text-blue-800">Zdefiniowane sektory</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{totalArea.toFixed(2)} ha</div>
            <div className="text-green-800">Całkowita powierzchnia</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {sectors.filter(s => s.cropType).length}
            </div>
            <div className="text-purple-800">Sektory z przypisaną uprawą</div>
          </div>
        </div>
      </div>

      {/* Panel kontrolny */}
      <div className="mb-6 flex flex-wrap gap-4">
        <button
          onClick={exportData}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          disabled={sectors.length === 0}
        >
          <Download size={16} />
          Eksportuj mapę ({sectors.length} sektorów)
        </button>
        
        <label className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer transition-colors">
          <Upload size={16} />
          Importuj mapę
          <input
            type="file"
            accept=".json"
            onChange={importData}
            className="hidden"
          />
        </label>

        <button
          onClick={clearAll}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          disabled={sectors.length === 0}
        >
          <Trash2 size={16} />
          Wyczyść wszystko
        </button>
      </div>

      {/* Mapa */}
      <div className="mb-6 rounded-lg overflow-hidden shadow-lg">
        <InteractiveMap 
          rectangles={rectangles}
          onRectanglesChange={handleRectanglesChange}
          onSectorsChange={handleSectorsChange}
        />
      </div>

      {/* Lista sektorów */}
      {sectors.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Zdefiniowane sektory</h2>
          <div className="grid gap-4">
            {sectors.map((sector, index) => (
              <div key={sector.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">{sector.name}</h3>
                  <button
                    onClick={() => deleteSector(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Usuń sektor"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nazwa sektora
                    </label>
                    <input
                      type="text"
                      value={sector.name}
                      onChange={(e) => updateSector(index, 'name', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rodzaj uprawy
                    </label>
                    <select
                      value={sector.cropType}
                      onChange={(e) => updateSector(index, 'cropType', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Wybierz rodzaj uprawy...</option>
                      <option value="jabłonie">🍎 Jabłonie</option>
                      <option value="grusze">🍐 Grusze</option>
                      <option value="śliwy">🟣 Śliwy</option>
                      <option value="wiśnie">🍒 Wiśnie</option>
                      <option value="brzoskwinie">🍑 Brzoskwinie</option>
                      <option value="czereśnie">🍒 Czereśnie</option>
                      <option value="morele">🟠 Morele</option>
                      <option value="inne">🌳 Inne</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Powierzchnia
                    </label>
                    <div className="p-2 bg-gray-50 border border-gray-300 rounded text-gray-700">
                      {sector.area} ha
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Współrzędne
                    </label>
                    <div className="text-xs text-gray-500 p-2 bg-gray-50 border border-gray-300 rounded font-mono">
                      SW: {sector.bounds[0][0].toFixed(4)}, {sector.bounds[0][1].toFixed(4)}<br/>
                      NE: {sector.bounds[1][0].toFixed(4)}, {sector.bounds[1][1].toFixed(4)}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notatki
                  </label>
                  <textarea
                    value={sector.notes || ''}
                    onChange={(e) => updateSector(index, 'notes', e.target.value)}
                    placeholder="Dodatkowe informacje o sektorze..."
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="2"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sectors.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Square size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-xl text-gray-500 mb-2">Nie zdefiniowano jeszcze żadnych sektorów</p>
          <p className="text-gray-400">
            Użyj przycisku "Rysuj prostokąt" na mapie, aby oznaczyć obszary upraw
          </p>
        </div>
      )}
    </div>
  );
};

export default OrchardMapSystem;