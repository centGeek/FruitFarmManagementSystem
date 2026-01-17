import React, { useState, useEffect, useCallback } from 'react';
import { Cloud, CloudRain, Sun, Wind, Droplets, Bell, BellOff, Plus, Trash2, Loader, AlertCircle, Check, CloudSnow, Thermometer, X, Edit3, Calendar, CloudDrizzle, CloudFog, Zap
} from 'lucide-react';
import { BACKEND_URL, getAuthHeaders } from "../utils/apiConfigs";
import { Link } from "react-router-dom";
import {type NotificationRule, type ForecastAlert, type OpenMeteoCoordinates } from "../utils/common";
import { authFetch } from '../utils/authFetch';


interface CurrentWeather {
    temp: number;
    feels_like: number;
    humidity: number;
    description: string;
    icon: JSX.Element; 
    wind_speed: number;
    location: string;
}

interface CoordinateDTO {
    latitude: number;
    longitude: number;
}

interface UserLocationDTO {
    userId: number;
    coordinateDTO: CoordinateDTO;
    locationName: string;
}

const NOTIFICATION_TYPES = [
    { 
        value: 'FROST_WARNING', 
        label: '🧊 Ostrzeżenie o przymrozku',
        description: 'Powiadom gdy temperatura spadnie poniżej',
        unit: '°C',
        icon: CloudSnow,
        defaultThreshold: 2
    },
    { 
        value: 'TEMP_LOW', 
        label: '❄️ Niska temperatura',
        description: 'Powiadom gdy temperatura spadnie poniżej',
        unit: '°C',
        icon: Thermometer,
        defaultThreshold: 5
    },
    { 
        value: 'TEMP_HIGH', 
        label: '🌡️ Wysoka temperatura',
        description: 'Powiadom gdy temperatura przekroczy',
        unit: '°C',
        icon: Thermometer,
        defaultThreshold: 30
    },
    { 
        value: 'RAIN_FORECAST', 
        label: '🌧️ Prognoza opadów',
        description: 'Powiadom o opadach deszczu powyżej',
        unit: '% prawdopodobieństwa',
        icon: CloudRain,
        defaultThreshold: 70
    },
    { 
        value: 'STRONG_WIND', 
        label: '💨 Silny wiatr',
        description: 'Powiadom gdy wiatr przekroczy',
        unit: 'km/h',
        icon: Wind,
        defaultThreshold: 40
    }
];

const DAYS_AHEAD_OPTIONS = [
    { value: 1, label: 'Za 1 dzień' },
    { value: 2, label: 'Za 2 dni' },
    { value: 3, label: 'Za 3 dni' },
    { value: 5, label: 'Za 5 dni' },
    { value: 7, label: 'Za 7 dni' }
];


const getWeatherFromCode = (code: number): { description: string; icon: JSX.Element } => {
    const weatherMap: { [key: number]: { description: string; IconComponent: any; color: string } } = {
        0: { description: 'Bezchmurnie', IconComponent: Sun, color: 'text-yellow-500' },
        1: { description: 'Przeważnie bezchmurnie', IconComponent: Sun, color: 'text-yellow-400' },
        2: { description: 'Częściowe zachmurzenie', IconComponent: Cloud, color: 'text-gray-400' },
        3: { description: 'Zachmurzenie', IconComponent: Cloud, color: 'text-gray-500' },
        45: { description: 'Mgła', IconComponent: CloudFog, color: 'text-gray-400' },
        48: { description: 'Mgła osadzająca szron', IconComponent: CloudFog, color: 'text-blue-300' },
        51: { description: 'Lekka mżawka', IconComponent: CloudDrizzle, color: 'text-blue-300' },
        53: { description: 'Umiarkowana mżawka', IconComponent: CloudDrizzle, color: 'text-blue-400' },
        55: { description: 'Gęsta mżawka', IconComponent: CloudDrizzle, color: 'text-blue-500' },
        61: { description: 'Słaby deszcz', IconComponent: CloudRain, color: 'text-blue-400' },
        63: { description: 'Umiarkowany deszcz', IconComponent: CloudRain, color: 'text-blue-500' },
        65: { description: 'Silny deszcz', IconComponent: CloudRain, color: 'text-blue-600' },
        71: { description: 'Słabe opady śniegu', IconComponent: CloudSnow, color: 'text-blue-200' },
        73: { description: 'Umiarkowane opady śniegu', IconComponent: CloudSnow, color: 'text-blue-300' },
        75: { description: 'Silne opady śniegu', IconComponent: CloudSnow, color: 'text-blue-400' },
        80: { description: 'Słabe przelotne opady', IconComponent: CloudRain, color: 'text-blue-400' },
        81: { description: 'Umiarkowane przelotne opady', IconComponent: CloudRain, color: 'text-blue-500' },
        82: { description: 'Silne przelotne opady', IconComponent: CloudRain, color: 'text-blue-600' },
        95: { description: 'Burza', IconComponent: Zap, color: 'text-yellow-500' },
        96: { description: 'Burza z gradem', IconComponent: Zap, color: 'text-yellow-600' },
        99: { description: 'Burza z silnym gradem', IconComponent: Zap, color: 'text-orange-600' },
    };

    const weather = weatherMap[code] || { description: 'Nieznane', IconComponent: Cloud, color: 'text-gray-400' };
    const IconComponent = weather.IconComponent;
    
    return {
        description: weather.description,
        icon: <IconComponent className={`w-16 h-16 ${weather.color}`} />
    };
};


