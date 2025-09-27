import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Download, Upload, Trash2, Square, Edit3, X, RotateCw, Move } from 'lucide-react';

// Fix dla ikon Leaflet w Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Funkcja do tworzenia obróconych prostokątów
const createRotatedRectangle = (center, width, height, rotation = 0) => {
  const toRad = Math.PI / 180;
  const cos = Math.cos(rotation * toRad);
  const sin = Math.sin(rotation * toRad);
  
  // Wierzchołki prostokąta względem centrum (w metrach)
  const corners = [
    [-width/2, -height/2],
    [width/2, -height/2],
    [width/2, height/2],
    [-width/2, height/2]
  ];
  
  // Obrót i konwersja na współrzędne geograficzne
  const rotatedCorners = corners.map(([x, y]) => {
    const rotX = x * cos - y * sin;
    const rotY = x * sin + y * cos;
    
    // Konwersja z metrów na stopnie (przybliżenie)
    const deltaLat = rotY / 111320; // 1 stopień = ~111320m
    const deltaLng = rotX / (111320 * Math.cos(center[0] * toRad));
    
    return [center[0] + deltaLat, center[1] + deltaLng];
  });
  
  return rotatedCorners;
};

// Funkcja do obliczania obszaru wielokąta (formuła Shoelace)
const calculatePolygonArea = (corners) => {
  let area = 0;
  const n = corners.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += corners[i][0] * corners[j][1];
    area -= corners[j][0] * corners[i][1];
  }
  
  area = Math.abs(area) / 2;
  
  // Konwersja ze stopni^2 na hektary
  const areaKm2 = area * 111.32 * 111.32;
  const areaHa = areaKm2 * 100;
  
  return areaHa;
};

