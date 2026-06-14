import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Droplets, Wind, Bell, X, Check, Loader, Thermometer, Calendar, BellOff, Trash2 } from 'lucide-react';
import type { CurrentWeather, NotificationRule } from './WeatherNotificationsHooks';
import { NOTIFICATION_TYPES, DAYS_AHEAD_OPTIONS } from '../../utils/common';

// Renders the unit for a notification type. RAIN_FORECAST's unit carries Polish text
// (translated via the shared common namespace); the others are universal symbols (°C, km/h).
const useNotificationUnit = () => {
    const { t } = useTranslation();
    return (type: string, fallbackUnit: string) =>
        type === 'RAIN_FORECAST' ? t('common:notificationType.RAIN_FORECAST.unit') : fallbackUnit;
};

export const CurrentWeatherCard: React.FC<{ weather: CurrentWeather }> = ({ weather }) => {
    const { t } = useTranslation('weatherNotifications');
    const description = t(`weatherCode.${weather.weatherCode}`, { defaultValue: t('weatherCode.unknown') });

    return (
    <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-lg p-5 text-white">
        <div className="flex items-center justify-between mb-4">
            <div>
                <h2 className="text-xl font-bold mb-1">{weather.location}</h2>
                <p className="text-blue-100 text-sm capitalize">{description}</p>
                <p className="text-blue-200 text-xs mt-0.5">{t('weather.current')}</p>
            </div>
            <div className="scale-75">{weather.icon}</div>
        </div>

        <div className="grid grid-cols-2 gap-3">
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <div className="text-3xl font-bold mb-1">{Math.round(weather.temp)}°C</div>
                <div className="text-blue-100 text-sm">{t('weather.temperature')}</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <div className="text-3xl font-bold mb-1">{Math.round(weather.feels_like)}°C</div>
                <div className="text-blue-100 text-sm">{t('weather.feelsLike')}</div>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="flex items-center gap-2 bg-white bg-opacity-10 rounded-lg p-2">
                <Droplets className="w-5 h-5" />
                <div>
                    <div className="text-xl font-bold">{weather.humidity}%</div>
                    <div className="text-xs text-blue-100">{t('weather.humidity')}</div>
                </div>
            </div>
            <div className="flex items-center gap-2 bg-white bg-opacity-10 rounded-lg p-2">
                <Wind className="w-5 h-5" />
                <div>
                    <div className="text-xl font-bold">{Math.round(weather.wind_speed)} km/h</div>
                    <div className="text-xs text-blue-100">{t('weather.wind')}</div>
                </div>
            </div>
        </div>
    </div>
    );
};

