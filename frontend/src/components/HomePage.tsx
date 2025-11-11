import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AlertCircle, Loader } from 'lucide-react';
import { Link } from "react-router-dom";

import { BACKEND_URL, getAuthHeaders } from "../utils/apiConfigs";
import {type NotificationRule, type ForecastAlert, type Alert, type OpenMeteoCoordinates } from "../utils/common";


const NOTIFICATION_TYPES = {
  WEATHER: { label: 'Pogoda', icon: '🌤️', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  USER: { label: 'Użytkownik', icon: '👤', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  WORK_ENTRY: { label: 'Wpis pracy', icon: '📝', color: 'bg-green-50 text-green-700 border-green-200' },
  SECTOR: { label: 'Sektor', icon: '🗺️', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  PROFIT: { label: 'Zysk', icon: '💰', color: 'bg-green-50 text-green-700 border-green-200' },
  EXPENSE: { label: 'Wydatek', icon: '💸', color: 'bg-red-50 text-red-700 border-red-200' },
};


const LoadingState = () => (
  <div className="text-center py-16">
    <div className="w-14 h-14 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
    <p className="text-gray-500 text-xl font-medium">Ładowanie notyfikacji... 🔄</p>
  </div>
);

const EmptyState = () => (
  <div className="text-center py-16">
    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">
      🔔
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mb-3">Brak notyfikacji</h3>
    <p className="text-gray-500 mb-6 max-w-md mx-auto">
      Nie masz jeszcze żadnych powiadomień. Sprawdź ponownie później!
    </p>
  </div>
);

const NotificationCard = ({ notification }) => {
  const typeDetails = NOTIFICATION_TYPES[notification.notificationType] || { 
    label: 'Powiadomienie', 
    icon: '📢', 
    color: 'bg-gray-50 text-gray-700 border-gray-200' 
  };
  
  const notificationDate = new Date(notification.createdAt).toLocaleString('pl-PL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const timeAgo = useMemo(() => {
    const now = new Date();
    const created = new Date(notification.createdAt);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Przed chwilą';
    if (diffMins < 60) return `${diffMins} min temu`;
    if (diffHours < 24) return `${diffHours} godz. temu`;
    if (diffDays < 7) return `${diffDays} dni temu`;
    return notificationDate;
  }, [notification.createdAt, notificationDate]);

  return (
    <div className={`bg-white border-l-4 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 ${typeDetails.color.replace('bg-', 'border-l-').split(' ')[0]} border border-gray-100`}>
      <div className="flex items-start space-x-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 ${typeDetails.color}`}>
          {typeDetails.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-base font-bold text-gray-900 mb-1">
                {notification.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {notification.message}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${typeDetails.color}`}>
                {typeDetails.label}
              </span>
              <div className="text-xs text-gray-500 flex items-center whitespace-nowrap">
                <span className="mr-1">🕐</span>
                {timeAgo}
              </div>
              {notification.userDTO && (
                <div className="text-xs text-gray-400 flex items-center whitespace-nowrap">
                  <span className="mr-1">👤</span>
                  {notification.userDTO.username || notification.userDTO.email}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const WeatherAlertCard = ({ alert }) => {
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
    <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 border border-orange-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="px-2.5 py-1 bg-orange-600 text-white text-xs font-bold rounded-full">
              {dateLabel}
            </span>
            <span className="text-xs text-gray-600">
              {formattedDate}
            </span>
          </div>
          <p className="text-gray-900 font-medium text-sm leading-relaxed">
            {alert.message}
          </p>
        </div>
        <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-1" />
      </div>
    </div>
  );
};

export default function NotificationDashboard() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });
  
  // Weather alerts state
  const [forecastAlerts, setForecastAlerts] = useState([]);
  const [isCheckingAlerts, setIsCheckingAlerts] = useState(false);
  const [weatherError, setWeatherError] = useState(null);
  const [coordinates, setCoordinates] = useState(null);

  const closeAlert = useCallback(() => setAlert({ type: '', message: '' }), []);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/notification`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(Array.isArray(data) ? data : []);
      } else {
        const errorText = await response.text();
        console.error('Błąd pobierania notyfikacji:', response.status, errorText);
        setAlert({ 
          type: 'error', 
          message: `Nie udało się załadować notyfikacji (${response.status})` 
        });
        setNotifications([]);
      }
    } catch (error) {
      console.error('Błąd połączenia:', error);
      setAlert({ 
        type: 'error', 
        message: 'Nie można połączyć z serwerem. Sprawdź połączenie.' 
      });
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  
  const loadWeatherNotifications = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/weather-notifications`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const mappedNotifications = data.map((item) => ({
        id: Date.now() + Math.random(),
        backendId: item.id,
        weatherNotificationType: item.weatherNotificationType,
        threshold: item.threshold,
        daysAhead: item.daysAhead || 1,
        enabled: item.enabled,
        description: item.description
      }));

      return mappedNotifications;
    } catch (error) {
      console.error('Błąd ładowania notyfikacji pogodowych:', error);
      return [];
    }
  }, []);

  const checkWeatherAlerts = useCallback(async (coords, rules) => {
    if (rules.length === 0 || !rules.some(r => r.enabled)) {
      return;
    }

    setIsCheckingAlerts(true);
    const alerts = [];

    try {
      const maxDays = Math.max(...rules.filter(r => r.enabled).map(r => r.daysAhead));
      
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?` +
        `latitude=${coords.lat}&` +
        `longitude=${coords.lon}&` +
        `daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&` +
        `timezone=Europe/Warsaw&` +
        `forecast_days=${maxDays}`
      );

      if (!response.ok) {
        throw new Error('Nie udało się pobrać prognozy pogody');
      }

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
              if (value < rule.threshold) {
                triggered = true;
                message = `🧊 Ostrzeżenie o przymrozku: ${value.toFixed(1)}°C (próg: ${rule.threshold}°C)`;
              }
              break;

            case 'TEMP_LOW':
              value = data.daily.temperature_2m_min[i];
              if (value < rule.threshold) {
                triggered = true;
                message = `❄️ Niska temperatura: ${value.toFixed(1)}°C (próg: ${rule.threshold}°C)`;
              }
              break;

            case 'TEMP_HIGH':
              value = data.daily.temperature_2m_max[i];
              if (value > rule.threshold) {
                triggered = true;
                message = `🌡️ Wysoka temperatura: ${value.toFixed(1)}°C (próg: ${rule.threshold}°C)`;
              }
              break;

            case 'RAIN_FORECAST':
              value = data.daily.precipitation_probability_max[i];
              if (value > rule.threshold) {
                triggered = true;
                message = `🌧️ Prognoza opadów: ${value.toFixed(0)}% (próg: ${rule.threshold}%)`;
              }
              break;

            case 'STRONG_WIND':
              value = data.daily.wind_speed_10m_max[i];
              if (value > rule.threshold) {
                triggered = true;
                message = `💨 Silny wiatr: ${value.toFixed(1)} km/h (próg: ${rule.threshold} km/h)`;
              }
              break;
          }

          if (triggered) {
            alerts.push({
              notificationId: rule.id,
              type: rule.weatherNotificationType,
              message,
              date,
              value,
              threshold: rule.threshold
            });
          }
        }
      });

      setForecastAlerts(alerts);
    } catch (error) {
      console.error('Błąd sprawdzania alertów pogodowych:', error);
    } finally {
      setIsCheckingAlerts(false);
    }
  }, []);

   const fetchGardenerLocation = useCallback(async () => {
    setWeatherError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/api/gardener/location`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Błąd serwera: Nie udało się pobrać danych lokalizacji.');
      }

      const data = await response.json();
      
      if (!data.coordinateDTO || data.coordinateDTO.latitude === undefined || data.coordinateDTO.longitude === undefined) {
        throw new Error('Koordynaty dla sadownika nie są zdefiniowane.');
      }
      
      setCoordinates({ 
        lat: data.coordinateDTO.latitude, 
        lon: data.coordinateDTO.longitude 
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Wystąpił nieznany błąd podczas ładowania lokalizacji.';
      console.error('Błąd pobierania koordynatów:', message);
      setWeatherError(message);
      setCoordinates(null);
    }
  }, []);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 flex items-center">
            <span className="text-indigo-600 mr-3">🔔</span>
            Powiadomienia
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Wszystkie ważne informacje w jednym miejscu
          </p>
        </header>
        
        {alert.message && (
          <Alert type={alert.type} message={alert.message} onClose={closeAlert} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center">
                  <span className="mr-2">📬</span>
                  Ostatnie aktualności
                </h2>
              </div>
              
              {isLoading ? (
                <LoadingState />
              ) : notifications.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Weather Alerts Sidebar (1/3 width) */}
          <div className="lg:col-span-1 lg:-mt-20">
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl shadow-xl p-4 md:p-5 border border-orange-200 lg:sticky lg:top-2">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
                <h2 className="text-base md:text-lg font-bold text-gray-900">
                  Pogoda
                </h2>
              </div>

              {isCheckingAlerts ? (
                <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader className="w-6 h-6 text-orange-600 animate-spin" />
                    <span className="text-orange-800 font-medium text-sm text-center">
                      Sprawdzanie alertów...
                    </span>
                  </div>
                </div>
              ) : weatherError ? (
                <div className="bg-red-100 border border-red-300 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-800">
                      {weatherError}
                    </div>
                  </div>
                </div>
              ) : forecastAlerts.length > 0 ? (
                <>
                  <div className="mb-3 px-3 py-2 bg-orange-600 text-white rounded-lg text-center">
                    <span className="font-bold text-lg">{forecastAlerts.length}</span>
                    <span className="text-sm ml-2">
                      {forecastAlerts.length === 1 ? 'ostrzeżenie' : 
                       forecastAlerts.length < 5 ? 'ostrzeżenia' : 'ostrzeżeń'}
                    </span>
                  </div>
                  <div className="space-y-3 max-h-[500px] lg:max-h-[calc(100vh-280px)] overflow-y-auto pr-2 custom-scrollbar">
                    {forecastAlerts.map((alert, index) => (
                      <WeatherAlertCard key={index} alert={alert} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 text-center">
                  <div className="text-4xl md:text-5xl mb-3">☀️</div>
                  <p className="text-gray-700 font-medium mb-1 text-sm md:text-base">Brak ostrzeżeń</p>
                  <p className="text-gray-600 text-xs md:text-sm">Brak niespodzianek. Możesz skonfigurować alerty pogodowe w{" "} <Link
                                    to="/weather"
                                    className="font-bold underline text-red-800 hover:text-red-900"
                                >
                                    Notyfikacjach Powodowych
                                </Link></p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(234, 88, 12, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(234, 88, 12, 0.7);
        }
      `}</style>
    </div>
  );
}