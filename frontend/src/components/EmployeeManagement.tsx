import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BACKEND_URL, getAuthHeaders } from "../utils/apiConfigs";


const Alert = ({ type, message, onClose }) => {
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
};

const Modal = ({ isOpen, onClose, title, children, headerColor = 'bg-green-50' }) => {
    if (!isOpen) return null;

    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300"
            aria-modal="true"
            role="dialog"
        >
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-transform duration-300 scale-100">
                <div className={`sticky top-0 ${headerColor} border-b border-gray-200 px-6 py-4 rounded-t-2xl z-10`}>
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center">
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white hover:bg-opacity-50 rounded-xl transition-colors text-lg"
                            aria-label="Zamknij"
                        >
                            ❌
                        </button>
                    </div>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

const WorkDetailsModal = ({ isOpen, onClose, employee, onSave }) => {
    const [workDetails, setWorkDetails] = useState(null);
    const [isPaidHourly, setIsPaidHourly] = useState(true);
    const [hourlyPay, setHourlyPay] = useState('');
    const [payPerKilogram, setPayPerKilogram] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const formatPay = (pay) => {
        if (pay === null || pay === undefined || pay === '') return '';
        return Number(pay).toFixed(2);
    };

    const currentRateText = useMemo(() => {
        if (!workDetails) return null;

        const isHourly = workDetails.isPaidHourly === true;
        const rate = isHourly ? workDetails.hourlyPay : workDetails.payPerKilogram;
        const rateUnit = isHourly ? 'PLN/godz' : 'PLN/kg';
        const rateType = isHourly ? 'Godzinowy' : 'Za Kilogram';

        if (rate === null || rate === undefined) return null;

        const formattedRate = Number(rate).toFixed(2); 

        return {
            rateType,
            rateText: `${formattedRate} ${rateUnit}`,
            isCurrentHourly: isHourly
        };
    }, [workDetails]);

    useEffect(() => {
        if (isOpen && employee) {
            fetchLatestWorkDetails();
        } else if (!isOpen) {
            setWorkDetails(null);
            setIsPaidHourly(true);
            setHourlyPay('');
            setPayPerKilogram('');
            setError('');
        }
    }, [isOpen, employee]);

    const fetchLatestWorkDetails = async () => {
        setIsLoading(true);
        setError('');
        
        setWorkDetails(null);
        setIsPaidHourly(true);
        setHourlyPay('');
        setPayPerKilogram('');
        
        try {
            const response = await fetch(`${BACKEND_URL}/api/work-details/user/${employee.id}/latest`, {
                headers: getAuthHeaders()
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`Załadowano detale zatrudnienia dla użytkownika ${employee.name} ${employee.surname}:`, data);
                setWorkDetails(data);
                
                const isPaidHourlyFromBackend = data.isPaidHourly === true;
                setIsPaidHourly(isPaidHourlyFromBackend);
                
                if (isPaidHourlyFromBackend) {
                    setHourlyPay(formatPay(data.hourlyPay)); 
                    setPayPerKilogram('');
                } else {
                    setPayPerKilogram(formatPay(data.payPerKilogram)); 
                    setHourlyPay('');
                }
            } else if (response.status === 204) {
                console.log(`Brak zapisanych detali pracy dla użytkownika ${employee.name} ${employee.surname}`);
            } else {
                console.error('Błąd pobierania detali:', response.status);
            }
        } catch (err) {
            console.error('Błąd pobierania detali pracy:', err);
            setError('Nie udało się pobrać detali pracy');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
    setError('');
    
    console.log('🔍 DEBUG - Stan przed walidacją:');
    console.log('isPaidHourly:', isPaidHourly, 'typ:', typeof isPaidHourly);
    console.log('hourlyPay:', hourlyPay);
    console.log('payPerKilogram:', payPerKilogram);
    
    if (isPaidHourly && (!hourlyPay || parseFloat(hourlyPay) <= 0)) {
        setError('Wprowadź prawidłową stawkę godzinową');
        return;
    }
    if (!isPaidHourly && (!payPerKilogram || parseFloat(payPerKilogram) <= 0)) {
        setError('Wprowadź prawidłową stawkę za kilogram');
        return;
    }

    const payload = {
        userDTO: {
            id: employee.id,
            name: employee.name,
            surname: employee.surname,
            email: employee.email,
            nickname: employee.nickname || null,
            phoneNumber: employee.phoneNumber || null,
            creationDate: employee.creationDate || null,
            active: employee.active
        },
        isPaidHourly: isPaidHourly,
        hourlyPay: isPaidHourly ? parseFloat(hourlyPay) : null,
        payPerKilogram: !isPaidHourly ? parseFloat(payPerKilogram) : null
    };

    console.log('📦 Payload do wysłania:', JSON.stringify(payload, null, 2));

    setIsLoading(true);
    try {
        const response = await fetch(`${BACKEND_URL}/api/work-details`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            onSave();
            onClose();
        } else {
            setError('Błąd zapisywania detali pracy');
        }
    } catch (err) {
        setError('Błąd połączenia z serwerem');
    } finally {
        setIsLoading(false);
    }
};

    if (!isOpen) return null;

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={<span><span className="mr-2 text-purple-600">💼</span>Detale Zatrudnienia - {employee?.name} {employee?.surname}</span>}
            headerColor="bg-purple-50"
        >
            <div className="space-y-6">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                    <p className="text-sm font-medium text-blue-900">
                        👤 {employee?.name} {employee?.surname}
                        {employee?.nickname && <span className="italic text-blue-700"> "{employee.nickname}"</span>}
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                        📧 {employee?.email}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                        ⚠️ {error}
                    </div>
                )}

                {isLoading && !error ? (
                    <div className="text-center py-8">
                        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
                        <p className="text-gray-500 mt-4">Ładowanie...</p>
                    </div>
                 ) : (
                    <>
                        {currentRateText && (
                            <div className={`p-4 rounded-xl border-l-4 ${currentRateText.isCurrentHourly ? 'bg-blue-100 border-blue-500' : 'bg-green-100 border-green-500'} transition-all`}>
                                <p className="text-sm text-gray-800 flex items-center">
                                    <span className="mr-2 text-xl">
                                        {currentRateText.isCurrentHourly ? '⏰' : '⚖️'}
                                    </span> 
                                    Obecna stawka pracownika: 
                                    <span className="ml-2 font-bold text-base">
                                        {currentRateText.rateText}
                                    </span>
                                </p>
                            </div>
                        )}
                        
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Typ Rozliczenia
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsPaidHourly(true);
                                        setPayPerKilogram('');
                                    }}
                                    disabled={isLoading}
                                    className={`py-4 px-4 rounded-xl font-medium transition-all ${
                                        isPaidHourly
                                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    <div className="text-3xl mb-2">⏰</div>
                                    <div className="text-sm font-bold">Płatność Godzinowa</div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsPaidHourly(false);
                                        setHourlyPay('');
                                    }}
                                    disabled={isLoading}
                                    className={`py-4 px-4 rounded-xl font-medium transition-all ${
                                        !isPaidHourly
                                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg scale-105'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    <div className="text-3xl mb-2">⚖️</div>
                                    <div className="text-sm font-bold">Płatność Za Kilogram</div>
                                </button>
                            </div>
                        </div>

                        {isPaidHourly ? (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Stawka Godzinowa (PLN) *
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xl">
                                        💰
                                    </span>
                                    <input
                                        type="number"
                                        value={hourlyPay}
                                        onChange={(e) => setHourlyPay(e.target.value)}
                                        placeholder="np. 25.50"
                                        step="0.01"
                                        min="0"
                                        disabled={isLoading}
                                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Kwota wypłacana za każdą przepracowaną godzinę
                                </p>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Stawka za Kilogram (PLN) *
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xl">
                                        🍎
                                    </span>
                                    <input
                                        type="number"
                                        value={payPerKilogram}
                                        onChange={(e) => setPayPerKilogram(e.target.value)}
                                        placeholder="np. 0.80"
                                        step="0.01"
                                        min="0"
                                        disabled={isLoading}
                                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Kwota wypłacana za każdy zebrany kilogram owoców
                                </p>
                            </div>
                        )}

                        {workDetails && (
                            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                                <p>📅 Ostatnia aktualizacja: {new Date(workDetails.createdAt).toLocaleDateString('pl-PL')}</p>
                            </div>
                        )}

                        <div className="flex gap-3 pt-4 border-t">
                            <button
                                onClick={handleSave}
                                disabled={isLoading}
                                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 px-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Zapisywanie...
                                    </span>
                                ) : (
                                    <span>💾 Zapisz Nowe Detale</span>
                                )}
                            </button>
                            <button
                                onClick={onClose}
                                disabled={isLoading}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-xl font-semibold transition-colors"
                            >
                                Anuluj
                            </button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};

