import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BACKEND_URL, getAuthHeaders } from "../utils/apiConfigs";


const NOTIFICATION_TYPES = {
  WEATHER: { label: 'Pogoda', icon: '🌤️', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  USER: { label: 'Użytkownik', icon: '👤', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  WORK_ENTRY: { label: 'Wpis pracy', icon: '📝', color: 'bg-green-50 text-green-700 border-green-200' },
  SECTOR: { label: 'Sektor', icon: '🗺️', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  ALERT: { label: 'Alert', icon: '⚠️', color: 'bg-red-50 text-red-700 border-red-200' },
  SYSTEM: { label: 'System', icon: '⚙️', color: 'bg-gray-50 text-gray-700 border-gray-200' },
};

const Alert = ({ type, message, onClose }) => {
  if (!message) return null;
  const colors = useMemo(() => ({
    error: 'bg-red-50 border-red-300 text-red-700',
    success: 'bg-green-50 border-green-300 text-green-700',
    warning: 'bg-amber-50 border-amber-300 text-amber-700'
  }), []);
  
  return (
    <div className={`mb-4 p-4 border rounded-xl ${colors[type]} flex items-center justify-between shadow-sm`} role="alert">
      <div className="flex items-center">
        <div className={`w-2 h-2 rounded-full mr-2 ${type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-amber-500'}`}></div>
        <p className="font-medium">{message}</p>
      </div>
      {onClose && (
        <button 
          onClick={onClose} 
          className="text-gray-500 hover:text-gray-700 p-1 transition-colors text-lg"
          aria-label="Zamknij alert"
        >
          ❌
        </button>
      )}
    </div>
  );
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

export default function NotificationHome() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

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

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-1 flex items-center">
            <span className="text-indigo-600 mr-3">🔔</span>
            Powiadomienia
          </h1>
          <p className="text-gray-600 text-base">
            Wszystkie ważne informacje w jednym miejscu
          </p>
        </header>
        
        {alert.message && (
          <Alert type={alert.type} message={alert.message} onClose={closeAlert} />
        )}

        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <span className="mr-2">📬</span>
              Ostatnie aktualności
            </h2>
            <button
              onClick={fetchNotifications}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm flex items-center space-x-2"
            >
              <span>🔄</span>
              <span>Odśwież</span>
            </button>
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
    </div>
  );
}