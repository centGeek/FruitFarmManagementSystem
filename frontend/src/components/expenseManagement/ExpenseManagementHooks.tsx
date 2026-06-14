import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BACKEND_URL, getAuthHeaders } from "../../utils/apiConfigs";
import { authFetch } from '../../utils/authFetch';

export interface Sector {
  id: number;
  description?: string;
  plantType?: string;
  variety?: string;
  isActive?: boolean;
}

export interface Expense {
  id: number;
  type: string;
  amount: number;
  createdAt: string;
  description?: string;
  paid: boolean;
  userId?: number;
  sectorDTO?: Sector | null;
}

export const EXPENSE_TYPES = [
  { value: 'ŚRODKI_OCHRONY_ROŚLIN', label: 'Opryski / Środki ochrony roślin', icon: '🧴', color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'NAWOZY', label: 'Nawozy', icon: '🌾', color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'SADZENIE', label: 'Sadzenie / Nowe drzewka', icon: '🌳', color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'NAWADNIANIE', label: 'Nawadnianie / System nawadniania', icon: '💧', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'ENERGIA_ELEKTRYCZNA', label: 'Prąd', icon: '⚡', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { value: 'WODA', label: 'Woda', icon: '💧', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'MATERIAŁY_POMOCNICZE', label: 'Paliki / Druty / Rusztowania', icon: '🪵', color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'SIATKI_OCHRONNE', label: 'Siatki / Folie / Agrowłóknina', icon: '🕸️', color: 'bg-green-50 text-green-700 border-green-200' },

  { value: 'MASZYNY', label: 'Maszyny / Sprzęt', icon: '🚜', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'NAPRAWY', label: 'Naprawy / Części zamienne', icon: '🔧', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'PALIWO', label: 'Paliwo / Oleje / Smary', icon: '⛽', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { value: 'UBEZPIECZENIE', label: 'Ubezpieczenia (maszyny, sad)', icon: '🧾', color: 'bg-gray-50 text-gray-700 border-gray-200' },

  { value: 'PRACA', label: 'Pracownicy sezonowi', icon: '💼', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'ZAKWATEROWANIE', label: 'Zakwaterowanie / Wyżywienie pracowników', icon: '🏠🍽️', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'USŁUGI_ROLNICZE', label: 'Usługi rolnicze / Analizy gleby', icon: '🧪', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'TRANSPORT', label: 'Transport / Logistyka', icon: '🚚', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'SZKOLENIA', label: 'Szkolenia / Doradztwo / Certyfikaty', icon: '🎓', color: 'bg-purple-50 text-purple-700 border-purple-200' },

  { value: 'OPAKOWANIA', label: 'Opakowania / Skrzynki / Kartony', icon: '📦', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { value: 'CHŁODNIA', label: 'Chłodnia / Przechowalnia', icon: '🧊', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'MARKETING', label: 'Marketing / Sprzedaż / Prowizje', icon: '💰', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { value: 'BIURO', label: 'Materiały biurowe / Telefon / Internet', icon: '📱', color: 'bg-gray-50 text-gray-700 border-gray-200' },

  { value: 'REMONTY', label: 'Renowacje / Inwestycje w sadzie', icon: '🧱', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'INFRASTRUKTURA', label: 'Drogi / Ogrodzenia / Budynki', icon: '🚧', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'MODERNIZACJE_TECHNICZNE', label: 'Modernizacje / Nowe technologie', icon: '⚙️', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },

  { value: 'PODATKI', label: 'Podatki / Opłaty / KRUS', icon: '💸', color: 'bg-red-50 text-red-700 border-red-200' },
  { value: 'KSIĘGOWOŚĆ', label: 'Księgowość / Biuro rachunkowe', icon: '📊', color: 'bg-red-50 text-red-700 border-red-200' },

  { value: 'INNE_MATERIAŁY', label: 'Inne zaopatrzenie', icon: '🛒', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'INNE', label: 'Inne wydatki', icon: '🪙', color: 'bg-gray-50 text-gray-700 border-gray-200' },
];

export const PAYMENT_STATUS_OPTIONS = [
  { value: '', label: 'Wszystkie 📋' },
  { value: 'paid', label: 'Opłacone ✅' },
  { value: 'unpaid', label: 'Nieopłacone ⏳' }
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
  const { t } = useTranslation("expenseManagement");
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [selectedType, setSelectedType] = useState('');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('');
  const [selectedSectorId, setSelectedSectorId] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const closeAlert = useCallback(() => setAlert({ type: '', message: '' }), []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedType, selectedPaymentStatus, selectedSectorId, selectedYear, selectedMonth, searchTerm]);

  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    let allData: Expense[] = [];
    let currentPage = 0;
    let totalPages = 1;
    
    const params = new URLSearchParams();
    if (selectedYear) params.append('year', selectedYear);
    if (selectedMonth) params.append('month', selectedMonth);
    if (selectedSectorId) params.append('sectorId', selectedSectorId);
    
    try {
      while (currentPage < totalPages) {
        params.set('page', currentPage.toString());
        params.set('size', '100');

        const response = await authFetch(
          `${BACKEND_URL}/api/expenses?${params.toString()}`,
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
      setAlert({ type: 'error', message: t('messages.fetchError') });
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, selectedMonth, selectedSectorId, t]);

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

  const handleSaveExpense = useCallback(async (expenseData) => {
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
        setAlert({ type: 'success', message: isUpdate ? t('messages.saveSuccessUpdated') : t('messages.saveSuccessAdded') });
        setIsModalOpen(false);
        setSelectedExpense(null);
        fetchExpenses();
      } else {
        const error = await response.json();
        setAlert({ type: 'error', message: t('messages.saveError', { status: response.status, error: error.message || error.error || response.statusText }) });
      }
    } catch (error) {
      setAlert({ type: 'error', message: t('messages.saveNetworkError') });
    } finally {
      setIsLoading(false);
    }
  }, [selectedExpense, fetchExpenses, closeAlert, t]);

  const handleDeleteExpense = useCallback(async (expenseId: number) => {
    if (!window.confirm(t('messages.deleteConfirm'))) return;
    closeAlert();

    try {
      const response = await authFetch(`${BACKEND_URL}/api/expenses/${expenseId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        setAlert({ type: 'success', message: t('messages.deleteSuccess') });
        fetchExpenses();
      } else {
        const error = await response.json();
        setAlert({ type: 'error', message: t('messages.deleteError', { error: error.message || error.error || response.statusText }) });
      }
    } catch (error) {
      setAlert({ type: 'error', message: t('messages.deleteNetworkError') });
    }
  }, [fetchExpenses, closeAlert, t]);

  useEffect(() => { 
    fetchExpenses(); 
    fetchSectors(); 
  }, [fetchExpenses, fetchSectors]);

  const filteredExpenses = useMemo(() => {
    let list = allExpenses;
    
    if (selectedType) list = list.filter(exp => exp.type === selectedType);
    
    if (selectedPaymentStatus) {
      if (selectedPaymentStatus === 'paid') list = list.filter(exp => exp.paid === true);
      else if (selectedPaymentStatus === 'unpaid') list = list.filter(exp => exp.paid === false);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(exp => {
        const typeLabel = EXPENSE_TYPES.some(item => item.value === exp.type)
          ? t(`expenseType.${exp.type}`)
          : t('expenseType.UNKNOWN');
        return (exp.description?.toLowerCase().includes(term)) ||
          (exp.amount?.toString().includes(term)) ||
          (exp.createdAt?.includes(term)) ||
          (typeLabel.toLowerCase().includes(term));
      });
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allExpenses, selectedType, selectedPaymentStatus, searchTerm, t]);

  const filteredStats = useMemo(() => {
    const total = filteredExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
    const paid = filteredExpenses.filter(exp => exp.paid).reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
    const unpaid = total - paid;
    return { total, paid, unpaid };
  }, [filteredExpenses]);

  const selectedSectorName = useMemo(() => {
    if (!selectedSectorId) return null;
    return sectors.find(s => s.id === Number(selectedSectorId))?.description || t('sectorFallback', { id: selectedSectorId });
  }, [selectedSectorId, sectors, t]);

  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const paginatedExpenses = filteredExpenses.slice((currentPage - 1) * itemsPerPage, (currentPage - 1) * itemsPerPage + itemsPerPage);

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [totalPages]);

  const openModal = useCallback((expense: Expense | null = null) => { setSelectedExpense(expense); setIsModalOpen(true); closeAlert(); }, [closeAlert]);
  const closeModal = useCallback(() => { setIsModalOpen(false); setSelectedExpense(null); }, []);

  return {
    allExpenses, sectors, selectedType, setSelectedType, selectedPaymentStatus, setSelectedPaymentStatus,
    selectedSectorId, setSelectedSectorId, selectedYear, setSelectedYear, selectedMonth, setSelectedMonth,
    searchTerm, setSearchTerm, currentPage, totalPages, isModalOpen, selectedExpense, isLoading, alert,
    filteredStats, selectedSectorName, paginatedExpenses,
    handleSaveExpense, handleDeleteExpense, openModal, closeModal, handlePageChange, closeAlert
  };
};