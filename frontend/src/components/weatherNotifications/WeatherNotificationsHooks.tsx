import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { BACKEND_URL, getAuthHeaders } from "../../utils/apiConfigs";
import { authFetch } from '../../utils/authFetch';
import { Sun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, Zap } from 'lucide-react';

export interface CurrentWeather {
    temp: number;
    feels_like: number;
    humidity: number;
    weatherCode: number;
    icon: JSX.Element;
    wind_speed: number;
    location: string;
}

export interface CoordinateDTO {
    latitude: number;
    longitude: number;
}

export interface UserLocationDTO {
    userId: number;
    coordinateDTO: CoordinateDTO;
    locationName: string;
}

export interface OpenMeteoCoordinates {
    lat: number;
    lon: number;
}

export interface NotificationRule {
    id?: number;
    backendId?: number;
    weatherNotificationType: string;
    threshold: number;
    daysAhead: number;
    enabled: boolean;
    description?: string;
}

export interface ForecastAlert {
    notificationId: number;
    type: string;
    message: string;
    date: string;
    value: number;
    threshold: number;
}

export const getWeatherIconFromCode = (code: number): JSX.Element => {
    const weatherMap: { [key: number]: { IconComponent: any; color: string } } = {
        0: { IconComponent: Sun, color: 'text-yellow-500' },
        1: { IconComponent: Sun, color: 'text-yellow-400' },
        2: { IconComponent: Cloud, color: 'text-gray-400' },
        3: { IconComponent: Cloud, color: 'text-gray-500' },
        45: { IconComponent: CloudFog, color: 'text-gray-400' },
        48: { IconComponent: CloudFog, color: 'text-blue-300' },
        51: { IconComponent: CloudDrizzle, color: 'text-blue-300' },
        53: { IconComponent: CloudDrizzle, color: 'text-blue-400' },
        55: { IconComponent: CloudDrizzle, color: 'text-blue-500' },
        61: { IconComponent: CloudRain, color: 'text-blue-400' },
        63: { IconComponent: CloudRain, color: 'text-blue-500' },
        65: { IconComponent: CloudRain, color: 'text-blue-600' },
        71: { IconComponent: CloudSnow, color: 'text-blue-200' },
        73: { IconComponent: CloudSnow, color: 'text-blue-300' },
        75: { IconComponent: CloudSnow, color: 'text-blue-400' },
        80: { IconComponent: CloudRain, color: 'text-blue-400' },
        81: { IconComponent: CloudRain, color: 'text-blue-500' },
        82: { IconComponent: CloudRain, color: 'text-blue-600' },
        95: { IconComponent: Zap, color: 'text-yellow-500' },
        96: { IconComponent: Zap, color: 'text-yellow-600' },
        99: { IconComponent: Zap, color: 'text-orange-600' },
    };

    const weather = weatherMap[code] || { IconComponent: Cloud, color: 'text-gray-400' };
    const IconComponent = weather.IconComponent;

    return <IconComponent className={`w-16 h-16 ${weather.color}`} />;
};