export const NotificationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (rule: NotificationRule) => Promise<boolean>;
    editingRule?: NotificationRule | null;
}> = ({ isOpen, onClose, onSave, editingRule }) => {
    const { t } = useTranslation('weatherNotifications');
    const resolveUnit = useNotificationUnit();
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
            alert(t('modal.fillAllFields'));
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
            const success = await onSave(rule);
            if(success) {
                alert(rule.backendId ? t('modal.notificationUpdated') : t('modal.notificationAdded'));
                onClose();
            } else {
                alert(t('modal.saveFailed'));
            }
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
                                {editingRule ? t('modal.editTitle') : t('modal.addTitle')}
                            </h3>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('modal.typeLabel')}
                            </label>
                            <select
                                value={weatherNotificationType}
                                onChange={(e) => {
                                    setWeatherNotificationType(e.target.value);
                                    const type = NOTIFICATION_TYPES.find(nt => nt.value === e.target.value);
                                    if (type && !threshold) setThreshold(type.defaultThreshold.toString());
                                }}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">{t('modal.typePlaceholder')}</option>
                                {NOTIFICATION_TYPES.map(nt => (
                                    <option key={nt.value} value={nt.value}>{t(`common:notificationType.${nt.value}.label`)}</option>
                                ))}
                            </select>
                        </div>
                        
                        {selectedType && (
                            <>
                                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                    <p className="text-sm text-blue-800">{t(`common:notificationType.${selectedType.value}.description`)}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t('modal.thresholdLabel', { unit: resolveUnit(selectedType.value, selectedType.unit) })}
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={threshold}
                                        onChange={(e) => setThreshold(e.target.value)}
                                        placeholder={selectedType.defaultThreshold.toString()}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t('modal.daysAheadLabel')}
                                    </label>
                                    <select
                                        value={daysAhead}
                                        onChange={(e) => setDaysAhead(parseInt(e.target.value))}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        {DAYS_AHEAD_OPTIONS.map(o => (
                                            <option key={o.value} value={o.value}>{t(`common:daysAhead.${o.value}`)}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {t('modal.daysAheadHint')}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                    
                    <div className="flex gap-3">
                        <button 
                            onClick={onClose} 
                            disabled={isLoading} 
                            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            {t('common:actions.cancel')}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isLoading || !weatherNotificationType || !threshold}
                            className="flex-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                        >
                            {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            {isLoading ? t('modal.saving') : editingRule ? t('modal.saveChanges') : t('modal.addNotification')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const NotificationItem: React.FC<{
    notification: NotificationRule;
    onEdit: (n: NotificationRule) => void;
    onToggle: (id: number) => void;
    onDelete: (id: number) => void;
}> = ({ notification, onEdit, onToggle, onDelete }) => {
    const { t } = useTranslation('weatherNotifications');
    const resolveUnit = useNotificationUnit();
    const typeData = NOTIFICATION_TYPES.find(nt => nt.value === notification.weatherNotificationType);
    const Icon = typeData?.icon || Bell;
    const typeLabel = typeData ? t(`common:notificationType.${typeData.value}.label`) : notification.weatherNotificationType;
    const typeDescription = typeData ? t(`common:notificationType.${typeData.value}.description`) : '';
    const typeUnit = typeData ? resolveUnit(typeData.value, typeData.unit) : '';
    const daysLabel = DAYS_AHEAD_OPTIONS.find(d => d.value === notification.daysAhead)
        ? t(`common:daysAhead.${notification.daysAhead}`)
        : t('rules.inDays', { count: notification.daysAhead });

    return (
        <div className={`border-2 rounded-xl p-5 transition-all ${notification.enabled ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${notification.enabled ? 'bg-blue-100' : 'bg-gray-200'}`}>
                        <Icon className={`w-6 h-6 ${notification.enabled ? 'text-blue-600' : 'text-gray-500'}`} />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900 text-lg">
                                {typeLabel}
                            </h3>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${notification.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                                {notification.enabled ? t('rules.active') : t('rules.inactive')}
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{typeDescription}</p>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 text-sm bg-white rounded-lg p-2 border border-gray-200">
                                <Thermometer className="w-4 h-4 text-gray-500" />
                                <div>
                                    <span className="text-gray-500 text-xs">{t('rules.thresholdLabel')}</span>
                                    <span className="font-semibold text-gray-900 ml-1">
                                        {notification.threshold} {typeUnit}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm bg-white rounded-lg p-2 border border-gray-200">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <div>
                                    <span className="text-gray-500 text-xs">{t('rules.forecastLabel')}</span>
                                    <span className="font-semibold text-gray-900 ml-1">{daysLabel}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        onClick={() => onEdit(notification)}
                        className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200"
                        title={t('rules.edit')}
                    >
                        <Check className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => onToggle(notification.id!)}
                        className={`p-2 rounded-lg ${notification.enabled ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                        title={notification.enabled ? t('rules.disable') : t('rules.enable')}
                    >
                        {notification.enabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                    </button>
                    <button
                        onClick={() => window.confirm(t('rules.confirmDelete')) && onDelete(notification.id!)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                        title={t('rules.delete')}
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};