const InputField = React.memo(({ label, name, type = 'text', required = false, isPassword = false, error, isLoading, showPassword, setShowPassword, handleChange, value, ...props }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">
            {label} {required && '*'}
        </label>
        <div className="relative">
            <input
                id={name}
                type={isPassword && showPassword ? "text" : type}
                name={name}
                onChange={handleChange}
                className={`w-full px-3 py-2 ${error ? 'border-red-500' : 'border-gray-300'} border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors`}
                disabled={isLoading}
                value={value}
                {...props}
            />
            {isPassword && (
                <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                    aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
                >
                    {showPassword ? "🙈" : "👁️"}
                </button>
            )}
        </div>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
));

const EmployeeForm = ({ employee, onSave, onCancel, isLoading }) => {
    const isUpdating = !!employee;
    const initialState = useMemo(() => ({
        name: employee?.name || '',
        surname: employee?.surname || '',
        nickname: employee?.nickname || '',
        phoneNumber: employee?.phoneNumber || '',
        email: employee?.email || '',
        date: employee?.creationDate || '', 
        password: '',
        confirmPassword: '',
        active: employee?.active ?? true
    }), [employee]);

    const [formData, setFormData] = useState(initialState);
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        setFormData(initialState);
        setErrors({});
    }, [initialState]);

    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    }, [errors]);

    const validate = useCallback(() => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Imię jest wymagane';
        if (!formData.surname.trim()) newErrors.surname = 'Nazwisko jest wymagane';
        
        if (!formData.email.trim()) newErrors.email = 'Email jest wymagany';
        else if (!/\S+@\S+\.\S/.test(formData.email)) newErrors.email = 'Nieprawidłowy format email';
        
        if (!isUpdating || formData.password) {
            if (!isUpdating && !formData.password.trim()) {
                newErrors.password = 'Hasło jest wymagane dla nowego pracownika';
            } else if (formData.password.length > 0 && formData.password.length < 6) {
                newErrors.password = 'Hasło musi mieć co najmniej 6 znaków';
            }
        }
        
        if (!isUpdating || formData.password) {
            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Hasła nie są zgodne';
            }
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData, isUpdating]);

    const handleSubmit = useCallback(() => {
        if (validate()) {
            const submitData = { ...formData };
            
            if (isUpdating && !submitData.password) {
                delete submitData.password;
                delete submitData.confirmPassword;
            } else if (!isUpdating) {
                submitData.confirmPassword = submitData.confirmPassword || submitData.password;
            }
            
            onSave(submitData);
        }
    }, [validate, formData, onSave, isUpdating]);
    
    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField 
                    label="Imię" name="name" required value={formData.name} error={errors.name}
                    handleChange={handleChange} isLoading={isLoading}
                />
                <InputField 
                    label="Nazwisko" name="surname" required value={formData.surname} error={errors.surname}
                    handleChange={handleChange} isLoading={isLoading}
                />
            </div>

            <InputField 
                label="Pseudonim" name="nickname" value={formData.nickname}
                handleChange={handleChange} isLoading={isLoading}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField 
                    label="Telefon" name="phoneNumber" type="tel" value={formData.phoneNumber}
                    handleChange={handleChange} isLoading={isLoading}
                />
                <InputField 
                    label="Email" name="email" type="email" required value={formData.email} error={errors.email}
                    handleChange={handleChange} isLoading={isLoading}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                    label={isUpdating ? 'Nowe hasło (pozostaw puste aby nie zmieniać)' : 'Hasło'}
                    name="password"
                    type="password"
                    isPassword
                    required={!isUpdating}
                    value={formData.password}
                    error={errors.password}
                    handleChange={handleChange} isLoading={isLoading}
                    showPassword={showPassword} setShowPassword={setShowPassword}
                />
                
                {(!isUpdating || formData.password) && (
                    <InputField
                        label="Potwierdź hasło"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        error={errors.confirmPassword}
                        handleChange={handleChange} isLoading={isLoading}
                    />
                )}
            </div>
            
            <div className="flex items-center pt-2">
                <input
                    type="checkbox"
                    name="active"
                    id="active"
                    checked={formData.active}
                    onChange={handleChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    disabled={isLoading}
                />
                <label htmlFor="active" className="ml-2 text-sm text-gray-700 font-medium">
                    Aktywny
                </label>
            </div>

            <div className="flex space-x-3 pt-6 border-t border-gray-100">
                <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center shadow-md text-lg"
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    ) : (
                        '💾' 
                    )}
                    {isUpdating ? 'Zapisz zmiany' : 'Dodaj pracownika'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-xl font-semibold transition-colors"
                    disabled={isLoading}
                >
                    Anuluj
                </button>
            </div>
        </div>
    );
};

