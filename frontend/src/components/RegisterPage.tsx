import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, User, Lock, Apple, Leaf, MapPin, Phone, UserCheck, Mail } from 'lucide-react';
import { BACKEND_URL } from "../utils/apiConfigs";
import { Alert } from "../utils/common";
import BasicMap from '../utils/BasicMap';
import LocationSearch from '../utils/LocationSearch';

const TextInput = React.memo(({ id, name, value, onChange, placeholder, icon: Icon, type = "text", disabled, error }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">{placeholder}</label>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon className={`h-5 w-5 ${error ? 'text-red-400' : 'text-gray-400'}`} />
            </div>
            <input
                type={type}
                id={id}
                name={name}
                value={value}
                onChange={onChange}
                className={`w-full pl-10 pr-4 py-3 border ${error ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white`}
                placeholder={placeholder}
                disabled={disabled}
            />
        </div>
        {error && <p className="text-red-500 text-xs mt-1 ml-1">{error}</p>}
    </div>
));

const PasswordInput = React.memo(({ id, name, value, onChange, showPassword, setShowPassword, placeholder, disabled, error }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">{placeholder}</label>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className={`h-5 w-5 ${error ? 'text-red-400' : 'text-gray-400'}`} />
            </div>
            <input
                type={showPassword ? "text" : "password"}
                id={id}
                name={name}
                value={value}
                onChange={onChange}
                className={`w-full pl-10 pr-12 py-3 border ${error ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white`}
                placeholder={placeholder}
                disabled={disabled}
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                disabled={disabled}
            >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
        </div>
        {error && <p className="text-red-500 text-xs mt-1 ml-1">{error}</p>}
    </div>
));


