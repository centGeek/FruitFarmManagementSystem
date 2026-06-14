import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from "react-i18next";
import { BACKEND_URL, getAuthHeaders } from "../../utils/apiConfigs";
import { authFetch } from "../../utils/authFetch";

export interface Notification {
    id: number;
    title: string;
    message: string;
    notificationType: 'WEATHER' | 'USER' | 'WORK_ENTRY' | 'SECTOR' | 'PROFIT' | 'EXPENSE';
    createdAt: string;
    userDTO?: {
        username?: string;
        email?: string;
    };
}

export interface WeatherAlert {
    message: string;
    date: string;
}

export interface NotificationRule {
    id: number;
    weatherNotificationType: string;
    threshold: number;
    daysAhead: number;
    enabled: boolean;
    description: string;
}

export const useHomePage = () => {
    const { t } = useTranslation("homePage");
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [alert, setAlert] = useState({ type: '', message: '' });
    
    const [forecastAlerts, setForecastAlerts] = useState<WeatherAlert[]>([]);
    const [isCheckingAlerts, setIsCheckingAlerts] = useState(false);
    const [weatherError, setWeatherError] = useState<string | null>(null);
    const [coordinates, setCoordinates] = useState<{ lat: number; lon: number } | null>(null);

    const closeAlert = useCallback(() => setAlert({ type: '', message: '' }), []);

    const fetchNotifications = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await authFetch(`${BACKEND_URL}/api/notification`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                const data = await response.json();
                setNotifications(Array.isArray(data) ? data : []);
            } else {
                setAlert({ type: 'error', message: t("errors.loadNotifications", { status: response.status }) });
                setNotifications([]);
            }
        } catch (error) {
            setAlert({ type: 'error', message: t("errors.serverConnection") });
            setNotifications([]);
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    const fetchGardenerLocation = useCallback(async () => {
        setWeatherError(null);
        try {
            const response = await authFetch(`${BACKEND_URL}/api/gardener/location`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (!response.ok) throw new Error(t("errors.locationServer"));
            const data = await response.json();

            if (!data.coordinateDTO?.latitude || !data.coordinateDTO?.longitude) {
                throw new Error(t("errors.coordinatesUndefined"));
            }

            setCoordinates({ lat: data.coordinateDTO.latitude, lon: data.coordinateDTO.longitude });
        } catch (error: any) {
            setWeatherError(error.message || t("errors.locationLoad"));
            setCoordinates(null);
        }
    }, [t]);

    const loadWeatherNotifications = useCallback(async () => {
        try {
            const response = await authFetch(`${BACKEND_URL}/api/weather-notifications`, { method: 'GET', headers: getAuthHeaders() });
            if (!response.ok) return [];
            const data = await response.json();
            return data.map((item: any) => ({
                id: item.id,
                weatherNotificationType: item.weatherNotificationType,
                threshold: item.threshold,
                daysAhead: item.daysAhead || 1,
                enabled: item.enabled,
                description: item.description
            }));
        } catch (error) {
            console.error('Błąd ładowania notyfikacji pogodowych:', error);
            return [];
        }
    }, []);

    const checkWeatherAlerts = useCallback(async (coords: { lat: number; lon: number }, rules: NotificationRule[]) => {
        if (rules.length === 0 || !rules.some(r => r.enabled)) return;
        setIsCheckingAlerts(true);
        const alerts: WeatherAlert[] = [];

        try {
            const maxDays = Math.max(...rules.filter(r => r.enabled).map(r => r.daysAhead));
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&timezone=Europe/Warsaw&forecast_days=${maxDays}`
            );

            if (!response.ok) throw new Error(t("errors.forecastFetch"));
            const data = await response.json();

            rules.filter(rule => rule.enabled).forEach(rule => {
                for (let i = 0; i < rule.daysAhead && i < data.daily.time.length; i++) {
                    const date = data.daily.time[i];
                    let triggered = false;
                    let value = 0;
                    let message = '';

                    switch (rule.weatherNotificationType) {
                        case 'FROST_WARNING':
                            value = data.daily.temperature_2m_min[i];
                            if (value < rule.threshold) { triggered = true; message = t("weather.alert.frost", { value: value.toFixed(1) }); }
                            break;
                        case 'TEMP_LOW':
                            value = data.daily.temperature_2m_min[i];
                            if (value < rule.threshold) { triggered = true; message = t("weather.alert.tempLow", { value: value.toFixed(1) }); }
                            break;
                        case 'TEMP_HIGH':
                            value = data.daily.temperature_2m_max[i];
                            if (value > rule.threshold) { triggered = true; message = t("weather.alert.tempHigh", { value: value.toFixed(1) }); }
                            break;
                        case 'RAIN_FORECAST':
                            value = data.daily.precipitation_probability_max[i];
                            if (value > rule.threshold) { triggered = true; message = t("weather.alert.rain", { value: value.toFixed(0) }); }
                            break;
                        case 'STRONG_WIND':
                            value = data.daily.wind_speed_10m_max[i];
                            if (value > rule.threshold) { triggered = true; message = t("weather.alert.wind", { value: value.toFixed(1) }); }
                            break;
                    }

                    if (triggered) {
                        alerts.push({ message: t("weather.alert.withThreshold", { message, threshold: rule.threshold }), date });
                    }
                }
            });
            setForecastAlerts(alerts);
        } catch (error) {
            console.error('Błąd sprawdzania alertów:', error);
        } finally {
            setIsCheckingAlerts(false);
        }
    }, [t]);

    useEffect(() => {
        fetchNotifications();
        fetchGardenerLocation();
    }, [fetchNotifications, fetchGardenerLocation]);

    useEffect(() => {
        const loadWeatherData = async () => {
            if (coordinates) {
                const rules = await loadWeatherNotifications();
                if (rules.length > 0) {
                    await checkWeatherAlerts(coordinates, rules);
                }
            }
        };
        loadWeatherData();
    }, [coordinates, loadWeatherNotifications, checkWeatherAlerts]);

    return {
        notifications, isLoading, alert, closeAlert,
        forecastAlerts, isCheckingAlerts, weatherError
    };
};