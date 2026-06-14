import { useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from "react-i18next";
import type { Notification, WeatherAlert } from './HomePageHooks';

const NOTIFICATION_TYPE_STYLES: Record<string, { icon: string; color: string }> = {
    WEATHER: { icon: '🌤️', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
    USER: { icon: '👤', color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
    WORK_ENTRY: { icon: '📝', color: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' },
    SECTOR: { icon: '🗺️', color: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' },
    PROFIT: { icon: '💰', color: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' },
    EXPENSE: { icon: '💸', color: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' },
};

export const LoadingState = () => {
    const { t } = useTranslation("homePage");
    return (
        <div className="text-center py-16">
            <div className="w-14 h-14 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-gray-500 dark:text-gray-400 text-xl font-medium">{t("loadingNotifications")}</p>
        </div>
    );
};

export const EmptyState = () => {
    const { t } = useTranslation("homePage");
    return (
        <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">🔔</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-3">{t("empty.title")}</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">{t("empty.subtitle")}</p>
        </div>
    );
};

export const NotificationCard = ({ notification }: { notification: Notification }) => {
    const { t } = useTranslation("homePage");
    const style = NOTIFICATION_TYPE_STYLES[notification.notificationType] || { icon: '📢', color: 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700' };
    const typeDetails = {
        icon: style.icon,
        color: style.color,
        label: NOTIFICATION_TYPE_STYLES[notification.notificationType]
            ? t(`notificationType.${notification.notificationType}`)
            : t("notificationType.DEFAULT"),
    };
    const notificationDate = new Date(notification.createdAt).toLocaleString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    const timeAgo = useMemo(() => {
        const now = new Date();
        const created = new Date(notification.createdAt);
        const diffMs = now.getTime() - created.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        if (diffMins < 1) return t("timeAgo.justNow");
        if (diffMins < 60) return t("timeAgo.minutes", { count: diffMins });
        if (diffHours < 24) return t("timeAgo.hours", { count: diffHours });
        if (diffDays < 7) return t("timeAgo.days", { count: diffDays });
        return notificationDate;
    }, [notification.createdAt, notificationDate, t]);

    return (
        <div className={`bg-white dark:bg-gray-800 border-l-4 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 ${typeDetails.color.replace('bg-', 'border-l-').split(' ')[0]} border border-gray-100 dark:border-gray-700`}>
            <div className="flex items-start space-x-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 ${typeDetails.color}`}>{typeDetails.icon}</div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <h3 className="text-base font-bold text-gray-900 dark:text-gray-50 mb-1">{notification.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{notification.message}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${typeDetails.color}`}>{typeDetails.label}</span>
                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center whitespace-nowrap"><span className="mr-1">🕐</span>{timeAgo}</div>
                            {notification.userDTO && <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center whitespace-nowrap"><span className="mr-1">👤</span>{notification.userDTO.username || notification.userDTO.email}</div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const WeatherAlertCard = ({ alert }: { alert: WeatherAlert }) => {
    const { t } = useTranslation("homePage");
    const alertDate = new Date(alert.date);
    const today = new Date(); today.setHours(0, 0, 0, 0); alertDate.setHours(0, 0, 0, 0);
    const daysFromNow = Math.round((alertDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const dateLabel = daysFromNow === 0
        ? t("weather.dateLabel.today")
        : daysFromNow === 1
            ? t("weather.dateLabel.tomorrow")
            : daysFromNow === 2
                ? t("weather.dateLabel.dayAfterTomorrow")
                : t("weather.dateLabel.inDays", { count: daysFromNow });
    const formattedDate = new Date(alert.date).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 border border-orange-200 dark:border-orange-800">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="px-2.5 py-1 bg-orange-600 text-white text-xs font-bold rounded-full">{dateLabel}</span>
                        <span className="text-xs text-gray-600 dark:text-gray-300">{formattedDate}</span>
                    </div>
                    <p className="text-gray-900 dark:text-gray-50 font-medium text-sm leading-relaxed">{alert.message}</p>
                </div>
                <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-300 flex-shrink-0 mt-1" />
            </div>
        </div>
    );
};