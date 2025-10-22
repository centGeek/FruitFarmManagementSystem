import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Trash2, Layers, X, Search, MapPin, Loader, Check, AlertCircle, Edit3 } from 'lucide-react';
import { BACKEND_URL, getAuthHeaders } from "../utils/apiConfigs";
import LocationSearch from './LocationSearch';
import BasicMap from './BasicMap';


const CROP_TYPES = [
  { 
    value: 'APPLE', 
    label: '🍎 Jabłonie',
    varieties: [
      { value: 'GOLDEN_DELICIOUS', label: 'Golden Delicious' },
      { value: 'RED_DELICIOUS', label: 'Red Delicious' },
      { value: 'GALA', label: 'Gala' },
      { value: 'CHAMPION', label: 'Champion' },
      { value: 'IDARED', label: 'Idared' },
      { value: 'LIGOL', label: 'Ligol' },
      { value: 'SZAMPION', label: 'Szampion' },
      { value: 'JONAGOLD', label: 'Jonagold' },
      { value: 'GLOSTER', label: 'Gloster' },
      { value: 'OTHER', label: 'Inna odmiana' }
    ]
  },
  { 
    value: 'PEAR', 
    label: '🍐 Grusze',
    varieties: [
      { value: 'CONFERENCE', label: 'Conference' },
      { value: 'WILLIAMS', label: 'Williams' },
      { value: 'LUKASOWKA', label: 'Łukasówka' },
      { value: 'FAWORYTKA', label: 'Faworytka' },
      { value: 'BONKRETA', label: 'Bonkreta' },
      { value: 'OTHER', label: 'Inna odmiana' }
    ]
  },
  { 
    value: 'PLUM', 
    label: '🟣 Śliwy',
    varieties: [
      { value: 'WEGIERSKA', label: 'Węgierka' },
      { value: 'RENKLODA', label: 'Renkloda' },
      { value: 'ELENA', label: 'Elena' },
      { value: 'PRESIDENT', label: 'President' },
      { value: 'CACANSKA', label: 'Čačanska' },
      { value: 'OTHER', label: 'Inna odmiana' }
    ]
  },
  { 
    value: 'CHERRY', 
    label: '🍒 Wiśnie',
    varieties: [
      { value: 'LUTOWKA', label: 'Łutówka' },
      { value: 'NEFRIS', label: 'Nefris' },
      { value: 'DEBRECENI', label: 'Debreceni' },
      { value: 'KELLERIS', label: 'Kelleris' },
      { value: 'OTHER', label: 'Inna odmiana' }
    ]
  },
  { 
    value: 'SWEET_CHERRY', 
    label: '🍒 Czereśnie',
    varieties: [
      { value: 'BURLAT', label: 'Burlat' },
      { value: 'KORDIA', label: 'Kordia' },
      { value: 'REGINA', label: 'Regina' },
      { value: 'LAPINS', label: 'Lapins' },
      { value: 'VAN', label: 'Van' },
      { value: 'SUMMIT', label: 'Summit' },
      { value: 'OTHER', label: 'Inna odmiana' }
    ]
  },
  { 
    value: 'RASPBERRY', 
    label: '🍓 Maliny',
    varieties: [
      { value: 'POLKA', label: 'Polka' },
      { value: 'POLANA', label: 'Polana' },
      { value: 'LASZKA', label: 'Laszka' },
      { value: 'GLEN_AMPLE', label: 'Glen Ample' },
      { value: 'TULAMEEN', label: 'Tulameen' },
      { value: 'OTHER', label: 'Inna odmiana' }
    ]
  }
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

const SectorConfirmationModal = ({ isOpen, onClose, sectorData, onConfirm, onEdit }) => {
  const [editedSector, setEditedSector] = useState({
    id: null,
    name: '',
    cropType: '',
    variety: '',
    corners: []
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (sectorData && isOpen) {
      setEditedSector({
        id: sectorData.id || null,
        name: sectorData.name || '',
        cropType: sectorData.cropType || '',
        variety: sectorData.variety || '',
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
    setEditedSector(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      
      if (field === 'cropType') {
        updated.variety = '';
      }
      
      return updated;
    });
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

  const selectedCropType = CROP_TYPES.find(c => c.value === editedSector.cropType);

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
                {editedSector.cropType && selectedCropType && (
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-2">
                      Odmiana
                    </label>
                    <select
                      value={editedSector.variety}
                      onChange={(e) => handleInputChange('variety', e.target.value)}
                      className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="">Wybierz odmianę...</option>
                      {selectedCropType.varieties.map(variety => (
                        <option key={variety.value} value={variety.value}>
                          {variety.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {editedSector.cropType && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">Wybrana uprawa</h4>
                <div className="p-3 bg-white rounded border border-green-300">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">
                      {CROP_TYPES.find(c => c.value === editedSector.cropType)?.label.split(' ')[0]}
                    </span>
                    <div className="flex-1">
                      <div className="font-bold text-green-900">
                        {CROP_TYPES.find(c => c.value === editedSector.cropType)?.label}
                      </div>
                      <div className="text-xs text-green-700">
                        Typ: {editedSector.cropType}
                      </div>
                    </div>
                  </div>
                  {editedSector.variety && (
                    <div className="pt-2 border-t border-green-200">
                      <div className="text-sm text-green-800">
                        <span className="font-medium">Odmiana:</span>{' '}
                        {selectedCropType?.varieties.find(v => v.value === editedSector.variety)?.label || editedSector.variety}
                      </div>
                    </div>
                  )}
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
  const [editMode, setEditMode] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const editMarkersRef = useRef([]);
  const [drawingPoints, setDrawingPoints] = useState([]);
  const [tempLayer, setTempLayer] = useState(null);
  const [selectedSector, setSelectedSector] = useState(null);
  const [confirmationModal, setConfirmationModal] = useState({ isOpen: false, sectorData: null });
  const [visibleSectorIndices, setVisibleSectorIndices] = useState([]);
  const animationTimeoutRef = useRef(null);

  
  const handleMapLoad = (map) => {
    leafletMapRef.current = map;
    setMapInstance(map);
  };

  useEffect(() => {
    if (sectors.length === 0) {
      setVisibleSectorIndices([]);
      return;
    }

    setVisibleSectorIndices([]);
    
    if (animationTimeoutRef.current) {
      animationTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
    }

    const timeouts = [];
    
    sectors.forEach((_, index) => {
      const timeout = setTimeout(() => {
        setVisibleSectorIndices(prev => [...prev, index]);
        
        if (index === sectors.length - 1 && mapInstance && sectors.length > 0) {
          setTimeout(() => {
            const allCorners = sectors.flatMap(s => s.corners || []);
            if (allCorners.length > 0) {
              const bounds = L.latLngBounds(allCorners);
              mapInstance.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
            }
          }, 100);
        }
      }, 0);
      
      timeouts.push(timeout);
    });

    animationTimeoutRef.current = timeouts;

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [sectors.length, mapInstance]);

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
      variety: editedSectorData.variety || null,
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

  const enableSectorEdit = (sectorIndex) => {

  if (mapInstance) {
    mapInstance.closePopup();
    mapInstance.dragging.disable();
  }
  
  setEditMode({ sectorIndex, cornerIndex: null });
  setDrawingMode('none');
};

const disableEditMode = () => {
  setEditMode(null);
  
  if (mapInstance) {
    mapInstance.dragging.enable();
  }
  
  if (editMarkersRef.current && mapInstance) {
    editMarkersRef.current.forEach(marker => {
      if (mapInstance.hasLayer(marker)) {
        mapInstance.removeLayer(marker);
      }
    });
    editMarkersRef.current = [];
  }
};
const updateCornerPosition = async (sectorIndex, cornerIndex, newLatLng) => {
  const updatedSectors = [...sectors];
  updatedSectors[sectorIndex].corners[cornerIndex] = [newLatLng.lat, newLatLng.lng];
  
  if (updatedSectors[sectorIndex].backendId) {
    try {
      const coordinatesDTO = updatedSectors[sectorIndex].corners.map(corner => ({
        latitude: corner[0],
        longitude: corner[1]
      }));

      const sectorData = {
        id: updatedSectors[sectorIndex].backendId,
        description: updatedSectors[sectorIndex].name,
        plantType: updatedSectors[sectorIndex].cropType || null,
        variety: updatedSectors[sectorIndex].variety || null,
        coordinates: coordinatesDTO
      };

      const response = await fetch(`${BACKEND_URL}/api/sectors/${updatedSectors[sectorIndex].backendId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(sectorData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('Pozycja wierzchołka zaktualizowana w backendzie');
    } catch (error) {
      console.error('Błąd podczas aktualizacji pozycji w backendzie:', error);
    }
  }
  
  onSectorsChange(updatedSectors);
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

  editMarkersRef.current.forEach(marker => {
    if (map.hasLayer(marker)) {
      map.removeLayer(marker);
    }
  });
  editMarkersRef.current = [];
if (drawingMode === 'polygon' && drawingPoints.length > 0) {
    // Rysuj już umieszczone punkty
    drawingPoints.forEach((point, index) => {
      const pointMarker = L.circleMarker([point.lat, point.lng], {
        radius: 8,
        fillColor: '#ff6b00',
        color: '#ffffff',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.9
      }).addTo(drawnItems);

      pointMarker.bindTooltip(`Punkt ${index + 1}`, {
        permanent: true,
        direction: 'top',
        className: 'drawing-tooltip'
      });
    });

    // Rysuj linie łączące punkty
    if (drawingPoints.length > 1) {
      const linePoints = drawingPoints.map(p => [p.lat, p.lng]);
      L.polyline(linePoints, {
        color: '#ff6b00',
        weight: 2,
        opacity: 0.7,
        dashArray: '5, 5'
      }).addTo(drawnItems);
    }

    // Jeśli mamy 3 punkty, narysuj linię do pierwszego punktu (zamknięcie)
    if (drawingPoints.length === 3) {
      const closingLine = [
        [drawingPoints[drawingPoints.length - 1].lat, drawingPoints[drawingPoints.length - 1].lng],
        [drawingPoints[0].lat, drawingPoints[0].lng]
      ];
      L.polyline(closingLine, {
        color: '#ff6b00',
        weight: 2,
        opacity: 0.5,
        dashArray: '10, 10'
      }).addTo(drawnItems);
    }
  }

  const sectorsToShow = sectors.filter((_, index) => visibleSectorIndices.includes(index));

  sectorsToShow.forEach((sector, visibleIndex) => {
    if (!sector.corners || sector.corners.length === 0) return;

    const actualIndex = sectors.indexOf(sector);
    const isBeingEdited = editMode?.sectorIndex === actualIndex;

    const polygon = L.polygon(sector.corners, {
      color: isBeingEdited ? '#ff6b00' : (selectedSector === actualIndex ? '#ff0000' : '#3388ff'),
      weight: isBeingEdited ? 3 : (selectedSector === actualIndex ? 3 : 2),
      fillColor: isBeingEdited ? '#ff6b00' : '#3388ff',
      fillOpacity: isBeingEdited ? 0.3 : 0.2
    });

    const cropTypeLabel = sector.cropType 
      ? CROP_TYPES.find(c => c.value === sector.cropType)?.label || sector.cropType
      : 'Nie określono';

    const varietyLabel = sector.variety
      ? CROP_TYPES.find(c => c.value === sector.cropType)?.varieties.find(v => v.value === sector.variety)?.label || sector.variety
      : null;

    polygon.bindPopup(`
      <div style="padding: 12px;">
        <div style="font-size: 16px; font-weight: bold; color: #1f2937; margin-bottom: 6px;">
          📍 ${sector.name}
        </div>
        <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">
          Uprawa: <b> ${cropTypeLabel} </b>
        </div>
        ${varietyLabel ? `
          <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">
            🌱Odmiana: <b>${varietyLabel} </b>
          </div>
        ` : ''}
        ${!isBeingEdited ? `
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
            <button 
              onclick="window.editSectorVertices(${actualIndex})" 
              style="width: 100%; padding: 6px 12px; background: #ff6b00; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500;"
            >
              ✏️ Edytuj wierzchołki
            </button>
          </div>
        ` : ''}
      </div>
    `, {
      maxWidth: 250
    });

    drawnItems.addLayer(polygon);

    sector.corners.forEach((corner, cornerIndex) => {
      const isEditable = isBeingEdited;
      
      let marker;
      
      if (isEditable) {
        const editIcon = L.divIcon({
          className: 'custom-edit-marker',
          html: `<div style="
            background: #ff6b00;
            border: 3px solid white;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            cursor: move;
          "></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
        
        marker = L.marker(corner, {
          icon: editIcon,
          draggable: true,
          autoPan: true
        });
      } else {
        marker = L.circleMarker(corner, {
          radius: 4,
          fillColor: '#3388ff',
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        });
      }
      
      if (isEditable) {
        marker.on('dragstart', () => {
          setIsDragging(true);
        });

        marker.on('drag', (e) => {
          const newLatLng = e.target.getLatLng();
          const updatedCorners = [...sector.corners];
          updatedCorners[cornerIndex] = [newLatLng.lat, newLatLng.lng];
          
          polygon.setLatLngs(updatedCorners);
        });

        marker.on('dragend', (e) => {
          const newLatLng = e.target.getLatLng();
          updateCornerPosition(actualIndex, cornerIndex, newLatLng);
          setIsDragging(false);
        });

        marker.bindTooltip(`Przeciągnij punkt ${cornerIndex + 1}`, {
          permanent: false,
          direction: 'top'
        });

        editMarkersRef.current.push(marker);
      } else {
        marker.bindTooltip(`Punkt ${cornerIndex + 1}`, {
          permanent: false,
          direction: 'top'
        });
      }
      
      drawnItems.addLayer(marker);
    });
  });

  window.editSectorVertices = enableSectorEdit;

  map.getContainer().style.cursor = drawingMode !== 'none' ? 'crosshair' : (isDragging ? 'grabbing' : '');
}, [sectors, selectedSector, drawingMode, drawingPoints, mapInstance, visibleSectorIndices, editMode, isDragging]);

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

    {/* TUTAJ JEST MAPA - TO JEST TA ZMIANA! */}
    <div className="relative">
      <BasicMap 
        onMapLoad={handleMapLoad}
        style={{ height: '500px', width: '100%' }}
      />
    </div>

    {/* Przyciski sterujące */}
    <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-[1000]">
      {editMode !== null ? (
        <button
          onClick={disableEditMode}
          className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-lg shadow-lg flex items-center gap-2 transition-colors"
        >
          <Check size={20} />
          <span className="text-sm font-medium">Zakończ edycję</span>
        </button>
      ) : drawingMode === 'none' ? (
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
          {editMode !== null && (
            <div className="text-orange-600 mt-2 text-xs font-medium">
              🔧 Tryb edycji aktywny
            </div>
          )}
          <div className="text-gray-500 mt-2 text-xs">
            {visibleSectorIndices.length < sectors.length 
              ? `Ładowanie: ${visibleSectorIndices.length}/${sectors.length}`
              : editMode !== null 
                ? 'Przeciągnij wierzchołki aby zmienić kształt'
                : 'Kliknij sektor aby zobaczyć szczegóły'
            }
          </div>
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
}
const EditSectorModal = ({ isOpen, onClose, sectorData, onSave }) => {
  const [editedSector, setEditedSector] = useState({
    id: null,
    backendId: null,
    name: '',
    cropType: '',
    variety: '',
    corners: []
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (sectorData && isOpen) {
      setEditedSector({
        id: sectorData.id,
        backendId: sectorData.backendId,
        name: sectorData.name || '',
        cropType: sectorData.cropType || '',
        variety: sectorData.variety || '',
        corners: sectorData.corners || []
      });
    }
  }, [sectorData, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (field, value) => {
    setEditedSector(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      
      if (field === 'cropType') {
        updated.variety = '';
      }
      
      return updated;
    });
  };

  const handleSave = async () => {
    if (!editedSector.name.trim()) {
      alert('Nazwa sektora jest wymagana!');
      return;
    }

    setIsLoading(true);
    try {
      await onSave(editedSector);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCropType = CROP_TYPES.find(c => c.value === editedSector.cropType);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Edit3 className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Edytuj sektor
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
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <h4 className="font-semibold text-orange-900 mb-4">Dane sektora</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-orange-800 mb-2">
                    Nazwa sektora *
                  </label>
                  <input
                    type="text"
                    value={editedSector.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full p-3 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                    placeholder="np. Sektor wschodni, Sad jabłoniowy A..."
                  />
                  {!editedSector.name.trim() && (
                    <p className="text-red-600 text-xs mt-1">Nazwa jest wymagana</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-orange-800 mb-2">
                    Rodzaj uprawy
                  </label>
                  <select
                    value={editedSector.cropType}
                    onChange={(e) => handleInputChange('cropType', e.target.value)}
                    className="w-full p-3 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                  >
                    <option value="">Wybierz rodzaj uprawy...</option>
                    {CROP_TYPES.map(crop => (
                      <option key={crop.value} value={crop.value}>
                        {crop.label}
                      </option>
                    ))}
                  </select>
                </div>

                {editedSector.cropType && selectedCropType && (
                  <div>
                    <label className="block text-sm font-medium text-orange-800 mb-2">
                      Odmiana
                    </label>
                    <select
                      value={editedSector.variety}
                      onChange={(e) => handleInputChange('variety', e.target.value)}
                      className="w-full p-3 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                    >
                      <option value="">Wybierz odmianę...</option>
                      {selectedCropType.varieties.map(variety => (
                        <option key={variety.value} value={variety.value}>
                          {variety.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {editedSector.cropType && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">Wybrana uprawa</h4>
                <div className="p-3 bg-white rounded border border-green-300">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">
                      {CROP_TYPES.find(c => c.value === editedSector.cropType)?.label.split(' ')[0]}
                    </span>
                    <div className="flex-1">
                      <div className="font-bold text-green-900">
                        {CROP_TYPES.find(c => c.value === editedSector.cropType)?.label}
                      </div>
                      <div className="text-xs text-green-700">
                        Typ: {editedSector.cropType}
                      </div>
                    </div>
                  </div>
                  {editedSector.variety && (
                    <div className="pt-2 border-t border-green-200">
                      <div className="text-sm text-green-800">
                        <span className="font-medium">Odmiana:</span>{' '}
                        {selectedCropType?.varieties.find(v => v.value === editedSector.variety)?.label || editedSector.variety}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Anuluj
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || !editedSector.name.trim()}
              className="flex-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-medium shadow-lg"
            >
              {isLoading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {isLoading ? 'Zapisywanie...' : 'Zapisz zmiany'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SectorsList = ({ sectors, onRefresh, isLoading, onEditSector }) => {
    if (sectors.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <div className="flex justify-center gap-4 mb-4">
          <Layers size={48} className="text-gray-400" />
          <Search size={48} className="text-gray-400" />
        </div>
        <p className="text-xl text-gray-500 mb-2">
          {isLoading ? 'Ładowanie sektorów...' : 'Nie zdefiniowano jeszcze żadnych sektorów'}
        </p>
        <p className="text-gray-400 mb-4">
          {isLoading 
            ? 'Proszę czekać...'
            : 'Wyszukaj miejscowość i użyj mapy, aby oznaczyć obszary upraw'
          }
        </p>
        {!isLoading && (
          <div className="text-sm text-gray-500 space-y-1">
            <div>• <strong>Wyszukaj miejscowość:</strong> znajdź swoje gospodarstwo</div>
            <div>• <strong>Rysuj sektor:</strong> kliknij 4 punkty na mapie</div>
          </div>
        )}
      </div>
    );
  }

  return (
  <div className="bg-white rounded-lg shadow-lg p-6">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-2xl font-semibold">Zdefiniowane sektory</h2>
      <button
        onClick={onRefresh}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        title="Odśwież dane z serwera"
      >
        <Loader className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        Odśwież
      </button>
    </div>

    <div className="grid gap-4">
      {sectors.map((sector) => {
        const cropTypeData = CROP_TYPES.find(c => c.value === sector.cropType);
        const varietyData = cropTypeData?.varieties.find(v => v.value === sector.variety);
        
        return (
          <div key={sector.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nazwa sektora
                </label>
                <div className="w-full p-2 border border-gray-200 rounded bg-gray-50 text-gray-800">
                  {sector.name}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rodzaj uprawy
                </label>
                <div className="w-full p-2 border border-gray-200 rounded bg-gray-50 text-gray-800">
                  {cropTypeData ? cropTypeData.label : (sector.cropType || 'Nie określono')}
                </div>
              </div>
            </div>

            {sector.variety && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Odmiana
                </label>
                <div className="block text-sm font-medium text-gray-700 mb-1">
                  🌱 {varietyData ? varietyData.label : sector.variety}
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between gap-4">
            <button
              onClick={() => onEditSector(sector)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
            >
              <Edit3 className="w-4 h-4" />
              Edytuj sektor
            </button>

            {sector.corners && sector.corners.length > 0 && (
              <details className="text-xs">
                <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  Współrzędne GPS
                </summary>
                <div className="absolute right-0 mt-2 bg-white p-3 rounded-lg border border-gray-200 shadow-lg z-10 max-h-40 overflow-y-auto min-w-64">
                  <div className="space-y-1 font-mono text-xs">
                    {sector.corners.map((corner, idx) => (
                      <div key={idx} className="flex justify-between gap-4">
                        <span className="text-gray-600">Punkt {idx + 1}:</span>
                        <span className="text-gray-800">
                          {corner[0].toFixed(6)}, {corner[1].toFixed(6)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </details>
            )}
          </div>
          </div>
        );
      })}
    </div>
  </div>
);
};

const OrchardMapSystem = () => {
  const [sectors, setSectors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [editSectorModal, setEditSectorModal] = useState({ isOpen: false, sectorData: null });
  const loadSectorsFromBackend = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/sectors`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Błąd HTTP: ${response.status}`);
      }

      const backendSectors = await response.json();
      console.log('Załadowano sektory z backendu:', backendSectors);

      const mappedSectors = backendSectors.map(sector => ({
        id: Date.now() + Math.random(),
        backendId: sector.id,
        name: sector.description || `Sektor ${sector.id}`,
        cropType: sector.plantType || '',
        variety: sector.variety || '',
        corners: sector.coordinates?.map(coord => [
          coord.latitude,
          coord.longitude
        ]) || []
      }));

      setSectors(mappedSectors);
      
    } catch (error) {
      console.error('❌ Błąd podczas ładowania sektorów:', error);
      setLoadError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleEditSector = (sector) => {
  setEditSectorModal({
    isOpen: true,
    sectorData: sector
  });
};

const handleSaveEditedSector = async (editedSector) => {
  try {
    if (!editedSector.backendId) {
      alert('Brak ID backendu - nie można edytować tego sektora');
      return;
    }

    const coordinatesDTO = editedSector.corners.map(corner => ({
      latitude: corner[0],
      longitude: corner[1]
    }));

    const backendData = {
      id: editedSector.backendId,
      description: editedSector.name,
      plantType: editedSector.cropType || null,
      variety: editedSector.variety || null,
      coordinates: coordinatesDTO
    };

    console.log('Aktualizacja sektora w backendzie:', backendData);

    const response = await fetch(`${BACKEND_URL}/api/sectors/${editedSector.backendId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(backendData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    console.log('Sektor zaktualizowany w backendzie');

    // Aktualizuj lokalny stan
    const updatedSectors = sectors.map(s => 
      s.id === editedSector.id ? editedSector : s
    );
    setSectors(updatedSectors);

    setEditSectorModal({ isOpen: false, sectorData: null });
    alert('Sektor został pomyślnie zaktualizowany!');
    
  } catch (error) {
    console.error('Błąd podczas aktualizacji sektora:', error);
    alert(`Nie udało się zaktualizować sektora: ${error.message}`);
  }
};

  useEffect(() => {
    loadSectorsFromBackend();
  }, [loadSectorsFromBackend]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          System Zarządzania Gospodarstwem Sadowniczym
        </h1>
        <p className="text-gray-600 mb-4">
          Mapowanie i zarządzanie sektorami upraw 
        </p>

        {isLoading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3">
              <Loader className="w-5 h-5 text-blue-600 animate-spin" />
              <div>
                <div className="font-semibold text-blue-900">Ładowanie danych...</div>
                <div className="text-sm text-blue-700">Pobieranie sektorów z serwera</div>
              </div>
            </div>
          </div>
        )}

        {loadError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div>
                  <div className="font-semibold text-red-900">Błąd ładowania danych</div>
                  <div className="text-sm text-red-700">{loadError}</div>
                </div>
              </div>
              <button
                onClick={loadSectorsFromBackend}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Spróbuj ponownie
              </button>
            </div>
          </div>
        )}
        
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
  <div className="bg-amber-50 p-4 rounded-lg">
    <div className="text-2xl font-bold text-amber-600">
      {new Set(sectors.map(s => s.variety).filter(Boolean)).size}
    </div>
    <div className="text-amber-800">Rodzaje odmian</div>
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
        onRefresh={loadSectorsFromBackend}
        isLoading={isLoading}
        onEditSector={handleEditSector}
      />

      <EditSectorModal
        isOpen={editSectorModal.isOpen}
        onClose={() => setEditSectorModal({ isOpen: false, sectorData: null })}
        sectorData={editSectorModal.sectorData}
        onSave={handleSaveEditedSector}
      />
    </div>
  );
};

export default OrchardMapSystem;