export const useWeatherNotifications = () => {
    const { t } = useTranslation('weatherNotifications');
    const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
    const [notifications, setNotifications] = useState<NotificationRule[]>([]);
    const [isLoadingWeather, setIsLoadingWeather] = useState(true);
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
    const [weatherError, setWeatherError] = useState<string | null>(null);
    const [missingLocation, setMissingLocation] = useState(false);
    const [forecastAlerts, setForecastAlerts] = useState<ForecastAlert[]>([]);
    const [isCheckingAlerts, setIsCheckingAlerts] = useState(false);
    const [locationName, setLocationName] = useState(t('location.loading'));
    const [coordinates, setCoordinates] = useState<OpenMeteoCoordinates | null>(null);

    const fetchGardenerLocation = useCallback(async () => {
        setLocationName(t('location.fetchingCoordinates'));
        setWeatherError(null);
        setMissingLocation(false);
        try {
            const response = await authFetch(`${BACKEND_URL}/api/gardener/location`, { method: 'GET', headers: getAuthHeaders() });
            if (!response.ok) throw new Error(t('location.serverError'));
            const data: UserLocationDTO = await response.json();
            if (!data.coordinateDTO?.latitude || !data.coordinateDTO?.longitude) {
                setMissingLocation(true);
                throw new Error(t('location.coordinatesUndefined'));
            }

            setCoordinates({ lat: data.coordinateDTO.latitude, lon: data.coordinateDTO.longitude });
            setLocationName(data.locationName || t('location.fromProfile'));
        } catch (error) {
            const message = error instanceof Error ? error.message : t('location.unknownError');
            console.error('Błąd pobierania koordynatów:', message);
            setWeatherError(message);
            setLocationName(t('location.noData'));
            setCoordinates(null);
            setIsLoadingWeather(false);
        }
    }, [t]);

    const fetchCurrentWeather = useCallback(async (coords: OpenMeteoCoordinates, location: string) => { 
        setIsLoadingWeather(true);
        try {
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=Europe/Warsaw`
            );
            if (!response.ok) throw new Error(t('forecast.weatherFetchFailed'));

            const data = await response.json();

            setCurrentWeather({
                temp: data.current.temperature_2m,
                feels_like: data.current.apparent_temperature,
                humidity: data.current.relative_humidity_2m,
                weatherCode: data.current.weather_code,
                icon: getWeatherIconFromCode(data.current.weather_code),
                wind_speed: data.current.wind_speed_10m,
                location: location,
            });
        } catch (error) {
            console.error('Błąd pobierania danych pogodowych:', error);
            setWeatherError(t('forecast.weatherFetchFailed'));
        } finally {
            setIsLoadingWeather(false);
        }
    }, [t]);

    const loadNotifications = useCallback(async () => {
        setIsLoadingNotifications(true);
        try {
            const response = await authFetch(`${BACKEND_URL}/api/weather-notifications`, { method: 'GET', headers: getAuthHeaders() });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            const mappedNotifications: NotificationRule[] = data.map((item: any) => ({
                id: item.id,
                weatherNotificationType: item.weatherNotificationType,
                threshold: item.threshold,
                daysAhead: item.daysAhead || 1,
                enabled: item.enabled,
                description: item.description
            }));
            setNotifications(mappedNotifications);
        } catch (error) {
            console.error('Błąd ładowania notyfikacji:', error);
        } finally {
            setIsLoadingNotifications(false);
        }
    }, []);

    const checkWeatherAlerts = useCallback(async (coords: OpenMeteoCoordinates, rules: NotificationRule[]) => {
        if (rules.length === 0 || !rules.some(r => r.enabled)) return;
        setIsCheckingAlerts(true);
        const alerts: ForecastAlert[] = [];
        try {
            const enabledRules = rules.filter(r => r.enabled);
            const maxDays = Math.max(...enabledRules.map(r => r.daysAhead));
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?` +
                `latitude=${coords.lat}&` + `longitude=${coords.lon}&` +
                `daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&` +
                `timezone=Europe/Warsaw&` + `forecast_days=${maxDays}`
              );
            if (!response.ok) {
                throw new Error(t('forecast.forecastFetchFailed'));
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
                            if (value < rule.threshold) { triggered = true; message = t('forecast.frostWarning', { value: value.toFixed(1), threshold: rule.threshold }); }
                            break;
                        case 'TEMP_LOW':
                            value = data.daily.temperature_2m_min[i];
                            if (value < rule.threshold) { triggered = true; message = t('forecast.tempLow', { value: value.toFixed(1), threshold: rule.threshold }); }
                            break;
                        case 'TEMP_HIGH':
                            value = data.daily.temperature_2m_max[i];
                            if (value > rule.threshold) { triggered = true; message = t('forecast.tempHigh', { value: value.toFixed(1), threshold: rule.threshold }); }
                            break;
                        case 'RAIN_FORECAST':
                            value = data.daily.precipitation_probability_max[i];
                            if (value > rule.threshold) { triggered = true; message = t('forecast.rainForecast', { value: value.toFixed(0), threshold: rule.threshold }); }
                            break;
                        case 'STRONG_WIND':
                            value = data.daily.wind_speed_10m_max[i];
                            if (value > rule.threshold) { triggered = true; message = t('forecast.strongWind', { value: value.toFixed(1), threshold: rule.threshold }); }
                            break;
                    }
                    if (triggered) alerts.push({ notificationId: rule.id!, type: rule.weatherNotificationType, message, date, value, threshold: rule.threshold });
                }
            });
            setForecastAlerts(alerts);
        } catch (error) {
            console.error('Błąd sprawdzania alertów pogodowych:', error);
        } finally {
            setIsCheckingAlerts(false);
        }
    }, [t]);

    const handleSaveNotification = async (rule: NotificationRule) => {
        try {
            const backendData = {
                weatherNotificationType: rule.weatherNotificationType,
                threshold: rule.threshold,
                daysAhead: rule.daysAhead,
                enabled: rule.enabled
            };
            const url = rule.backendId ? `${BACKEND_URL}/api/weather-notifications/${rule.backendId}` : `${BACKEND_URL}/api/weather-notifications`;
            const method = rule.backendId ? 'PUT' : 'POST';
            const response = await authFetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(backendData) });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            await loadNotifications();
            return true;
        } catch (error) {
            console.error('Błąd zapisywania notyfikacji:', error);
            return false;
        }
    };

    const toggleNotification = async (id: number) => {
        const notification = notifications.find(n => n.id === id);
        if (!notification || !notification.backendId) return;
        try {
            const response = await authFetch(`${BACKEND_URL}/api/weather-notifications/${notification.backendId}/toggle`, { method: 'PATCH', headers: getAuthHeaders() });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            setNotifications(notifications.map(n => n.id === id ? { ...n, enabled: !n.enabled } : n));
        } catch (error) { console.error('Błąd aktualizacji notyfikacji:', error); }
    };

    const deleteNotification = async (id: number) => {
        const notification = notifications.find(n => n.id === id);
        if (!notification || !notification.backendId) return;
        try {
            const response = await authFetch(`${BACKEND_URL}/api/weather-notifications/${notification.backendId}`, { method: 'DELETE', headers: getAuthHeaders() });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            setNotifications(notifications.filter(n => n.id !== id));
        } catch (error) { console.error('Błąd usuwania notyfikacji:', error); }
    };

    useEffect(() => { loadNotifications(); fetchGardenerLocation(); }, [loadNotifications, fetchGardenerLocation]);
    useEffect(() => { if (coordinates && locationName && weatherError === null) 
        fetchCurrentWeather(coordinates, locationName); }, [coordinates, locationName, fetchCurrentWeather, weatherError]);
    useEffect(() => { if (coordinates && notifications.length > 0 && !isLoadingNotifications) 
        checkWeatherAlerts(coordinates, notifications); }, [coordinates, notifications, isLoadingNotifications, checkWeatherAlerts]);

    return {
        currentWeather, notifications, isLoadingWeather, isLoadingNotifications, weatherError, missingLocation,
        forecastAlerts, isCheckingAlerts, locationName, coordinates,
        fetchCurrentWeather, loadNotifications, handleSaveNotification, toggleNotification, deleteNotification
    };
};