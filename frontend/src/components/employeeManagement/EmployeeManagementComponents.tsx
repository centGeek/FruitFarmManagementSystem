import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BACKEND_URL, getAuthHeaders } from "../../utils/apiConfigs";
import { authFetch } from '../../utils/authFetch';

const formatPay = (pay: any) => { if (pay === null || pay === undefined || pay === '') return ''; return Number(pay).toFixed(2); };

export const Modal = ({ isOpen, onClose, title, children, headerColor = 'bg-green-50' }: any) => {
    if (!isOpen) return null;
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-transform duration-300 scale-100">
                <div className={`sticky top-0 ${headerColor} border-b border-gray-200 px-6 py-4 rounded-t-2xl z-10 flex items-center justify-between`}>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">{title}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white hover:bg-opacity-50 rounded-xl transition-colors text-lg">❌</button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
};

export const InputField = React.memo(({ label, name, type = 'text', required = false, error, isLoading, handleChange, value, ...props }: any) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">{label} {required && '*'}</label>
        <div className="relative">
            <input id={name} name={name} onChange={handleChange} className={`w-full px-3 py-2 ${error ? 'border-red-500' : 'border-gray-300'} border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors`} disabled={isLoading} value={value} type={type} {...props} />
        </div>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
));

export const EmployeeForm = ({ employee, onSave, onCancel, isLoading }: any) => {
    const isUpdating = !!employee;
    const initialState = useMemo(() => ({ name: employee?.name || '', surname: employee?.surname || '', nickname: employee?.nickname || '', phoneNumber: employee?.phoneNumber || '', email: employee?.email || '', active: employee?.active ?? true }), [employee]);
    const [formData, setFormData] = useState(initialState);
    const [errors, setErrors] = useState<any>({});

    useEffect(() => { setFormData(initialState); setErrors({}); }, [initialState]);

    const handleChange = useCallback((e: any) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        if (errors[name]) setErrors((prev: any) => ({ ...prev, [name]: '' }));
    }, [errors]);

    const validate = useCallback(() => {
        const newErrors: any = {};
        if (!formData.name.trim()) newErrors.name = 'Imię jest wymagane';
        if (!formData.surname.trim()) newErrors.surname = 'Nazwisko jest wymagane';
        if (!formData.nickname.trim()) newErrors.nickname = 'Nazwa użytkownika jest wymagana';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    const handleSubmit = useCallback(() => { if (validate()) onSave(formData); }, [validate, formData, onSave]);

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField label="Imię" name="name" required value={formData.name} error={errors.name} handleChange={handleChange} isLoading={isLoading} />
                <InputField label="Nazwisko" name="surname" required value={formData.surname} error={errors.surname} handleChange={handleChange} isLoading={isLoading} />
            </div>
            <InputField label="Nazwa użytkownika" name="nickname" required value={formData.nickname} error={errors.nickname} handleChange={handleChange} isLoading={isLoading} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField label="Telefon" name="phoneNumber" type="tel" value={formData.phoneNumber} handleChange={handleChange} isLoading={isLoading} />
                <InputField label="Email" name="email" type="email" value={formData.email} handleChange={handleChange} isLoading={isLoading} />
            </div>
            <div className="flex items-center pt-2">
                <input type="checkbox" name="active" id="active" checked={formData.active} onChange={handleChange} className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded" disabled={isLoading} />
                <label htmlFor="active" className="ml-2 text-sm text-gray-700 font-medium">Aktywny</label>
            </div>
            <div className="flex space-x-3 pt-6 border-t border-gray-100">
                <button onClick={handleSubmit} disabled={isLoading} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center shadow-md text-lg">
                    {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> : '💾'} {isUpdating ? 'Zapisz zmiany' : 'Dodaj pracownika'}
                </button>
                <button type="button" onClick={onCancel} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-xl font-semibold transition-colors" disabled={isLoading}>Anuluj</button>
            </div>
        </div>
    );
};

export const StatCard = ({ count, label, color }: any) => {
    const colorMap: any = {
        green: { bg: 'from-green-100 to-green-200', emoji: '🟢', icon: '🍃' },
        red: { bg: 'from-red-100 to-red-200', emoji: '🔴', icon: '📦' },
        lime: { bg: 'from-lime-100 to-lime-200', emoji: '✨', icon: '🔎' }
    };
    const colors = colorMap[color] || colorMap.green;
    return (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center space-x-4">
                <div className={`w-14 h-14 bg-gradient-to-br ${colors.bg} rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl`}>{colors.icon}</div>
                <div><p className="text-3xl font-extrabold text-gray-900">{count}</p><p className="text-sm text-gray-500">{label} {colors.emoji}</p></div>
            </div>
        </div>
    );
};

