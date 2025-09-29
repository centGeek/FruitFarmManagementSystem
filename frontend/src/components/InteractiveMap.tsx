import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Trash2, Layers, X, Search, MapPin, Loader, Check, AlertCircle, Edit3 } from 'lucide-react';
import { BACKEND_URL, getAuthHeaders } from "../utils/apiConfigs";


delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const CROP_TYPES = [
  { value: 'APPLE', label: '🍎 Jabłonie' },
  { value: 'PEAR', label: '🍐 Grusze' },
  { value: 'PLUM', label: '🟣 Śliwy' },
  { value: 'CHERRY', label: '🍒 Wiśnie' },
  { value: 'SWEET_CHERRY', label: '🍒 Czereśnie' },
  { value: 'RASPBERRY', label: '🍓 Maliny' }
];

const sortPointsClockwise = (points) => {
  if (points.length !== 4) return points;

  const centroid = points.reduce((acc, p) => ({
    lat: acc.lat + p.lat / points.length,
    lng: acc.lng + p.lng / points.length
  }), { lat: 0, lng: 0 });

  return points.sort((a, b) => {
    const angleA = Math.atan2(a.lat - centroid.lat, a.lng - centroid.lng);
    const angleB = Math.atan2(b.lat - centroid.lat, b.lng - centroid.lng);
    return angleA - angleB;
  });
};

