import React, { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, Check } from 'lucide-react';

// ---------------------------
// 1. GLOBALNA KONFIGURACJA I STYLES
// ---------------------------

// Konfiguracja domyślnych ikon Leaflet (kluczowa, musi być wykonana raz)
if (typeof L !== 'undefined') {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
}

// Definicja stylów mapy
export const MAP_STYLES = {
    streets: { name: '🗺️ Domyślna', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenStreetMap' },
    satellite: { name: '🛰️ Satelita', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: '&copy; Esri' },
    hybrid: { name: '🌍 Hybrydowa', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: '&copy; Esri', overlay: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' },
    topo: { name: '⛰️ Topograficzna', url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenTopoMap' }
} as const;


// ---------------------------
// 2. KOMPONENTY WEWNĘTRZNE (Kontrolki i Marker)
// ---------------------------

interface MapToolsProps {
    onStyleChange: (styleKey: keyof typeof MAP_STYLES) => void;
    currentStyle: keyof typeof MAP_STYLES;
}

/**
 * Komponent wewnętrzny: Kontrolki zoomu i wyboru warstwy mapy.
 * Używa hooka useMap do interakcji z instancją L.Map.
 */
const MapTools: React.FC<MapToolsProps> = React.memo(({ onStyleChange, currentStyle }) => {
    // useMap hook działa tylko wewnątrz MapContainer
    const map = useMap(); 
    const [isStyleOpen, setIsStyleOpen] = useState(false);

    return (
        <div className="absolute top-4 left-4 z-[1000] flex flex-col items-start space-y-2">
            
            {/* Kontrola Zoomu */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden w-10">
                <button onClick={() => map.zoomIn()} className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors border-b border-gray-200" title="Przybliż">
                    <span className="text-xl font-bold text-gray-700">+</span>
                </button>
                <button onClick={() => map.zoomOut()} className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors rounded-b-lg" title="Oddal">
                    <span className="text-xl font-bold text-gray-700">−</span>
                </button>
            </div>

            {/* Kontrola Warstw */}
            <div className="relative">
                <button
                    onClick={() => setIsStyleOpen(!isStyleOpen)}
                    className={`w-10 h-10 flex items-center justify-center transition-colors rounded-lg shadow-lg ${isStyleOpen ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100 text-gray-700'}`}
                    title="Warstwy mapy"
                >
                    <Layers className="w-5 h-5" />
                </button>

                {isStyleOpen && (
                    <div className="absolute left-12 top-0 bg-white rounded-lg shadow-xl border border-gray-200 w-40">
                        <div className="p-1 space-y-0.5 max-h-40 overflow-y-auto">
                            {Object.entries(MAP_STYLES).map(([key, style]) => (
                                <button
                                    key={key}
                                    onClick={() => onStyleChange(key as keyof typeof MAP_STYLES)}
                                    className={`w-full text-left px-2 py-1.5 rounded text-xs transition-all flex items-center justify-between ${currentStyle === key ? 'bg-blue-500 text-white font-medium' : 'hover:bg-gray-100 text-gray-700'}`}
                                >
                                    <span className="whitespace-nowrap">{style.name}</span>
                                    {currentStyle === key && (<Check className="w-3 h-3 ml-1 flex-shrink-0" />)}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});


interface MapMarkerAndClickManagerProps {
    markerPosition: [number, number] | null; 
    markerPopupContent?: string;
    onMapClick?: (e: L.LeafletMouseEvent) => void;
    viewUpdateKey?: any;
}

/**
 * Komponent wewnętrzny: Zarządza pojedynczym znacznikiem i obsługuje kliknięcia mapy.
 * Używa hooka useMap do interakcji z instancją L.Map.
 */
const MapMarkerAndClickManager: React.FC<MapMarkerAndClickManagerProps> = ({ 
    markerPosition, 
    markerPopupContent, 
    onMapClick,
    viewUpdateKey
}) => {
    const map = useMap(); 
    const markerRef = useRef<L.Marker | null>(null);

    // Efekt do zarządzania znacznikiem (tworzenie, aktualizacja, usuwanie, centrowanie)
    useEffect(() => {
        if (!markerPosition) {
            // Usuń znacznik, jeśli pozycja jest null
            if (markerRef.current) {
                map.removeLayer(markerRef.current);
                markerRef.current = null;
            }
            return;
        }

        const [lat, lon] = markerPosition;
        const newLatLng = L.latLng(lat, lon);
        
        // ZARZĄDZANIE MARKEREM
        if (markerRef.current) {
            markerRef.current.setLatLng(newLatLng);
            if (markerPopupContent) {
                markerRef.current.setPopupContent(markerPopupContent);
            }
        } else {
            const newMarker = L.marker(newLatLng).addTo(map);
            if (markerPopupContent) {
                newMarker.bindPopup(markerPopupContent).openPopup();
            }
            markerRef.current = newMarker;
        }

        // CENTROWANIE WIDOKU
        // Wymuś centrowanie/zmianę widoku po aktualizacji pozycji
        map.setView(newLatLng, map.getZoom() > 10 ? map.getZoom() : 13, { 
            animate: true, 
            duration: 0.5 
        }); 

        return () => {
            // Funkcja czyszcząca
            if (markerRef.current) {
                map.removeLayer(markerRef.current);
                markerRef.current = null;
            }
        };
    }, [map, markerPosition, markerPopupContent, viewUpdateKey]);

    // Efekt do obsługi kliknięcia mapy (onMapClick)
    useEffect(() => {
        if (onMapClick) {
            map.on('click', onMapClick);
        }

        return () => {
            if (onMapClick) {
                map.off('click', onMapClick);
            }
        };
    }, [map, onMapClick]);

    return null; // Ten komponent nie renderuje własnego DOM
};


// ---------------------------
// 3. GŁÓWNY KOMPONENT: BasicMap
// ---------------------------

interface BasicMapProps {
    center?: [number, number];
    zoom?: number;
    onMapLoad?: (map: L.Map) => void;
    children?: React.ReactNode;
    style?: React.CSSProperties;
    
    // PROPSY DLA WSPÓLNEJ LOGIKI MARKERA I KLIKNIĘCIA
    markerPosition?: [number, number] | null; 
    markerPopupContent?: string; 
    onMapClick?: (e: L.LeafletMouseEvent) => void;
    viewUpdateKey?: any; 
}

const BasicMap: React.FC<BasicMapProps> = ({ 
    center = [52.2297, 21.0122], 
    zoom = 6,
    onMapLoad,
    children,
    style = { height: '500px', width: '100%' },
    markerPosition = null,
    markerPopupContent,
    onMapClick,
    viewUpdateKey
}) => {
    const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
    const [mapStyle, setMapStyle] = useState<keyof typeof MAP_STYLES>('streets');
    const mapRef = useRef<L.Map | null>(null);
    const tileLayersRef = useRef<{ base: L.TileLayer | null, overlay: L.TileLayer | null }>({ base: null, overlay: null });


    const handleMapLoad = useCallback((map: L.Map) => {
        setMapInstance(map);
        if (onMapLoad) {
            onMapLoad(map);
        }
    }, [onMapLoad]);
    
    // Logika do zmiany stylu mapy i zarządzania TileLayer'ami
    const changeMapStyle = useCallback((newStyleKey: keyof typeof MAP_STYLES) => {
        if (!mapInstance) return;
        
        // Usuń stare warstwy
        if (tileLayersRef.current.base && mapInstance.hasLayer(tileLayersRef.current.base)) {
            mapInstance.removeLayer(tileLayersRef.current.base);
        }
        if (tileLayersRef.current.overlay && mapInstance.hasLayer(tileLayersRef.current.overlay)) {
            mapInstance.removeLayer(tileLayersRef.current.overlay);
        }

        const style = MAP_STYLES[newStyleKey];
        
        // Dodaj nową warstwę bazową
        const newBaseLayer = L.tileLayer(style.url, { attribution: style.attribution, maxZoom: 19 }).addTo(mapInstance);
        tileLayersRef.current.base = newBaseLayer;

        // Dodaj opcjonalną warstwę nakładki (dla hybrydy)
        if (style.overlay) {
            const newOverlayLayer = L.tileLayer(style.overlay, { maxZoom: 19, opacity: 0.5 }).addTo(mapInstance);
            tileLayersRef.current.overlay = newOverlayLayer;
        } else {
            tileLayersRef.current.overlay = null;
        }

        setMapStyle(newStyleKey);
    }, [mapInstance]);

    // Uruchomienie domyślnej warstwy i obsługa resize
    useEffect(() => {
        if (mapInstance) {
            // Inicjalizacja domyślnego stylu
            if (!tileLayersRef.current.base) {
                changeMapStyle(mapStyle); 
            }
            
            // Wymuś odświeżenie rozmiaru (częsty problem w React)
            const timer = setTimeout(() => {
                mapInstance.invalidateSize();
            }, 0); 
            return () => clearTimeout(timer);
        }
    }, [mapInstance, changeMapStyle, mapStyle]);
    
    // Zmiana styleKey przekazanego z MapTools
    useEffect(() => {
        if (mapInstance && mapStyle) {
            changeMapStyle(mapStyle);
        }
    }, [mapStyle, mapInstance, changeMapStyle]);


    return (
        <div className="relative" style={style}>
            <MapContainer
                center={center}
                zoom={zoom}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
                // Przechwycenie instancji mapy
                ref={(map) => {
                    if (map && mapRef.current !== map) {
                        mapRef.current = map;
                        handleMapLoad(map);
                    }
                }}
                zoomControl={false} 
            >
                {/* 1. Kontrolki UI (zoom, warstwy) */}
                {mapInstance && <MapTools 
                    onStyleChange={changeMapStyle} 
                    currentStyle={mapStyle} 
                />} 
                
                {/* 2. Zarządzanie markerem i kliknięciami */}
                <MapMarkerAndClickManager 
                    markerPosition={markerPosition}
                    markerPopupContent={markerPopupContent}
                    onMapClick={onMapClick}
                    viewUpdateKey={viewUpdateKey}
                />
                
                {children}
            </MapContainer>
        </div>
    );
};

export default BasicMap;