const InteractiveMap = ({ rectangles, onRectanglesChange, onSectorsChange }) => {
  const mapRef = useRef(null);
  const drawnItemsRef = useRef(null);
  const [drawingMode, setDrawingMode] = useState('none'); // 'rectangle', 'rotated', 'none'
  const [drawingStep, setDrawingStep] = useState(0); // 0: start, 1: second point, 2: rotation
  const [drawingPoints, setDrawingPoints] = useState([]);
  const [tempPolygon, setTempPolygon] = useState(null);
  const [selectedRectangle, setSelectedRectangle] = useState(null);
  const [dragMode, setDragMode] = useState(false);

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
      let polygon;
      
      if (rect.corners) {
        // Obrócony prostokąt
        polygon = L.polygon(rect.corners, {
          color: selectedRectangle === index ? '#ff0000' : '#3388ff',
          weight: selectedRectangle === index ? 3 : 2,
          fillColor: '#3388ff',
          fillOpacity: 0.2
        });
      } else {
        // Zwykły prostokąt (kompatybilność wsteczna)
        const bounds = L.latLngBounds(rect.bounds[0], rect.bounds[1]);
        polygon = L.rectangle(bounds, {
          color: selectedRectangle === index ? '#ff0000' : '#3388ff',
          weight: selectedRectangle === index ? 3 : 2,
          fillColor: '#3388ff',
          fillOpacity: 0.2
        });
      }
      
      polygon.bindPopup(`
        <div style="font-weight: bold; margin-bottom: 5px;">${rect.name}</div>
        <div>Uprawa: ${rect.cropType || 'Nie określono'}</div>
        <div>Powierzchnia: ${rect.area} ha</div>
        ${rect.rotation ? `<div>Obrót: ${rect.rotation}°</div>` : ''}
        <div style="margin-top: 8px;">
          <button onclick="window.editRectangle(${index})" style="background: #3388ff; color: white; border: none; padding: 4px 8px; border-radius: 3px; margin-right: 4px; cursor: pointer;">Edytuj</button>
          <button onclick="window.deleteRectangle(${index})" style="background: #ff4444; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer;">Usuń</button>
        </div>
      `);

      polygon.on('click', () => {
        setSelectedRectangle(selectedRectangle === index ? null : index);
      });

      drawnItems.addLayer(polygon);

      // Dodaj punkt centralny dla obróconych prostokątów
      if (rect.corners && rect.center) {
        const centerMarker = L.circleMarker(rect.center, {
          radius: 4,
          color: '#ff7800',
          weight: 2,
          fillColor: '#ff7800',
          fillOpacity: 0.8
        });
        drawnItems.addLayer(centerMarker);
      }
    });

    // Dodaj tymczasowy wielokąt podczas rysowania
    if (tempPolygon) {
      const polygon = L.polygon(tempPolygon, {
        color: '#ff7800',
        weight: 2,
        fillColor: '#ff7800',
        fillOpacity: 0.3,
        dashArray: '5, 5'
      });
      drawnItems.addLayer(polygon);
    }

    // Funkcje globalne dla popup'ów
    window.editRectangle = (index) => {
      setSelectedRectangle(index);
    };

    window.deleteRectangle = (index) => {
      if (window.confirm('Czy na pewno chcesz usunąć ten sektor?')) {
        const updatedRectangles = rectangles.filter((_, i) => i !== index);
        onRectanglesChange(updatedRectangles);
        onSectorsChange(updatedRectangles);
        setSelectedRectangle(null);
      }
    };

  }, [rectangles, tempPolygon, selectedRectangle]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    const handleMapClick = (e) => {
      if (drawingMode === 'none') return;

      const clickPoint = [e.latlng.lat, e.latlng.lng];

      if (drawingMode === 'rectangle') {
        // Zwykły prostokąt - 2 punkty
        if (drawingStep === 0) {
          setDrawingPoints([clickPoint]);
          setDrawingStep(1);
        } else if (drawingStep === 1) {
          const bounds = [
            [Math.min(drawingPoints[0][0], clickPoint[0]), Math.min(drawingPoints[0][1], clickPoint[1])],
            [Math.max(drawingPoints[0][0], clickPoint[0]), Math.max(drawingPoints[0][1], clickPoint[1])]
          ];

          const newRect = {
            id: Date.now(),
            name: `Sektor ${rectangles.length + 1}`,
            bounds: bounds,
            cropType: '',
            area: calculateRectangleArea(bounds),
            workers: [],
            notes: ''
          };

          finishDrawing(newRect);
        }
      } else if (drawingMode === 'rotated') {
        // Obrócony prostokąt - 3 punkty
        if (drawingStep === 0) {
          setDrawingPoints([clickPoint]);
          setDrawingStep(1);
        } else if (drawingStep === 1) {
          setDrawingPoints([...drawingPoints, clickPoint]);
          setDrawingStep(2);
        } else if (drawingStep === 2) {
          const [p1, p2] = drawingPoints;
          const p3 = clickPoint;

          // Oblicz centrum, szerokość, wysokość i obrót
          const center = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
          const width = calculateDistance(p1, p2);
          
          // Wysokość to odległość od p3 do linii p1-p2
          const height = calculatePointToLineDistance(p3, p1, p2);
          
          // Obrót względem osi poziomej
          const rotation = Math.atan2(p2[0] - p1[0], p2[1] - p1[1]) * 180 / Math.PI;

          const corners = createRotatedRectangle(center, width, height, rotation);
          const area = calculatePolygonArea(corners);

          const newRect = {
            id: Date.now(),
            name: `Sektor ${rectangles.length + 1}`,
            center: center,
            corners: corners,
            width: width,
            height: height,
            rotation: Math.round(rotation),
            cropType: '',
            area: area.toFixed(2),
            workers: [],
            notes: ''
          };

          finishDrawing(newRect);
        }
      }
    };

    const handleMouseMove = (e) => {
      if (drawingMode === 'none') return;

      const currentPoint = [e.latlng.lat, e.latlng.lng];

      if (drawingMode === 'rectangle' && drawingStep === 1) {
        // Podgląd zwykłego prostokąta
        const bounds = [
          [Math.min(drawingPoints[0][0], currentPoint[0]), Math.min(drawingPoints[0][1], currentPoint[1])],
          [Math.max(drawingPoints[0][0], currentPoint[0]), Math.max(drawingPoints[0][1], currentPoint[1])]
        ];
        const corners = [
          [bounds[0][0], bounds[0][1]],
          [bounds[0][0], bounds[1][1]],
          [bounds[1][0], bounds[1][1]],
          [bounds[1][0], bounds[0][1]]
        ];
        setTempPolygon(corners);
      } else if (drawingMode === 'rotated') {
        if (drawingStep === 1) {
          // Podgląd linii bazowej
          setTempPolygon([drawingPoints[0], currentPoint]);
        } else if (drawingStep === 2) {
          // Podgląd obróconenego prostokąta
          const [p1, p2] = drawingPoints;
          const p3 = currentPoint;
          
          const center = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
          const width = calculateDistance(p1, p2);
          const height = calculatePointToLineDistance(p3, p1, p2);
          const rotation = Math.atan2(p2[0] - p1[0], p2[1] - p1[1]) * 180 / Math.PI;

          const corners = createRotatedRectangle(center, width, height, rotation);
          setTempPolygon(corners);
        }
      }
    };

    if (drawingMode !== 'none') {
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
  }, [drawingMode, drawingStep, drawingPoints, rectangles]);

  const calculateDistance = (p1, p2) => {
    const lat1 = p1[0] * Math.PI / 180;
    const lat2 = p2[0] * Math.PI / 180;
    const deltaLat = (p2[0] - p1[0]) * Math.PI / 180;
    const deltaLng = (p2[1] - p1[1]) * Math.PI / 180;

    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return 6371000 * c; // w metrach
  };

  const calculatePointToLineDistance = (point, lineStart, lineEnd) => {
    // Uproszczona wersja - używamy odległości prostopadłej w przybliżeniu kartezjańskim
    const A = lineEnd[0] - lineStart[0];
    const B = lineEnd[1] - lineStart[1];
    const C = lineStart[0] - point[0];
    const D = lineStart[1] - point[1];

    const dot = A * C + B * D;
    const lenSq = A * A + B * B;
    
    if (lenSq === 0) return calculateDistance(point, lineStart);

    const param = -dot / lenSq;
    let closestPoint;

    if (param < 0) {
      closestPoint = lineStart;
    } else if (param > 1) {
      closestPoint = lineEnd;
    } else {
      closestPoint = [
        lineStart[0] + param * A,
        lineStart[1] + param * B
      ];
    }

    return calculateDistance(point, closestPoint);
  };

  const calculateRectangleArea = (bounds) => {
    const latDiff = Math.abs(bounds[1][0] - bounds[0][0]);
    const lngDiff = Math.abs(bounds[1][1] - bounds[0][1]);
    const areaKm2 = latDiff * lngDiff * 111.32 * 111.32;
    const areaHa = areaKm2 * 100;
    return areaHa.toFixed(2);
  };

  const startDrawing = (mode) => {
    setDrawingMode(mode);
    setDrawingStep(0);
    setDrawingPoints([]);
    setTempPolygon(null);
  };

  const cancelDrawing = () => {
    setDrawingMode('none');
    setDrawingStep(0);
    setDrawingPoints([]);
    setTempPolygon(null);
  };

  const finishDrawing = (newRect) => {
    const updatedRectangles = [...rectangles, newRect];
    onRectanglesChange(updatedRectangles);
    onSectorsChange(updatedRectangles);
    cancelDrawing();
  };

  const getDrawingInstructions = () => {
    if (drawingMode === 'rectangle') {
      if (drawingStep === 0) return '🎯 Kliknij pierwszy róg prostokąta';
      if (drawingStep === 1) return '🎯 Kliknij przeciwny róg prostokąta';
    } else if (drawingMode === 'rotated') {
      if (drawingStep === 0) return '🎯 Kliknij pierwszy punkt (zostanie STAŁY)';
      if (drawingStep === 1) return '🎯 Kliknij drugi punkt (pierwsza strona)';
      if (drawingStep === 2) return '🎯 Kliknij gdzie prostokąt ma się rozszerzyć (tylko od drugiego punktu)';
    }
    return '';
  };

  return (
    <div className="relative">
      {/* Instrukcje */}
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Jak rysować sektory:</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <div><strong>Zwykły prostokąt:</strong> 2 kliknięcia - przeciwne rogi</div>
          <div><strong>Obrócony prostokąt:</strong> 3 kliknięcia - długość, szerokość, orientacja</div>
          {drawingMode !== 'none' && (
            <div className="text-orange-700 font-medium mt-2">
              {getDrawingInstructions()}
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
        {drawingMode === 'none' ? (
          <>
            <button
              onClick={() => startDrawing('rectangle')}
              className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg shadow-lg flex items-center gap-2 transition-colors"
              title="Rysuj zwykły prostokąt"
            >
              <Square size={20} />
              <span className="text-sm font-medium">Zwykły prostokąt</span>
            </button>
            <button
              onClick={() => startDrawing('rotated')}
              className="bg-purple-500 hover:bg-purple-600 text-white p-3 rounded-lg shadow-lg flex items-center gap-2 transition-colors"
              title="Rysuj obrócony prostokąt"
            >
              <RotateCw size={20} />
              <span className="text-sm font-medium">Obrócony prostokąt</span>
            </button>
          </>
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
            <div className="text-gray-500">Kliknij sektor na mapie aby zobaczyć szczegóły</div>
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
      version: "2.0", // Zwiększona wersja dla obróconych prostokątów
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
          Mapowanie i zarządzanie sektorami upraw z możliwością obrotu
        </p>
        
        {/* Statystyki */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {sectors.filter(s => s.rotation).length}
            </div>
            <div className="text-orange-800">Sektory obrócone</div>
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
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    {sector.name}
                    {sector.rotation && (
                      <span className="text-sm bg-orange-100 text-orange-800 px-2 py-1 rounded">
                        <RotateCw size={12} className="inline mr-1" />
                        {sector.rotation}°
                      </span>
                    )}
                  </h3>
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
                      Geometria
                    </label>
                    <div className="text-xs text-gray-500 p-2 bg-gray-50 border border-gray-300 rounded">
                      {sector.corners ? (
                        <div>
                          <div className="font-medium">Obrócony prostokąt</div>
                          {sector.width && <div>Wymiary: {Math.round(sector.width)}m × {Math.round(sector.height)}m</div>}
                          <div>4 punkty: ({sector.corners.length} wierzchołki)</div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-medium">Zwykły prostokąt</div>
                          <div>SW: {sector.bounds[0][0].toFixed(4)}, {sector.bounds[0][1].toFixed(4)}</div>
                          <div>NE: {sector.bounds[1][0].toFixed(4)}, {sector.bounds[1][1].toFixed(4)}</div>
                        </div>
                      )}
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
          <div className="flex justify-center gap-4 mb-4">
            <Square size={48} className="text-gray-400" />
            <RotateCw size={48} className="text-gray-400" />
          </div>
          <p className="text-xl text-gray-500 mb-2">Nie zdefiniowano jeszcze żadnych sektorów</p>
          <p className="text-gray-400">
            Użyj przycisków na mapie, aby oznaczyć obszary upraw
          </p>
          <div className="mt-4 text-sm text-gray-500 space-y-1">
            <div>• <strong>Zwykły prostokąt:</strong> dla obszarów wyrównanych z mapą</div>
            <div>• <strong>Obrócony prostokąt:</strong> dla obszarów pod kątem</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrchardMapSystem;