import BasicMap from '../../utils/BasicMap';
import LocationSearch from '../../utils/LocationSearch';
import { Alert } from '../../utils/common';
import { MapPin } from 'lucide-react';
import { useTranslation } from "react-i18next";
import { useGardenerProfile } from './GardenerProfileHooks';
import { InputField, LoadingState } from './GardenerProfileComponents';

export default function GardenerProfile() {
    const { t } = useTranslation("gardenerProfile");
    const {
        profileData, errors, isLoading, isSaving, alert, hasChanges, 
        showPassword, setShowPassword, mapView, mapInstance, setMapInstance, 
        handleChange, handleLocationSelect, handleSave, handleReset, closeAlert
    } = useGardenerProfile();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-50 to-lime-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-6 font-sans">
                <div className="max-w-4xl mx-auto"><LoadingState /></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-50 to-lime-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-6 font-sans">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center">
                        <span className="text-green-600 mr-3">👤</span> {t("header.title")}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 text-lg flex items-center">
                        {t("header.subtitle")}
                    </p>
                </header>
                
                {alert.message && (
                    <Alert 
                        type={alert.type} 
                        message={alert.message} 
                        onClose={closeAlert} 
                    />
                )}

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
                    
                    <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-4 flex items-center">
                            <span className="mr-2">📋</span> {t("sections.basicInfo")}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField
                                label={t("fields.name")}
                                name="name"
                                required
                                value={profileData.name}
                                onChange={handleChange}
                                error={errors.name}
                                isLoading={isSaving}
                                placeholder={t("placeholders.name")}
                            />
                            <InputField
                                label={t("fields.surname")}
                                name="surname"
                                required
                                value={profileData.surname}
                                onChange={handleChange}
                                error={errors.surname}
                                isLoading={isSaving}
                                placeholder={t("placeholders.surname")}
                            />
                        </div>
                    </div>

                    <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-4 flex items-center">
                            <span className="mr-2">📞</span> {t("sections.contactInfo")}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField
                                label={t("fields.emailOptional")}
                                name="email"
                                type="email"
                                value={profileData.email}
                                onChange={handleChange}
                                error={errors.email}
                                isLoading={isSaving}
                                placeholder={t("placeholders.email")}
                            />
                            <InputField
                                label={t("fields.phoneOptional")}
                                name="phoneNumber"
                                value={profileData.phoneNumber}
                                onChange={handleChange}
                                error={errors.phoneNumber}
                                isLoading={isSaving}
                                placeholder={t("placeholders.phone")}
                            />
                        </div>
                        <div className="mt-6">
                            <InputField
                                label={t("fields.nicknameRequired")}
                                name="nickname"
                                required
                                value={profileData.nickname}
                                onChange={handleChange}
                                isLoading={isSaving}
                                placeholder={t("placeholders.nickname")}
                            />
                        </div>
                    </div>

                    <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-4 flex items-center">
                            <MapPin className="mr-2 text-red-500 w-6 h-6" /> {t("sections.location")}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                            {t("location.hint", { locality: profileData.localityName })}
                        </p>

                        <div className="mb-4 relative z-10">
                            <label htmlFor="location-search" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                {t("location.searchLabel")}
                            </label>
                            {mapInstance && (
                                <LocationSearch 
                                    map={mapInstance} 
                                    onLocationSelect={handleLocationSelect} 
                                />
                            )}
                        </div>
                        
                        <div className="rounded-xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700 relative z-0" style={{ height: '400px' }}>
                            <BasicMap 
                                center={mapView.center} 
                                zoom={mapView.zoom} 
                                onMapLoad={setMapInstance} 
                                style={{ height: '400px', width: '100%' }} 
                                markerPosition={[profileData.latitude, profileData.longitude]} 
                                markerPopupContent={`📍 ${profileData.localityName || t("location.unknownLocation")}`}
                                viewUpdateKey={mapView.viewUpdateKey} 
                            />
                        </div>

                        <div className='mt-4'>
                            <InputField
                                label={t("fields.selectedLocality")}
                                name="localityName"
                                required
                                value={profileData.localityName}
                                onChange={handleChange}
                                error={errors.localityName}
                                isLoading={isSaving}
                                disabled={true}
                                placeholder={t("placeholders.locality")}
                            />
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                            {t("location.coordinates", { lat: profileData.latitude.toFixed(4), lon: profileData.longitude.toFixed(4) })}
                        </p>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-4 flex items-center">
                            <span className="mr-2">🔒</span> {t("sections.passwordChange")}
                        </h2>
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                            <p className="text-sm text-blue-800 dark:text-blue-300">
                                {t("password.hint")}
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField
                                label={t("fields.newPassword")}
                                name="password"
                                type="password"
                                isPassword
                                value={profileData.password}
                                onChange={handleChange}
                                error={errors.password}
                                isLoading={isSaving}
                                showPassword={showPassword}
                                setShowPassword={setShowPassword}
                                placeholder={t("placeholders.password")}
                            />
                            {(profileData.password || errors.confirmPassword) && (
                                <InputField
                                    label={t("fields.confirmNewPassword")}
                                    name="confirmPassword"
                                    type="password"
                                    value={profileData.confirmPassword}
                                    onChange={handleChange}
                                    error={errors.confirmPassword}
                                    isLoading={isSaving}
                                    placeholder={t("placeholders.confirmPassword")}
                                />
                            )}
                        </div>
                    </div>

                    {hasChanges && (
                        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <p className="text-sm text-amber-800 dark:text-amber-300 flex items-center">
                                <span className="mr-2">⚠️</span> {t("unsavedChanges")}
                            </p>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <button 
                            onClick={handleSave} 
                            disabled={isSaving || !hasChanges} 
                            className="flex-1 bg-gradient-to-r from-green-600 to-lime-700 hover:from-green-700 hover:to-lime-800 text-white py-4 px-6 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center"
                        >
                            {isSaving ? (
                                <span className="flex items-center">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    {t("buttons.saving")}
                                </span>
                            ) : (
                                <span className="flex items-center">
                                    <span className="mr-2">💾</span> {t("buttons.save")}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={handleReset}
                            disabled={isSaving || !hasChanges}
                            className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 py-4 px-6 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            <span className="mr-2">🔄</span> {t("buttons.reset")}
                        </button>
                    </div>

                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-600 dark:text-gray-300 flex items-center">
                            <span className="mr-2">🔐</span> {t("securityNote")}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}