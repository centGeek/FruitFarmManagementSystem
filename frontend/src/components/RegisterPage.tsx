import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Eye, EyeOff, User, Lock, Apple, Leaf, MapPin, Phone, UserCheck } from 'lucide-react';
import { BACKEND_URL} from "../utils/apiConfigs";
import { Alert} from "../utils/common";
import BasicMap from '../utils/BasicMap';
import LocationSearch from '../utils/LocationSearch';
import L from 'leaflet';
import { authFetch } from '../utils/authFetch';


const TextInput = React.memo(({ id, name, value, onChange, placeholder, icon: Icon, type = "text", disabled, error }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">{placeholder}</label>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon className="h-5 w-5 text-gray-400" />
            </div>
            <input
                type={type}
                id={id}
                name={name}
                value={value}
                onChange={onChange}
                className={`w-full pl-10 pr-4 py-3 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white`}
                placeholder={placeholder}
                disabled={disabled}
            />
        </div>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
));

const PasswordInput = React.memo(({ id, name, value, onChange, showPassword, setShowPassword, placeholder, disabled, error }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">{placeholder}</label>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
                type={showPassword ? "text" : "password"}
                id={id}
                name={name}
                value={value}
                onChange={onChange}
                className={`w-full pl-10 pr-12 py-3 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white`}
                placeholder={placeholder}
                disabled={disabled}
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                disabled={disabled}
            >
                {showPassword ? <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" /> : <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />}
            </button>
        </div>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
));

const handleRegistrationSuccess = (token, email) => {
    sessionStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify({
        email: email,
        loginTime: new Date().toISOString(),
        loginMethod: 'registration'
    }));
    window.location.href = '/home';
};

// --- GŁÓWNY KOMPONENT REGISTERPAGE ---

