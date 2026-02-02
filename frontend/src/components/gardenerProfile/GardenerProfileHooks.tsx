import { useState, useEffect, useCallback, useMemo } from 'react';
import { BACKEND_URL, getAuthHeaders } from "../../utils/apiConfigs";
import { authFetch } from '../../utils/authFetch';

export interface ProfileData {
    name: string;
    surname: string;
    nickname: string;
    phoneNumber: string;
    email: string;
    password: '';
    confirmPassword: '';
    latitude: number;
    longitude: number;
    localityName: string;
}

export const useGardenerProfile = () => {
    // Domyślna lokalizacja (Warszawa)
    const defaultCenter = useMemo<[number, number]>(() => [52.2297, 21.0122], []);
    
    // Stan mapy
    const [mapInstance, setMapInstance] = useState<any>(null);
    const [mapView, setMapView] = useState({
        center: defaultCenter, 
        zoom: 6,
        viewUpdateKey: Date.now()
    });

    // Stan formularza
    const [profileData, setProfileData] = useState<ProfileData>({
        name: '', surname: '', nickname: '', phoneNumber: '', email: '',
        password: '', confirmPassword: '',
        latitude: defaultCenter[0], longitude: defaultCenter[1], localityName: 'Warszawa', 
    });
    const [originalData, setOriginalData] = useState<ProfileData | null>(null);
    
    // Stan UI
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<any>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [alert, setAlert] = useState({ type: '', message: '' });
    const [hasChanges, setHasChanges] = useState(false);

    const closeAlert = useCallback(() => setAlert({ type: '', message: '' }), []);

    // 1. Pobieranie danych profilu
    const fetchProfile = useCallback(async () => {
        setIsLoading(true);
        closeAlert();
        try {
            const response = await authFetch(`${BACKEND_URL}/api/gardener`, { method: 'GET', headers: getAuthHeaders() });
            if (response.ok) {
                const data = await response.json();
                const initialLat = data.coordinateDTO?.latitude ?? defaultCenter[0];
                const initialLon = data.coordinateDTO?.longitude ?? defaultCenter[1];
                const initialLocality = data.localityName || 'Warszawa';
                
                const profileInfo: ProfileData = {
                    name: data.name || '', surname: data.surname || '', nickname: data.nickname || '',
                    phoneNumber: data.phoneNumber || '', email: data.email || '',
                    password: '', confirmPassword: '',
                    latitude: initialLat, longitude: initialLon, localityName: initialLocality,
                };
                
                setProfileData(profileInfo);
                setOriginalData(profileInfo);
                
                const initialZoom = initialLocality === 'Warszawa' ? 6 : 13;
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

    useEffect(() => { fetchProfile(); }, [fetchProfile]);

    // 2. Wykrywanie zmian
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

    // 3. Obsługa formularza
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev: any) => ({ ...prev, [name]: '' }));
    }, [errors]);
    
    // 4. Obsługa mapy
    const handleLocationSelect = useCallback((location: any) => {
        const locality = location.address.city || location.address.town || location.address.village || location.name.split(',')[0] || 'Nieustawiona';
        setProfileData(prev => ({ ...prev, latitude: location.lat, longitude: location.lon, localityName: locality }));
        setMapView({ center: [location.lat, location.lon], zoom: 13, viewUpdateKey: Date.now() });
        setAlert({ type: 'success', message: `Ustawiono nową lokalizację: ${locality}` });
        setErrors((prev: any) => ({ ...prev, localityName: '' }));
    }, []);

    // 5. Walidacja
    const validate = useCallback(() => {
        const newErrors: any = {};
        if (!profileData.name.trim()) newErrors.name = 'Imię jest wymagane';
        else if (profileData.name.length < 2 || profileData.name.length > 50) newErrors.name = 'Imię musi mieć między 2 a 50 znaków';
        
        if (!profileData.surname.trim()) newErrors.surname = 'Nazwisko jest wymagane';
        else if (profileData.surname.length < 2 || profileData.surname.length > 50) newErrors.surname = 'Nazwisko musi mieć między 2 a 50 znaków';
        
        if (!profileData.nickname.trim()) newErrors.nickname = 'Nazwa użytkownika jest wymagana';
        if(profileData.email && !/\S+@\S+\.\S+/.test(profileData.email)) newErrors.email = 'Nieprawidłowy format email';
        
        if (!profileData.localityName || profileData.localityName === 'Nieustawiona' || (profileData.latitude === defaultCenter[0] && profileData.longitude === defaultCenter[1] && originalData)) {
             newErrors.localityName = 'Wybierz miejscowość, ustawiając ją na mapie/wyszukując.';
        }
        
        if (profileData.password.length > 0) {
            if (profileData.password.length < 6) newErrors.password = 'Hasło musi mieć co najmniej 6 znaków';
            if (profileData.password !== profileData.confirmPassword) newErrors.confirmPassword = 'Hasła nie są zgodne';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [profileData, defaultCenter, originalData]);

    // 6. Zapisywanie
    const handleSave = useCallback(async () => {
        if (!validate()) { setAlert({ type: 'error', message: 'Wystąpiły błędy walidacji.' }); return; }
        setIsSaving(true);
        closeAlert();
        
        const payload = {
            name: profileData.name, surname: profileData.surname, nickname: profileData.nickname || null,
            phoneNumber: profileData.phoneNumber, email: profileData.email,
            ...(profileData.password && { password: profileData.password, confirmPassword: profileData.confirmPassword }),
            coordinateDTO: { latitude: profileData.latitude, longitude: profileData.longitude },
            localityName: profileData.localityName,
        };

        try {
            const response = await authFetch(`${BACKEND_URL}/api/gardener`, {
                method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(payload),
            });

            if (response.ok) {
                setAlert({ type: 'success', message: 'Profil został zaktualizowany pomyślnie!' });
                await fetchProfile();
                setProfileData(prev => ({ ...prev, password: '' as any, confirmPassword: '' as any }));
                setMapView(prev => ({ ...prev, center: [profileData.latitude, profileData.longitude], zoom: 13, viewUpdateKey: Date.now() }));
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

    // 7. Resetowanie
    const handleReset = useCallback(() => {
        if (originalData) {
            setProfileData(originalData);
            setErrors({});
            closeAlert();
            setMapView({ center: [originalData.latitude, originalData.longitude], zoom: 13, viewUpdateKey: Date.now() });
            setAlert({ type: 'warning', message: 'Cofnięto wszystkie niezapisane zmiany.' });
        }
    }, [originalData, closeAlert]);

    return {
        profileData, errors, isLoading, isSaving, alert, hasChanges, showPassword, setShowPassword,
        mapView, mapInstance, setMapInstance, handleChange, handleLocationSelect, handleSave, handleReset, closeAlert
    };
};