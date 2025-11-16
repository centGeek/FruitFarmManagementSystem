import React, { useState, useEffect, useMemo, useCallback } from 'react';

import { BACKEND_URL, getAuthHeaders } from "../utils/apiConfigs";
import {formatCurrency, Alert} from "../utils/common"


const EXPENSE_TYPES = [
  // 🌱 Produkcja i pielęgnacja sadu
  { value: 'ŚRODKI_OCHRONY_ROŚLIN', label: 'Opryski / Środki ochrony roślin', icon: '🧴', color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'NAWOZY', label: 'Nawozy', icon: '🌾', color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'SADZENIE', label: 'Sadzenie / Nowe drzewka', icon: '🌳', color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'NAWADNIANIE', label: 'Nawadnianie / System nawadniania', icon: '💧', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'ENERGIA_ELEKTRYCZNA', label: 'Prąd', icon: '⚡', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { value: 'WODA', label: 'Woda', icon: '💧', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'MATERIAŁY_POMOCNICZE', label: 'Paliki / Druty / Rusztowania', icon: '🪵', color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'SIATKI_OCHRONNE', label: 'Siatki / Folie / Agrowłóknina', icon: '🕸️', color: 'bg-green-50 text-green-700 border-green-200' },

  // 🧰 Sprzęt i eksploatacja
  { value: 'MASZYNY', label: 'Maszyny / Sprzęt', icon: '🚜', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'NAPRAWY', label: 'Naprawy / Części zamienne', icon: '🔧', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'PALIWO', label: 'Paliwo / Oleje / Smary', icon: '⛽', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { value: 'UBEZPIECZENIE', label: 'Ubezpieczenia (maszyny, sad)', icon: '🧾', color: 'bg-gray-50 text-gray-700 border-gray-200' },

  // 👨‍🌾 Praca i usługi
  { value: 'PRACA', label: 'Pracownicy sezonowi', icon: '💼', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'ZAKWATEROWANIE', label: 'Zakwaterowanie / Wyżywienie pracowników', icon: '🏠🍽️', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'USŁUGI_ROLNICZE', label: 'Usługi rolnicze / Analizy gleby', icon: '🧪', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'TRANSPORT', label: 'Transport / Logistyka', icon: '🚚', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'SZKOLENIA', label: 'Szkolenia / Doradztwo / Certyfikaty', icon: '🎓', color: 'bg-purple-50 text-purple-700 border-purple-200' },

  // 🍎 Zbiory i sprzedaż
  { value: 'OPAKOWANIA', label: 'Opakowania / Skrzynki / Kartony', icon: '📦', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { value: 'CHŁODNIA', label: 'Chłodnia / Przechowalnia', icon: '🧊', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'MARKETING', label: 'Marketing / Sprzedaż / Prowizje', icon: '💰', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { value: 'BIURO', label: 'Materiały biurowe / Telefon / Internet', icon: '📱', color: 'bg-gray-50 text-gray-700 border-gray-200' },

  // 🏗️ Inwestycje i infrastruktura
  { value: 'REMONTY', label: 'Renowacje / Inwestycje w sadzie', icon: '🧱', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'INFRASTRUKTURA', label: 'Drogi / Ogrodzenia / Budynki', icon: '🚧', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'MODERNIZACJE_TECHNICZNE', label: 'Modernizacje / Nowe technologie', icon: '⚙️', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },

  // 💸 Podatki i administracja
  { value: 'PODATKI', label: 'Podatki / Opłaty / KRUS', icon: '💸', color: 'bg-red-50 text-red-700 border-red-200' },
  { value: 'KSIĘGOWOŚĆ', label: 'Księgowość / Biuro rachunkowe', icon: '📊', color: 'bg-red-50 text-red-700 border-red-200' },

  // 🪙 Drobne i inne wydatki
  { value: 'INNE_MATERIAŁY', label: 'Inne zaopatrzenie', icon: '🛒', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'INNE', label: 'Inne wydatki', icon: '🪙', color: 'bg-gray-50 text-gray-700 border-gray-200' },
];


const PAYMENT_STATUS_OPTIONS = [
    { value: '', label: 'Wszystkie 📋' },
    { value: 'paid', label: 'Opłacone ✅' },
    { value: 'unpaid', label: 'Nieopłacone ⏳' }
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
                <div className="sticky top-0 bg-red-50 border-b border-red-200 px-6 py-4 rounded-t-2xl z-10">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center">
                            <span className="mr-2 text-red-600">💰</span>
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-red-100 rounded-xl transition-colors text-lg"
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
                className={`w-full px-3 py-2 ${error ? 'border-red-500' : 'border-gray-300'} border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors`}
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
        <div className="w-14 h-14 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-6"></div>
        <p className="text-gray-500 text-xl font-medium">Ładowanie wydatków... 🔄</p>
    </div>
);

const EmptyState = ({ searchTerm, expensesCount, onAddClick }) => {
    let title, message;

    if (searchTerm) {
        title = 'Brak wyników wyszukiwania';
        message = 'Spróbuj zmienić kryteria wyszukiwania lub filtry.';
    } else if (expensesCount === 0) {
        title = 'Brak zarejestrowanych wydatków';
        message = 'Dodaj pierwszy wydatek, aby rozpocząć monitorowanie kosztów.';
    } else {
        title = 'Brak wydatków spełniających kryteria';
        message = 'Zmień filtry, aby wyświetlić wydatki.';
    }

    return (
        <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">
                💸
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">{message}</p>
            {expensesCount === 0 && (
                <button
                    onClick={onAddClick}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-md flex items-center justify-center mx-auto"
                >
                    <span className="inline mr-2 text-xl">+</span>
                    Dodaj pierwszy wydatek
                </button>
            )}
        </div>
    );
};

const ExpenseForm = ({ expense, onSave, onCancel, isLoading, sectors }) => {
    const isUpdating = !!expense;
    const today = new Date().toISOString().split('T')[0];

    const initialState = useMemo(() => ({
    id: expense?.id || null,
    date: expense?.createdAt || today,
    amount: expense?.amount?.toString() || '',
    type: expense?.type || EXPENSE_TYPES[0].value,
    description: expense?.description || '',
    paid: expense?.paid ?? true,
    sectorId: expense?.sectorDTO?.id?.toString() || '',
}), [expense, today]);

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
        
        if (!formData.date.trim()) newErrors.date = 'Data wydatku jest wymagana';
        if (!formData.amount || isNaN(amountNum) || amountNum <= 0) {
            newErrors.amount = 'Kwota musi być dodatnią liczbą';
        }
        if (!formData.type) newErrors.type = 'Typ wydatku jest wymagany';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        if (validate()) {
            const submitData = {
                ...formData,
                amount: Number(formData.amount),
                createdAt: formData.date,
                sectorDTO: formData.sectorId ? { id: Number(formData.sectorId) } : null
            };
            delete submitData.sectorId;
            onSave(submitData);
        }
    }, [validate, formData, onSave]);

    const selectedSector = sectors?.find(s => s.id === Number(formData.sectorId));

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <InputField 
                label="Data Wydatku" name="date" type="date" required 
                value={formData.date} error={errors.date}
                handleChange={handleChange} isLoading={isLoading}
            />

            <InputField 
                label="Kwota Wydatku (PLN)" name="amount" type="number" required 
                value={formData.amount} error={errors.amount}
                handleChange={handleChange} isLoading={isLoading}
                step="0.01" min="0.01"
            />

            <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                    Typ Wydatku *
                </label>
                <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 ${errors.type ? 'border-red-500' : 'border-gray-300'} border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white`}
                    disabled={isLoading}
                >
                    {EXPENSE_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                </select>
                {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
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
                    className="w-full px-3 py-2 border-gray-300 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white"
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
                        📍 Wydatek zostanie przypisany do: <strong>{selectedSector.description || `Sektor ${selectedSector.id}`}</strong>
                    </div>
                )}
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Opis Wydatku
                </label>
                <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    className={`w-full px-3 py-2 ${errors.description ? 'border-red-500' : 'border-gray-300'} border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors`}
                    disabled={isLoading}
                />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>

            <div className="flex items-center pt-2">
                <input
                    type="checkbox"
                    name="paid"
                    id="paid"
                    checked={formData.paid}
                    onChange={handleChange}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    disabled={isLoading}
                />
                <label htmlFor="paid" className="ml-2 text-sm text-gray-700 font-medium">
                    Opłacone (Płatność Zrealizowana)
                </label>
            </div>

            <div className="flex space-x-3 pt-6 border-t border-gray-100">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center shadow-md text-lg"
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    ) : (
                        '💾' 
                    )}
                    {isUpdating ? 'Zapisz zmiany' : 'Dodaj Wydatek'}
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

const getExpenseTypeDetails = (type: string) => {
  const expense = EXPENSE_TYPES.find(exp => exp.value === type);

  return expense
    ? { label: expense.label, icon: expense.icon, color: expense.color }
    : { label: 'Nieznany', icon: '❓', color: 'bg-gray-50 text-gray-700 border-gray-200' };
};


const ExpenseCard = ({ expense, onEdit, onDelete, sectors }) => {
    const typeDetails = getExpenseTypeDetails(expense.type);
    const isPaid = expense.paid;
    const expenseDate = new Date(expense.createdAt).toLocaleDateString('pl-PL');
    const assignedSector = expense.sectorDTO || null;

    return (
        <div className={`bg-white border-2 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 ${isPaid ? 'border-green-300' : 'border-red-300'}`}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl ${typeDetails.color.split(' ')[0]} border ${typeDetails.color.split(' ')[2]}`}>
                        {typeDetails.icon}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800">
                            {formatCurrency(expense.amount)} PLN
                        </h3>
                        <p className="text-sm text-gray-500">{expenseDate}</p>
                    </div>
                </div>
                
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => onEdit(expense)}
                        className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors text-base"
                        title="Edytuj"
                    >
                        ✏️
                    </button>
                    <button
                        onClick={() => onDelete(expense.id)}
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
                {isPaid ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Opłacony
                    </span>
                ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        Nieopłacony
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
                <p className="text-base text-gray-900 line-clamp-2">{expense.description || 'Brak opisu.'}</p>
            </div>
        </div>
    );
};

