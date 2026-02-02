import { useState, useEffect, useCallback, useMemo } from 'react';
import { BACKEND_URL, getAuthHeaders } from "../../utils/apiConfigs";
import { authFetch } from '../../utils/authFetch';

export const EXPENSE_TYPES = [
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

export const PAYMENT_STATUS_OPTIONS = [
  { value: '', label: 'Wszystkie 📋' },
  { value: 'paid', label: 'Opłacone ✅' },
  { value: 'unpaid', label: 'Nieopłacone ⏳' }
];

export const MONTH_OPTIONS = [
  { value: '', label: 'Wszystkie miesiące 📅' },
  { value: '1', label: 'Styczeń' }, { value: '2', label: 'Luty' }, { value: '3', label: 'Marzec' },
  { value: '4', label: 'Kwiecień' }, { value: '5', label: 'Maj' }, { value: '6', label: 'Czerwiec' },
  { value: '7', label: 'Lipiec' }, { value: '8', label: 'Sierpień' }, { value: '9', label: 'Wrzesień' },
  { value: '10', label: 'Październik' }, { value: '11', label: 'Listopad' }, { value: '12', label: 'Grudzień' }
];

export const getExpenseTypeDetails = (type: string) => {
  const expense = EXPENSE_TYPES.find(exp => exp.value === type);
  return expense
    ? { label: expense.label, icon: expense.icon, color: expense.color }
    : { label: 'Nieznany', icon: '❓', color: 'bg-gray-50 text-gray-700 border-gray-200' };
};

export const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = 0; i <= 5; i++) {
    years.push(currentYear - i);
  }
  return years;
};


