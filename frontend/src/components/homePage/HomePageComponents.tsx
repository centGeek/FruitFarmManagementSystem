import React, { useMemo } from 'react';
import { AlertCircle, Loader } from 'lucide-react';
import type { Notification, WeatherAlert } from './HomePageHooks';

const NOTIFICATION_TYPES: Record<string, { label: string; icon: string; color: string }> = {
    WEATHER: { label: 'Pogoda', icon: '🌤️', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    USER: { label: 'Użytkownik', icon: '👤', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    WORK_ENTRY: { label: 'Wpis pracy', icon: '📝', color: 'bg-green-50 text-green-700 border-green-200' },
    SECTOR: { label: 'Sektor', icon: '🗺️', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    PROFIT: { label: 'Zysk', icon: '💰', color: 'bg-green-50 text-green-700 border-green-200' },
    EXPENSE: { label: 'Wydatek', icon: '💸', color: 'bg-red-50 text-red-700 border-red-200' },
};

export const LoadingState = () => (
    <div className="text-center py-16">
        <div className="w-14 h-14 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
        <p className="text-gray-500 text-xl font-medium">Ładowanie notyfikacji... 🔄</p>
    </div>
);

export const EmptyState = () => (
    <div className="text-center py-16">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">🔔</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">Brak notyfikacji</h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">Nie masz jeszcze żadnych powiadomień. Sprawdź ponownie później!</p>
    </div>
);

export const NotificationCard = ({ notification }: { notification: Notification }) => {
    const typeDetails = NOTIFICATION_TYPES[notification.notificationType] || { label: 'Powiadomienie', icon: '📢', color: 'bg-gray-50 text-gray-700 border-gray-200' };
    const notificationDate = new Date(notification.createdAt).toLocaleString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    const timeAgo = useMemo(() => {
        const now = new Date();
        const created = new Date(notification.createdAt);
        const diffMs = now.getTime() - created.getTime();
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
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 ${typeDetails.color}`}>{typeDetails.icon}</div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <h3 className="text-base font-bold text-gray-900 mb-1">{notification.title}</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">{notification.message}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${typeDetails.color}`}>{typeDetails.label}</span>
                            <div className="text-xs text-gray-500 flex items-center whitespace-nowrap"><span className="mr-1">🕐</span>{timeAgo}</div>
                            {notification.userDTO && <div className="text-xs text-gray-400 flex items-center whitespace-nowrap"><span className="mr-1">👤</span>{notification.userDTO.username || notification.userDTO.email}</div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const WeatherAlertCard = ({ alert }: { alert: WeatherAlert }) => {
    const alertDate = new Date(alert.date);
    const today = new Date(); today.setHours(0, 0, 0, 0); alertDate.setHours(0, 0, 0, 0);
    const daysFromNow = Math.round((alertDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const dateLabel = daysFromNow === 0 ? 'Dziś' : daysFromNow === 1 ? 'Jutro' : daysFromNow === 2 ? 'Pojutrze' : `Za ${daysFromNow} dni`;
    const formattedDate = new Date(alert.date).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 border border-orange-200">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="px-2.5 py-1 bg-orange-600 text-white text-xs font-bold rounded-full">{dateLabel}</span>
                        <span className="text-xs text-gray-600">{formattedDate}</span>
                    </div>
                    <p className="text-gray-900 font-medium text-sm leading-relaxed">{alert.message}</p>
                </div>
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-1" />
            </div>
        </div>
    );
};