const StatCard = ({ count, label, color, amount }) => {
    const colorMap = {
        green: { bg: 'from-green-100 to-green-200', text: 'text-green-600', icon: '✅' },
        red: { bg: 'from-red-100 to-red-200', text: 'text-red-600', icon: '💸' },
        blue: { bg: 'from-blue-100 to-blue-200', text: 'text-blue-600', icon: '📊' },
        purple: { bg: 'from-purple-100 to-purple-200', text: 'text-purple-600', icon: '🧑‍🌾' }
    };
    const colors = colorMap[color] || colorMap.red;
    
    const displayValue = amount !== undefined 
        ? `${formatCurrency(amount)} PLN` 
        : count;

    return (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center space-x-4">
                <div className={`w-14 h-14 bg-gradient-to-br ${colors.bg} rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl`}>
                    {colors.icon}
                </div>
                <div>
                    <p className="text-3xl font-extrabold text-gray-900">{displayValue}</p>
                    <p className="text-sm text-gray-500">{label}</p>
                </div>
            </div>
        </div>
    );
};

export default function ExpenseManagement() {
    const [allExpenses, setAllExpenses] = useState([]);
    const [sectors, setSectors] = useState([]);
    const [selectedType, setSelectedType] = useState('');
    const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('');
    const [selectedSectorId, setSelectedSectorId] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [selectedMonth, setSelectedMonth] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(15);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [alert, setAlert] = useState({ type: '', message: '' });
    const [sectorLaborCosts, setSectorLaborCosts] = useState(null);
    const [advancesSum, setAdvancesSum] = useState(null);
    const [isLoadingLaborCosts, setIsLoadingLaborCosts] = useState(false);


    const closeAlert = useCallback(() => setAlert({ type: '', message: '' }), []);

useEffect(() => {
    setCurrentPage(1);
}, [selectedType, selectedPaymentStatus, selectedSectorId, selectedYear, selectedMonth, searchTerm]);

    const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    let allData = [];
    let currentPage = 0;
    let totalPages = 1;
    
    try {
        while (currentPage < totalPages) {
            const response = await fetch(
                `${BACKEND_URL}/api/expenses?page=${currentPage}&size=100`,
                { method: 'GET', headers: getAuthHeaders() }
            );
            
            if (response.ok) {
                const data = await response.json();
                allData = [...allData, ...data.content];
                totalPages = data.totalPages;
                currentPage++;
            } else break;
        }
        
        setAllExpenses(allData);
    } catch (error) {
        setAlert({ type: 'error', message: 'Błąd ładowania wydatków' });
    } finally {
        setIsLoading(false);
    }
}, []);
const fetchData = useCallback(async (setter, endpoint, entityName) => {
    console.log(`[FETCH] Rozpoczynam pobieranie ${entityName} z: ${BACKEND_URL}${endpoint}`);
    try {
        const headers = getAuthHeaders();
        console.log(`[FETCH] Headers dla ${entityName}:`, headers);
        
        const response = await fetch(`${BACKEND_URL}${endpoint}`, {
            method: 'GET',
            headers: headers,
        });

        console.log(`[FETCH] Odpowiedź serwera dla ${entityName} - Status: ${response.status} ${response.statusText}`);

        if (response.ok) {
            const data = await response.json();
            console.log(`[FETCH] ✅ Załadowano ${entityName}:`, data);
            setter(Array.isArray(data) ? data : []);
        } else {
            const errorText = await response.text();
            console.error(`[FETCH] ❌ Błąd HTTP dla ${entityName}: ${response.status}`, errorText);
            setAlert({ 
                type: 'warning', 
                message: `Nie udało się załadować ${entityName} (${response.status}). Możesz dodawać wydatki bez przypisania do sektora.` 
            });
            setter([]);
        }
    } catch (error) {
        console.error(`[FETCH] ❌ Błąd połączenia dla ${entityName}:`, error);
        setAlert({ 
            type: 'warning', 
            message: `Nie można połączyć z API ${entityName}. Wydatki można dodawać bez przypisania do sektora.` 
        });
        setter([]);
    }
}, []);