const LocationSearch = ({ map }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef(null);

  const searchLocations = async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=pl&limit=5&addressdetails=1`
      );
      const data = await response.json();
      
      const formattedSuggestions = data.map(item => ({
        id: item.place_id,
        name: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        type: item.type
      }));

      setSuggestions(formattedSuggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Błąd wyszukiwania:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchLocations(value);
    }, 300);
  };

  const selectLocation = (location) => {
    if (!map) return;
    
    map.flyTo([location.lat, location.lon], 15, {
      duration: 1.5,
      easeLinearity: 0.25
    });
    
    const customIcon = L.divIcon({
      className: 'custom-search-marker',
      html: `
        <div style="
          background: #ff4444;
          border: 3px solid white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          box-shadow: 0 0 10px rgba(255,68,68,0.5);
          animation: pulse 2s infinite;
        "></div>
        <style>
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.7; }
            100% { transform: scale(1); opacity: 1; }
          }
        </style>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    const marker = L.marker([location.lat, location.lon], { icon: customIcon })
      .addTo(map)
      .bindPopup(`
        <div style="text-align: center; padding: 5px;">
          <div style="font-weight: bold; color: #333; margin-bottom: 5px;">
            📍 ${location.name.split(',')[0]}
          </div>
          <div style="font-size: 12px; color: #666;">
            ${location.name}
          </div>
        </div>
      `)
      .openPopup();
    
    setTimeout(() => {
      marker.closePopup();
      setTimeout(() => {
        if (map.hasLayer(marker)) {
          map.removeLayer(marker);
        }
      }, 500);
    }, 5000);
    
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="relative mb-4">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader className="h-5 w-5 text-gray-400 animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-gray-400" />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="Wyszukaj miejscowość w Polsce (min. 3 znaki)..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm transition-all duration-200 hover:shadow-md"
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              onClick={() => selectLocation(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {suggestion.name.split(',')[0]}
                    {suggestion.type && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        {suggestion.type}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {suggestion.name}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const SectorConfirmationModal = ({ isOpen, onClose, sectorData, onConfirm, onEdit }) => {
  const [editedSector, setEditedSector] = useState({
    id: null,
    name: '',
    cropType: '',
    corners: []
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (sectorData && isOpen) {
      setEditedSector({
        id: sectorData.id || null,
        name: sectorData.name || '',
        cropType: sectorData.cropType || '',
        corners: sectorData.corners || []
      });
    }
  }, [sectorData, isOpen]);

  if (!isOpen) return null;

  const calculateArea = (corners) => {
    if (!corners || corners.length < 3) return 0;
    
    let area = 0;
    const n = corners.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += corners[i][0] * corners[j][1];
      area -= corners[j][0] * corners[i][1];
    }
    return Math.abs(area / 2) * 111000 * 111000;
  };

  const areaInM2 = calculateArea(editedSector.corners);
  const areaInHa = (areaInM2 / 10000).toFixed(2);

  const handleInputChange = (field, value) => {
    setEditedSector(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConfirm = async () => {
    if (!editedSector.name.trim()) {
      alert('Nazwa sektora jest wymagana!');
      return;
    }

    setIsLoading(true);
    try {
      await onConfirm(editedSector);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Dodaj nowy sektor
              </h3>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isLoading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-4">Dane sektora</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-2">
                    Nazwa sektora *
                  </label>
                  <input
                    type="text"
                    value={editedSector.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    placeholder="np. Sektor wschodni, Sad jabłoniowy A..."
                  />
                  {!editedSector.name.trim() && (
                    <p className="text-red-600 text-xs mt-1">Nazwa jest wymagana</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-2">
                    Rodzaj uprawy
                  </label>
                  <select
                    value={editedSector.cropType}
                    onChange={(e) => handleInputChange('cropType', e.target.value)}
                    className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="">Wybierz rodzaj uprawy...</option>
                    {CROP_TYPES.map(crop => (
                      <option key={crop.value} value={crop.value}>
                        {crop.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {editedSector.cropType && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">Wybrana uprawa</h4>
                <div className="flex items-center gap-3 p-3 bg-white rounded border border-green-300">
                  <span className="text-2xl">
                    {CROP_TYPES.find(c => c.value === editedSector.cropType)?.label.split(' ')[0]}
                  </span>
                  <div>
                    <div className="font-bold text-green-900">
                      {CROP_TYPES.find(c => c.value === editedSector.cropType)?.label}
                    </div>
                    <div className="text-xs text-green-700">
                      Typ: {editedSector.cropType}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3">Parametry geometryczne</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white p-3 rounded border">
                  <div className="text-gray-600">Powierzchnia</div>
                  <div className="text-xl font-bold text-gray-900">~{areaInHa} ha</div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="text-gray-600">Punkty GPS</div>
                  <div className="text-xl font-bold text-gray-900">{editedSector.corners.length}</div>
                </div>
              </div>
            </div>

            <details className="bg-gray-50 rounded-lg border">
              <summary className="p-4 cursor-pointer font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
                Współrzędne GPS (kliknij aby rozwinąć)
              </summary>
              <div className="px-4 pb-4">
                <div className="text-xs text-gray-600 space-y-1 max-h-32 overflow-y-auto bg-white p-3 rounded border font-mono">
                  {editedSector.corners.map((corner, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>Punkt {idx + 1}:</span>
                      <span>{corner[0].toFixed(6)}, {corner[1].toFixed(6)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </details>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Sprawdź dane przed wysłaniem</p>
                  <p>Sektor zostanie zapisany w systemie i wysłany na serwer.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onEdit}
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Edit3 className="w-4 h-4" />
              Narysuj ponownie
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading || !editedSector.name.trim()}
              className="flex-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-medium shadow-lg"
            >
              {isLoading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {isLoading ? 'Wysyłanie...' : 'Utwórz sektor'}
            </button>
          </div>

          <div className="mt-4 p-3 bg-gray-100 rounded-lg">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Status:</span>
              <span className="font-medium">
                {!editedSector.name.trim() ? 'Brak nazwy' : 
                 !editedSector.cropType ? 'Brak uprawy (opcjonalne)' : 
                 'Gotowe do wysłania'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InteractiveMap = ({ sectors, onSectorsChange }) => {
  const leafletMapRef = useRef(null);
  const drawnItemsRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [drawingMode, setDrawingMode] = useState('none');
  const [drawingPoints, setDrawingPoints] = useState([]);
  const [tempLayer, setTempLayer] = useState(null);
  const [selectedSector, setSelectedSector] = useState(null);
  const [confirmationModal, setConfirmationModal] = useState({ isOpen: false, sectorData: null });

  const handleMapLoad = (map) => {
    leafletMapRef.current = map;
    setMapInstance(map);
  };

  const startDrawing = () => {
    setDrawingMode('polygon');
    setDrawingPoints([]);
    if (tempLayer && mapInstance) {
      mapInstance.removeLayer(tempLayer);
      setTempLayer(null);
    }
  };

  const cancelDrawing = () => {
    setDrawingMode('none');
    setDrawingPoints([]);
    if (tempLayer && mapInstance) {
      mapInstance.removeLayer(tempLayer);
      setTempLayer(null);
    }
  };

  const finishDrawing = async (points) => {
    if (points.length < 3) {
      alert('Wymagane co najmniej 3 punkty, aby zamknąć wielokąt.');
      cancelDrawing();
      return;
    }

    const sortedPoints = sortPointsClockwise(points);
    const newSector = {
      id: Date.now(),
      name: `Sektor ${sectors.length + 1}`,
      corners: sortedPoints.map(p => [p.lat, p.lng]),
      cropType: ''
    };

    setConfirmationModal({
      isOpen: true,
      sectorData: newSector
    });
  };

    const handleSectorConfirm = async (editedSectorData) => {
    try {
      const coordinatesDTO = editedSectorData.corners.map(corner => ({
        latitude: corner[0],
        longitude: corner[1]
      }));
      const backendData = {
        description: editedSectorData.name,
        plantType: editedSectorData.cropType || null,
        coordinates: coordinatesDTO
      };
      console.log('Wysyłanie danych do backendu:', backendData);
      const response = await fetch(`${BACKEND_URL}/api/sectors`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(backendData)
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      let result = null;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const text = await response.text();
        if (text && text.trim().length > 0) {
          try {
            result = JSON.parse(text);
          } catch (e) {
            console.warn('Nie udało się sparsować odpowiedzi JSON:', e);
          }
        }
      }
      console.log('Sektor wysłany do backendu:', result);
      const finalSector = { ...editedSectorData };
      if (result && result.id) {
        finalSector.backendId = result.id;
      }
      onSectorsChange([...sectors, finalSector]);
      alert('Sektor został pomyślnie dodany i zsynchronizowany z serwerem!');
    } catch (error) {
      console.error('Błąd podczas wysyłania sektora do backendu:', error);
      if (window.confirm('Nie udało się wysłać danych sektora do serwera. Czy chcesz zapisać sektor tylko lokalnie?')) {
        onSectorsChange([...sectors, editedSectorData]);
      }
    }
    setConfirmationModal({ isOpen: false, sectorData: null });
    cancelDrawing();
  };

  const handleSectorEdit = () => {
    setConfirmationModal({ isOpen: false, sectorData: null });
    
    setDrawingMode('polygon');
    setDrawingPoints([]);
    if (tempLayer && mapInstance) {
      mapInstance.removeLayer(tempLayer);
      setTempLayer(null);
    }
  };

  const handleMapClick = useCallback((e) => {
    if (drawingMode !== 'polygon') return;

    const clickPoint = e.latlng;
    
    setDrawingPoints(prevPoints => {
      const newPoints = [...prevPoints, clickPoint];
      if (newPoints.length === 4) {
        finishDrawing(newPoints);
        return [];
      }
      return newPoints;
    });
  }, [drawingMode, sectors]);

  const deleteSector = async (index) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten sektor?')) {
      if (sectors[index].backendId) {
        try {
          const response = await fetch(`${BACKEND_URL}/api/sectors/${sectors[index].backendId}`, {
            method: 'DELETE'
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
          }

          console.log('Sektor usunięty z backendu');
        } catch (error) {
          console.error('Błąd podczas usuwania sektora z backendu:', error);
          if (!window.confirm('Nie udało się usunąć sektora z serwera. Czy chcesz usunąć go tylko lokalnie?')) {
            return;
          }
        }
      }

      const updatedSectors = sectors.filter((_, i) => i !== index);
      onSectorsChange(updatedSectors);
      setSelectedSector(null);
    }
  };

  useEffect(() => {
    if (!mapInstance) return;

    const map = mapInstance;
    if (!drawnItemsRef.current) {
      drawnItemsRef.current = new L.FeatureGroup().addTo(map);
    }

    const drawnItems = drawnItemsRef.current;
    drawnItems.clearLayers();

    sectors.forEach((sector, index) => {
      if (!sector.corners) return;

      const polygon = L.polygon(sector.corners, {
        color: selectedSector === index ? '#ff0000' : '#3388ff',
        weight: selectedSector === index ? 3 : 2,
        fillColor: '#3388ff',
        fillOpacity: 0.2
      });

      polygon.bindPopup(`
        <div style="font-weight: bold; margin-bottom: 5px;">${sector.name}</div>
        <div>Uprawa: ${sector.cropType || 'Nie określono'}</div>
        <div style="margin-top: 8px;">
          <button onclick="window.editSector(${index})" style="background: #3388ff; color: white; border: none; padding: 4px 8px; border-radius: 3px; margin-right: 4px; cursor: pointer;">Edytuj</button>
          <button onclick="window.deleteSector(${index})" style="background: #ff4444; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer;">Usuń</button>
        </div>
      `);

      polygon.on('click', () => {
        setSelectedSector(selectedSector === index ? null : index);
      });

      drawnItems.addLayer(polygon);
    });

    window.editSector = (index) => setSelectedSector(index);
    window.deleteSector = deleteSector;

    if (drawingMode === 'polygon' && drawingPoints.length >= 1) {
      if (tempLayer) drawnItems.removeLayer(tempLayer);

      const tempPolygonLayer = L.polygon(
        drawingPoints.map(p => [p.lat, p.lng]), 
        {
          color: '#ff7800',
          weight: 2,
          fillColor: '#ff7800',
          fillOpacity: 0.3,
          dashArray: '5, 5'
        }
      );

      drawnItems.addLayer(tempPolygonLayer);
      setTempLayer(tempPolygonLayer);
    } else if (tempLayer) {
      drawnItems.removeLayer(tempLayer);
      setTempLayer(null);
    }

    map.getContainer().style.cursor = drawingMode !== 'none' ? 'crosshair' : '';
  }, [sectors, selectedSector, drawingMode, drawingPoints, mapInstance]);

  useEffect(() => {
    if (!mapInstance) return;
    
    const map = mapInstance;

    if (drawingMode === 'polygon') {
      map.on('click', handleMapClick);
      map.doubleClickZoom.disable();
    } else {
      map.off('click', handleMapClick);
      map.doubleClickZoom.enable();
    }

    return () => {
      map.off('click', handleMapClick);
      map.doubleClickZoom.enable();
    };
  }, [drawingMode, handleMapClick, mapInstance]);

  const getDrawingInstructions = () => {
    if (drawingMode !== 'polygon') return '';
    
    const currentCount = drawingPoints.length;
    if (currentCount === 0) return 'Kliknij pierwszy z 4 punktów wielokąta.';
    if (currentCount < 4) return `Kliknij, aby dodać punkt. Masz: ${currentCount}/4 punkty.`;
    return 'Rysowanie zakończone, tworzenie sektora...';
  };

  return (
    <div className="relative">
      <LocationSearch map={leafletMapRef.current} />
      
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Jak korzystać:</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <div><strong>1. Wyszukaj lokalizację:</strong> Wpisz nazwę miejscowości</div>
          <div><strong>2. Rysuj sektor:</strong> Klikaj 4 punkty na mapie</div>
          {drawingMode !== 'none' && (
            <div className="text-orange-700 font-medium mt-2 p-2 bg-orange-100 rounded">
              {getDrawingInstructions()}
            </div>
          )}
        </div>
      </div>

      <MapContainer
        center={[52.2297, 21.0122]}
        zoom={13}
        style={{ height: '500px', width: '100%' }}
        ref={handleMapLoad}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      </MapContainer>

      <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-[1000]">
        {drawingMode === 'none' ? (
          <button
            onClick={startDrawing}
            className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg shadow-lg flex items-center gap-2 transition-colors"
          >
            <Layers size={20} />
            <span className="text-sm font-medium">Rysuj Sektor</span>
          </button>
        ) : (
          <button
            onClick={cancelDrawing}
            className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg shadow-lg flex items-center gap-2 transition-colors"
          >
            <X size={20} />
            <span className="text-sm font-medium">Anuluj</span>
          </button>
        )}

        {sectors.length > 0 && (
          <div className="bg-white p-3 rounded-lg shadow-lg text-xs max-w-48">
            <div className="font-semibold text-gray-700 mb-1">Statystyki:</div>
            <div className="text-gray-600">Sektorów: {sectors.length}</div>
            <div className="text-gray-500 mt-2 text-xs">Kliknij sektor aby zobaczyć szczegóły</div>
          </div>
        )}
      </div>

      <SectorConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal({ isOpen: false, sectorData: null })}
        sectorData={confirmationModal.sectorData}
        onConfirm={handleSectorConfirm}
        onEdit={handleSectorEdit}
      />
    </div>
  );
};

const SectorsList = ({ sectors, onSectorsChange }) => {
  const updateSector = async (index, field, value) => {
    const updatedSectors = sectors.map((sector, i) => 
      i === index ? { ...sector, [field]: value } : sector
    );
    
    if (field === 'cropType' && sectors[index].backendId) {
      try {
        const coordinatesDTO = updatedSectors[index].corners.map(corner => ({
          latitude: corner[0],
          longitude: corner[1]
        }));

        const sectorData = {
          id: sectors[index].backendId,
          description: updatedSectors[index].name,
          plantType: value || null,
          coordinates: coordinatesDTO
        };

        const response = await fetch(`${BACKEND_URL}/api/sectors${sectors[index].backendId}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(sectorData)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        console.log('Sektor zaktualizowany w backendzie');
      } catch (error) {
        console.error('Błąd podczas aktualizacji sektora w backendzie:', error);
      }
    }
    
    onSectorsChange(updatedSectors);
  };

  const deleteSector = async (index) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten sektor?')) {
      if (sectors[index].backendId) {
        try {
          const response = await fetch(`${BACKEND_URL}/api/sectors${sectors[index].backendId}`, {
            method: 'DELETE'
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
          }

          console.log('Sektor usunięty z backendu');
        } catch (error) {
          console.error('Błąd podczas usuwania sektora z backendu:', error);
          if (!window.confirm('Nie udało się usunąć sektora z serwera. Czy chcesz usunąć go tylko lokalnie?')) {
            return;
          }
        }
      }

      const updatedSectors = sectors.filter((_, i) => i !== index);
      onSectorsChange(updatedSectors);
    }
  };

  if (sectors.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <div className="flex justify-center gap-4 mb-4">
          <Layers size={48} className="text-gray-400" />
          <Search size={48} className="text-gray-400" />
        </div>
        <p className="text-xl text-gray-500 mb-2">Nie zdefiniowano jeszcze żadnych sektorów</p>
        <p className="text-gray-400 mb-4">
          Wyszukaj miejscowość i użyj mapy, aby oznaczyć obszary upraw
        </p>
        <div className="text-sm text-gray-500 space-y-1">
          <div>• <strong>Wyszukaj miejscowość:</strong> znajdź swoje gospodarstwo</div>
          <div>• <strong>Rysuj sektor:</strong> kliknij 4 punkty na mapie</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold mb-4">Zdefiniowane sektory</h2>

      <div className="grid gap-4">
        {sectors.map((sector, index) => (
          <div key={sector.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <button
                onClick={() => deleteSector(index)}
                className="text-red-500 hover:text-red-700 p-1"
                title="Usuń sektor"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                  {CROP_TYPES.map(crop => (
                    <option key={crop.value} value={crop.value}>
                      {crop.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-3 text-xs text-gray-500 bg-gray-50 p-2 rounded">
              <strong>Geometria:</strong> Wielokąt z {sector.corners ? sector.corners.length : 'N/A'} wierzchołkami
              {sector.backendId && (
                <span className="ml-2">• ID backendu: {sector.backendId}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const OrchardMapSystem = () => {
  const [sectors, setSectors] = useState([]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          System Zarządzania Gospodarstwem Sadowniczym
        </h1>
        <p className="text-gray-600 mb-4">
          Mapowanie i zarządzanie sektorami upraw z integracją backend
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{sectors.length}</div>
            <div className="text-blue-800">Zdefiniowane sektory</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {sectors.filter(s => s.cropType).length}
            </div>
            <div className="text-green-800">Sektory z uprawą</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {sectors.filter(s => s.backendId).length}
            </div>
            <div className="text-purple-800">Synchronizowane</div>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-lg overflow-hidden shadow-lg">
        <InteractiveMap 
          sectors={sectors}
          onSectorsChange={setSectors}
        />
      </div>

      <SectorsList 
        sectors={sectors}
        onSectorsChange={setSectors}
      />
    </div>
  );
};

export default OrchardMapSystem;