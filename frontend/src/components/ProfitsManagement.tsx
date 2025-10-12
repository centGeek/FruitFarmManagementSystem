import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BACKEND_URL, getAuthHeaders } from "../utils/apiConfigs";

const PROFIT_TYPES = [
  // 🍎 Sprzedaż owoców
  { value: 'APPLE_SALE', label: 'Sprzedaż jabłek', icon: '🍎', color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'PEAR_SALE', label: 'Sprzedaż gruszek', icon: '🍐', color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'CHERRY_SALE', label: 'Sprzedaż czereśni/wiśni', icon: '🍒', color: 'bg-red-50 text-red-700 border-red-200' },
  { value: 'PLUM_SALE', label: 'Sprzedaż śliwek', icon: '🫐', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'PEACH_SALE', label: 'Sprzedaż brzoskwiń', icon: '🍑', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { value: 'OTHER_FRUIT_SALE', label: 'Sprzedaż innych owoców', icon: '🥝', color: 'bg-green-50 text-green-700 border-green-200' },
  
  // 🏪 Kanały sprzedaży
  { value: 'WHOLESALE', label: 'Sprzedaż hurtowa', icon: '🏭', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'RETAIL', label: 'Sprzedaż detaliczna', icon: '🏪', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'EXPORT', label: 'Eksport', icon: '🌍', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'ONLINE_SALE', label: 'Sprzedaż online', icon: '💻', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  
  // 💰 Inne przychody
  { value: 'SUBSIDY', label: 'Dotacje / Dopłaty', icon: '🏛️', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { value: 'COMPENSATION', label: 'Odszkodowania / Ubezpieczenia', icon: '🛡️', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'EQUIPMENT_SALE', label: 'Sprzedaż sprzętu', icon: '🚜', color: 'bg-gray-50 text-gray-700 border-gray-200' },
  { value: 'SERVICES', label: 'Usługi rolnicze dla innych', icon: '🤝', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { value: 'RENT', label: 'Wynajem ziemi/sprzętu', icon: '🏡', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'OTHER', label: 'Inne przychody', icon: '💵', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
];

const PAYMENT_STATUS_OPTIONS = [
    { value: '', label: 'Wszystkie 📋' },
    { value: 'received', label: 'Otrzymane ✅' },
    { value: 'pending', label: 'Oczekujące ⏳' }
];

const MONTH_OPTIONS = [
    { value: '', label: 'Wszystkie miesiące 📅' },
    { value: '1', label: 'Styczeń' },
    { value: '2', label: 'Luty' },
    { value: '3', label: 'Marzec' },
    { value: '4', label: 'Kwiecień' },
    { value: '5', label: 'Maj' },
    { value: '6', label: 'Czerwiec' },
    { value: '7', label: 'Lipiec' },
    { value: '8', label: 'Sierpień' },
    { value: '9', label: 'Wrzesień' },
    { value: '10', label: 'Październik' },
    { value: '11', label: 'Listopad' },
    { value: '12', label: 'Grudzień' }
];

const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i <= 5; i++) {
        years.push(currentYear - i);
    }
    return years;
};

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

const Modal = ({ isOpen, onClose, title, children }) => {
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
                <div className="sticky top-0 bg-green-50 border-b border-green-200 px-6 py-4 rounded-t-2xl z-10">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center">
                            <span className="mr-2 text-green-600">💰</span>
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-green-100 rounded-xl transition-colors text-lg"
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

const InputField = React.memo(({ label, name, type = 'text', required = false, error, isLoading, handleChange, value, ...props }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">
            {label} {required && '*'}
        </label>
        <div className="relative">
            <input
                id={name}
                type={type}
                name={name}
                onChange={handleChange}
                className={`w-full px-3 py-2 ${error ? 'border-red-500' : 'border-gray-300'} border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors`}
                disabled={isLoading}
                value={value}
                {...props}
            />
        </div>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
));

const LoadingState = () => (
    <div className="text-center py-16">
        <div className="w-14 h-14 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-6"></div>
        <p className="text-gray-500 text-xl font-medium">Ładowanie przychodów... 🔄</p>
    </div>
);

const EmptyState = ({ searchTerm, profitsCount, onAddClick }) => {
    let title, message;

    if (searchTerm) {
        title = 'Brak wyników wyszukiwania';
        message = 'Spróbuj zmienić kryteria wyszukiwania lub filtry.';
    } else if (profitsCount === 0) {
        title = 'Brak zarejestrowanych przychodów';
        message = 'Dodaj pierwszy przychód, aby rozpocząć monitorowanie dochodów.';
    } else {
        title = 'Brak przychodów spełniających kryteria';
        message = 'Zmień filtry, aby wyświetlić przychody.';
    }

    return (
        <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">
                💵
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">{message}</p>
            {profitsCount === 0 && (
                <button
                    onClick={onAddClick}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-md flex items-center justify-center mx-auto"
                >
                    <span className="inline mr-2 text-xl">+</span>
                    Dodaj pierwszy przychód
                </button>
            )}
        </div>
    );
};

const ProfitForm = ({ profit, onSave, onCancel, isLoading, sectors }) => {
    const isUpdating = !!profit;
    const today = new Date().toISOString().split('T')[0];

    const initialState = useMemo(() => ({
        id: profit?.purchaseId || null,
        date: profit?.createdAt || today,
        amount: profit?.profit?.toString() || '',
        profitType: profit?.profitType || PROFIT_TYPES[0].value,
        description: profit?.description || '',
        received: profit?.received ?? true,
        sectorId: profit?.sectorDTO?.id?.toString() || '',
    }), [profit, today]);

    const [formData, setFormData] = useState(initialState);
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
        const amountNum = Number(formData.amount);
        
        if (!formData.date.trim()) newErrors.date = 'Data przychodu jest wymagana';
        if (!formData.amount || isNaN(amountNum) || amountNum <= 0) {
            newErrors.amount = 'Kwota musi być dodatnią liczbą';
        }
        if (!formData.description.trim()) newErrors.description = 'Opis jest wymagany';
        if (!formData.profitType) newErrors.profitType = 'Typ przychodu jest wymagany';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        if (validate()) {
            const submitData = {
                ...formData,
                profit: Number(formData.amount),
                createdAt: formData.date,
                sectorDTO: formData.sectorId ? { id: Number(formData.sectorId) } : null
            };
            delete submitData.amount;
            delete submitData.date;
            delete submitData.sectorId;
            onSave(submitData);
        }
    }, [validate, formData, onSave]);

    const selectedSector = sectors?.find(s => s.id === Number(formData.sectorId));

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <InputField 
                label="Data Przychodu" name="date" type="date" required 
                value={formData.date} error={errors.date}
                handleChange={handleChange} isLoading={isLoading}
            />

            <InputField 
                label="Kwota Przychodu (PLN)" name="amount" type="number" required 
                value={formData.amount} error={errors.amount}
                handleChange={handleChange} isLoading={isLoading}
                step="0.01" min="0.01"
            />

            <div>
                <label htmlFor="profitType" className="block text-sm font-medium text-gray-700 mb-2">
                    Typ Przychodu *
                </label>
                <select
                    id="profitType"
                    name="profitType"
                    value={formData.profitType}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 ${errors.profitType ? 'border-red-500' : 'border-gray-300'} border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white`}
                    disabled={isLoading}
                >
                    {PROFIT_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                </select>
                {errors.profitType && <p className="text-red-500 text-xs mt-1">{errors.profitType}</p>}
            </div>

            <div>
                <label htmlFor="sectorId" className="block text-sm font-medium text-gray-700 mb-2">
                    Przypisz do Sektora (opcjonalnie) 🗺️
                </label>
                <select
                    id="sectorId"
                    name="sectorId"
                    value={formData.sectorId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border-gray-300 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white"
                    disabled={isLoading}
                >
                    <option value="">Bez przypisania do sektora</option>
                    {sectors && sectors.map(sector => (
                        <option key={sector.id} value={sector.id}>
                            {sector.description || `Sektor ${sector.id}`}
                            {sector.plantType && ` - ${sector.plantType}`}
                        </option>
                    ))}
                </select>
                {selectedSector && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                        📍 Przychód zostanie przypisany do: <strong>{selectedSector.description || `Sektor ${selectedSector.id}`}</strong>
                    </div>
                )}
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Opis Przychodu *
                </label>
                <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    className={`w-full px-3 py-2 ${errors.description ? 'border-red-500' : 'border-gray-300'} border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors`}
                    disabled={isLoading}
                />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>

            <div className="flex items-center pt-2">
                <input
                    type="checkbox"
                    name="received"
                    id="received"
                    checked={formData.received}
                    onChange={handleChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    disabled={isLoading}
                />
                <label htmlFor="received" className="ml-2 text-sm text-gray-700 font-medium">
                    Otrzymano (Płatność Zrealizowana)
                </label>
            </div>

            <div className="flex space-x-3 pt-6 border-t border-gray-100">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center shadow-md text-lg"
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    ) : (
                        '💾' 
                    )}
                    {isUpdating ? 'Zapisz zmiany' : 'Dodaj Przychód'}
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
        </form>
    );
};

const getProfitTypeDetails = (type) => {
    const profit = PROFIT_TYPES.find(p => p.value === type);
    return profit
        ? { label: profit.label, icon: profit.icon, color: profit.color }
        : { label: 'Nieznany', icon: '❓', color: 'bg-gray-50 text-gray-700 border-gray-200' };
};

const ProfitCard = ({ profit, onEdit, onDelete, sectors }) => {
    const typeDetails = getProfitTypeDetails(profit.profitType);
    const isReceived = profit.received;
    const profitDate = new Date(profit.createdAt).toLocaleDateString('pl-PL');
    const assignedSector = profit.sectorEntity || null;

    return (
        <div className={`bg-white border-2 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 ${isReceived ? 'border-green-300' : 'border-amber-300'}`}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl ${typeDetails.color.split(' ')[0]} border ${typeDetails.color.split(' ')[2]}`}>
                        {typeDetails.icon}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800">
                            {profit.profit.toFixed(2)} PLN
                        </h3>
                        <p className="text-sm text-gray-500">{profitDate}</p>
                    </div>
                </div>
                
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => onEdit(profit)}
                        className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors text-base"
                        title="Edytuj"
                    >
                        ✏️
                    </button>
                    <button
                        onClick={() => onDelete(profit.purchaseId)}
                        className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors text-base"
                        title="Usuń"
                    >
                        🗑️
                    </button>
                </div>
            </div>

            <div className="mb-4 space-x-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${typeDetails.color}`}>
                    {typeDetails.label}
                </span>
                {isReceived ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Otrzymano
                    </span>
                ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        Oczekujące
                    </span>
                )}
            </div>

            {assignedSector && (
                <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-600 font-medium">
                        Sektor: {assignedSector.description || `Sektor ${assignedSector.id}`}
                        {assignedSector.plantType && ` (${assignedSector.plantType})`}
                    </p>
                </div>
            )}

            <div className="pt-4 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-500 uppercase mb-1">Opis</p>
                <p className="text-base text-gray-900 line-clamp-2">{profit.description || 'Brak opisu.'}</p>
            </div>
        </div>
    );
};