const fetchSectors = useCallback(() => {
    fetchData(setSectors, '/api/sectors', 'sektorów');
}, [fetchData]);


    const handleSaveExpense = useCallback(async (expenseData) => {
        setIsLoading(true);
        closeAlert();
        
        const isUpdate = !!selectedExpense;
        const endpoint = isUpdate 
            ? `${BACKEND_URL}/api/expenses/${selectedExpense.id}` 
            : `${BACKEND_URL}/api/expenses`;
        const method = isUpdate ? 'PUT' : 'POST';

        try {
            const response = await fetch(endpoint, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify(expenseData),
            });

            if (response.ok) {
                setAlert({ type: 'success', message: `Wydatek został ${isUpdate ? 'zaktualizowany' : 'dodany'} pomyślnie!` });
                closeModal();
                fetchExpenses();
            } else {
                const error = await response.json();
                setAlert({ type: 'error', message: `Błąd zapisu (${response.status}): ${error.message || error.error || response.statusText}` });
            }
        } catch (error) {
            setAlert({ type: 'error', message: `Błąd sieci: Nie można zapisać wydatku.` });
        } finally {
            setIsLoading(false);
        }
    }, [selectedExpense, fetchExpenses, closeAlert]);

    const fetchSectorLaborCosts = useCallback(async () => {
    console.log('🔍 [LABOR] START');
    console.log('🔍 [LABOR] selectedSectorId:', selectedSectorId);
    console.log('🔍 [LABOR] selectedYear:', selectedYear);
    console.log('🔍 [LABOR] selectedMonth:', selectedMonth);
    
    setIsLoadingLaborCosts(true);
    
    try {
        const params = new URLSearchParams();

        // Jeśli wybrany konkretny sektor - pobierz tylko dla niego
        if (selectedSectorId && selectedSectorId !== '') {
            params.append('sectorId', selectedSectorId);
            
            if (selectedYear) params.append('year', selectedYear);
            if (selectedMonth) params.append('month', selectedMonth);
            
            const url = `${BACKEND_URL}/api/expenses/sector-labor-costs?${params}`;
            console.log('📡 [LABOR] URL (konkretny sektor):', url);
            
            const response = await fetch(url, { 
                method: 'GET', 
                headers: getAuthHeaders() 
            });
            
            console.log('📨 [LABOR] Response:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ [LABOR] Data:', data);
                setSectorLaborCosts(data);
            } else {
                const errorText = await response.text();
                console.error('❌ [LABOR] Error:', response.status, errorText);
                setSectorLaborCosts(null);
            }
        } else {
            // Jeśli "Wszystkie sektory" - sumuj wszystkie
            console.log('📊 [LABOR] Sumowanie wszystkich sektorów + bez sektora');
            
            // Pobierz listę wszystkich sektorów
            const sectorsListResponse = await fetch(`${BACKEND_URL}/api/sectors`, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            
            if (!sectorsListResponse.ok) {
                throw new Error('Nie można pobrać listy sektorów');
            }
            
            const sectorsList = await sectorsListResponse.json();
            console.log('📋 [LABOR] Lista sektorów:', sectorsList);
            
            // Tablica do przechowania wszystkich obietnic zapytań
            const fetchPromises = [];
            
            // Zapytanie dla wpisów BEZ sektora
            const paramsNoSector = new URLSearchParams();
            if (selectedYear) paramsNoSector.append('year', selectedYear);
            if (selectedMonth) paramsNoSector.append('month', selectedMonth);
            
            fetchPromises.push(
                fetch(`${BACKEND_URL}/api/expenses/sector-labor-costs?${paramsNoSector}`, {
                    method: 'GET',
                    headers: getAuthHeaders()
                }).then(r => r.json())
            );
            
            // Zapytania dla każdego sektora osobno
            sectorsList.forEach(sector => {
                const paramsSector = new URLSearchParams();
                paramsSector.append('sectorId', sector.id);
                if (selectedYear) paramsSector.append('year', selectedYear);
                if (selectedMonth) paramsSector.append('month', selectedMonth);
                
                fetchPromises.push(
                    fetch(`${BACKEND_URL}/api/expenses/sector-labor-costs?${paramsSector}`, {
                        method: 'GET',
                        headers: getAuthHeaders()
                    }).then(r => r.json())
                );
            });
            
            // Czekaj na wszystkie odpowiedzi
            const results = await Promise.all(fetchPromises);
            console.log('✅ [LABOR] Wszystkie wyniki:', results);
            
            // Sumuj wszystkie koszty
            const totalLaborCost = results.reduce((sum, r) => sum + (r.sectorLaborCost || 0), 0);
            const totalPaidCost = results.reduce((sum, r) => sum + (r.paidLaborCost || 0), 0);
            const totalUnpaidCost = results.reduce((sum, r) => sum + (r.unpaidLaborCost || 0), 0);
            const totalPaidEntries = results.reduce((sum, r) => sum + (r.paidEntries || 0), 0);
            const totalUnpaidEntries = results.reduce((sum, r) => sum + (r.unpaidEntries || 0), 0);
            
            const aggregatedData = {
                sectorName: '',
                sectorLaborCost: totalLaborCost,
                paidLaborCost: totalPaidCost,
                unpaidLaborCost: totalUnpaidCost,
                paidEntries: totalPaidEntries,
                unpaidEntries: totalUnpaidEntries
            };
            
            console.log('📊 [LABOR] Zagregowane dane:', aggregatedData);
            setSectorLaborCosts(aggregatedData);
        }
    } catch (error) {
        console.error('❌ [LABOR] Exception:', error);
        setSectorLaborCosts(null);
    } finally {
        setIsLoadingLaborCosts(false);
    }
    try {
    const advancesResponse = await fetch(`${BACKEND_URL}/api/advances/user/sum-unsettled`, { 
        method: 'GET', 
        headers: getAuthHeaders() 
    });
    
    if (advancesResponse.ok) {
        const data = await advancesResponse.json();
        console.log('✅ [Advances] Data:', data);
        setAdvancesSum(data.amount || 0);
    } else {
        console.error('❌ [Advances] Error:', advancesResponse.status);
        setAdvancesSum(null);
    }
} catch (error) {
    console.error('❌ [Advances] Exception:', error);
    setAdvancesSum(null);
}
}, [selectedSectorId, selectedYear, selectedMonth]);