export default function RegisterPage() {
    const navigate = useNavigate();
    const { t } = useTranslation("register");
    const defaultCenter = useMemo(() => [52.2297, 21.0122], []); // Warszawa
    const initialLocalityMessage = t('location.initialMessage');

    const [mapInstance, setMapInstance] = useState(null);
    
    const [mapView, setMapView] = useState({
        center: defaultCenter, 
        zoom: 6, 
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
        const locality = location.address.city || location.address.town || location.address.village || location.name.split(',')[0] || t('location.notSet');
        
        setFormData(prev => ({
            ...prev,
            latitude: location.lat,
            longitude: location.lon,
            localityName: locality,
        }));
        
        setMapView({ 
            center: [location.lat, location.lon], 
            zoom: 13, 
            viewUpdateKey: Date.now()
        });
        
        setErrors(prev => ({ ...prev, localityName: '' }));
    }, [t]);

    const handleMapClick = useCallback((e) => {
        if (!mapInstance) return;

        const { lat, lng } = e.latlng;
        const locality = t('location.markedPoint', { lat: lat.toFixed(4), lng: lng.toFixed(4) });

        setFormData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            localityName: locality,
        }));

        const currentZoom = mapInstance.getZoom();
        const newZoom = currentZoom > 15 ? currentZoom : 15; 
        
        setMapView({ 
            center: [lat, lng], 
            zoom: newZoom, 
            viewUpdateKey: Date.now() 
        });
        
        setErrors(prev => ({ ...prev, localityName: '' }));
        setGeneralError('');
        setSuccess('');
    }, [mapInstance, t]);
    
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

    const validateForm = () => {
        const newErrors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!formData.name?.trim()) newErrors.name = t('validation.nameRequired');
        if (!formData.surname?.trim()) newErrors.surname = t('validation.surnameRequired');
        if (!formData.nickname?.trim()) newErrors.nickname = t('validation.nicknameRequired');

        if (formData.email && !emailRegex.test(formData.email)) {
            newErrors.email = t('validation.emailInvalid');
        }

        if (formData.password.length < 6) newErrors.password = t('validation.passwordTooShort');
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = t('validation.passwordsMismatch');

        if (!formData.localityName || formData.localityName === initialLocalityMessage) {
            newErrors.localityName = t('validation.localityRequired');
        }

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
            setGeneralError(t('validation.fixErrors'));
        }
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsLoading(true);
        setGeneralError('');
        setSuccess('');

        try {
            const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    surname: formData.surname.trim(),
                    nickname: formData.nickname.trim() || null,
                    phoneNumber: formData.phoneNumber.trim() || null,
                    email: formData.email.trim().toLowerCase() || null,
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
                    navigate('/home');
                } else {
                    setSuccess(t('result.success'));
                    setTimeout(() => navigate('/login'), 3000);
                }
            } else {
                setGeneralError(data.message || t('result.genericError'));
            }
        } catch (err) {
            setGeneralError(t('result.connectionError'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50 flex items-center justify-center p-4">
            <div className="absolute top-20 left-20 text-green-200 animate-pulse"><Apple size={32} /></div>
            <div className="absolute top-40 right-32 text-lime-200 animate-bounce"><Leaf size={24} /></div>
            <div className="absolute bottom-32 left-16 text-emerald-200 animate-pulse"><Leaf size={28} /></div>

            <div className="w-full max-w-lg bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden border border-white/50">
                <div className="p-8 lg:p-10">
                    <div className="max-w-md mx-auto">
                        
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl mb-4 shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
                                <Apple className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('heading')}</h1>
                            <p className="text-gray-600 text-sm">{t('subtitle')}</p>
                        </div>

                        <Alert type="error" message={generalError} />
                        <Alert type="success" message={success} />

                        <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <TextInput id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder={t('fields.name')} icon={User} disabled={isLoading} error={errors.name}/>
                                <TextInput id="surname" name="surname" value={formData.surname} onChange={handleInputChange} placeholder={t('fields.surname')} icon={UserCheck} disabled={isLoading} error={errors.surname}/>
                            </div>

                            <TextInput id="nickname" name="nickname" value={formData.nickname} onChange={handleInputChange} placeholder={t('fields.nickname')} icon={User} disabled={isLoading} error={errors.nickname}/>
                            <TextInput id="phoneNumber" name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleInputChange} placeholder={t('fields.phoneNumber')} icon={Phone} disabled={isLoading}/>
                            <TextInput id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder={t('fields.email')} icon={Mail} disabled={isLoading} error={errors.email}/>

                            <div className="pt-2">
                                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                    <MapPin className="w-4 h-4 mr-2 text-green-600" /> {t('location.heading')}
                                </h3>
                                
                                {mapInstance && (
                                    <div className="mb-3 relative z-10"> 
                                        <LocationSearch map={mapInstance} onLocationSelect={handleLocationSelect}/>
                                    </div>
                                )}
                                
                                <div className={`rounded-xl overflow-hidden shadow-sm border ${errors.localityName ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'} relative z-0`} style={{ height: '250px' }}>
                                    <BasicMap
                                        center={mapView.center}
                                        zoom={mapView.zoom}
                                        onMapLoad={setMapInstance}
                                        onMapClick={handleMapClick}
                                        style={{ height: '100%', width: '100%' }}
                                        markerPosition={
                                            formData.localityName === initialLocalityMessage 
                                            ? null 
                                            : [formData.latitude, formData.longitude]
                                        }
                                        markerPopupContent={`📍 ${formData.localityName || t('location.selectedPoint')}`}
                                        viewUpdateKey={mapView.viewUpdateKey} 
                                    />
                                </div>
                                {errors.localityName && <p className="text-red-500 text-xs mt-1">{errors.localityName}</p>}

                                <div className="mt-2">
                                    <TextInput
                                        id="localityName" name="localityName" value={formData.localityName}
                                        placeholder={t('fields.selectedLocality')} icon={MapPin}
                                        disabled={true} 
                                    />
                                </div>
                            </div>
                            
                            <PasswordInput
                                id="password" name="password" value={formData.password} onChange={handleInputChange}
                                showPassword={showPassword} setShowPassword={setShowPassword}
                                placeholder={t('fields.password')} disabled={isLoading} error={errors.password}
                            />

                            <PasswordInput
                                id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange}
                                showPassword={showConfirmPassword} setShowPassword={setShowConfirmPassword}
                                placeholder={t('fields.confirmPassword')} disabled={isLoading} error={errors.confirmPassword}
                            />

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:ring-4 focus:ring-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        {t('submit.processing')}
                                    </div>
                                ) : (
                                    t('submit.createAccount')
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600">
                                {t('alreadyHaveAccount')}{' '}
                                <a href="/login" className="text-green-600 hover:text-green-500 font-medium transition-colors" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
                                    {t('loginLink')}
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}