const EmployeeCard = ({ employee, onEdit, onArchive, onRestore, onWorkDetails }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const isEmployeeActive = employee.active || false; 
    const isArchived = !isEmployeeActive;

    const handleArchiveToggle = async () => {
        setIsProcessing(true);
        try {
            if (isEmployeeActive) {
                await onArchive(employee.id);
            } else { 
                await onRestore(employee.id);
            }
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className={`bg-white border rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 ${isArchived ? 'opacity-70 border-gray-300' : 'border-green-200'}`}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl ${isArchived ? 'bg-gray-100' : 'bg-gradient-to-br from-green-50 to-green-100'}`}>
                        🧑‍🌾
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800">
                            {employee.name} {employee.surname}
                        </h3>
                        {employee.nickname && (
                            <p className="text-sm text-gray-500 italic">"{employee.nickname}"</p>
                        )}
                    </div>
                </div>
                
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => onEdit(employee)}
                        className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors text-base"
                        title="Edytuj ✏️"
                        disabled={isProcessing}
                    >
                        ✏️
                    </button>
                    
                    <button
                        onClick={() => onWorkDetails(employee)}
                        className="p-2 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors text-base"
                        title="Detale Zatrudnienia 💼"
                        disabled={isProcessing}
                    >
                        💼
                    </button>
                    
                    <button
                        onClick={handleArchiveToggle}
                        disabled={isProcessing}
                        className={`p-2 rounded-lg transition-colors text-base ${
                            isArchived 
                                ? 'bg-lime-50 text-lime-600 hover:bg-lime-100' 
                                : 'bg-red-50 text-red-600 hover:bg-red-100'
                        } disabled:opacity-50`}
                        title={isArchived ? "Przywróć (Aktywuj) 🔄" : "Archiwizuj (Dezaktywuj) 📦"}
                    >
                        {isProcessing ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        ) : isArchived ? (
                            '🔄'
                        ) : (
                            '📦'
                        )}
                    </button>
                </div>
            </div>

            <div className="mb-4 space-x-2">
                {isEmployeeActive ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <span className="mr-1">✅</span>
                        Aktywny 🌱
                    </span>
                ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        <span className="mr-1">❌</span>
                        Zarchiwizowany 🍂
                    </span>
                )}
                
                {employee.role && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-lime-100 text-lime-700">
                        <span className="mr-1">⚙️</span>
                        {employee.role.name || employee.role.roleName || 'Brak roli'}
                    </span>
                )}
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-100">
                {[
                    { icon: '✉️', label: 'Email', value: employee.email, truncate: true },
                    { icon: '📞', label: 'Telefon', value: employee.phoneNumber },
                    { icon: '📅', label: 'Data utworzenia', value: employee.creationDate ? new Date(employee.creationDate).toLocaleDateString('pl-PL') : null },
                    { icon: '🆔', label: 'ID', value: `#${employee.id}` }
                ].map((item, index) => item.value && (
                    <div key={index} className="flex items-center space-x-3 text-gray-600">
                        <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0 text-lg">
                            {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-500 uppercase">{item.label}</p>
                            <p className={`text-sm font-medium text-gray-900 ${item.truncate ? 'truncate' : ''}`}>{item.value}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const StatCard = ({ count, label, color }) => {
    const colorMap = {
        green: { bg: 'from-green-100 to-green-200', text: 'text-green-600', emoji: '🟢', icon: '🍃' },
        red: { bg: 'from-red-100 to-red-200', text: 'text-red-600', emoji: '🔴', icon: '📦' },
        lime: { bg: 'from-lime-100 to-lime-200', text: 'text-lime-600', emoji: '✨', icon: '🔎' }
    };
    const colors = colorMap[color] || colorMap.green; 
    
    return (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center space-x-4">
                <div className={`w-14 h-14 bg-gradient-to-br ${colors.bg} rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl`}>
                    {colors.icon}
                </div>
                <div>
                    <p className="text-3xl font-extrabold text-gray-900">{count}</p>
                    <p className="text-sm text-gray-500">{label} {colors.emoji}</p>
                </div>
            </div>
        </div>
    );
};

const LoadingState = () => (
    <div className="text-center py-16">
        <div className="w-14 h-14 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-6"></div>
        <p className="text-gray-500 text-xl font-medium">Ładowanie użytkowników... 🔄</p>
    </div>
);

const EmptyState = ({ searchTerm, employeesCount, showArchived, onAddClick }) => {
    let title, message;

    if (searchTerm) {
        title = 'Brak wyników wyszukiwania';
        message = 'Spróbuj zmienić kryteria wyszukiwania lub zresetować filtr.';
    } else if (employeesCount === 0) {
        title = 'Brak użytkowników';
        message = 'Dodaj pierwszego użytkownika, aby rozpocząć zarządzanie pracownikami.';
    } else {
        title = showArchived ? 'Brak zarchiwizowanych użytkowników' : 'Brak aktywnych użytkowników';
        message = showArchived 
            ? 'Wszyscy użytkownicy są obecnie aktywni.' 
            : 'Wszyscy użytkownicy są zarchiwizowani. Zaznacz "Pokaż zarchiwizowanych"';
    }

    return (
        <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">
                👤
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">{message}</p>
        </div>
    );
};


export default function EmployeeManagement() {
    const [employees, setEmployees] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isWorkDetailsModalOpen, setIsWorkDetailsModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [alert, setAlert] = useState({ type: '', message: '' });
    const [allEmployees, setAllEmployees] = useState([]); 

    const closeAlert = useCallback(() => setAlert({ type: '', message: '' }), []);

    const fetchEmployees = useCallback(async () => {
        setIsLoading(true);
        setEmployees([]);
        const endpoint = showArchived ? '/api/users/archived' : '/api/users/active';
        
        try {
            const response = await fetch(`${BACKEND_URL}${endpoint}`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                const data = await response.json();
                const usersList = Array.isArray(data) ? data : [];
                setEmployees(usersList);
            } else {
                const error = await response.json();
                setAlert({ type: 'error', message: `Błąd ładowania pracowników: ${error.message || response.statusText}` });
            }
        } catch (error) {
            setAlert({ type: 'error', message: `Błąd sieci: Nie można połączyć się z backendem. Upewnij się, że serwer działa na porcie 8091.` });
        } finally {
            setIsLoading(false);
        }
    }, [showArchived]); 

    const fetchAllEmployeesForStats = useCallback(async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/users`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                const data = await response.json();
                const usersList = Array.isArray(data) ? data : [];
                setAllEmployees(usersList);
            }
        } catch (error) {
        }
    }, []);
    
    useEffect(() => {
        fetchEmployees(); 
        fetchAllEmployeesForStats(); 
    }, [fetchEmployees, fetchAllEmployeesForStats]); 

    const filteredEmployees = useMemo(() => {
        let list = employees;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            list = list.filter(emp =>
                (emp.name?.toLowerCase().includes(term)) ||
                (emp.surname?.toLowerCase().includes(term)) ||
                (emp.nickname?.toLowerCase().includes(term)) ||
                (emp.email?.toLowerCase().includes(term)) ||
                (emp.phoneNumber?.includes(term)) ||
                (emp.role?.name?.toLowerCase().includes(term)) ||
                (emp.role?.roleName?.toLowerCase().includes(term)) ||
                (emp.id?.toString().includes(term))
            );
        }
        return list;
    }, [employees, searchTerm]); 
    
    const activeCount = allEmployees.filter(e => e.active).length;
    const archivedCount = allEmployees.filter(e => !e.active).length;

    const handleSaveEmployee = useCallback(async (employeeData) => {
        setIsLoading(true);
        closeAlert();
        
        const isUpdate = !!selectedEmployee;
        const endpoint = isUpdate 
            ? `${BACKEND_URL}/api/users/${selectedEmployee.id}` 
            : `${BACKEND_URL}/api/users`;
        const method = isUpdate ? 'PUT' : 'POST';

        try {
            const response = await fetch(endpoint, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify(employeeData),
            });

            if (response.ok) {
                setAlert({ type: 'success', message: `Pracownik został ${isUpdate ? 'zaktualizowany' : 'dodany'} pomyślnie!` });
                closeModal();
                fetchEmployees();
                fetchAllEmployeesForStats();
            } else {
                let errorMessage = response.statusText;
                const error = await response.json();
                errorMessage = error.message || error.error || response.statusText; 
                setAlert({ type: 'error', message: `Błąd zapisu (${response.status}): ${errorMessage}` });
            }
        } catch (error) {
            setAlert({ type: 'error', message: `Błąd sieci: Nie można zapisać danych pracownika. Sprawdź CORS/Token.` });
        } finally {
            setIsLoading(false);
        }
    }, [selectedEmployee, fetchEmployees, fetchAllEmployeesForStats, closeAlert]);

    const toggleEmployeeStatus = useCallback(async (employeeId, newStatus) => {
        closeAlert();
        
        const action = newStatus ? 'aktywowanie' : 'archiwizowanie';
        const endpoint = `${BACKEND_URL}/api/users/${employeeId}/toggle-status`;

        try {
            const response = await fetch(endpoint, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ active: newStatus }),
            });

            if (response.ok) {
                setAlert({ type: 'success', message: `Pracownik został pomyślnie ${newStatus ? 'przywrócony' : 'zarchiwizowany'}.` });
                fetchEmployees();
                fetchAllEmployeesForStats();
            } else {
                let errorMessage = response.statusText;
                try {
                    const error = await response.json();
                    errorMessage = error.message || error.error || response.statusText;
                } catch (e) {
                }
                setAlert({ type: 'error', message: `Błąd podczas ${action}: ${errorMessage}` });
            }
        } catch (error) {
            setAlert({ type: 'error', message: `Błąd sieci: Nie można ${action} pracownika.` });
        }
    }, [fetchEmployees, fetchAllEmployeesForStats, closeAlert]);

    const openModal = useCallback((employee = null) => {
        setSelectedEmployee(employee);
        setIsModalOpen(true);
        closeAlert();
    }, [closeAlert]);

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        setSelectedEmployee(null);
    }, []);

    const handleWorkDetails = useCallback((employee) => {
        setSelectedEmployee(employee);
        setIsWorkDetailsModalOpen(true);
    }, []);

    const handleWorkDetailsSave = useCallback(() => {
        setAlert({ type: 'success', message: 'Detale zatrudnienia zostały zapisane pomyślnie!' });
        setIsWorkDetailsModalOpen(false);
        setSelectedEmployee(null);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-50 to-lime-100 p-6 font-sans">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-2 flex items-center">
                        <span className="text-red-500 mr-3">🍎</span>
                        Zarządzaj pracownikami
                    </h1>
                    <p className="text-gray-600 text-lg flex items-center">
                        Przeglądaj, dodawaj i zarządzaj kontami użytkowników. Gotowi do zbiorów! 🍎
                    </p>
                </header>
                
                {alert.message && (
                    <Alert
                        type={alert.type}
                        message={alert.message}
                        onClose={closeAlert}
                    />
                )}

                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-green-100">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative flex-1 w-full md:max-w-md">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                            <input
                                type="text"
                                placeholder="Szukaj: imię, email, numer telefonu..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                            />
                        </div>

                        <div className="flex items-center space-x-4 w-full md:w-auto justify-end">
                            <label className="flex items-center space-x-3 cursor-pointer bg-green-50 px-4 py-3 rounded-xl hover:bg-green-100 transition-colors flex-shrink-0">
                                <input
                                    type="checkbox"
                                    checked={showArchived}
                                    onChange={(e) => {
                                        setShowArchived(e.target.checked);
                                        setSearchTerm('');
                                    }}
                                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                />
                                <span className="text-sm font-medium text-gray-700">Pokaż Zarchiwizowanych 📦</span>
                            </label>
                            
                            <button
                                onClick={() => openModal()}
                                className="bg-gradient-to-r from-green-600 to-lime-700 hover:from-green-700 hover:to-lime-800 text-white px-5 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl flex-shrink-0"
                            >
                                <span className="text-xl">+</span>
                                <span className="hidden sm:inline">Dodaj Pracownika</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                    <StatCard 
                        count={activeCount} 
                        label="Aktywni Pracownicy" 
                        color="green"
                    />
                    <StatCard 
                        count={archivedCount} 
                        label="Zarchiwizowani" 
                        color="red"
                    />
                    <StatCard 
                        count={filteredEmployees.length} 
                        label="Wyświetlani w Filtrze" 
                        color="lime"
                    />
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                            {showArchived ? 'Zarchiwizowani pracownicy 🧑‍🌾' : 'Aktywny Zespół 🧑‍🌾'}
                        </h2>
                        <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-lg font-medium">
                            Wyświetlono: {filteredEmployees.length} z {employees.length}
                        </div>
                    </div>
                    
                    {isLoading ? (
                        <LoadingState />
                    ) : filteredEmployees.length === 0 ? (
                        <EmptyState 
                            searchTerm={searchTerm} 
                            employeesCount={employees.length}
                            showArchived={showArchived} 
                            onAddClick={openModal} 
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredEmployees.map((employee) => (
                                <EmployeeCard
                                    key={employee.id}
                                    employee={employee}
                                    onEdit={openModal}
                                    onArchive={(id) => toggleEmployeeStatus(id, false)}
                                    onRestore={(id) => toggleEmployeeStatus(id, true)}
                                    onWorkDetails={handleWorkDetails}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <Modal
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    title={<span><span className="mr-2 text-green-600">🌱</span>Dodaj Nowego Pracownika ✨</span>}
                    headerColor="bg-green-50"
                >
                    <EmployeeForm
                        employee={selectedEmployee}
                        onSave={handleSaveEmployee}
                        onCancel={closeModal}
                        isLoading={isLoading}
                    />
                </Modal>

                <WorkDetailsModal
                    isOpen={isWorkDetailsModalOpen}
                    onClose={() => {
                        setIsWorkDetailsModalOpen(false);
                        setSelectedEmployee(null);
                    }}
                    employee={selectedEmployee}
                    onSave={handleWorkDetailsSave}
                />
            </div>
        </div>
    );
}