const CurrentWeatherCard: React.FC<{ weather: CurrentWeather }> = ({ weather }) => {
    return (
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-lg p-5 text-white">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-bold mb-1">{weather.location}</h2>
                    <p className="text-blue-100 text-sm capitalize">{weather.description}</p>
                    <p className="text-blue-200 text-xs mt-0.5">Aktualna pogoda • Open-Meteo</p>
                </div>
                <div className="scale-75">
                    {weather.icon}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                    <div className="text-3xl font-bold mb-1">{Math.round(weather.temp)}°C</div>
                    <div className="text-blue-100 text-sm">Temperatura</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                    <div className="text-3xl font-bold mb-1">{Math.round(weather.feels_like)}°C</div>
                    <div className="text-blue-100 text-sm">Odczuwalna</div>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-3">
               <div className="flex items-center gap-2 bg-white bg-opacity-10 rounded-lg p-2">
                    <Droplets className="w-5 h-5" />
                    <div>
                        <div className="text-xl font-bold">{weather.humidity}%</div>
                        <div className="text-xs text-blue-100">Wilgotność</div>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-white bg-opacity-10 rounded-lg p-2">
                    <Wind className="w-5 h-5" />
                    <div>
                        <div className="text-xl font-bold">{Math.round(weather.wind_speed)} km/h</div>
                        <div className="text-xs text-blue-100">Wiatr</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const NotificationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (rule: NotificationRule) => void;
    editingRule?: NotificationRule | null;
}> = ({ isOpen, onClose, onSave, editingRule }) => {
    const [weatherNotificationType, setWeatherNotificationType] = useState('');
    const [threshold, setThreshold] = useState('');
    const [daysAhead, setDaysAhead] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (editingRule) {
            setWeatherNotificationType(editingRule.weatherNotificationType);
            setThreshold(editingRule.threshold.toString());
            setDaysAhead(editingRule.daysAhead);
        } else {
            setWeatherNotificationType('');
            setThreshold('');
            setDaysAhead(1);
        }
    }, [editingRule, isOpen]);

    if (!isOpen) return null;

    const selectedType = NOTIFICATION_TYPES.find(t => t.value === weatherNotificationType);

    const handleSave = async () => {
        if (!weatherNotificationType || !threshold) {
            alert('Wypełnij wszystkie pola!');
            return;
        }

        setIsLoading(true);
        try {
            const rule: NotificationRule = {
                id: editingRule?.id,
                backendId: editingRule?.backendId,
                weatherNotificationType,
                threshold: parseFloat(threshold),
                daysAhead,
                enabled: true
            };

            await onSave(rule);
            onClose();
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
                                {editingRule ? 'Edytuj notyfikację' : 'Dodaj notyfikację'}
                            </h3>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Typ ostrzeżenia pogodowego *
                            </label>
                            <select
                                value={weatherNotificationType}
                                onChange={(e) => {
                                    setWeatherNotificationType(e.target.value);
                                    const type = NOTIFICATION_TYPES.find(t => t.value === e.target.value);
                                    if (type && !threshold) {
                                        setThreshold(type.defaultThreshold.toString());
                                    }
                                }}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Wybierz typ ostrzeżenia...</option>
                                {NOTIFICATION_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedType && (
                            <>
                                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                    <p className="text-sm text-blue-800">
                                        {selectedType.description}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Próg ostrzeżenia ({selectedType.unit}) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={threshold}
                                        onChange={(e) => setThreshold(e.target.value)}
                                        placeholder={selectedType.defaultThreshold.toString()}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Wyprzedzenie prognozy *
                                    </label>
                                    <select
                                        value={daysAhead}
                                        onChange={(e) => setDaysAhead(parseInt(e.target.value))}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        {DAYS_AHEAD_OPTIONS.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Otrzymasz powiadomienie jeśli warunki wystąpią w tym okresie
                                    </p>
                                </div>

                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                    <div className="flex gap-2">
                                        <Calendar className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                        <div className="text-sm text-amber-800">
                                            <p className="font-medium mb-1">Przykład:</p>
                                            <p>
                                                {selectedType.value === 'FROST_WARNING' && 
                                                    `Jeśli za ${daysAhead} ${daysAhead === 1 ? 'dzień' : 'dni'} prognozowana temperatura spadnie poniżej ${threshold}°C, otrzymasz powiadomienie.`
                                                }
                                                {selectedType.value === 'RAIN_FORECAST' && 
                                                    `Jeśli za ${daysAhead} ${daysAhead === 1 ? 'dzień' : 'dni'} prawdopodobieństwo opadów przekroczy ${threshold}%, otrzymasz powiadomienie.`
                                                }
                                                {(selectedType.value === 'TEMP_HIGH' || selectedType.value === 'TEMP_LOW') && 
                                                    `Jeśli za ${daysAhead} ${daysAhead === 1 ? 'dzień' : 'dni'} temperatura ${selectedType.value === 'TEMP_HIGH' ? 'przekroczy' : 'spadnie poniżej'} ${threshold}°C, otrzymasz powiadomienie.`
                                                }
                                                {selectedType.value === 'STRONG_WIND' && 
                                                    `Jeśli za ${daysAhead} ${daysAhead === 1 ? 'dzień' : 'dni'} prędkość wiatru przekroczy ${threshold} km/h, otrzymasz powiadomienie.`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </>
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
                            disabled={isLoading || !weatherNotificationType || !threshold}
                            className="flex-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-medium"
                        >
                            {isLoading ? (
                                <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                                <Check className="w-4 h-4" />
                            )}
                            {isLoading ? 'Zapisywanie...' : editingRule ? 'Zapisz zmiany' : 'Dodaj notyfikację'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};



const WeatherNotifications: React.FC = () => {
    const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
    const [notifications, setNotifications] = useState<NotificationRule[]>([]);
    const [isLoadingWeather, setIsLoadingWeather] = useState(true);
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
    const [weatherError, setWeatherError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<NotificationRule | null>(null);
    const [forecastAlerts, setForecastAlerts] = useState<ForecastAlert[]>([]);
    const [isCheckingAlerts, setIsCheckingAlerts] = useState(false);
    
    const [locationName, setLocationName] = useState('Ładowanie lokalizacji...');
    
    const [coordinates, setCoordinates] = useState<OpenMeteoCoordinates | null>(null);
    
    const fetchGardenerLocation = useCallback(async () => {
        setLocationName('Pobieranie koordynatów z profilu...');
        setWeatherError(null);

        try {
            const response = await authFetch(`${BACKEND_URL}/api/gardener/location`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error('Błąd serwera: Nie udało się pobrać danych lokalizacji.');
            }

            const data: UserLocationDTO = await response.json();
            
            if (!data.coordinateDTO || data.coordinateDTO.latitude === undefined || data.coordinateDTO.longitude === undefined) {
                throw new Error('Koordynaty dla sadownika nie są zdefiniowane. Ustaw je w sekcji Profil.');
            }
            
            setCoordinates({ 
                lat: data.coordinateDTO.latitude, 
                lon: data.coordinateDTO.longitude 
            });
            setLocationName(data.locationName || 'Lokalizacja z profilu');

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Wystąpił nieznany błąd podczas ładowania lokalizacji.';
            console.error('Błąd pobierania koordynatów:', message);
            
            setWeatherError(message);
            setLocationName('Brak danych lokalizacji');
            setCoordinates(null);
            setIsLoadingWeather(false);
        }
    }, []); 


    const fetchCurrentWeather = useCallback(async (coords: OpenMeteoCoordinates, location: string) => { 
        setIsLoadingWeather(true);
    
        try {
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?` +
                `latitude=${coords.lat}&` + 
                `longitude=${coords.lon}&` + 
                `current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&` +
                `timezone=Europe/Warsaw`
            );

            if (!response.ok) {
                throw new Error('Nie udało się pobrać danych pogodowych z Open-Meteo');
            }

            const data = await response.json();
            const weatherInfo = getWeatherFromCode(data.current.weather_code);
            
            setCurrentWeather({
                temp: data.current.temperature_2m,
                feels_like: data.current.apparent_temperature,
                humidity: data.current.relative_humidity_2m,
                description: weatherInfo.description,
                icon: weatherInfo.icon,
                wind_speed: data.current.wind_speed_10m,
                location: location,
            });
        } catch (error) {
            console.error('Błąd pobierania danych pogodowych:', error);
            setWeatherError('Nie udało się pobrać danych pogodowych z Open-Meteo');
        } finally {
            setIsLoadingWeather(false);
        }
    }, []);

    const loadNotifications = useCallback(async () => {
    setIsLoadingNotifications(true);
    try {
        const response = await authFetch(`${BACKEND_URL}/api/weather-notifications`, {
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
            weatherNotificationType: item.weatherNotificationType,
            threshold: item.threshold,
            daysAhead: item.daysAhead || 1,
            enabled: item.enabled,
            description: item.description
        }));

        console.log('Zmapowane notyfikacje:', mappedNotifications);
        setNotifications(mappedNotifications);
    } catch (error) {
        console.error('Błąd ładowania notyfikacji:', error);
    } finally {
        setIsLoadingNotifications(false);
    }
}, []);
const checkWeatherAlerts = useCallback(async (coords: OpenMeteoCoordinates, rules: NotificationRule[]) => {
    if (rules.length === 0 || !rules.some(r => r.enabled)) {
        console.log('Brak aktywnych reguł do sprawdzenia');
        return;
    }

    setIsCheckingAlerts(true);
    const alerts: ForecastAlert[] = [];

    try {
        const enabledRules = rules.filter(r => r.enabled);
        const maxDays = Math.max(...enabledRules.map(r => r.daysAhead));
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?` +
          `latitude=${coords.lat}&` + `longitude=${coords.lon}&` +
          `daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&` +
          `timezone=Europe/Warsaw&` +`forecast_days=${maxDays}`
        );
        console.log('Sprawdzanie alertów dla:', {
            coords,
            maxDays,
            activeRules: rules.filter(r => r.enabled)
        });
        if (!response.ok) {
          throw new Error('Nie udało się pobrać prognozy pogody');
        }

        const data = await response.json();
        
        enabledRules.forEach(rule => {
          for (let i = 0; i < rule.daysAhead && i < data.daily.time.length; i++) {
                const date = data.daily.time[i];
                let triggered = false;
                let value = 0;
                let message = '';
                switch (rule.weatherNotificationType) {
                    case 'FROST_WARNING':
                        value = data.daily.temperature_2m_min[i];
                        console.log(`  Dzień ${i} (${date}): temp min = ${value}°C, próg = ${rule.threshold}°C`);
                        if (value < rule.threshold) {
                            triggered = true;
                            message = `🧊 Ostrzeżenie o przymrozku: ${value.toFixed(1)}°C (próg: ${rule.threshold}°C)`;
                        }
                        break;

                    case 'TEMP_LOW':
                        value = data.daily.temperature_2m_min[i];
                        console.log(`  Dzień ${i} (${date}): temp min = ${value}°C, próg = ${rule.threshold}°C`);
                        if (value < rule.threshold) {
                            triggered = true;
                            message = `❄️ Niska temperatura: ${value.toFixed(1)}°C (próg: ${rule.threshold}°C)`;
                        }
                        break;

                    case 'TEMP_HIGH':
                        value = data.daily.temperature_2m_max[i];
                        console.log(`  Dzień ${i} (${date}): temp max = ${value}°C, próg = ${rule.threshold}°C`);
                        if (value > rule.threshold) {
                            triggered = true;
                            message = `🌡️ Wysoka temperatura: ${value.toFixed(1)}°C (próg: ${rule.threshold}°C)`;
                        }
                        break;

                    case 'RAIN_FORECAST':
                        value = data.daily.precipitation_probability_max[i];
                        console.log(`  Dzień ${i} (${date}): opady = ${value}%, próg = ${rule.threshold}%`);
                        if (value > rule.threshold) {
                            triggered = true;
                            message = `🌧️ Prognoza opadów: ${value.toFixed(0)}% (próg: ${rule.threshold}%)`;
                        }
                        break;

                    case 'STRONG_WIND':
                        value = data.daily.wind_speed_10m_max[i];
                        console.log(`  Dzień ${i} (${date}): wiatr = ${value} km/h, próg = ${rule.threshold} km/h`);
                        if (value > rule.threshold) {
                            triggered = true;
                            message = `💨 Silny wiatr: ${value.toFixed(1)} km/h (próg: ${rule.threshold} km/h)`;
                        }
                        break;
                }

                if (triggered) {
                    console.log(`  ✓ Alert uruchomiony!`);
                    alerts.push({
                        notificationId: rule.id!,
                        type: rule.weatherNotificationType,
                        message,
                        date,
                        value,
                        threshold: rule.threshold
                    });
                }
            }
        });

        console.log('Znalezione alerty:', alerts);
        setForecastAlerts(alerts);
    } catch (error) {
        console.error('Błąd sprawdzania alertów pogodowych:', error);
    } finally {
        setIsCheckingAlerts(false);
    }
}, []);

    useEffect(() => {
        loadNotifications();
        fetchGardenerLocation();
    }, [loadNotifications, fetchGardenerLocation]);

    useEffect(() => {
        if (coordinates && locationName && weatherError === null) {
            fetchCurrentWeather(coordinates, locationName);
        }
    }, [coordinates, locationName, fetchCurrentWeather, weatherError]);

    // Sprawdź alerty po załadowaniu notyfikacji i koordynatów
    useEffect(() => {
        if (coordinates && notifications.length > 0 && !isLoadingNotifications) {
            checkWeatherAlerts(coordinates, notifications);
        }
    }, [coordinates, notifications, isLoadingNotifications, checkWeatherAlerts]);

    const handleSaveNotification = async (rule: NotificationRule) => {
        try {
            const backendData = {
                weatherNotificationType: rule.weatherNotificationType,
                threshold: rule.threshold,
                daysAhead: rule.daysAhead,
                enabled: rule.enabled
            };

            let response;
            if (rule.backendId) {
                response = await authFetch(`${BACKEND_URL}/api/weather-notifications/${rule.backendId}`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(backendData)
                });
            } else {
                response = await authFetch(`${BACKEND_URL}/api/weather-notifications`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(backendData)
                });
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            await loadNotifications();
            
            alert(rule.backendId ? 'Notyfikacja zaktualizowana!' : 'Notyfikacja dodana!');
            setIsModalOpen(false);
            setEditingRule(null);
        } catch (error) {
            console.error('Błąd zapisywania notyfikacji:', error);
            alert('Nie udało się zapisać notyfikacji');
        }
    };

    const toggleNotification = async (id: number) => {
        const notification = notifications.find(n => n.id === id);
        if (!notification || !notification.backendId) return;

        try {
            const response = await authFetch(`${BACKEND_URL}/api/weather-notifications/${notification.backendId}/toggle`, {
                method: 'PATCH',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            setNotifications(notifications.map(n => 
                n.id === id ? { ...n, enabled: !n.enabled } : n
            ));
        } catch (error) {
            console.error('Błąd aktualizacji notyfikacji:', error);
            alert('Nie udało się zaktualizować notyfikacji');
        }
    };

    const deleteNotification = async (id: number) => {
        if (!window.confirm('Czy na pewno chcesz usunąć tę notyfikację?')) return;

        const notification = notifications.find(n => n.id === id);
        if (!notification || !notification.backendId) return;

        try {
            const response = await authFetch(`${BACKEND_URL}/api/weather-notifications/${notification.backendId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            setNotifications(notifications.filter(n => n.id !== id));
        } catch (error) {
            console.error('Błąd usuwania notyfikacji:', error);
            alert('Nie udało się usunąć notyfikacji');
        }
    };
const handleEditClick = (notification: NotificationRule) => {
        setEditingRule(notification);
        setIsModalOpen(true);
    };

    const handleAddClick = () => {
        setEditingRule(null);
        setIsModalOpen(true);
    };
    
    const canRetryWeather = coordinates !== null && weatherError !== null;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                    <Cloud className="w-8 h-8 text-blue-500" />
                    Pogoda i Notyfikacje
                </h1>
                <p className="text-gray-600">
                    Aktualna pogoda oraz zarządzanie alertami pogodowymi
                </p>
            </div>

            {isLoadingWeather && coordinates === null && weatherError === null ? (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 mb-6">
                    <div className="flex items-center justify-center gap-3">
                        <Loader className="w-6 h-6 text-blue-600 animate-spin" />
                        <span className="text-blue-800 font-medium">
                            {locationName}
                        </span>
                    </div>
                </div>
            ) : weatherError ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                        <div>
                            <div className="font-semibold text-red-900">
                                {weatherError}
                            </div>
                            {canRetryWeather && (
                                <button 
                                    onClick={() => coordinates && fetchCurrentWeather(coordinates, locationName)}
                                    className="text-sm text-red-700 underline mt-1"
                                >
                                    Spróbuj ponownie pobrać pogodę. Sprawdź połączenie internetowe
                                </button>
                            )}
                            {weatherError.includes('Koordynaty') && (
                                <p className="text-sm text-red-700 mt-1">
                                Proszę uzupełnij swoją lokalizację w{" "}
                                <Link
                                    to="/gardener-profile"
                                    className="font-bold underline text-red-800 hover:text-red-900"
                                >
                                    Ustawieniach Profilu
                                </Link>.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            ) : currentWeather ? (
                <div className="mb-6">
                    <CurrentWeatherCard weather={currentWeather} />
                </div>
            ) : (
                 <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 mb-6">
                    <div className="flex items-center justify-center gap-3">
                        <Loader className="w-6 h-6 text-blue-600 animate-spin" />
                        <span className="text-blue-800 font-medium">Pobieranie danych pogodowych dla {locationName}...</span>
                    </div>
                </div>
            )}

            {isCheckingAlerts ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
                    <div className="flex items-center justify-center gap-3">
                        <Loader className="w-5 h-5 text-amber-600 animate-spin" />
                        <span className="text-amber-800 font-medium">Sprawdzanie alertów pogodowych...</span>
                    </div>
                </div>
            ) : forecastAlerts.length > 0 ? (
                <div className="mb-6 space-y-3">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                        <h3 className="text-lg font-semibold text-gray-800">
                            Ostrzeżenia pogodowe ({forecastAlerts.length})
                        </h3>
                    </div>
                    {forecastAlerts.map((alert, index) => {
    const alertDate = new Date(alert.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    alertDate.setHours(0, 0, 0, 0);
    
    const daysFromNow = Math.round((alertDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    const dateLabel = daysFromNow === 0 ? 'Dziś' : 
                    daysFromNow === 1 ? 'Jutro' : 
                    daysFromNow === 2 ? 'Pojutrze' :
                    `Za ${daysFromNow} dni`;
    
    const formattedDate = new Date(alert.date).toLocaleDateString('pl-PL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });
    
    return (
        <div 
            key={index}
            className="bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-500 rounded-lg p-4 shadow-md"
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 bg-orange-600 text-white text-sm font-bold rounded-full">
                            {dateLabel}
                        </span>
                        <span className="text-sm text-gray-600">
                            {formattedDate}
                        </span>
                    </div>
                    <p className="text-gray-900 font-medium text-lg">
                        {alert.message}
                    </p>
                </div>
                <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0" />
            </div>
        </div>
    );
})}
                </div>
            ) : null}

            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                        <Bell className="w-6 h-6 text-blue-500" />
                        Alerty Pogodowe
                    </h2>
                    <div className="flex gap-3">
                        <button
                            onClick={loadNotifications}
                            disabled={isLoadingNotifications}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm"
                        >
                            <Loader className={`w-4 h-4 ${isLoadingNotifications ? 'animate-spin' : ''}`} />
                            Odśwież
                        </button>
                        <button
                            onClick={handleAddClick}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            Dodaj alert
                        </button>
                    </div>
                </div>

                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                        <strong>Jak to działa?</strong> Skonfiguruj alerty pogodowe aby otrzymywać powiadomienia 
                        o nadchodzących warunkach pogodowych (przymrozki, opady, silne wiatry). 
                        System sprawdzi prognozę z Open-Meteo i powiadomi Cię z wyprzedzeniem.
                    </p>
                </div>

                {isLoadingNotifications ? (
                    <div className="text-center py-12">
                        <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                        <p className="text-gray-600">Ładowanie alertów...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-xl text-gray-500 mb-2">Brak skonfigurowanych alertów</p>
                        <p className="text-gray-400 mb-4">
                            Dodaj pierwszy alert aby otrzymywać powiadomienia o warunkach pogodowych
                        </p>
                        <button
                            onClick={handleAddClick}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            Dodaj pierwszy alert
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {notifications.map((notification) => {
                            const typeData = NOTIFICATION_TYPES.find(t => t.value === notification.weatherNotificationType);
                            const Icon = typeData?.icon || Bell;
                            const daysLabel = DAYS_AHEAD_OPTIONS.find(d => d.value === notification.daysAhead)?.label || `Za ${notification.daysAhead} dni`;
                            
                            return (
                                <div
                                    key={notification.id}
                                    className={`border-2 rounded-xl p-5 transition-all ${
                                        notification.enabled 
                                            ? 'border-blue-200 bg-blue-50' 
                                            : 'border-gray-200 bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                notification.enabled ? 'bg-blue-100' : 'bg-gray-200'
                                            }`}>
                                                <Icon className={`w-6 h-6 ${
                                                    notification.enabled ? 'text-blue-600' : 'text-gray-500'
                                                }`} />
                                            </div>
                                            
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="font-semibold text-gray-900 text-lg">
                                                        {typeData?.label || notification.weatherNotificationType}
                                                    </h3>
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                        notification.enabled 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-gray-200 text-gray-600'
                                                    }`}>
                                                        {notification.enabled ? 'Aktywny' : 'Nieaktywny'}
                                                    </span>
                                                </div>
                                                
                                                <p className="text-sm text-gray-600 mb-3">
                                                    {typeData?.description}
                                                </p>
                                                
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="flex items-center gap-2 text-sm bg-white rounded-lg p-2 border border-gray-200">
                                                        <Thermometer className="w-4 h-4 text-gray-500" />
                                                        <div>
                                                            <span className="text-gray-500 text-xs">Próg:</span>
                                                            <span className="font-semibold text-gray-900 ml-1">
                                                                {notification.threshold} {typeData?.unit}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm bg-white rounded-lg p-2 border border-gray-200">
                                                        <Calendar className="w-4 h-4 text-gray-500" />
                                                        <div>
                                                            <span className="text-gray-500 text-xs">Prognoza:</span>
                                                            <span className="font-semibold text-gray-900 ml-1">
                                                                {daysLabel}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => handleEditClick(notification)}
                                                className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors"
                                                title="Edytuj"
                                            >
                                                <Edit3 className="w-5 h-5" />
                                            </button>
                                            
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">
                        {notifications.length}
                    </div>
                    <div className="text-blue-800">Wszystkie alerty</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-600">
                        {notifications.filter(n => n.enabled).length}
                    </div>
                    <div className="text-green-800">Aktywne alerty</div>
                </div>
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <div className="text-2xl font-bold text-amber-600">
                        {new Set(notifications.map(n => n.weatherNotificationType)).size}
                    </div>
                    <div className="text-amber-800">Typy alertów</div>
                </div>
            </div>

            <NotificationModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingRule(null);
                }}
                onSave={handleSaveNotification}
                editingRule={editingRule}
            />
        </div>
    );
};

export default WeatherNotifications;