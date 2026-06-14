import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Cloud, Loader, AlertCircle, Bell, Plus } from 'lucide-react';
import { Link } from "react-router-dom";
import { useWeatherNotifications} from './WeatherNotificationsHooks';
import type { NotificationRule } from './WeatherNotificationsHooks';

import { CurrentWeatherCard, NotificationModal, NotificationItem } from './WeatherNotificationsComponents';

const WeatherNotifications: React.FC = () => {
    const { t, i18n } = useTranslation('weatherNotifications');
    const {
        currentWeather, notifications, isLoadingWeather, isLoadingNotifications, weatherError, missingLocation,
        forecastAlerts, isCheckingAlerts, locationName, coordinates,
        fetchCurrentWeather, loadNotifications, handleSaveNotification, toggleNotification, deleteNotification
    } = useWeatherNotifications();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<NotificationRule | null>(null);

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
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-3">
                    <Cloud className="w-8 h-8 text-blue-500 dark:text-blue-400" /> {t('page.title')}
                </h1>
                <p className="text-gray-600 dark:text-gray-300">{t('page.subtitle')}</p>
            </div>

            {isLoadingWeather && coordinates === null && weatherError === null ? (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-8 mb-6">
                    <div className="flex items-center justify-center gap-3">
                        <Loader className="w-6 h-6 text-blue-600 dark:text-blue-300 animate-spin" />
                        <span className="text-blue-800 dark:text-blue-300 font-medium">{locationName}</span>
                    </div>
                </div>
            ) : weatherError ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-6">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-300 flex-shrink-0" />
                        <div>
                            <div className="font-semibold text-red-900 dark:text-red-300">{weatherError}</div>
                            {canRetryWeather && (
                                <button onClick={() => coordinates && fetchCurrentWeather(coordinates, locationName)} className="text-sm text-red-700 dark:text-red-300 underline mt-1">
                                    {t('weather.retry')}
                                </button>
                            )}
                            {missingLocation && (
                                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                                    {t('weather.missingLocationPrefix')}<Link to="/gardener-profile" className="font-bold underline text-red-800 dark:text-red-300 hover:text-red-900">{t('weather.profileSettings')}</Link>{t('weather.missingLocationSuffix')}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            ) : currentWeather ? (
                <div className="mb-6"><CurrentWeatherCard weather={currentWeather} /></div>
            ) : (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-8 mb-6">
                    <div className="flex items-center justify-center gap-3">
                        <Loader className="w-6 h-6 text-blue-600 dark:text-blue-300 animate-spin" />
                        <span className="text-blue-800 dark:text-blue-300 font-medium">{t('weather.fetching', { location: locationName })}</span>
                    </div>
                </div>
            )}

            {isCheckingAlerts ? (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 mb-6">
                    <div className="flex items-center justify-center gap-3">
                        <Loader className="w-5 h-5 text-amber-600 dark:text-amber-300 animate-spin" />
                        <span className="text-amber-800 dark:text-amber-300 font-medium">{t('alerts.checking')}</span>
                    </div>
                </div>
            ) : forecastAlerts.length > 0 ? (
                <div className="mb-6 space-y-3">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-300" />
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('alerts.heading', { count: forecastAlerts.length })}</h3>
                    </div>
                    {forecastAlerts.map((alert, index) => {
                        const daysFromNow = Math.round((new Date(alert.date).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / (86400000));
                        const dateLabel = daysFromNow === 0 ? t('alerts.today') : daysFromNow === 1 ? t('alerts.tomorrow') : daysFromNow === 2 ? t('alerts.dayAfterTomorrow') : t('alerts.inDays', { count: daysFromNow });
                        return (
                            <div key={index} className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-l-4 border-orange-500 rounded-lg p-4 shadow-md">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-3 py-1 bg-orange-600 text-white text-sm font-bold rounded-full">{dateLabel}</span>
                                            <span className="text-sm text-gray-600 dark:text-gray-300">{new Date(alert.date).toLocaleDateString(i18n.language?.startsWith('en') ? 'en-US' : 'pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                                        </div>
                                        <p className="text-gray-900 dark:text-gray-50 font-medium text-lg">{alert.message}</p>
                                    </div>
                                    <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-300 flex-shrink-0" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : null}

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2"><Bell className="w-6 h-6 text-blue-500 dark:text-blue-400" /> {t('rules.title')}</h2>
                    <div className="flex gap-3">
                        <button onClick={loadNotifications} disabled={isLoadingNotifications} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 text-sm">
                            <Loader className={`w-4 h-4 ${isLoadingNotifications ? 'animate-spin' : ''}`} /> {t('rules.refresh')}
                        </button>
                        <button onClick={handleAddClick} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                            <Plus className="w-4 h-4" /> {t('rules.addAlert')}
                        </button>
                    </div>
                </div>

                <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                        <strong>{t('rules.howItWorksTitle')}</strong>{t('rules.howItWorksBody')}
                    </p>
                </div>

                {isLoadingNotifications ? (
                    <div className="text-center py-12">
                        <Loader className="w-8 h-8 text-blue-600 dark:text-blue-300 animate-spin mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-300">{t('rules.loading')}</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <Bell className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                        <p className="text-xl text-gray-500 dark:text-gray-400 mb-2">{t('rules.empty')}</p>
                        <button onClick={handleAddClick} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">{t('rules.addFirst')}</button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {notifications.map((notification) => (
                            <NotificationItem 
                                key={notification.id} 
                                notification={notification} 
                                onEdit={handleEditClick} 
                                onToggle={toggleNotification} 
                                onDelete={deleteNotification} 
                            />
                        ))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-300">{notifications.length}</div>
                    <div className="text-blue-800 dark:text-blue-300">{t('stats.all')}</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-300">{notifications.filter(n => n.enabled).length}</div>
                    <div className="text-green-800 dark:text-green-300">{t('stats.active')}</div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-300">{new Set(notifications.map(n => n.weatherNotificationType)).size}</div>
                    <div className="text-amber-800 dark:text-amber-300">{t('stats.types')}</div>
                </div>
            </div>

            <NotificationModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingRule(null); }} onSave={handleSaveNotification} editingRule={editingRule} />
        </div>
    );
};

export default WeatherNotifications;