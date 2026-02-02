import React, { useState } from 'react';
import { Cloud, Loader, AlertCircle, Bell, Plus } from 'lucide-react';
import { Link } from "react-router-dom";
import { useWeatherNotifications} from './WeatherNotificationsHooks';
import type { NotificationRule } from './WeatherNotificationsHooks';

import { CurrentWeatherCard, NotificationModal, NotificationItem } from './WeatherNotificationsComponents';

const WeatherNotifications: React.FC = () => {
    const { 
        currentWeather, notifications, isLoadingWeather, isLoadingNotifications, weatherError,
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
                <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                    <Cloud className="w-8 h-8 text-blue-500" /> Pogoda i Notyfikacje
                </h1>
                <p className="text-gray-600">Aktualna pogoda oraz zarządzanie alertami pogodowymi</p>
            </div>

            {isLoadingWeather && coordinates === null && weatherError === null ? (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 mb-6">
                    <div className="flex items-center justify-center gap-3">
                        <Loader className="w-6 h-6 text-blue-600 animate-spin" />
                        <span className="text-blue-800 font-medium">{locationName}</span>
                    </div>
                </div>
            ) : weatherError ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                        <div>
                            <div className="font-semibold text-red-900">{weatherError}</div>
                            {canRetryWeather && (
                                <button onClick={() => coordinates && fetchCurrentWeather(coordinates, locationName)} className="text-sm text-red-700 underline mt-1">
                                    Spróbuj ponownie pobrać pogodę. Sprawdź połączenie internetowe
                                </button>
                            )}
                            {weatherError.includes('Koordynaty') && (
                                <p className="text-sm text-red-700 mt-1">
                                    Proszę uzupełnij swoją lokalizację w <Link to="/gardener-profile" className="font-bold underline text-red-800 hover:text-red-900">Ustawieniach Profilu</Link>.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            ) : currentWeather ? (
                <div className="mb-6"><CurrentWeatherCard weather={currentWeather} /></div>
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
                        <h3 className="text-lg font-semibold text-gray-800">Ostrzeżenia pogodowe ({forecastAlerts.length})</h3>
                    </div>
                    {forecastAlerts.map((alert, index) => {
                        const daysFromNow = Math.round((new Date(alert.date).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / (86400000));
                        const dateLabel = daysFromNow === 0 ? 'Dziś' : daysFromNow === 1 ? 'Jutro' : daysFromNow === 2 ? 'Pojutrze' : `Za ${daysFromNow} dni`;
                        return (
                            <div key={index} className="bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-500 rounded-lg p-4 shadow-md">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-3 py-1 bg-orange-600 text-white text-sm font-bold rounded-full">{dateLabel}</span>
                                            <span className="text-sm text-gray-600">{new Date(alert.date).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                                        </div>
                                        <p className="text-gray-900 font-medium text-lg">{alert.message}</p>
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
                    <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2"><Bell className="w-6 h-6 text-blue-500" /> Alerty Pogodowe</h2>
                    <div className="flex gap-3">
                        <button onClick={loadNotifications} disabled={isLoadingNotifications} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 text-sm">
                            <Loader className={`w-4 h-4 ${isLoadingNotifications ? 'animate-spin' : ''}`} /> Odśwież
                        </button>
                        <button onClick={handleAddClick} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                            <Plus className="w-4 h-4" /> Dodaj alert
                        </button>
                    </div>
                </div>

                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                        <strong>Jak to działa?</strong> Skonfiguruj alerty pogodowe aby otrzymywać powiadomienia o nadchodzących warunkach pogodowych. System sprawdzi prognozę i powiadomi Cię z wyprzedzeniem.
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
                        <button onClick={handleAddClick} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Dodaj pierwszy alert</button>
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
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">{notifications.length}</div>
                    <div className="text-blue-800">Wszystkie alerty</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-600">{notifications.filter(n => n.enabled).length}</div>
                    <div className="text-green-800">Aktywne alerty</div>
                </div>
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <div className="text-2xl font-bold text-amber-600">{new Set(notifications.map(n => n.weatherNotificationType)).size}</div>
                    <div className="text-amber-800">Typy alertów</div>
                </div>
            </div>

            <NotificationModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingRule(null); }} onSave={handleSaveNotification} editingRule={editingRule} />
        </div>
    );
};

export default WeatherNotifications;