useEffect(() => {
    fetchExpenses();
    fetchSectors();
}, [fetchExpenses, fetchSectors]);

useEffect(() => {
    fetchSectorLaborCosts();
}, [fetchSectorLaborCosts]);


    const handleDeleteExpense = useCallback(async (expenseId) => {
        if (!window.confirm('Czy na pewno chcesz usunąć ten wydatek? Tej operacji nie można cofnąć!')) return;
        closeAlert();
        
        try {
            const response = await fetch(`${BACKEND_URL}/api/expenses/${expenseId}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                setAlert({ type: 'success', message: 'Wydatek został usunięty pomyślnie.' });
                fetchExpenses();
            } else {
                const error = await response.json();
                setAlert({ type: 'error', message: `Błąd usuwania: ${error.message || error.error || response.statusText}` });
            }
        } catch (error) {
            setAlert({ type: 'error', message: 'Błąd sieci: Nie można usunąć wydatku.' });
        }
    }, [fetchExpenses, closeAlert]);

    const openModal = useCallback((expense = null) => {
        setSelectedExpense(expense);
        setIsModalOpen(true);
        closeAlert();
    }, [closeAlert]);

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        setSelectedExpense(null);
    }, []);
    
const filteredExpenses = useMemo(() => {
    let list = allExpenses;

    if (selectedType) {
        list = list.filter(exp => exp.type === selectedType);
    }

    if (selectedPaymentStatus) {
        if (selectedPaymentStatus === 'paid') {
            list = list.filter(exp => exp.paid === true);
        } else if (selectedPaymentStatus === 'unpaid') {
            list = list.filter(exp => exp.paid === false);
        }
    }

    if (selectedSectorId) {
        // Konkretny sektor
        list = list.filter(exp => exp.sectorDTO?.id === Number(selectedSectorId));
    }

    if (selectedYear) {
    list = list.filter(exp => {
        const expenseYear = new Date(exp.createdAt).getFullYear();
        return expenseYear === Number(selectedYear);
    });
}

if (selectedMonth) {
    list = list.filter(exp => {
        const expenseMonth = new Date(exp.createdAt).getMonth() + 1; // getMonth() zwraca 0-11
        return expenseMonth === Number(selectedMonth);
    });
}

if (searchTerm) {
    const term = searchTerm.toLowerCase();
        list = list.filter(exp =>
            (exp.description?.toLowerCase().includes(term)) ||
            (exp.amount?.toString().includes(term)) ||
            (exp.createdAt?.includes(term)) ||
            (getExpenseTypeDetails(exp.type).label.toLowerCase().includes(term))
        );
    }
    
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); 
}, [allExpenses, selectedType, selectedPaymentStatus, selectedSectorId, selectedYear, selectedMonth, searchTerm]);

// Obliczenia paginacji
    const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedExpenses = filteredExpenses.slice(startIndex, endIndex);

    const handlePageChange = useCallback((newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [totalPages]);
    
    // Statystyki dla przefiltrowanych wydatków
    const filteredStats = useMemo(() => {
        const total = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const paid = filteredExpenses.filter(exp => exp.paid).reduce((sum, exp) => sum + exp.amount, 0);
        const unpaid = total - paid;
        
        return { total, paid, unpaid };
    }, [filteredExpenses]);

    const selectedSectorName = useMemo(() => {
    if (!selectedSectorId) return null;
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
                className="px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-red-500 disabled:hover:bg-white disabled:hover:border-gray-300"
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
                                    ? 'bg-gradient-to-r from-red-600 to-orange-700 text-white shadow-lg scale-110'
                                    : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-red-500'
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
                className="px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-red-500 disabled:hover:bg-white disabled:hover:border-gray-300"
            >
                Następna →
            </button>
        </div>
    );
};
    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-50 to-orange-100 p-6 font-sans">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        <span className="text-red-600 mr-3">💰</span>
                        Zarządzanie Wydatkami
                    </h1>
                    <p className="text-gray-600 text-lg flex items-center">
                        Monitoruj koszty paliwa, maszyn i zaopatrzenia. 💸
                    </p>
                </header>
                
                {alert.message && (
                    <Alert type={alert.type} message={alert.message} onClose={closeAlert} />
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard 
                        amount={formatCurrency(filteredStats.total)} 
                        label={hasActiveFilters ? "Suma Przefiltrowanych (niepracownicze)" : "Całkowite Wydatki (niepracownicze)"} 
                        color="blue"
                    />
                    <StatCard 
                        amount={formatCurrency(filteredStats.paid)} 
                        label={hasActiveFilters ? "Opłacone (Przefiltrowane, niepracownicze)" : "Wydatki Opłacone (niepracownicze)"} 
                        color="green"
                    />
                    <StatCard 
                        amount={formatCurrency(filteredStats.unpaid)} 
                        label={hasActiveFilters ? "Nieopłacone (Przefiltrowane, niepracownicze)" : "Wydatki Nieopłacone (niepracownicze)"} 
                        color="red" 
                    />
                {isLoadingLaborCosts ? (
                    <div className="col-span-full bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
                        <div className="text-center">
                            <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-500 font-medium">Obliczam koszty pracowników... 🔄</p>
                        </div>
                    </div>
                ) : sectorLaborCosts ? (
                    <>
                        <div className="col-span-full md:col-span-1">
                            <StatCard 
                                amount={sectorLaborCosts.sectorLaborCost || 0} 
                                label={`Łączne koszty pracownicze - ${sectorLaborCosts.sectorName || 'Wszystkie'}`}
                                color="purple"
                            />
                        </div>
                        
                        <div className="col-span-full md:col-span-1">
                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
                            <div className="flex items-center space-x-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl">
                                    ✅
                                </div>
                                <div className="flex-1">
                                    <p className="text-3xl font-extrabold text-gray-900">
                                        {formatCurrency((sectorLaborCosts.paidLaborCost || 0) + (advancesSum || 0))} PLN
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Koszty pracownicze: Opłacone ({sectorLaborCosts.paidEntries || 0} {sectorLaborCosts.paidEntries === 1 ? 'wpis' : 'wpisów'})
                                    </p>
                                    {advancesSum > 0 && (
                                        <p className="text-xs text-green-600 font-medium mt-1">
                                            💰 w tym zaliczki: +{formatCurrency(advancesSum)} PLN
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                        
                      <div className="col-span-full md:col-span-1">
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
        <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl">
                ⚠️
            </div>
            <div className="flex-1">
                {(() => {
                    const unpaidAfterAdvances = (sectorLaborCosts.unpaidLaborCost || 0) - (advancesSum || 0);
                    const isNegative = unpaidAfterAdvances < 0;
                    
                    return (
                        <>
                            <p className={`text-3xl font-extrabold ${isNegative ? 'text-green-600' : 'text-gray-900'}`}>
                                {isNegative ? '-' : ''}{formatCurrency(Math.abs(unpaidAfterAdvances))} PLN
                            </p>
                            <p className="text-sm text-gray-500">
                                Koszty pracownicze: Nieopłacone ({sectorLaborCosts.unpaidEntries || 0} {sectorLaborCosts.unpaidEntries === 1 ? 'wpis' : 'wpisów'})
                            </p>
                            {advancesSum > 0 && (
                                <p className="text-xs text-orange-600 font-medium mt-1">
                                    ⚡ w tym pomniejszone o zaliczki: -{formatCurrency(advancesSum)} PLN
                                </p>
                            )}
                            {isNegative && (
                                <p className="text-xs text-green-600 font-semibold mt-1">
                                    💰 Nadpłata zaliczek
                                </p>
                            )}
                        </>
                    );
                })()}
            </div>
        </div>
    </div>
</div>
                    </>
                ) : null}
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
                                            Typ: {EXPENSE_TYPES.find(t => t.value === selectedType)?.label}
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

                <div className="bg-white rounded-2xl shadow-lg border border-red-100 mb-8">
                    <div className="p-6 space-y-6">
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">
                                🔍 Wyszukiwanie w wydatkach
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">🔍</span>
                                <input
                                    type="text"
                                    placeholder="Wpisz opis, kwotę, datę lub typ wydatku..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-gray-50 focus:bg-white"
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
                                        Typ wydatku
                                    </label>
                                    <select
                                        value={selectedType}
                                        onChange={(e) => setSelectedType(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors shadow-sm"
                                    >
                                        <option value="">🛠️ Wszystkie typy</option>
                                        {EXPENSE_TYPES.map(t => (
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
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors shadow-sm"
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
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors shadow-sm"
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
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors shadow-sm"
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
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors shadow-sm"
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
                                className="w-full md:w-auto bg-gradient-to-r from-red-600 to-orange-700 hover:from-red-700 hover:to-orange-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl group"
                            >
                                <span className="text-xl group-hover:scale-110 transition-transform">+</span>
                                <span>Dodaj Nowy Wydatek</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                        Lista Wydatków
                    </h2>
                    <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-lg font-medium">
                        Wyświetlono: {startIndex + 1}-{Math.min(endIndex, filteredExpenses.length)} z {filteredExpenses.length}
                        {filteredExpenses.length !== allExpenses.length && ` (przefiltrowano z ${allExpenses.length})`}
                    </div>
                </div>
                
                {isLoading ? (
                    <LoadingState />
                ) : filteredExpenses.length === 0 ? (
                    <EmptyState 
                        searchTerm={searchTerm || selectedType || selectedPaymentStatus || selectedSectorId || selectedYear} 
                        expensesCount={allExpenses.length}
                        onAddClick={openModal} 
                    />
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {paginatedExpenses.map((expense) => (
                                <ExpenseCard
                                    key={expense.id}
                                    expense={expense}
                                    onEdit={openModal}
                                    onDelete={handleDeleteExpense}
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
                title={selectedExpense ? 'Edytuj Wydatek' : 'Dodaj Nowy Wydatek'}
            >
                <ExpenseForm
                    expense={selectedExpense}
                    onSave={handleSaveExpense}
                    onCancel={closeModal}
                    isLoading={isLoading}
                    sectors={sectors}
                />
            </Modal>
        </div>
    );
}