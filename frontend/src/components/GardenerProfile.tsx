import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BACKEND_URL, getAuthHeaders } from "../utils/apiConfigs"; 
import BasicMap from './BasicMap'; 
import LocationSearch from './LocationSearch';
import { MapPin } from 'lucide-react';

const Alert = React.memo(({ type, message, onClose }) => {
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
});

const InputField = React.memo(({ label, name, type = 'text', required = false, isPassword = false, error, isLoading, showPassword, setShowPassword, value, onChange, placeholder, disabled = false }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
            <input
                id={name}
                type={isPassword && showPassword ? "text" : type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled || isLoading}
                className={`w-full px-4 py-3 ${error ? 'border-red-500' : 'border-gray-300'} border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed`}
            />
            {isPassword && (
                <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                    aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
                    disabled={isLoading}
                >
                    {showPassword ? "🙈" : "👁️"}
                </button>
            )}
        </div>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
));

const LoadingState = React.memo(() => (
    <div className="text-center py-16">
        <div className="w-14 h-14 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-6"></div>
        <p className="text-gray-500 text-xl font-medium">Ładowanie profilu... 🔄</p>
    </div>
));

export default function GardenerProfile() {
    const defaultCenter = useMemo(() => [52.2297, 21.0122], []); // Warszawa
    const [mapInstance, setMapInstance] = useState(null);

    const [mapView, setMapView] = useState({
        center: defaultCenter, 
        zoom: 6,
        viewUpdateKey: Date.now()
    });

    const [profileData, setProfileData] = useState({
        name: '',
        surname: '',
        nickname: '',
        phoneNumber: '',
        email: '',
        password: '',
        confirmPassword: '',
        latitude: defaultCenter[0], 
        longitude: defaultCenter[1],
        localityName: 'Warszawa', 
    });
    const [originalData, setOriginalData] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [alert, setAlert] = useState({ type: '', message: '' });
    const [hasChanges, setHasChanges] = useState(false);

    const closeAlert = useCallback(() => setAlert({ type: '', message: '' }), []);

    const fetchProfile = useCallback(async () => {
        setIsLoading(true);
        closeAlert();

        try {
            const response = await fetch(`${BACKEND_URL}/api/gardener`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                const data = await response.json();
                
                const initialLat = data.coordinateDTO?.latitude ?? defaultCenter[0];
                const initialLon = data.coordinateDTO?.longitude ?? defaultCenter[1];
                const initialLocality = data.localityName || 'Warszawa';
                
                const profileInfo = {
                    name: data.name || '',
                    surname: data.surname || '',
                    nickname: data.nickname || '',
                    phoneNumber: data.phoneNumber || '',
                    email: data.email || '',
                    password: '',
                    confirmPassword: '',
                    latitude: initialLat,
                    longitude: initialLon,
                    localityName: initialLocality,
                };
                
                const initialZoom = initialLocality === 'Warszawa' ? 6 : 13;
                
                setProfileData(profileInfo);
                setOriginalData(profileInfo);
                
                setMapView({ center: [initialLat, initialLon], zoom: initialZoom, viewUpdateKey: Date.now() });

            } else {
                const error = await response.json();
                setAlert({ type: 'error', message: `Błąd ładowania profilu: ${error.message || response.statusText}` });
            }
        } catch (error) {
            setAlert({ type: 'error', message: 'Błąd sieci: Nie można połączyć się z serwerem.' });
        } finally {
            setIsLoading(false);
        }
    }, [closeAlert, defaultCenter]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);


    useEffect(() => {
        if (!originalData) return;

        const changed = 
            profileData.name !== originalData.name ||
            profileData.surname !== originalData.surname ||
            profileData.nickname !== originalData.nickname ||
            profileData.phoneNumber !== originalData.phoneNumber ||
            profileData.email !== originalData.email ||
            profileData.password.length > 0 ||
            profileData.latitude !== originalData.latitude ||
            profileData.longitude !== originalData.longitude ||
            profileData.localityName !== originalData.localityName;
        
        setHasChanges(changed);
    }, [profileData, originalData]);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    }, [errors]);
    
    const handleLocationSelect = useCallback((location) => {
        const locality = location.address.city || location.address.town || location.address.village || location.name.split(',')[0] || 'Nieustawiona';
        
        setProfileData(prev => ({
            ...prev,
            latitude: location.lat,
            longitude: location.lon,
            localityName: locality,
        }));
        
        setMapView(prev => ({ 
            center: [location.lat, location.lon], 
            zoom: 13, 
            viewUpdateKey: Date.now() 
        }));
        
        setAlert({ type: 'success', message: `Ustawiono nową lokalizację: ${locality}` });
        setErrors(prev => ({ ...prev, localityName: '' }));
    }, []);

    const validate = useCallback(() => {
        const newErrors = {};
        
        if (!profileData.name.trim()) newErrors.name = 'Imię jest wymagane';
        else if (profileData.name.length < 2 || profileData.name.length > 50) newErrors.name = 'Imię musi mieć między 2 a 50 znaków';
        
        if (!profileData.surname.trim()) newErrors.surname = 'Nazwisko jest wymagane';
        else if (profileData.surname.length < 2 || profileData.surname.length > 50) newErrors.surname = 'Nazwisko musi mieć między 2 a 50 znaków';
        
        if (!profileData.nickname.trim()) newErrors.nickname = 'Nazwa użytkownika jest wymagana';

        if(profileData.email) {
        if (!/\S+@\S+\.\S+/.test(profileData.email)) newErrors.email = 'Nieprawidłowy format email';
        }
        if (!profileData.localityName || profileData.localityName === 'Nieustawiona' || (profileData.latitude === defaultCenter[0] && profileData.longitude === defaultCenter[1] && originalData)) {
             newErrors.localityName = 'Wybierz miejscowość, ustawiając ją na mapie/wyszukując.';
        }
        
        if (profileData.password.length > 0) {
            if (profileData.password.length < 6) {
                newErrors.password = 'Hasło musi mieć co najmniej 6 znaków';
            }
            if (profileData.password !== profileData.confirmPassword) {
                newErrors.confirmPassword = 'Hasła nie są zgodne';
            }
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [profileData, defaultCenter, originalData]);

    const handleSave = useCallback(async () => {
        if (!validate()) {
            setAlert({ type: 'error', message: 'Wystąpiły błędy walidacji. Sprawdź pola formularza.' });
            return;
        }
        
        setIsSaving(true);
        closeAlert();
        
        const payload = {
            name: profileData.name,
            surname: profileData.surname,
            nickname: profileData.nickname || null,
            phoneNumber: profileData.phoneNumber,
            email: profileData.email,
            ...(profileData.password && {
                password: profileData.password,
                confirmPassword: profileData.confirmPassword
            }),
            coordinateDTO: {
                latitude: profileData.latitude,
                longitude: profileData.longitude,
            },
            localityName: profileData.localityName,
        };

        try {
            const response = await fetch(`${BACKEND_URL}/api/gardener`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                setAlert({ type: 'success', message: 'Profil został zaktualizowany pomyślnie!' });
                
                await fetchProfile();
                
                setProfileData(prev => ({
                    ...prev,
                    password: '',
                    confirmPassword: ''
                }));
                
                setMapView(prev => ({ 
                    center: [profileData.latitude, profileData.longitude], 
                    zoom: 13, 
                    viewUpdateKey: Date.now() 
                }));

            } else {
                const error = await response.json();
                setAlert({ type: 'error', message: `Błąd zapisu: ${error.message || response.statusText}` });
            }
        } catch (error) {
            setAlert({ type: 'error', message: 'Błąd sieci: Nie można zapisać zmian.' });
        } finally {
            setIsSaving(false);
        }
    }, [profileData, validate, closeAlert, fetchProfile]);

    const handleReset = useCallback(() => {
        if (originalData) {
            setProfileData(originalData);
            setErrors({});
            closeAlert();
            
            setMapView(prev => ({ 
                center: [originalData.latitude, originalData.longitude], 
                zoom: 13, 
                viewUpdateKey: Date.now() 
            }));

            setAlert({ type: 'warning', message: 'Cofnięto wszystkie niezapisane zmiany.' });
        }
    }, [originalData, closeAlert]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-50 to-lime-100 p-6 font-sans">
                <div className="max-w-4xl mx-auto">
                    <LoadingState />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-50 to-lime-100 p-6 font-sans">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
                        <span className="text-green-600 mr-3">👤</span>
                        Mój Profil
                    </h1>
                    <p className="text-gray-600 text-lg flex items-center">
                        Zarządzaj swoimi danymi osobowymi i ustawieniami konta 🌱
                    </p>
                </header>
                
                {alert.message && (
                    <Alert
                        type={alert.type}
                        message={alert.message}
                        onClose={closeAlert}
                    />
                )}

                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
                    
                    <div className="mb-8 pb-6 border-b border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                            <span className="mr-2">📋</span>
                            Informacje Podstawowe
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="Imię" name="name" required value={profileData.name} onChange={handleChange} error={errors.name} isLoading={isSaving} placeholder="np. Jan"/>
                            <InputField label="Nazwisko" name="surname" required value={profileData.surname} onChange={handleChange} error={errors.surname} isLoading={isSaving} placeholder="np. Kowalski"/>
                        </div>
                    </div>

                    <div className="mb-8 pb-6 border-b border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                            <span className="mr-2">📞</span>
                            Dane Kontaktowe
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="Email (opcjonalnie)" name="email" type="email" value={profileData.email} onChange={handleChange} error={errors.email} isLoading={isSaving} placeholder="email@example.com"/>
                            <InputField label="Numer Telefonu (opcjonalnie)" name="phoneNumber" value={profileData.phoneNumber} onChange={handleChange} error={errors.phoneNumber} isLoading={isSaving} placeholder="+48 123 456 789"/>
                        </div>
                        <div className="mt-6">
                            <InputField label="Pseudonim (obowiązkowo)" name="nickname" required value={profileData.nickname} onChange={handleChange} isLoading={isSaving} placeholder="Twój pseudonim"/>
                        </div>
                    </div>

                    <div className="mb-8 pb-6 border-b border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                            <MapPin className="mr-2 text-red-500 w-6 h-6" />
                            Ustaw Lokalizację Główną
                        </h2>
                        <p className="text-sm text-gray-600 mb-4">
                            Użyj pola wyszukiwania poniżej, aby znaleźć swoją miejscowość. Twoja aktualna lokalizacja: {profileData.localityName}
                        </p>
                        
                        <div className="mb-4 relative z-10"> 
                            <label htmlFor="location-search" className="block text-sm font-medium text-gray-700 mb-2">
                                Wyszukaj Miejscowość
                            </label>
                            {mapInstance && (
                                <LocationSearch
                                    map={mapInstance}
                                    onLocationSelect={handleLocationSelect}
                                />
                            )}
                        </div>
                        
                        <div className="rounded-xl overflow-hidden shadow-md border border-gray-200 relative z-0" style={{ height: '400px' }}>
                            <BasicMap
                                center={mapView.center}
                                zoom={mapView.zoom}
                                onMapLoad={setMapInstance}
                                style={{ height: '400px', width: '100%' }}
                                
                                markerPosition={[profileData.latitude, profileData.longitude]}
                                markerPopupContent={`📍 ${profileData.localityName || 'Nieznana lokalizacja'}`}
                                viewUpdateKey={mapView.viewUpdateKey}
                            />
                        </div>

                        <div className='mt-4'>
                            <InputField
                                label="Wybrana Miejscowość (Automatycznie)"
                                name="localityName"
                                required
                                value={profileData.localityName}
                                onChange={handleChange}
                                error={errors.localityName}
                                isLoading={isSaving}
                                disabled={true} 
                                placeholder="Wyszukaj na mapie..."
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                            Współrzędne: {profileData.latitude.toFixed(4)}, {profileData.longitude.toFixed(4)}
                        </p>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                            <span className="mr-2">🔒</span>
                            Zmiana Hasła
                        </h2>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <p className="text-sm text-blue-800">
                                💡 <strong>Wskazówka:</strong> Pozostaw pola hasła puste, jeśli nie chcesz zmieniać hasła.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="Nowe Hasło" name="password" type="password" isPassword value={profileData.password} onChange={handleChange} error={errors.password} isLoading={isSaving} showPassword={showPassword} setShowPassword={setShowPassword} placeholder="Minimum 6 znaków"/>
                            {(profileData.password || errors.confirmPassword) && (
                                <InputField label="Potwierdź Nowe Hasło" name="confirmPassword" type="password" value={profileData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} isLoading={isSaving} placeholder="Powtórz hasło"/>
                            )}
                        </div>
                    </div>

                    {hasChanges && (
                        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-sm text-amber-800 flex items-center">
                                <span className="mr-2">⚠️</span>
                                Masz niezapisane zmiany. Pamiętaj o zapisaniu profilu!
                            </p>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !hasChanges}
                            className="flex-1 bg-gradient-to-r from-green-600 to-lime-700 hover:from-green-700 hover:to-lime-800 text-white py-4 px-6 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center"
                        >
                            {isSaving ? (
                                <span className="flex items-center">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Zapisywanie...
                                </span>
                            ) : (
                                <span className="flex items-center">
                                    <span className="mr-2">💾</span>
                                    Zapisz Zmiany
                                </span>
                            )}
                        </button>
                        
                        <button
                            onClick={handleReset}
                            disabled={isSaving || !hasChanges}
                            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-4 px-6 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            <span className="mr-2">🔄</span>
                            Resetuj Zmiany
                        </button>
                    </div>

                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-600 flex items-center">
                            <span className="mr-2">🔐</span>
                            Twoje dane są bezpiecznie przechowywane i chronione.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}