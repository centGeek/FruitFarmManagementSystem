import React, { useState, useEffect, useCallback } from 'react';
import { 
  Cloud, 
  CloudRain, 
  Sun, 
  Wind, 
  Droplets, 
  Bell, 
  BellOff, 
  Plus, 
  Trash2, 
  MapPin, 
  Loader, 
  AlertCircle, 
  Check,
  CloudSnow,
  CloudDrizzle,
  Zap,
  Eye,
  Thermometer,
  X
} from 'lucide-react';
import LocationSearch from './LocationSearch';
import { BACKEND_URL, getAuthHeaders } from "../utils/apiConfigs";

// Typy danych
interface WeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  pressure: number;
  description: string;
  icon: string;
  wind_speed: number;
  clouds: number;
  visibility: number;
}

interface ForecastItem {
  dt: number;
  temp: number;
  description: string;
  icon: string;
  pop: number; // probability of precipitation
}

interface NotificationRule {
  id?: number;
  backendId?: number;
  locationName: string;
  latitude: number;
  longitude: number;
  notificationType: string;
  threshold: number;
  enabled: boolean;
  createdAt?: string;
}

interface LocationData {
  name: string;
  lat: number;
  lon: number;
}

// Typy notyfikacji pogodowych
const NOTIFICATION_TYPES = [
  { value: 'TEMP_HIGH', label: '🌡️ Temperatura wysoka', unit: '°C', icon: Thermometer },
  { value: 'TEMP_LOW', label: '❄️ Temperatura niska', unit: '°C', icon: CloudSnow },
  { value: 'RAIN_PROB', label: '🌧️ Prawdopodobieństwo opadów', unit: '%', icon: CloudRain },
  { value: 'WIND_SPEED', label: '💨 Prędkość wiatru', unit: 'km/h', icon: Wind },
  { value: 'HUMIDITY', label: '💧 Wilgotność', unit: '%', icon: Droplets },
  { value: 'FROST_WARNING', label: '🧊 Ostrzeżenie o przymrozku', unit: '°C', icon: CloudSnow }
];

// Funkcja do pobierania ikony pogody
const getWeatherIcon = (iconCode: string) => {
  const iconMap: { [key: string]: JSX.Element } = {
    '01d': <Sun className="w-12 h-12 text-yellow-500" />,
    '01n': <Sun className="w-12 h-12 text-yellow-300" />,
    '02d': <Cloud className="w-12 h-12 text-gray-400" />,
    '02n': <Cloud className="w-12 h-12 text-gray-500" />,
    '03d': <Cloud className="w-12 h-12 text-gray-400" />,
    '03n': <Cloud className="w-12 h-12 text-gray-500" />,
    '04d': <Cloud className="w-12 h-12 text-gray-500" />,
    '04n': <Cloud className="w-12 h-12 text-gray-600" />,
    '09d': <CloudDrizzle className="w-12 h-12 text-blue-400" />,
    '09n': <CloudDrizzle className="w-12 h-12 text-blue-500" />,
    '10d': <CloudRain className="w-12 h-12 text-blue-500" />,
    '10n': <CloudRain className="w-12 h-12 text-blue-600" />,
    '11d': <Zap className="w-12 h-12 text-yellow-600" />,
    '11n': <Zap className="w-12 h-12 text-yellow-500" />,
    '13d': <CloudSnow className="w-12 h-12 text-blue-200" />,
    '13n': <CloudSnow className="w-12 h-12 text-blue-300" />,
  };
  return iconMap[iconCode] || <Cloud className="w-12 h-12 text-gray-400" />;
};

// Komponent karty pogody
const WeatherCard: React.FC<{ weather: WeatherData; locationName: string }> = ({ weather, locationName }) => {
  return (
    <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-xl p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-2xl font-bold">{locationName}</h3>
          <p className="text-blue-100 capitalize">{weather.description}</p>
        </div>
        {getWeatherIcon(weather.icon)}
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white bg-opacity-20 rounded-lg p-3">
          <div className="text-4xl font-bold">{Math.round(weather.temp)}°C</div>
          <div className="text-sm text-blue-100">Temperatura</div>
        </div>
        <div className="bg-white bg-opacity-20 rounded-lg p-3">
          <div className="text-4xl font-bold">{Math.round(weather.feels_like)}°C</div>
          <div className="text-sm text-blue-100">Odczuwalna</div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4" />
          <span>{weather.humidity}%</span>
        </div>
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4" />
          <span>{Math.round(weather.wind_speed * 3.6)} km/h</span>
        </div>
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          <span>{(weather.visibility / 1000).toFixed(1)} km</span>
        </div>
      </div>
    </div>
  );
};