export const useExpenseManagement = () => {
    const [allExpenses, setAllExpenses] = useState<any[]>([]);
    const [sectors, setSectors] = useState<any[]>([]);
    const [selectedType, setSelectedType] = useState('');
    const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('');
    const [selectedSectorId, setSelectedSectorId] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [selectedMonth, setSelectedMonth] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(15);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [alert, setAlert] = useState({ type: '', message: '' });
    const [sectorLaborCosts, setSectorLaborCosts] = useState<any>(null);
    const [advancesSum, setAdvancesSum] = useState<number | null>(null);
    const [isLoadingLaborCosts, setIsLoadingLaborCosts] = useState(false);

    const closeAlert = useCallback(() => setAlert({ type: '', message: '' }), []);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedType, selectedPaymentStatus, selectedSectorId, selectedYear, selectedMonth, searchTerm]);

    const fetchExpenses = useCallback(async () => {
        setIsLoading(true);
        let allData: any[] = [];
        let currentPage = 0;
        let totalPages = 1;
        
        try {
            while (currentPage < totalPages) {
                const response = await authFetch(
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

    const fetchSectors = useCallback(async () => {
        try {
            const response = await authFetch(`${BACKEND_URL}/api/sectors`, { method: 'GET', headers: getAuthHeaders() });
            if (response.ok) {
                const data = await response.json();
                setSectors(Array.isArray(data) ? data : []);
            } else {
                setSectors([]);
            }
        } catch (error) {
            console.error('Error fetching sectors:', error);
            setSectors([]);
        }
    }, []);

    const handleSaveExpense = useCallback(async (expenseData: any) => {
        setIsLoading(true);
        closeAlert();
        
        const isUpdate = !!selectedExpense;
        const endpoint = isUpdate ? `${BACKEND_URL}/api/expenses/${selectedExpense.id}` : `${BACKEND_URL}/api/expenses`;
        const method = isUpdate ? 'PUT' : 'POST';

        try {
            const response = await authFetch(endpoint, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify(expenseData),
            });

            if (response.ok) {
                setAlert({ type: 'success', message: `Wydatek został ${isUpdate ? 'zaktualizowany' : 'dodany'} pomyślnie!` });
                setIsModalOpen(false);
                setSelectedExpense(null);
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

    const handleDeleteExpense = useCallback(async (expenseId: number) => {
        if (!window.confirm('Czy na pewno chcesz usunąć ten wydatek? Tej operacji nie można cofnąć!')) return;
        closeAlert();
        
        try {
            const response = await authFetch(`${BACKEND_URL}/api/expenses/${expenseId}`, {
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

    const fetchSectorLaborCosts = useCallback(async () => {
        setIsLoadingLaborCosts(true);
        try {
            // Logika kosztów pracy
            if (selectedSectorId && selectedSectorId !== '') {
                const params = new URLSearchParams();
                params.append('sectorId', selectedSectorId);
                if (selectedYear) params.append('year', selectedYear);
                if (selectedMonth) params.append('month', selectedMonth);
                
                const response = await authFetch(`${BACKEND_URL}/api/expenses/sector-labor-costs?${params}`, { method: 'GET', headers: getAuthHeaders() });
                if (response.ok) setSectorLaborCosts(await response.json());
                else setSectorLaborCosts(null);
            } else {
                // Sumowanie wszystkich sektorów
                const sectorsListResponse = await authFetch(`${BACKEND_URL}/api/sectors`, { method: 'GET', headers: getAuthHeaders() });
                if (!sectorsListResponse.ok) throw new Error('Nie można pobrać listy sektorów');
                const sectorsList = await sectorsListResponse.json();
                
                const fetchPromises = [];
                // Bez sektora
                const paramsNoSector = new URLSearchParams();
                if (selectedYear) paramsNoSector.append('year', selectedYear);
                if (selectedMonth) paramsNoSector.append('month', selectedMonth);
                fetchPromises.push(authFetch(`${BACKEND_URL}/api/expenses/sector-labor-costs?${paramsNoSector}`, { method: 'GET', headers: getAuthHeaders() }).then(r => r.json()));

                // Każdy sektor
                sectorsList.forEach((sector: any) => {
                    const paramsSector = new URLSearchParams();
                    paramsSector.append('sectorId', sector.id);
                    if (selectedYear) paramsSector.append('year', selectedYear);
                    if (selectedMonth) paramsSector.append('month', selectedMonth);
                    fetchPromises.push(authFetch(`${BACKEND_URL}/api/expenses/sector-labor-costs?${paramsSector}`, { method: 'GET', headers: getAuthHeaders() }).then(r => r.json()));
                });

                const results = await Promise.all(fetchPromises);
                
                const aggregatedData = {
                    sectorName: '',
                    sectorLaborCost: results.reduce((sum, r) => sum + (r.sectorLaborCost || 0), 0),
                    paidLaborCost: results.reduce((sum, r) => sum + (r.paidLaborCost || 0), 0),
                    unpaidLaborCost: results.reduce((sum, r) => sum + (r.unpaidLaborCost || 0), 0),
                    paidEntries: results.reduce((sum, r) => sum + (r.paidEntries || 0), 0),
                    unpaidEntries: results.reduce((sum, r) => sum + (r.unpaidEntries || 0), 0)
                };
                setSectorLaborCosts(aggregatedData);
            }

            // Pobieranie zaliczek
            const advancesResponse = await authFetch(`${BACKEND_URL}/api/advances/user/sum-unsettled`, { method: 'GET', headers: getAuthHeaders() });
            if (advancesResponse.ok) {
                const data = await advancesResponse.json();
                setAdvancesSum(data.amount || 0);
            } else setAdvancesSum(null);

        } catch (error) {
            console.error(error);
            setSectorLaborCosts(null);
            setAdvancesSum(null);
        } finally {
            setIsLoadingLaborCosts(false);
        }
    }, [selectedSectorId, selectedYear, selectedMonth]);

    useEffect(() => { fetchExpenses(); fetchSectors(); }, [fetchExpenses, fetchSectors]);
    useEffect(() => { fetchSectorLaborCosts(); }, [fetchSectorLaborCosts]);

    const filteredExpenses = useMemo(() => {
        let list = allExpenses;
        if (selectedType) list = list.filter(exp => exp.type === selectedType);
        if (selectedPaymentStatus) {
            if (selectedPaymentStatus === 'paid') list = list.filter(exp => exp.paid === true);
            else if (selectedPaymentStatus === 'unpaid') list = list.filter(exp => exp.paid === false);
        }
        if (selectedSectorId) list = list.filter(exp => exp.sectorDTO?.id === Number(selectedSectorId));
        if (selectedYear) list = list.filter(exp => new Date(exp.createdAt).getFullYear() === Number(selectedYear));
        if (selectedMonth) list = list.filter(exp => new Date(exp.createdAt).getMonth() + 1 === Number(selectedMonth));
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            list = list.filter(exp =>
                (exp.description?.toLowerCase().includes(term)) ||
                (exp.amount?.toString().includes(term)) ||
                (exp.createdAt?.includes(term)) ||
                (getExpenseTypeDetails(exp.type).label.toLowerCase().includes(term))
            );
        }
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); 
    }, [allExpenses, selectedType, selectedPaymentStatus, selectedSectorId, selectedYear, selectedMonth, searchTerm]);

    const filteredStats = useMemo(() => {
        const total = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const paid = filteredExpenses.filter(exp => exp.paid).reduce((sum, exp) => sum + exp.amount, 0);
        const unpaid = total - paid;
        return { total, paid, unpaid };
    }, [filteredExpenses]);

    const selectedSectorName = useMemo(() => {
        if (!selectedSectorId) return null;
        return sectors.find(s => s.id === Number(selectedSectorId))?.description || `Sektor ${selectedSectorId}`;
    }, [selectedSectorId, sectors]);

    const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
    const paginatedExpenses = filteredExpenses.slice((currentPage - 1) * itemsPerPage, (currentPage - 1) * itemsPerPage + itemsPerPage);

    const handlePageChange = useCallback((newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [totalPages]);

    const openModal = useCallback((expense: any = null) => { setSelectedExpense(expense); setIsModalOpen(true); closeAlert(); }, [closeAlert]);
    const closeModal = useCallback(() => { setIsModalOpen(false); setSelectedExpense(null); }, []);

    return {
        allExpenses, sectors, selectedType, setSelectedType, selectedPaymentStatus, setSelectedPaymentStatus,
        selectedSectorId, setSelectedSectorId, selectedYear, setSelectedYear, selectedMonth, setSelectedMonth,
        searchTerm, setSearchTerm, currentPage, totalPages, isModalOpen, selectedExpense, isLoading, alert,
        sectorLaborCosts, advancesSum, isLoadingLaborCosts, filteredStats, selectedSectorName, paginatedExpenses,
        handleSaveExpense, handleDeleteExpense, openModal, closeModal, handlePageChange, closeAlert
    };
};