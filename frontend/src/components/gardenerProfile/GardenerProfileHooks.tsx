import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from "react-i18next";
import { BACKEND_URL, getAuthHeaders } from "../../utils/apiConfigs";
import { authFetch } from '../../utils/authFetch';

export interface ProfileData {
    name: string;
    surname: string;
    nickname: string;
    phoneNumber: string;
    email: string;
    password: string;  
    confirmPassword: string;
    latitude: number;
    longitude: number;
    localityName: string;
}

export const useGardenerProfile = () => {
    const { t } = useTranslation("gardenerProfile");
    // Domyślna lokalizacja (Warszawa)
    const defaultCenter = useMemo<[number, number]>(() => [52.2297, 21.0122], []);
    
    const [mapInstance, setMapInstance] = useState<any>(null);
    const [mapView, setMapView] = useState({
        center: defaultCenter, 
        zoom: 6,
        viewUpdateKey: Date.now()
    });

    const [profileData, setProfileData] = useState<ProfileData>({
        name: '', surname: '', nickname: '', phoneNumber: '', email: '',
        password: '', confirmPassword: '',
        latitude: defaultCenter[0], longitude: defaultCenter[1], localityName: 'Warszawa', 
    });
    const [originalData, setOriginalData] = useState<ProfileData | null>(null);
    
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<any>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [alert, setAlert] = useState({ type: '', message: '' });
    const [hasChanges, setHasChanges] = useState(false);

    const closeAlert = useCallback(() => setAlert({ type: '', message: '' }), []);

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
                setAlert({ type: 'error', message: t("alerts.loadError", { error: error.message || response.statusText }) });
            }
        } catch (error) {
            setAlert({ type: 'error', message: t("alerts.networkLoadError") });
        } finally {
            setIsLoading(false);
        }
    }, [closeAlert, defaultCenter, t]);

    useEffect(() => { fetchProfile(); }, [fetchProfile]);

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

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev: any) => ({ ...prev, [name]: '' }));
    }, [errors]);
    
    const handleLocationSelect = useCallback((location: any) => {
        const locality = location.address.city || location.address.town || location.address.village || location.name.split(',')[0] || '';
        setProfileData(prev => ({ ...prev, latitude: location.lat, longitude: location.lon, localityName: locality }));
        setMapView({ center: [location.lat, location.lon], zoom: 13, viewUpdateKey: Date.now() });
        setAlert({ type: 'success', message: t("alerts.locationSet", { locality }) });
        setErrors((prev: any) => ({ ...prev, localityName: '' }));
    }, [t]);

    const validate = useCallback(() => {
        const newErrors: any = {};
        if (!profileData.name.trim()) newErrors.name = t("validation.nameRequired");
        else if (profileData.name.length < 2 || profileData.name.length > 50) newErrors.name = t("validation.nameLength");

        if (!profileData.surname.trim()) newErrors.surname = t("validation.surnameRequired");
        else if (profileData.surname.length < 2 || profileData.surname.length > 50) newErrors.surname = t("validation.surnameLength");

        if (!profileData.nickname.trim()) newErrors.nickname = t("validation.nicknameRequired");
        if(profileData.email && !/\S+@\S+\.\S+/.test(profileData.email)) newErrors.email = t("validation.emailInvalid");

        if (!profileData.localityName || profileData.localityName === 'Nieustawiona' || (profileData.latitude === defaultCenter[0] && profileData.longitude === defaultCenter[1] && originalData)) {
             newErrors.localityName = t("validation.localityRequired");
        }

        if (profileData.password.length > 0) {
            if (profileData.password.length < 6) newErrors.password = t("validation.passwordLength");
            if (profileData.password !== profileData.confirmPassword) newErrors.confirmPassword = t("validation.passwordMismatch");
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [profileData, defaultCenter, originalData, t]);

    const handleSave = useCallback(async () => {
        if (!validate()) { setAlert({ type: 'error', message: t("alerts.validationErrors") }); return; }
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
                setAlert({ type: 'success', message: t("alerts.updateSuccess") });
                await fetchProfile();
                setProfileData(prev => ({ ...prev, password: '', confirmPassword: '' }));
                setMapView(prev => ({ ...prev, center: [profileData.latitude, profileData.longitude], zoom: 13, viewUpdateKey: Date.now() }));
            } else {
                const error = await response.json();
                setAlert({ type: 'error', message: t("alerts.saveError", { error: error.message || response.statusText }) });
            }
        } catch (error) {
            setAlert({ type: 'error', message: t("alerts.networkSaveError") });
        } finally {
            setIsSaving(false);
        }
    }, [profileData, validate, closeAlert, fetchProfile, t]);

    const handleReset = useCallback(() => {
        if (originalData) {
            setProfileData(originalData);
            setErrors({});
            closeAlert();
            setMapView({ center: [originalData.latitude, originalData.longitude], zoom: 13, viewUpdateKey: Date.now() });
            setAlert({ type: 'warning', message: t("alerts.changesReverted") });
        }
    }, [originalData, closeAlert, t]);

    return {
        profileData, errors, isLoading, isSaving, alert, hasChanges, showPassword, setShowPassword,
        mapView, mapInstance, setMapInstance, handleChange, handleLocationSelect, handleSave, handleReset, closeAlert
    };
};