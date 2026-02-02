import BasicMap from '../../utils/BasicMap'; 
import LocationSearch from '../../utils/LocationSearch';
import { Alert } from '../../utils/common';
import { MapPin } from 'lucide-react';
import { useGardenerProfile } from './GardenerProfileHooks';
import { InputField, LoadingState } from './GardenerProfileComponents';

export default function GardenerProfile() {
    const {
        profileData, errors, isLoading, isSaving, alert, hasChanges, showPassword, setShowPassword,
        mapView, mapInstance, setMapInstance, handleChange, handleLocationSelect, handleSave, handleReset, closeAlert
    } = useGardenerProfile();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-50 to-lime-100 p-6 font-sans">
                <div className="max-w-4xl mx-auto"><LoadingState /></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-50 to-lime-100 p-6 font-sans">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center"><span className="text-green-600 mr-3">👤</span> Mój Profil</h1>
                    <p className="text-gray-600 text-lg flex items-center">Zarządzaj swoimi danymi osobowymi i ustawieniami konta 🌱</p>
                </header>
                
                {alert.message && <Alert type={alert.type} message={alert.message} onClose={closeAlert} />}

                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
                    
                    {/* DANE PODSTAWOWE */}
                    <div className="mb-8 pb-6 border-b border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center"><span className="mr-2">📋</span> Informacje Podstawowe</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="Imię" name="name" required value={profileData.name} onChange={handleChange} error={errors.name} isLoading={isSaving} placeholder="np. Jan"/>
                            <InputField label="Nazwisko" name="surname" required value={profileData.surname} onChange={handleChange} error={errors.surname} isLoading={isSaving} placeholder="np. Kowalski"/>
                        </div>
                    </div>

                    {/* DANE KONTAKTOWE */}
                    <div className="mb-8 pb-6 border-b border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center"><span className="mr-2">📞</span> Dane Kontaktowe</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="Email (opcjonalnie)" name="email" type="email" value={profileData.email} onChange={handleChange} error={errors.email} isLoading={isSaving} placeholder="email@example.com"/>
                            <InputField label="Numer Telefonu (opcjonalnie)" name="phoneNumber" value={profileData.phoneNumber} onChange={handleChange} error={errors.phoneNumber} isLoading={isSaving} placeholder="+48 123 456 789"/>
                        </div>
                        <div className="mt-6">
                            <InputField label="Nazwa użytkownika (obowiązkowo)" name="nickname" required value={profileData.nickname} onChange={handleChange} isLoading={isSaving} placeholder="Twój pseudonim"/>
                        </div>
                    </div>

                    {/* LOKALIZACJA (MAPA) */}
                    <div className="mb-8 pb-6 border-b border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center"><MapPin className="mr-2 text-red-500 w-6 h-6" /> Ustaw Lokalizację Główną</h2>
                        <p className="text-sm text-gray-600 mb-4">Użyj pola wyszukiwania poniżej, aby znaleźć swoją miejscowość. Twoja aktualna lokalizacja: {profileData.localityName}</p>
                        
                        <div className="mb-4 relative z-10"> 
                            <label htmlFor="location-search" className="block text-sm font-medium text-gray-700 mb-2">Wyszukaj Miejscowość</label>
                            {mapInstance && <LocationSearch map={mapInstance} onLocationSelect={handleLocationSelect} />}
                        </div>
                        
                        <div className="rounded-xl overflow-hidden shadow-md border border-gray-200 relative z-0" style={{ height: '400px' }}>
                            <BasicMap 
                                center={mapView.center} zoom={mapView.zoom} onMapLoad={setMapInstance} style={{ height: '400px', width: '100%' }} 
                                markerPosition={[profileData.latitude, profileData.longitude]} markerPopupContent={`📍 ${profileData.localityName || 'Nieznana lokalizacja'}`} viewUpdateKey={mapView.viewUpdateKey} 
                            />
                        </div>

                        <div className='mt-4'>
                            <InputField label="Wybrana Miejscowość (Automatycznie)" name="localityName" required value={profileData.localityName} onChange={handleChange} error={errors.localityName} isLoading={isSaving} disabled={true} placeholder="Wyszukaj na mapie..." />
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Współrzędne: {profileData.latitude.toFixed(4)}, {profileData.longitude.toFixed(4)}</p>
                    </div>

                    {/* HASŁO */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center"><span className="mr-2">🔒</span> Zmiana Hasła</h2>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4"><p className="text-sm text-blue-800">💡 Pozostaw pole hasła puste, jeśli nie chcesz zmieniać hasła.</p></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="Nowe Hasło" name="password" type="password" isPassword value={profileData.password} onChange={handleChange} error={errors.password} isLoading={isSaving} showPassword={showPassword} setShowPassword={setShowPassword} placeholder="Minimum 6 znaków"/>
                            {(profileData.password || errors.confirmPassword) && (
                                <InputField label="Potwierdź Nowe Hasło" name="confirmPassword" type="password" value={profileData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} isLoading={isSaving} placeholder="Powtórz hasło"/>
                            )}
                        </div>
                    </div>

                    {hasChanges && (
                        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-sm text-amber-800 flex items-center"><span className="mr-2">⚠️</span> Masz niezapisane zmiany. Pamiętaj o zapisaniu profilu!</p>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                        <button onClick={handleSave} disabled={isSaving || !hasChanges} className="flex-1 bg-gradient-to-r from-green-600 to-lime-700 hover:from-green-700 hover:to-lime-800 text-white py-4 px-6 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center">
                            {isSaving ? <span className="flex items-center"><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>Zapisywanie...</span> : <span className="flex items-center"><span className="mr-2">💾</span> Zapisz Zmiany</span>}
                        </button>
                        <button onClick={handleReset} disabled={isSaving || !hasChanges} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-4 px-6 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                            <span className="mr-2">🔄</span> Resetuj Zmiany
                        </button>
                    </div>

                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-600 flex items-center"><span className="mr-2">🔐</span> Twoje dane są bezpiecznie przechowywane i chronione.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}