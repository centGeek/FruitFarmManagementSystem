import React, { useState, useEffect, useMemo, useCallback } from 'react';

import { BACKEND_URL, getAuthHeaders } from "../utils/apiConfigs";

const EXPENSE_TYPES = [
    { value: 'MACHINE', label: 'Maszyny / Sprzęt 🚜' },
    { value: 'GAS', label: 'Paliwo / Gaz ⛽' },
    { value: 'SUPPLIES', label: 'Zaopatrzenie 🛒' },
    { value: 'OTHER', label: 'Inne 🧾' },
];

const PAYMENT_STATUS_OPTIONS = [
    { value: '', label: 'Wszystkie 📋' },
    { value: 'paid', label: 'Opłacone ✅' },
    { value: 'unpaid', label: 'Nieopłacone ⏳' }
];

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
        date: expense?.date ? new Date(expense.date).toISOString().split('T')[0] : today,
        amount: expense?.amount?.toString() || '',
        type: expense?.type || EXPENSE_TYPES[0].value,
        description: expense?.description || '',
        paid: expense?.paid ?? false,
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
        if (!formData.description.trim()) newErrors.description = 'Opis jest wymagany';
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
                date: formData.date,
                sectorDTO: formData.sectorId ? { id: Number(formData.sectorId) } : null
            };
            // Usuń sectorId z wysyłanych danych
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
                    Opis Wydatku *
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
                    Opłacone (Faktura Zrealizowana)
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

const getExpenseTypeDetails = (type) => {
    switch(type) {
        case 'MACHINE': return { label: 'Maszyny', icon: '🚜', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
        case 'GAS': return { label: 'Paliwo', icon: '⛽', color: 'bg-orange-50 text-orange-700 border-orange-200' };
        case 'SUPPLIES': return { label: 'Zaopatrzenie', icon: '🛒', color: 'bg-blue-50 text-blue-700 border-blue-200' };
        case 'OTHER': return { label: 'Inne', icon: '🧾', color: 'bg-gray-50 text-gray-700 border-gray-200' };
        default: return { label: 'Nieznany', icon: '❓', color: 'bg-gray-50 text-gray-700 border-gray-200' };
    }
};

const ExpenseCard = ({ expense, onEdit, onDelete, sectors }) => {
    const typeDetails = getExpenseTypeDetails(expense.type);
    const isPaid = expense.paid;
    const expenseDate = new Date(expense.date).toLocaleDateString('pl-PL');
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
                            {expense.amount.toFixed(2)} PLN
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
        blue: { bg: 'from-blue-100 to-blue-200', text: 'text-blue-600', icon: '📊' }
    };
    const colors = colorMap[color] || colorMap.red;
    
    const displayValue = amount !== undefined 
        ? `${amount.toFixed(2)} PLN` 
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
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [alert, setAlert] = useState({ type: '', message: '' });

    const closeAlert = useCallback(() => setAlert({ type: '', message: '' }), []);

    const fetchExpenses = useCallback(async () => {
        setIsLoading(true);
        
        try {
            const response = await fetch(`${BACKEND_URL}/api/expenses`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                const data = await response.json();
                const expensesList = Array.isArray(data) ? data : [];
                setAllExpenses(expensesList); 
            } else {
                const error = await response.json();
                setAlert({ type: 'error', message: `Błąd ładowania wydatków: ${error.message || response.statusText}` });
            }
        } catch (error) {
            setAlert({ type: 'error', message: `Błąd sieci: Nie można połączyć z backendem.` });
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchSectors = useCallback(async () => {
        console.log('🔍 Rozpoczynam pobieranie sektorów z:', `${BACKEND_URL}/api/sectors`);
        try {
            const headers = getAuthHeaders();
            console.log('📤 Wysyłam request z nagłówkami:', headers);
            
            const response = await fetch(`${BACKEND_URL}/api/sectors`, {
                method: 'GET',
                headers: headers,
            });

            console.log('📥 Odpowiedź serwera - Status:', response.status, response.statusText);

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Załadowane sektory:', data);
                console.log('📊 Liczba sektorów:', Array.isArray(data) ? data.length : 'Nie jest tablicą');
                setSectors(Array.isArray(data) ? data : []);
            } else {
                const errorText = await response.text();
                console.error('❌ Błąd HTTP:', response.status, errorText);
                setAlert({ type: 'warning', message: `Nie udało się załadować sektorów (${response.status}). Możesz dodawać wydatki bez przypisania do sektora.` });
                setSectors([]); // Ustaw pustą tablicę
            }
        } catch (error) {
            console.error('❌ Błąd pobierania sektorów:', error);
            console.error('Szczegóły błędu:', error.message);
            setAlert({ type: 'warning', message: 'Nie można połączyć z API sektorów. Wydatki można dodawać bez przypisania do sektora.' });
            setSectors([]); // Ustaw pustą tablicę
        }
    }, []);

    useEffect(() => {
        fetchExpenses();
        fetchSectors();
    }, [fetchExpenses, fetchSectors]);

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
            list = list.filter(exp => exp.sectorDTO?.id === Number(selectedSectorId));
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            list = list.filter(exp =>
                (exp.description?.toLowerCase().includes(term)) ||
                (exp.amount?.toString().includes(term)) ||
                (exp.date?.includes(term)) ||
                (getExpenseTypeDetails(exp.type).label.toLowerCase().includes(term))
            );
        }
        
        return list.sort((a, b) => new Date(b.date) - new Date(a.date)); 
    }, [allExpenses, selectedType, selectedPaymentStatus, selectedSectorId, searchTerm]);
    
    const totalAmount = allExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const paidAmount = allExpenses.filter(exp => exp.paid).reduce((sum, exp) => sum + exp.amount, 0);
    const unpaidAmount = totalAmount - paidAmount;

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-50 to-orange-100 p-6 font-sans">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-2 flex items-center">
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
                        amount={totalAmount} 
                        label="Całkowite Wydatki (Wszystkie)" 
                        color="red"
                    />
                    <StatCard 
                        amount={unpaidAmount} 
                        label="Wydatki Nieopłacone (Do Zapłaty)" 
                        color="red" 
                    />
                    <StatCard 
                        count={filteredExpenses.length} 
                        label="Wyświetlanych Wydatków" 
                        color="blue"
                    />
                </div>

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
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            Wyświetlono: {filteredExpenses.length} z {allExpenses.length}
                        </div>
                    </div>
                    
                    {isLoading ? (
                        <LoadingState />
                    ) : filteredExpenses.length === 0 ? (
                        <EmptyState 
                            searchTerm={searchTerm || selectedType || selectedPaymentStatus || selectedSectorId} 
                            expensesCount={allExpenses.length}
                            onAddClick={openModal} 
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredExpenses.map((expense) => (
                                <ExpenseCard
                                    key={expense.id}
                                    expense={expense}
                                    onEdit={openModal}
                                    onDelete={handleDeleteExpense}
                                    sectors={sectors}
                                />
                            ))}
                        </div>
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