const StatCard = ({ label, color, amount }) => {
    const colorMap = {
        green: { bg: 'from-green-100 to-green-200', text: 'text-green-600', icon: '✅' },
        amber: { bg: 'from-amber-100 to-amber-200', text: 'text-amber-600', icon: '⏳' },
        blue: { bg: 'from-blue-100 to-blue-200', text: 'text-blue-600', icon: '📊' }
    };
    const colors = colorMap[color] || colorMap.blue;

    return (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center space-x-4">
                <div className={`w-14 h-14 bg-gradient-to-br ${colors.bg} rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl`}>
                    {colors.icon}
                </div>
                <div>
                    <p className="text-3xl font-extrabold text-gray-900">{amount.toFixed(2)} PLN</p>
                    <p className="text-sm text-gray-500">{label}</p>
                </div>
            </div>
        </div>
    );
};

export default function ProfitManagement() {
    const [allProfits, setAllProfits] = useState([]);
    const [sectors, setSectors] = useState([]);
    const [selectedType, setSelectedType] = useState('');
    const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('');
    const [selectedSectorId, setSelectedSectorId] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(15);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProfit, setSelectedProfit] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [alert, setAlert] = useState({ type: '', message: '' });

    const closeAlert = useCallback(() => setAlert({ type: '', message: '' }), []);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedType, selectedPaymentStatus, selectedSectorId, selectedYear, selectedMonth, searchTerm]);

    const fetchProfits = useCallback(async () => {
        setIsLoading(true);
        let allData = [];
        let currentPage = 0;
        let totalPages = 1;
        
        try {
            while (currentPage < totalPages) {
                const response = await fetch(
                    `${BACKEND_URL}/api/profits?page=${currentPage}&size=100`,
                    { method: 'GET', headers: getAuthHeaders() }
                );
                
                if (response.ok) {
                    const data = await response.json();
                    allData = [...allData, ...data.content];
                    totalPages = data.totalPages;
                    currentPage++;
                } else break;
            }
            
            setAllProfits(allData);
        } catch (error) {
            setAlert({ type: 'error', message: 'Błąd ładowania przychodów' });
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchSectors = useCallback(async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/sectors`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                const data = await response.json();
                setSectors(Array.isArray(data) ? data : []);
            } else {
                setSectors([]);
            }
        } catch (error) {
            setSectors([]);
        }
    }, []);

    useEffect(() => {
        fetchProfits();
        fetchSectors();
    }, [fetchProfits, fetchSectors]);

    const handleSaveProfit = useCallback(async (profitData) => {
        setIsLoading(true);
        closeAlert();
        
        const isUpdate = !!selectedProfit;
        const endpoint = isUpdate 
            ? `${BACKEND_URL}/api/profits/${selectedProfit.purchaseId}` 
            : `${BACKEND_URL}/api/profits`;
        const method = isUpdate ? 'PUT' : 'POST';

        try {
            const response = await fetch(endpoint, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify(profitData),
            });

            if (response.ok) {
                setAlert({ type: 'success', message: `Przychód został ${isUpdate ? 'zaktualizowany' : 'dodany'} pomyślnie!` });
                closeModal();
                fetchProfits();
            } else {
                const error = await response.json();
                setAlert({ type: 'error', message: `Błąd zapisu: ${error.message || response.statusText}` });
            }
        } catch (error) {
            setAlert({ type: 'error', message: 'Błąd sieci: Nie można zapisać przychodu.' });
        } finally {
            setIsLoading(false);
        }
    }, [selectedProfit, fetchProfits, closeAlert]);

    const handleDeleteProfit = useCallback(async (profitId) => {
        if (!window.confirm('Czy na pewno chcesz usunąć ten przychód? Tej operacji nie można cofnąć!')) return;
        closeAlert();
        
        try {
            const response = await fetch(`${BACKEND_URL}/api/profits/${profitId}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                setAlert({ type: 'success', message: 'Przychód został usunięty pomyślnie.' });
                fetchProfits();
            } else {
                const error = await response.json();
                setAlert({ type: 'error', message: `Błąd usuwania: ${error.message || response.statusText}` });
            }
        } catch (error) {
            setAlert({ type: 'error', message: 'Błąd sieci: Nie można usunąć przychodu.' });
        }
    }, [fetchProfits, closeAlert]);

    const openModal = useCallback((profit = null) => {
        setSelectedProfit(profit);
        setIsModalOpen(true);
        closeAlert();
    }, [closeAlert]);

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        setSelectedProfit(null);
    }, []);
    
    const filteredProfits = useMemo(() => {
        let list = allProfits;

        if (selectedType) {
            list = list.filter(p => p.profitType === selectedType);
        }

        if (selectedPaymentStatus) {
            if (selectedPaymentStatus === 'received') {
                list = list.filter(p => p.received === true);
            } else if (selectedPaymentStatus === 'pending') {
                list = list.filter(p => p.received === false);
            }
        }

        if (selectedSectorId) {
            list = list.filter(p => p.sectorEntity?.id === Number(selectedSectorId));
        }

        if (selectedYear) {
            list = list.filter(p => {
                const profitYear = new Date(p.createdAt).getFullYear();
                return profitYear === Number(selectedYear);
            });
        }

        if (selectedMonth) {
            list = list.filter(p => {
                const profitMonth = new Date(p.createdAt).getMonth() + 1;
                return profitMonth === Number(selectedMonth);
            });
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            list = list.filter(p =>
                (p.description?.toLowerCase().includes(term)) ||
                (p.profit?.toString().includes(term)) ||
                (p.createdAt?.includes(term)) ||
                (getProfitTypeDetails(p.profitType).label.toLowerCase().includes(term))
            );
        }
        
        return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); 
    }, [allProfits, selectedType, selectedPaymentStatus, selectedSectorId, selectedYear, selectedMonth, searchTerm]);

    const totalPages = Math.ceil(filteredProfits.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProfits = filteredProfits.slice(startIndex, endIndex);

    const handlePageChange = useCallback((newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [totalPages]);
    
    const filteredStats = useMemo(() => {
        const total = filteredProfits.reduce((sum, p) => sum + p.profit, 0);
        const received = filteredProfits.filter(p => p.received).reduce((sum, p) => sum + p.profit, 0);
        const pending = total - received;
        
        return { total, received, pending };
    }, [filteredProfits]);

    const selectedSectorName = useMemo(() => {
        if (!selectedSectorId) return null;
        const sector = sectors.find(s => s.id === Number(selectedSectorId));
        return sector ? (sector.description || `Sektor ${sector.id}`) : null;
    }, [selectedSectorId, sectors]);

    const hasActiveFilters = selectedType || selectedPaymentStatus || selectedSectorId || selectedYear || selectedMonth || searchTerm;

    const Pagination = ({ currentPage, totalPages, onPageChange }) => {
        if (totalPages <= 1) return null;

        const getPageNumbers = () => {
            const pages = [];
            const maxVisible = 5;
            
            if (totalPages <= maxVisible) {
                for (let i = 1; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                if (currentPage <= 3) {
                    for (let i = 1; i <= 4; i++) pages.push(i);
                    pages.push('...');
                    pages.push(totalPages);
                } else if (currentPage >= totalPages - 2) {
                    pages.push(1);
                    pages.push('...');
                    for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
                } else {
                    pages.push(1);
                    pages.push('...');
                    for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                    pages.push('...');
                    pages.push(totalPages);
                }
            }
            
            return pages;
        };

        return (
            <div className="flex items-center justify-center gap-2 mt-8 pb-4">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-green-500 disabled:hover:bg-white disabled:hover:border-gray-300"
                >
                    ← Poprzednia
                </button>
                
                <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, index) => (
                        page === '...' ? (
                            <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-400">...</span>
                        ) : (
                            <button
                                key={page}
                                onClick={() => onPageChange(page)}
                                className={`min-w-[40px] h-[40px] rounded-lg font-semibold transition-all ${
                                    currentPage === page
                                        ? 'bg-gradient-to-r from-green-600 to-emerald-700 text-white shadow-lg scale-110'
                                        : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-green-500'
                                }`}
                            >
                                {page}
                            </button>
                        )
                    ))}
                </div>
                
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-green-500 disabled:hover:bg-white disabled:hover:border-gray-300"
                >
                    Następna →
                </button>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 p-6 font-sans">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-2 flex items-center">
                        <span className="text-green-600 mr-3">💰</span>
                        Zarządzanie Przychodami
                    </h1>
                    <p className="text-gray-600 text-lg flex items-center">
                        Monitoruj przychody ze sprzedaży owoców i innych źródeł. 💵
                    </p>
                </header>
                
                {alert.message && (
                    <Alert type={alert.type} message={alert.message} onClose={closeAlert} />
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard 
                        amount={filteredStats.total} 
                        label={hasActiveFilters ? "Suma Przefiltrowanych" : "Całkowite Przychody"} 
                        color="blue"
                    />
                    <StatCard 
                        amount={filteredStats.received} 
                        label={hasActiveFilters ? "Otrzymane (Przefiltrowane)" : "Przychody Otrzymane"} 
                        color="green"
                    />
                    <StatCard 
                        amount={filteredStats.pending} 
                        label={hasActiveFilters ? "Oczekujące (Przefiltrowane)" : "Przychody Oczekujące"} 
                        color="amber" 
                    />
                </div>

                {hasActiveFilters && (
                    <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-4 mb-6 shadow-md">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-purple-900 mb-2 flex items-center">
                                    <span className="mr-2">🔍</span>
                                    Aktywne Filtry
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {selectedType && (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                            Typ: {PROFIT_TYPES.find(t => t.value === selectedType)?.label}
                                        </span>
                                    )}
                                    {selectedPaymentStatus && (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                            Status: {PAYMENT_STATUS_OPTIONS.find(o => o.value === selectedPaymentStatus)?.label}
                                        </span>
                                    )}
                                    {selectedSectorId && selectedSectorName && (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                            🗺️ Sektor: {selectedSectorName}
                                        </span>
                                    )}
                                    {selectedYear && (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                            📅 Rok: {selectedYear}
                                        </span>
                                    )}
                                    {selectedMonth && (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                            📆 Miesiąc: {MONTH_OPTIONS.find(m => m.value === selectedMonth)?.label}
                                        </span>
                                    )}
                                    {searchTerm && (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                            Szukaj: "{searchTerm}"
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedType('');
                                    setSelectedPaymentStatus('');
                                    setSelectedSectorId('');
                                    setSelectedYear('');
                                    setSelectedMonth('');
                                    setSearchTerm('');
                                }}
                                className="ml-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors text-sm whitespace-nowrap"
                            >
                                Wyczyść Filtry
                            </button>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-lg border border-green-100 mb-8">
                    <div className="p-6 space-y-6">
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">
                                🔍 Wyszukiwanie w przychodach
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">🔍</span>
                                <input
                                    type="text"
                                    placeholder="Wpisz opis, kwotę, datę lub typ przychodu..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        title="Wyczyść wyszukiwanie"
                                    >
                                        ❌
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide">
                                        Typ przychodu
                                    </label>
                                    <select
                                        value={selectedType}
                                        onChange={(e) => setSelectedType(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors shadow-sm"
                                    >
                                        <option value="">🍎 Wszystkie typy</option>
                                        {PROFIT_TYPES.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide">
                                        Status płatności
                                    </label>
                                    <select
                                        value={selectedPaymentStatus}
                                        onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors shadow-sm"
                                    >
                                        {PAYMENT_STATUS_OPTIONS.map(option => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide">
                                        Sektor 🗺️
                                    </label>
                                    <select
                                        value={selectedSectorId}
                                        onChange={(e) => setSelectedSectorId(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors shadow-sm"
                                    >
                                        <option value="">📋 Wszystkie sektory</option>
                                        {sectors.map(sector => (
                                            <option key={sector.id} value={sector.id}>
                                                {sector.description || `Sektor ${sector.id}`}
                                                {sector.plantType && ` - ${sector.plantType}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide">
                                        Rok 📅
                                    </label>
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors shadow-sm"
                                    >
                                        <option value="">📆 Wszystkie lata</option>
                                        {generateYearOptions().map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide">
                                        Miesiąc 📆
                                    </label>
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors shadow-sm"
                                    >
                                        {MONTH_OPTIONS.map(option => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>                            
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <button
                                onClick={() => openModal()}
                                className="w-full md:w-auto bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl group"
                            >
                                <span className="text-xl group-hover:scale-110 transition-transform">+</span>
                                <span>Dodaj Nowy Przychód</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                            Lista Przychodów
                        </h2>
                        <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-lg font-medium">
                            Wyświetlono: {startIndex + 1}-{Math.min(endIndex, filteredProfits.length)} z {filteredProfits.length}
                            {filteredProfits.length !== allProfits.length && ` (przefiltrowano z ${allProfits.length})`}
                        </div>
                    </div>
                    
                    {isLoading ? (
                        <LoadingState />
                    ) : filteredProfits.length === 0 ? (
                        <EmptyState 
                            searchTerm={searchTerm || selectedType || selectedPaymentStatus || selectedSectorId || selectedYear || selectedMonth} 
                            profitsCount={allProfits.length}
                            onAddClick={openModal} 
                        />
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {paginatedProfits.map((profit) => (
                                    <ProfitCard
                                        key={profit.purchaseId}
                                        profit={profit}
                                        onEdit={openModal}
                                        onDelete={handleDeleteProfit}
                                        sectors={sectors}
                                    />
                                ))}
                            </div>
                            
                            <Pagination 
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                            />
                        </>
                    )}
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={selectedProfit ? 'Edytuj Przychód' : 'Dodaj Nowy Przychód'}
            >
                <ProfitForm
                    profit={selectedProfit}
                    onSave={handleSaveProfit}
                    onCancel={closeModal}
                    isLoading={isLoading}
                    sectors={sectors}
                />
            </Modal>
        </div>
    );
}