export const LoadingState = () => (
    <div className="text-center py-16">
        <div className="w-14 h-14 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-6"></div>
        <p className="text-gray-500 text-xl font-medium">Ładowanie użytkowników... 🔄</p>
    </div>
);

export const EmptyState = ({ searchTerm, employeesCount, showArchived, onAddClick }: any) => {
    let title, message;
    if (searchTerm) { title = 'Brak wyników wyszukiwania'; message = 'Spróbuj zmienić kryteria wyszukiwania lub zresetować filtr.'; }
    else if (employeesCount === 0) { title = 'Brak użytkowników'; message = 'Dodaj pierwszego użytkownika, aby rozpocząć zarządzanie pracownikami.'; }
    else { title = showArchived ? 'Brak zarchiwizowanych użytkowników' : 'Brak aktywnych użytkowników'; message = showArchived ? 'Wszyscy użytkownicy są obecnie aktywni.' : 'Wszyscy użytkownicy są zarchiwizowani. Zaznacz "Pokaż zarchiwizowanych"'; }

    return (
        <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">👤</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">{message}</p>
        </div>
    );
};

export const EmployeeCard = ({ employee, onEdit, onArchive, onRestore, onFinanceDetails }: any) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const isEmployeeActive = employee.active || false;
    const isArchived = !isEmployeeActive;

    const handleArchiveToggle = async () => {
        setIsProcessing(true);
        try { if (isEmployeeActive) await onArchive(employee.id); else await onRestore(employee.id); } finally { setIsProcessing(false); }
    };

    return (
        <div className={`bg-white border rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 ${isArchived ? 'opacity-70 border-gray-300' : 'border-green-200'}`}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl ${isArchived ? 'bg-gray-100' : 'bg-gradient-to-br from-green-50 to-green-100'}`}>🧑‍🌾</div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 flex items-center">{employee.name} {employee.surname}</h3>
                        {employee.nickname && <p className="text-sm text-gray-500 italic">"{employee.nickname}"</p>}
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={() => onEdit(employee)} className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors text-base" title="Edytuj ✏️" disabled={isProcessing}>✏️</button>
                    <button onClick={() => onFinanceDetails(employee)} className="p-2 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors text-base" title="Detale Pracy 💼" disabled={isProcessing}>💼</button>
                    <button onClick={handleArchiveToggle} disabled={isProcessing} className={`p-2 rounded-lg transition-colors text-base ${isArchived ? 'bg-lime-50 text-lime-600 hover:bg-lime-100' : 'bg-red-50 text-red-600 hover:bg-red-100'} disabled:opacity-50`} title={isArchived ? "Przywróć (Aktywuj) 🔄" : "Archiwizuj (Dezaktywuj) 📦"}>{isProcessing ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : isArchived ? '🔄' : '📦'}</button>
                </div>
            </div>
            <div className="mb-4 space-x-2">
                {isEmployeeActive ? <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"><span className="mr-1">✅</span>Aktywny 🌱</span> : <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700"><span className="mr-1">❌</span>Zarchiwizowany 🍂</span>}
                {employee.role && <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-lime-100 text-lime-700"><span className="mr-1">⚙️</span>{employee.role.roleName === 'Employee' ? 'Pracownik' : employee.role.roleName || 'Brak roli'}</span>}
            </div>
            <div className="space-y-3 pt-4 border-t border-gray-100">
                {[{ icon: '✉️', label: 'Email', value: employee.email, truncate: true }, { icon: '📞', label: 'Telefon', value: employee.phoneNumber }, { icon: '📅', label: 'Data utworzenia', value: employee.creationDate ? new Date(employee.creationDate).toLocaleDateString('pl-PL') : null }, { icon: '🆔', label: 'ID', value: `#${employee.id}` }].map((item, index) => item.value && (
                    <div key={index} className="flex items-center space-x-3 text-gray-600">
                        <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0 text-lg">{item.icon}</div>
                        <div className="flex-1 min-w-0"><p className="text-xs font-medium text-gray-500 uppercase">{item.label}</p><p className={`text-sm font-medium text-gray-900 ${item.truncate ? 'truncate' : ''}`}>{item.value}</p></div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const AdvancePaySection = ({ employee, onAdvanceSave }: any) => {
    const [advances, setAdvances] = useState<any[]>([]);
    const [advanceAmount, setAdvanceAmount] = useState('');
    const [advanceDescription, setAdvanceDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isPayingOff, setIsPayingOff] = useState(false);
    const [error, setError] = useState('');

    const fetchAdvances = useCallback(async () => {
        setIsLoading(true); setError('');
        try {
            const response = await authFetch(`${BACKEND_URL}/api/advances/user/${employee.id}/unsettled`, { headers: getAuthHeaders() });
            if (response.ok) setAdvances(await response.json());
            else if (response.status !== 404) setError('Błąd pobierania zaliczek');
        } catch (err) { setError('Błąd sieci'); } finally { setIsLoading(false); }
    }, [employee.id]);

    useEffect(() => { fetchAdvances(); }, [fetchAdvances]);

    const handleNewAdvance = async () => {
        const amount = parseFloat(advanceAmount);
        if (isNaN(amount) || amount <= 0) { setError('Wprowadź prawidłową kwotę'); return; }
        setIsSaving(true);
        try {
            const response = await authFetch(`${BACKEND_URL}/api/advances`, {
                method: 'POST', headers: getAuthHeaders(),
                body: JSON.stringify({ userId: employee.id, amount, description: advanceDescription.trim() || null, date: new Date().toISOString().split('T')[0] })
            });
            if (response.ok) { setAdvanceAmount(''); setAdvanceDescription(''); await fetchAdvances(); onAdvanceSave('success', 'Zaliczka dodana!'); }
            else setError('Błąd dodawania zaliczki');
        } catch (err) { setError('Błąd sieci'); } finally { setIsSaving(false); }
    };

    const handlePayOff = async () => {
        setIsPayingOff(true);
        try {
            const response = await authFetch(`${BACKEND_URL}/api/advances/user/${employee.id}`, { method: 'PUT', headers: getAuthHeaders() });
            if (response.ok) { await fetchAdvances(); onAdvanceSave('success', 'Zaliczki spłacone!'); }
            else setError('Błąd spłacania zaliczek');
        } catch (err) { setError('Błąd sieci'); } finally { setIsPayingOff(false); }
    };

    const unsettledSum = useMemo(() => advances.reduce((sum, a) => sum + (a.amount || 0), 0).toFixed(2), [advances]);

    return (
        <div className="space-y-6">
            {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">⚠️ {error}</div>}
            <div className="p-4 rounded-xl border-l-4 border-yellow-500 bg-yellow-50">
                <p className="text-sm text-gray-800 flex items-center"><span className="mr-2 text-xl">💵</span> Całkowita niespłacona zaliczka: <span className="ml-2 font-bold text-lg text-yellow-700">{unsettledSum} PLN</span></p>
                <p className="text-xs text-gray-600 mt-1">Suma zaliczek oczekujących na rozliczenie.</p>
            </div>
            <div className="p-4 border rounded-xl shadow-sm bg-gray-50 space-y-4">
                <h4 className="text-lg font-bold text-gray-800 flex items-center">➕ Wypłać pracownikowi zaliczkę</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Kwota Zaliczki (PLN) *</label>
                        <input type="number" value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} placeholder="np. 50.00" step="10" min="1" disabled={isSaving || isLoading} className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors" />
                    </div>
                    <div className="sm:col-span-1 flex items-end">
                        <button onClick={handleNewAdvance} disabled={isSaving || isLoading} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2.5 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center shadow-md text-base">{isSaving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> : 'Zapisz 💾'}</button>
                    </div>
                </div>
                <InputField label="Opis (opcjonalnie)" name="advanceDescription" value={advanceDescription} handleChange={(e: any) => setAdvanceDescription(e.target.value)} isLoading={isSaving || isLoading} placeholder="np. Na jedzenie" />
            </div>
            {parseFloat(unsettledSum) > 0 && <div className="pt-4 border-t border-gray-100"><button onClick={handlePayOff} disabled={isPayingOff || isLoading} className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center shadow-lg hover:shadow-xl">{isPayingOff ? 'Spłacanie...' : `Spłać wszystkie zaliczki (${unsettledSum} PLN) 💸`}</button></div>}
            <h4 className="text-lg font-bold text-gray-800 mt-6 pt-4 border-t">Historia Niespłaconych Zaliczek ({advances.length})</h4>
            {isLoading ? <div className="text-center text-gray-500 py-4">Ładowanie historii...</div> : advances.length === 0 ? <div className="text-center text-gray-500 py-4 border border-gray-100 rounded-xl">Brak niespłaconych zaliczek.</div> : <ul className="space-y-3">{advances.map((advance, index) => (<li key={index} className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-lg shadow-sm"><div className="flex-1 min-w-0"><p className="font-semibold text-gray-800">{advance.amount?.toFixed(2) || '0.00'} PLN</p><p className="text-xs text-gray-500 truncate">{advance.description || 'Brak opisu'}</p></div><div className="text-sm text-gray-600 ml-4 flex-shrink-0">📅 {new Date(advance.date || advance.createdAt).toLocaleDateString('pl-PL')}</div></li>))}</ul>}
        </div>
    );
};

export const EmployeeFinanceModal = ({ isOpen, onClose, employee, onWorkDetailsSave }: any) => {
    const [activeTab, setActiveTab] = useState('workDetails');
    const [workDetails, setWorkDetails] = useState<any>(null);
    const [isPaidHourly, setIsPaidHourly] = useState(true);
    const [hourlyPay, setHourlyPay] = useState('');
    const [payPerKilogram, setPayPerKilogram] = useState('');
    const [isLoadingWorkDetails, setIsLoadingWorkDetails] = useState(false);
    const [error, setError] = useState('');

    const fetchLatestWorkDetails = useCallback(async () => {
        setIsLoadingWorkDetails(true); setError(''); setWorkDetails(null); setIsPaidHourly(true); setHourlyPay(''); setPayPerKilogram('');
        try {
            const response = await authFetch(`${BACKEND_URL}/api/work-details/user/${employee.id}/latest`, { headers: getAuthHeaders() });
            if (response.ok) {
                const data = await response.json();
                setWorkDetails(data);
                const isHourly = data.isPaidHourly === true;
                setIsPaidHourly(isHourly);
                if (isHourly) setHourlyPay(formatPay(data.hourlyPay)); else setPayPerKilogram(formatPay(data.payPerKilogram));
            }
        } catch (err) { setError('Dodaj sposób rozliczania i stawkę'); } finally { setIsLoadingWorkDetails(false); }
    }, [employee]);

    useEffect(() => { if (isOpen && employee) { fetchLatestWorkDetails(); setActiveTab('workDetails'); } }, [isOpen, employee, fetchLatestWorkDetails]);

    const handleSaveWorkDetails = async () => {
        setError('');
        if (isPaidHourly && (!hourlyPay || parseFloat(hourlyPay) <= 0)) { setError('Wprowadź prawidłową stawkę godzinową'); return; }
        if (!isPaidHourly && (!payPerKilogram || parseFloat(payPerKilogram) <= 0)) { setError('Wprowadź prawidłową stawkę za kilogram'); return; }
        setIsLoadingWorkDetails(true);
        try {
            const response = await authFetch(`${BACKEND_URL}/api/work-details`, {
                method: 'POST', headers: getAuthHeaders(),
                body: JSON.stringify({ userDTO: employee, isPaidHourly, hourlyPay: isPaidHourly ? parseFloat(hourlyPay) : null, payPerKilogram: !isPaidHourly ? parseFloat(payPerKilogram) : null })
            });
            if (response.ok) { onWorkDetailsSave('success', 'Detale zatrudnienia zostały zapisane pomyślnie!'); await fetchLatestWorkDetails(); }
            else setError('Błąd zapisywania detali pracy');
        } catch (err) { setError('Błąd połączenia z serwerem'); } finally { setIsLoadingWorkDetails(false); }
    };

    const currentRateText = useMemo(() => {
        if (!workDetails) return null;
        const isHourly = workDetails.isPaidHourly === true;
        const rate = isHourly ? workDetails.hourlyPay : workDetails.payPerKilogram;
        if (!rate) return null;
        return { rateText: `${Number(rate).toFixed(2)} ${isHourly ? 'PLN/godz' : 'PLN/kg'}`, isCurrentHourly: isHourly };
    }, [workDetails]);

    if (!isOpen || !employee) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={<span><span className="mr-2 text-purple-600">💼</span>Detale Pracy - {employee.name} {employee.surname}</span>} headerColor="bg-purple-50">
            <div className="space-y-6">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded"><p className="text-sm font-medium text-blue-900">👤 {employee.name} {employee.surname} {employee.nickname && <span className="italic text-blue-700"> "{employee.nickname}"</span>}</p><p className="text-xs text-blue-700 mt-1">{employee.email}</p></div>
                <div className="flex border-b border-gray-200">
                    <button onClick={() => setActiveTab('workDetails')} className={`py-2 px-4 text-sm font-semibold transition-colors ${activeTab === 'workDetails' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}>💼 Detale Pracy</button>
                    <button onClick={() => setActiveTab('advances')} className={`py-2 px-4 text-sm font-semibold transition-colors ${activeTab === 'advances' ? 'border-b-2 border-yellow-600 text-yellow-600' : 'text-gray-500 hover:text-gray-700'}`}>💸 Zaliczki</button>
                </div>
                {activeTab === 'workDetails' && (
                    <div className="space-y-6">
                        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">⚠️ {error}</div>}
                        {isLoadingWorkDetails ? <div className="text-center py-8"><div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div><p className="text-gray-500 mt-4">Ładowanie detali...</p></div> : (
                            <>
                                {currentRateText && <div className={`p-4 rounded-xl border-l-4 ${currentRateText.isCurrentHourly ? 'bg-blue-100 border-blue-500' : 'bg-green-100 border-green-500'} transition-all`}><p className="text-sm text-gray-800 flex items-center"><span className="mr-2 text-xl">{currentRateText.isCurrentHourly ? '⏰' : '⚖️'}</span>Obecna stawka pracownika: <span className="ml-2 font-bold text-base">{currentRateText.rateText}</span></p></div>}
                                <div><label className="block text-sm font-semibold text-gray-700 mb-3">Typ Rozliczenia</label><div className="grid grid-cols-2 gap-3"><button type="button" onClick={() => { setIsPaidHourly(true); setPayPerKilogram(''); }} disabled={isLoadingWorkDetails} className={`py-4 px-4 rounded-xl font-medium transition-all ${isPaidHourly ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><div className="text-3xl mb-2">⏰</div><div className="text-sm font-bold">Płatność Godzinowa</div></button><button type="button" onClick={() => { setIsPaidHourly(false); setHourlyPay(''); }} disabled={isLoadingWorkDetails} className={`py-4 px-4 rounded-xl font-medium transition-all ${!isPaidHourly ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg scale-105' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><div className="text-3xl mb-2">⚖️</div><div className="text-sm font-bold">Płatność Za Kilogram</div></button></div></div>
                                {isPaidHourly ? <div><label className="block text-sm font-medium text-gray-700 mb-2">Stawka Godzinowa (PLN) *</label><div className="relative"><span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xl">💼</span><input type="number" value={hourlyPay} onChange={(e) => setHourlyPay(e.target.value)} placeholder="np. 25.50" step="1" min="10" disabled={isLoadingWorkDetails} className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" /></div></div> : <div><label className="block text-sm font-medium text-gray-700 mb-2">Stawka za Kilogram (PLN) *</label><div className="relative"><span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xl">🍎</span><input type="number" value={payPerKilogram} onChange={(e) => setPayPerKilogram(e.target.value)} placeholder="np. 0.80" step="0.01" min="0.01" disabled={isLoadingWorkDetails} className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors" /></div></div>}
                                {workDetails && <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600"><p>📅 Ostatnia aktualizacja detali pracy: {new Date(workDetails.createdAt).toLocaleDateString('pl-PL')}</p></div>}
                                <div className="flex gap-3 pt-4 border-t"><button onClick={handleSaveWorkDetails} disabled={isLoadingWorkDetails} className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 px-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl">{isLoadingWorkDetails ? <span className="flex items-center justify-center"><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>Zapisywanie...</span> : <span>💾 Zapisz Nowe Detale</span>}</button><button onClick={onClose} disabled={isLoadingWorkDetails} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-xl font-semibold transition-colors">Zamknij</button></div>
                            </>
                        )}
                    </div>
                )}
                {activeTab === 'advances' && <AdvancePaySection employee={employee} onAdvanceSave={(type: string, message: string) => onWorkDetailsSave(type, message)} />}
            </div>
        </Modal>
    );
};