export default function RegisterPage() {
    const defaultCenter = useMemo(() => [52.2297, 21.0122], []); // Warszawa (Centralna Polska)
    const initialLocalityMessage = 'Kliknij na mapę lub wyszukaj lokalizację';

    const [mapInstance, setMapInstance] = useState(null);
    
    // Stan do dynamicznej kontroli widoku i centrowania mapy
    const [mapView, setMapView] = useState({
        center: defaultCenter, 
        zoom: 6, // Startowy widok na Polskę
        viewUpdateKey: Date.now()
    });
    
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        nickname: '',
        phoneNumber: '',
        email: '',
        password: '',
        confirmPassword: '',
        latitude: defaultCenter[0],
        longitude: defaultCenter[1],
        localityName: initialLocalityMessage, 
    });
    
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState('');
    const [success, setSuccess] = useState('');

    const handleLocationSelect = useCallback((location) => {
        const locality = location.address.city || location.address.town || location.address.village || location.name.split(',')[0] || 'Nieustawiona';
        
        setFormData(prev => ({
            ...prev,
            latitude: location.lat,
            longitude: location.lon,
            localityName: locality,
        }));
        
        // Aktualizacja stanu mapy w celu wyśrodkowania i zaktualizowania markera w BasicMap
        setMapView(prev => ({ 
            center: [location.lat, location.lon], 
            zoom: 13, // Zwiększ zoom dla konkretnej miejscowości
            viewUpdateKey: Date.now() // Wymuś odświeżenie
        }));
        
        setErrors(prev => ({ ...prev, localityName: '' }));
    }, []);


    /**
     * Funkcja obsługująca KLIKNIĘCIE na mapę w celu ręcznego ustawienia pineski.
     */
    const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
        if (!mapInstance) return;

        const { lat, lng } = e.latlng;
        const locality = `Zaznaczony punkt (${lat.toFixed(4)}, ${lng.toFixed(4)})`; 

        setFormData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            localityName: locality,
        }));

        // Zwiększamy zoom, jeśli jest zbyt mały
        const currentZoom = mapInstance.getZoom();
        const newZoom = currentZoom > 15 ? currentZoom : 15; 
        
        // Aktualizacja stanu mapy w celu wyśrodkowania i zaktualizowania markera w BasicMap
        setMapView(prev => ({ 
            center: [lat, lng], 
            zoom: newZoom, 
            viewUpdateKey: Date.now() 
        }));
        
        setErrors(prev => ({ ...prev, localityName: '' }));
        setGeneralError(''); 
        setSuccess('');

    }, [mapInstance]);
    
    // --- END MAP LOGIC ---

    // Form Input Handler
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        setGeneralError('');
        setSuccess('');
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Form Validation
    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) newErrors.name = 'Imię jest wymagane';
        if (!formData.surname.trim()) newErrors.surname = 'Nazwisko jest wymagane';
        if (formData.password.length < 6) newErrors.password = 'Hasło min. 6 znaków';
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Hasła nie są identyczne';

        // Walidacja lokalizacji
        if (formData.localityName === initialLocalityMessage) {
            newErrors.localityName = 'Musisz wybrać lub kliknąć swoją miejscowość na mapie.';
        }

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
            setGeneralError('Wypełnij poprawnie wszystkie wymagane pola.');
        }
        return Object.keys(newErrors).length === 0;
    };

    // Email Registration Handler
    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsLoading(true);
        setGeneralError('');
        setSuccess('');

        try {
            const res = await authFetch(`${BACKEND_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    name: formData.name.trim(),
                    surname: formData.surname.trim(),
                    nickname: formData.nickname.trim() || null,
                    phoneNumber: formData.phoneNumber.trim() || null,
                    email: formData.email.trim().toLowerCase(),
                    password: formData.password,
                    coordinateDTO: {
                        latitude: formData.latitude,
                        longitude: formData.longitude,
                    },
                    localityName: formData.localityName,
                    isActive: true
                }),
            });

            const data = await res.json();

            if (res.ok) {
                if (data.token) {
                    handleRegistrationSuccess(data.token, formData.email.trim().toLowerCase());
                } else {
                    setSuccess('Rejestracja zakończona pomyślnie! Sprawdź email w celu aktywacji konta.');
                    setFormData(prev => ({
                        ...prev,
                        name: '', surname: '', nickname: '', phoneNumber: '', email: '', password: '', confirmPassword: ''
                    }));
                }
            } else {
                setGeneralError(data.message || 'Błąd rejestracji');
            }
        } catch (err) {
            setGeneralError('Nie można połączyć się z serwerem');
        } finally {
            setIsLoading(false);
        }
    };

    // --- RENDER ---

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50 flex items-center justify-center p-4">
            {/* Decorative Elements */}
            <div className="absolute top-20 left-20 text-green-200 animate-pulse"><Apple size={32} /></div>
            <div className="absolute top-40 right-32 text-lime-200 animate-bounce"><Leaf size={24} /></div>
            <div className="absolute bottom-32 left-16 text-emerald-200 animate-pulse"><Leaf size={28} /></div>

            {/* Kontener formularza: maksymalna szerokość i centrowanie */}
            <div className="w-full max-w-lg bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden">
                <div className="p-8 lg:p-12">
                    <div className="max-w-md mx-auto">
                        
                        {/* Nagłówek */}
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl mb-4 shadow-lg">
                                <Apple className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">Dołącz do OrchardManager</h1>
                            <p className="text-gray-600">Utwórz konto i zacznij zarządzać swoim sadem</p>
                        </div>

                        {/* Alerty */}
                        <Alert type="error" message={generalError} />
                        <Alert type="success" message={success} />

                        {/* Formularz Rejestracyjny */}
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <TextInput id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Imię *" icon={User} disabled={isLoading} error={errors.name}/>
                                <TextInput id="surname" name="surname" value={formData.surname} onChange={handleInputChange} placeholder="Nazwisko *" icon={UserCheck} disabled={isLoading} error={errors.surname}/>
                            </div>

                            <TextInput id="nickname" name="nickname" value={formData.nickname} onChange={handleInputChange} placeholder="Nazwa użytkownika *" icon={User} disabled={isLoading}/>
                            <TextInput id="phoneNumber" name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleInputChange} placeholder="Numer telefonu (opcjonalny)" icon={Phone} disabled={isLoading}/>
                            <TextInput id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="Adres email (opcjonalny)" icon={User} disabled={isLoading} error={errors.email}/>

                            <div className="pt-2">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                    <MapPin className="w-5 h-5 mr-2 text-green-600" /> Ustaw swoją lokalizację *
                                </h3>
                                <p className="text-xs text-gray-500 mb-3">
                                    **Kliknij na mapę**, aby precyzyjnie ustawić pinezkę (np. na swój dom) lub użyj wyszukiwarki.
                                </p>
                                
                                {mapInstance && (
                                    <div className="mb-4 relative z-10"> 
                                        <label htmlFor="location-search" className="block text-sm font-medium text-gray-700 mb-2">
                                            Wyszukaj Miejscowość
                                        </label>
                                        <LocationSearch map={mapInstance} onLocationSelect={handleLocationSelect}/>
                                    </div>
                                )}
                                
                                {/* Mapa: Użycie BasicMap z przekazaniem state do kontroli widoku i markera */}
                                <div className="rounded-xl overflow-hidden shadow-md border border-gray-200 relative z-0" style={{ height: '250px' }}>
                                    <BasicMap
                                        center={mapView.center} // Kontrolowane z mapView state
                                        zoom={mapView.zoom} // Kontrolowane z mapView state
                                        onMapLoad={setMapInstance}
                                        onMapClick={handleMapClick} // Przekazanie obsługi kliknięcia do BasicMap
                                        style={{ height: '250px', width: '100%' }}
                                        
                                        // Dynamiczne ustawianie markera na podstawie danych formularza i stanu
                                        markerPosition={
                                            formData.localityName === initialLocalityMessage 
                                            ? null 
                                            : [formData.latitude, formData.longitude]
                                        }
                                        markerPopupContent={`📍 **${formData.localityName || 'Wybrany punkt'}**`}
                                        viewUpdateKey={mapView.viewUpdateKey} // Wymuszenie centrowania/odświeżenia markera
                                    />
                                </div>

                                <TextInput
                                    id="localityName" name="localityName" value={formData.localityName}
                                    placeholder="Wybrana Miejscowość (Z mapy/wyszukiwarki)" icon={MapPin}
                                    disabled={true} error={errors.localityName}
                                />
                            </div>
                            {/* --- MAP SECTION END --- */}
                            
                            <PasswordInput
                                id="password" name="password" value={formData.password} onChange={handleInputChange}
                                showPassword={showPassword} setShowPassword={setShowPassword}
                                placeholder="Hasło *" disabled={isLoading} error={errors.password}
                            />

                            <PasswordInput
                                id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange}
                                showPassword={showConfirmPassword} setShowPassword={setShowConfirmPassword}
                                placeholder="Potwierdź hasło *" disabled={isLoading} error={errors.confirmPassword}
                            />

                            <button
                                type="button" onClick={handleSubmit} disabled={isLoading}
                                className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:ring-4 focus:ring-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Rejestrowanie...
                                    </div>
                                ) : (
                                    'Utwórz konto'
                                )}
                            </button>
                        </div>

                        {/* Login Link */}
                        <div className="mt-8 text-center">
                            <p className="text-sm text-gray-600">
                                Masz już konto?{' '}
                                <a href="/login" className="text-green-600 hover:text-green-500 font-medium">
                                    Zaloguj się
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}