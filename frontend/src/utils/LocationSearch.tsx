import React, { useState, useRef } from 'react';
import { Search, MapPin, Loader } from 'lucide-react';
import L from 'leaflet';

/**
 * Komponent wyszukiwarki lokalizacji na mapie.
 * Wykorzystuje Nominatim API OpenStreetMap.
 * * @param {Object} props
 * @param {L.Map} props.map Instancja mapy z Leaflet.
 * @param {function} [props.onLocationSelect] Funkcja wywoływana po wybraniu lokalizacji.
 */
const LocationSearch = ({ 
    map,
    placeholder = "Wyszukaj miejscowość w Polsce (min. 3 znaki)...",
    countryCode = "pl",
    resultsLimit = 5,
    minSearchLength = 3,
    searchDelay = 300,
    markerDuration = 5000,
    onLocationSelect
}) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchTimeoutRef = useRef(null);
    const searchMarkerRef = useRef(null); 

    /**
     * Wyszukuje lokalizacje za pomocą Nominatim API.
     */
    const searchLocations = async (searchQuery) => {
        if (!searchQuery || searchQuery.length < minSearchLength) {
            setSuggestions([]);
            return;
        }

        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                format: 'json',
                q: searchQuery,
                countrycodes: countryCode,
                limit: resultsLimit,
                addressdetails: 1
            });

            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?${params.toString()}`
            );
            const data = await response.json();
            
            const formattedSuggestions = data.map(item => ({
                id: item.place_id,
                name: item.display_name,
                lat: parseFloat(item.lat),
                lon: parseFloat(item.lon),
                type: item.type,
                address: item.address
            }));

            setSuggestions(formattedSuggestions);
            setShowSuggestions(true);
        } catch (error) {
            console.error('Błąd wyszukiwania lokalizacji:', error);
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
        }, searchDelay);
    };

 
    const selectLocation = (location) => {
        // ZABEZPIECZENIE: Sprawdzamy, czy Leaflet jest załadowany i mapa jest dostępna
        if (!map || typeof L === 'undefined') {
             console.error("Map or Leaflet library not initialized.");
             return;
        }

        if (searchMarkerRef.current && map.hasLayer(searchMarkerRef.current)) {
            map.removeLayer(searchMarkerRef.current);
            searchMarkerRef.current = null;
        }
        
        // Przelot kamery
        map.flyTo([location.lat, location.lon], 15, {
            duration: 1.5,
            easeLinearity: 0.25
        });
        
        // Definicja ikony (pozostawiona bez zmian)
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

        // 2. Dodaj nowy marker
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
            
        // 3. Zapisz referencję do nowego markera
        searchMarkerRef.current = marker;
        
        // 4. Ustaw czasomierz na usunięcie markera
        setTimeout(() => {
            if (searchMarkerRef.current && map.hasLayer(searchMarkerRef.current)) {
                map.removeLayer(searchMarkerRef.current);
                searchMarkerRef.current = null;
            }
        }, markerDuration); 
        
        if (onLocationSelect) {
            onLocationSelect(location);
        }
        
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
                    placeholder={placeholder}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm transition-all duration-200 hover:shadow-md"
                />
            </div>

            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    {suggestions.map((suggestion) => (
                        <button
                            key={suggestion.id}
                            onMouseDown={() => selectLocation(suggestion)}
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

export default LocationSearch;