// Komponent prognozy
const ForecastCard: React.FC<{ forecast: ForecastItem[] }> = ({ forecast }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Cloud className="w-6 h-6 text-blue-500" />
        Prognoza 5-dniowa
      </h3>
      <div className="grid grid-cols-5 gap-3">
        {forecast.slice(0, 5).map((item, index) => (
          <div key={index} className="text-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="text-sm text-gray-600 mb-2">
              {new Date(item.dt * 1000).toLocaleDateString('pl-PL', { weekday: 'short' })}
            </div>
            <div className="flex justify-center mb-2">
              {getWeatherIcon(item.icon)}
            </div>
            <div className="text-lg font-bold text-gray-800">
              {Math.round(item.temp)}°C
            </div>
            {item.pop > 0 && (
              <div className="text-xs text-blue-600 mt-1">
                {Math.round(item.pop * 100)}% 🌧️
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Modal dodawania nowej notyfikacji
const AddNotificationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  location: LocationData | null;
  onAdd: (rule: NotificationRule) => void;
}> = ({ isOpen, onClose, location, onAdd }) => {
  const [notificationType, setNotificationType] = useState('');
  const [threshold, setThreshold] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !location) return null;

  const selectedType = NOTIFICATION_TYPES.find(t => t.value === notificationType);

  const handleAdd = async () => {
    if (!notificationType || !threshold) {
      alert('Wypełnij wszystkie pola!');
      return;
    }

    setIsLoading(true);
    try {
      const newRule: NotificationRule = {
        locationName: location.name,
        latitude: location.lat,
        longitude: location.lon,
        notificationType,
        threshold: parseFloat(threshold),
        enabled: true
      };

      await onAdd(newRule);
      onClose();
      setNotificationType('');
      setThreshold('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Dodaj notyfikację
              </h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="flex items-center gap-2 text-blue-800">
                <MapPin className="w-4 h-4" />
                <span className="font-medium">{location.name}</span>
              </div>
              <div className="text-xs text-blue-600 mt-1">
                {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Typ notyfikacji *
              </label>
              <select
                value={notificationType}
                onChange={(e) => setNotificationType(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Wybierz typ...</option>
                {NOTIFICATION_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {selectedType && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Próg ({selectedType.unit}) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  placeholder={`np. ${selectedType.value === 'TEMP_HIGH' ? '30' : selectedType.value === 'TEMP_LOW' ? '0' : '50'}`}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Otrzymasz powiadomienie gdy wartość {selectedType.value.includes('HIGH') || selectedType.value.includes('PROB') ? 'przekroczy' : 'spadnie poniżej'} tego progu
                </p>
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
              onClick={handleAdd}
              disabled={isLoading || !notificationType || !threshold}
              className="flex-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-medium"
            >
              {isLoading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {isLoading ? 'Dodawanie...' : 'Dodaj notyfikację'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Główny komponent
const WeatherNotifications: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationRule[]>([]);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const OPENWEATHER_API_KEY = 'twoj_klucz_api'; // TODO: Przenieś do zmiennych środowiskowych

  // Ładowanie notyfikacji z backendu
  const loadNotifications = useCallback(async () => {
    setIsLoadingNotifications(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/weather-notifications`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const mappedNotifications: NotificationRule[] = data.map((item: any) => ({
        id: Date.now() + Math.random(),
        backendId: item.id,
        locationName: item.locationName,
        latitude: item.latitude,
        longitude: item.longitude,
        notificationType: item.notificationType,
        threshold: item.threshold,
        enabled: item.enabled,
        createdAt: item.createdAt
      }));

      setNotifications(mappedNotifications);
    } catch (error) {
      console.error('Błąd ładowania notyfikacji:', error);
    } finally {
      setIsLoadingNotifications(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Pobieranie danych pogodowych
  const fetchWeatherData = async (lat: number, lon: number) => {
    setIsLoadingWeather(true);
    setWeatherError(null);

    try {
      // Aktualna pogoda
      const currentResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=pl`
      );

      if (!currentResponse.ok) {
        throw new Error('Nie udało się pobrać danych pogodowych');
      }

      const currentData = await currentResponse.json();
      
      setCurrentWeather({
        temp: currentData.main.temp,
        feels_like: currentData.main.feels_like,
        humidity: currentData.main.humidity,
        pressure: currentData.main.pressure,
        description: currentData.weather[0].description,
        icon: currentData.weather[0].icon,
        wind_speed: currentData.wind.speed,
        clouds: currentData.clouds.all,
        visibility: currentData.visibility
      });

      // Prognoza
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=pl`
      );

      if (forecastResponse.ok) {
        const forecastData = await forecastResponse.json();
        const dailyForecast: ForecastItem[] = [];
        const processedDays = new Set();

        forecastData.list.forEach((item: any) => {
          const date = new Date(item.dt * 1000).toDateString();
          if (!processedDays.has(date) && dailyForecast.length < 5) {
            processedDays.add(date);
            dailyForecast.push({
              dt: item.dt,
              temp: item.main.temp,
              description: item.weather[0].description,
              icon: item.weather[0].icon,
              pop: item.pop
            });
          }
        });

        setForecast(dailyForecast);
      }
    } catch (error) {
      console.error('Błąd pobierania danych pogodowych:', error);
      setWeatherError('Nie udało się pobrać danych pogodowych. Sprawdź klucz API.');
    } finally {
      setIsLoadingWeather(false);
    }
  };

  // Obsługa wyboru lokalizacji
  const handleLocationSelect = (location: any) => {
    const locationData: LocationData = {
      name: location.name.split(',')[0],
      lat: location.lat,
      lon: location.lon
    };
    setSelectedLocation(locationData);
    fetchWeatherData(location.lat, location.lon);
  };

  // Dodawanie notyfikacji
  const handleAddNotification = async (rule: NotificationRule) => {
    try {
      const backendData = {
        locationName: rule.locationName,
        latitude: rule.latitude,
        longitude: rule.longitude,
        notificationType: rule.notificationType,
        threshold: rule.threshold,
        enabled: rule.enabled
      };

      const response = await fetch(`${BACKEND_URL}/api/weather-notifications`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(backendData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const finalRule = { ...rule, backendId: result.id };
      
      setNotifications([...notifications, finalRule]);
      alert('Notyfikacja została dodana!');
    } catch (error) {
      console.error('Błąd dodawania notyfikacji:', error);
      alert('Nie udało się dodać notyfikacji do serwera');
    }
  };

  // Przełączanie statusu notyfikacji
  const toggleNotification = async (id: number) => {
    const notification = notifications.find(n => n.id === id);
    if (!notification || !notification.backendId) return;

    try {
      const updatedNotification = { ...notification, enabled: !notification.enabled };
      
      const response = await fetch(`${BACKEND_URL}/api/weather-notifications/${notification.backendId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          locationName: updatedNotification.locationName,
          latitude: updatedNotification.latitude,
          longitude: updatedNotification.longitude,
          notificationType: updatedNotification.notificationType,
          threshold: updatedNotification.threshold,
          enabled: updatedNotification.enabled
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setNotifications(notifications.map(n => 
        n.id === id ? updatedNotification : n
      ));
    } catch (error) {
      console.error('Błąd aktualizacji notyfikacji:', error);
      alert('Nie udało się zaktualizować notyfikacji');
    }
  };

  // Usuwanie notyfikacji
  const deleteNotification = async (id: number) => {
    if (!window.confirm('Czy na pewno chcesz usunąć tę notyfikację?')) return;

    const notification = notifications.find(n => n.id === id);
    if (!notification || !notification.backendId) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/weather-notifications/${notification.backendId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setNotifications(notifications.filter(n => n.id !== id));
    } catch (error) {
      console.error('Błąd usuwania notyfikacji:', error);
      alert('Nie udało się usunąć notyfikacji z serwera');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <Cloud className="w-8 h-8 text-blue-500" />
          Notyfikacje Pogodowe
        </h1>
        <p className="text-gray-600">
          Monitoruj warunki pogodowe i otrzymuj powiadomienia o ważnych zmianach
        </p>
      </div>

      {/* Wyszukiwarka lokalizacji */}
      <div className="mb-6 bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-500" />
          Wybierz lokalizację
        </h2>
        <LocationSearch 
          map={null}
          onLocationSelect={handleLocationSelect}
          placeholder="Wyszukaj miejscowość aby sprawdzić pogodę..."
        />
      </div>

      {/* Dane pogodowe */}
      {isLoadingWeather && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-center gap-3">
            <Loader className="w-6 h-6 text-blue-600 animate-spin" />
            <span className="text-blue-800 font-medium">Pobieranie danych pogodowych...</span>
          </div>
        </div>
      )}

      {weatherError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <div className="font-semibold text-red-900">{weatherError}</div>
              <div className="text-sm text-red-700 mt-1">
                Upewnij się, że masz poprawny klucz API OpenWeather
              </div>
            </div>
          </div>
        </div>
      )}

      {currentWeather && selectedLocation && (
        <div className="grid grid-cols-1 gap-6 mb-6">
          <WeatherCard weather={currentWeather} locationName={selectedLocation.name} />
          {forecast.length > 0 && <ForecastCard forecast={forecast} />}
          
          {/* Przycisk dodawania notyfikacji */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-4 rounded-xl shadow-lg flex items-center justify-center gap-3 transition-all transform hover:scale-105"
          >
            <Plus className="w-6 h-6" />
            <span className="font-semibold text-lg">Dodaj notyfikację dla tej lokalizacji</span>
          </button>
        </div>
      )}

      {/* Panel notyfikacji */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-500" />
            Aktywne notyfikacje
          </h2>
          <button
            onClick={loadNotifications}
            disabled={isLoadingNotifications}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
          >
            <Loader className={`w-4 h-4 ${isLoadingNotifications ? 'animate-spin' : ''}`} />
            Odśwież
          </button>
        </div>

        {isLoadingNotifications ? (
          <div className="text-center py-12">
            <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Ładowanie notyfikacji...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-500 mb-2">Brak notyfikacji</p>
            <p className="text-gray-400">
              Wyszukaj lokalizację i dodaj pierwszą notyfikację pogodową
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => {
              const typeData = NOTIFICATION_TYPES.find(t => t.value === notification.notificationType);
              const Icon = typeData?.icon || Bell;
              
              return (
                <div
                  key={notification.id}
                  className={`border-2 rounded-xl p-4 transition-all ${
                    notification.enabled 
                      ? 'border-blue-200 bg-blue-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        notification.enabled ? 'bg-blue-100' : 'bg-gray-200'
                      }`}>
                        <Icon className={`w-6 h-6 ${
                          notification.enabled ? 'text-blue-600' : 'text-gray-500'
                        }`} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{notification.locationName}</h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            notification.enabled 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {notification.enabled ? 'Aktywna' : 'Nieaktywna'}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          {typeData?.label || notification.notificationType}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-gray-700">
                            <MapPin className="w-4 h-4" />
                            <span>{notification.latitude.toFixed(4)}, {notification.longitude.toFixed(4)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-700">
                            <Thermometer className="w-4 h-4" />
                            <span>Próg: {notification.threshold} {typeData?.unit}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleNotification(notification.id!)}
                        className={`p-2 rounded-lg transition-colors ${
                          notification.enabled
                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                        title={notification.enabled ? 'Wyłącz' : 'Włącz'}
                      >
                        {notification.enabled ? (
                          <Bell className="w-5 h-5" />
                        ) : (
                          <BellOff className="w-5 h-5" />
                        )}
                      </button>
                      
                      <button
                        onClick={() => deleteNotification(notification.id!)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        title="Usuń"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Statystyki */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">
            {notifications.length}
          </div>
          <div className="text-blue-800">Wszystkie notyfikacje</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">
            {notifications.filter(n => n.enabled).length}
          </div>
          <div className="text-green-800">Aktywne notyfikacje</div>
        </div>
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <div className="text-2xl font-bold text-amber-600">
            {new Set(notifications.map(n => n.locationName)).size}
          </div>
          <div className="text-amber-800">Monitorowane lokalizacje</div>
        </div>
      </div>

      {/* Modal dodawania notyfikacji */}
      <AddNotificationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        location={selectedLocation}
        onAdd={handleAddNotification}
      />
    </div>
  );
};

export default WeatherNotifications;