import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from "react-i18next";
import { BACKEND_URL, getAuthHeaders } from "../../utils/apiConfigs";
import { authFetch } from '../../utils/authFetch';

export interface Sector {
  id: number;
  description?: string;
  plantType?: string;
  variety?: string;
  isActive?: boolean;
}

export interface Profit {
  purchaseId: number;
  profitType: string;
  profit: number;
  createdAt: string;
  description?: string;
  received: boolean;
  kilogramsSold?: number;
  userId?: number;
  sectorDTO?: Sector | null;
}

export const PROFIT_TYPES = [

  { value: 'SPRZEDAZ_JABLEK', label: 'Sprzedaż jabłek', icon: '🍎', color: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' },
  { value: 'SPRZEDAZ_GRUSZEK', label: 'Sprzedaż gruszek', icon: '🍐', color: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' },
  { value: 'SPRZEDAZ_WISNI', label: 'Sprzedaż wiśni', icon: '🍒', color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800' },
  { value: 'SPRZEDAZ_CZERESNI', label: 'Sprzedaż czereśni', icon: '🍒', color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800' },
  { value: 'SPRZEDAZ_SLIW', label: 'Sprzedaż śliwek', icon: '🟣', color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800' },
  { value: 'SPRZEDAZ_MALIN', label: 'Sprzedaż malin', icon: '🍓', color: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-800' },
  { value: 'SPRZEDAZ_TRUSKAWEK', label: 'Sprzedaż truskawek', icon: '🍓', color: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-800' },
  { value: 'SPRZEDAZ_PORZECZEK_CZARNYCH', label: 'Sprzedaż czarnych porzeczek', icon: '🫐', color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800' },
  { value: 'SPRZEDAZ_PORZECZEK_CZERWONYCH', label: 'Sprzedaż czerwonych porzeczek', icon: '🟥', color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800' },
  { value: 'SPRZEDAZ_AGRESTU', label: 'Sprzedaż agrestu', icon: '🟢', color: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' },
  { value: 'SPRZEDAZ_BOROWEK', label: 'Sprzedaż borówek', icon: '🫐', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800' },
  { value: 'SPRZEDAZ_JEZYN', label: 'Sprzedaż jeżyn', icon: '🟣', color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800' },
  { value: 'SPRZEDAZ_ARONII', label: 'Sprzedaż aronii', icon: '⚫', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800' },

  { value: 'SPRZEDAZ_HURTOWA', label: 'Sprzedaż hurtowa', icon: '🏭', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800' },
  { value: 'SPRZEDAZ_DETALICZNA', label: 'Sprzedaż detaliczna', icon: '🏪', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800' },
  { value: 'EKSPORT', label: 'Eksport', icon: '🌍', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800' },
  { value: 'SPRZEDAZ_ONLINE', label: 'Sprzedaż online', icon: '💻', color: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-800' },

  { value: 'SUBSYDIA', label: 'Dotacje / Dopłaty', icon: '🏛️', color: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800' },
  { value: 'ODSZKODOWANIE', label: 'Odszkodowania / Ubezpieczenia', icon: '🛡️', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800' },
  { value: 'SPRZEDAZ_SPRZETU', label: 'Sprzedaż sprzętu', icon: '🚜', color: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-700/50 dark:text-gray-200 dark:border-gray-700' },
  { value: 'USLUGI', label: 'Usługi rolnicze dla innych', icon: '🤝', color: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-800' },
  { value: 'CZYNSZ', label: 'Wynajem ziemi/sprzętu', icon: '🏡', color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800' },
  { value: 'INNE', label: 'Inne przychody', icon: '💵', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800' },
];

export const PAYMENT_STATUS_OPTIONS = [
  { value: '', label: 'Wszystkie 📋' },
  { value: 'received', label: 'Otrzymane ✅' },
  { value: 'pending', label: 'Oczekujące ⏳' }
];


export const getProfitTypeDetails = (type: string) => {
  const profit = PROFIT_TYPES.find(p => p.value === type);
  return profit
    ? { value: profit.value, label: profit.label, icon: profit.icon, color: profit.color }
    : { value: 'UNKNOWN', label: 'Nieznany', icon: '❓', color: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-700/50 dark:text-gray-200 dark:border-gray-700' };
};

export const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = 0; i <= 5; i++) {
    years.push(currentYear - i);
  }
  return years;
};

// --- HOOK ---

export const useProfitManagement = () => {
    const { t } = useTranslation("profitManagement");
    const [allProfits, setAllProfits] = useState<Profit[]>([]);
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
    const [selectedProfit, setSelectedProfit] = useState<Profit | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [alert, setAlert] = useState({ type: '', message: '' });

    const closeAlert = useCallback(() => setAlert({ type: '', message: '' }), []);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedType, selectedPaymentStatus, selectedSectorId, selectedYear, selectedMonth, searchTerm]);

    const fetchProfits = useCallback(async () => {
        setIsLoading(true);
        let allData: Profit[] = [];
        let currentPage = 0;
        let totalPages = 1;
        
        try {
            while (currentPage < totalPages) {
                const response = await authFetch(
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
            setAlert({ type: 'error', message: t("alerts.loadError") });
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    const fetchSectors = useCallback(async () => {
        try {
            const response = await authFetch(`${BACKEND_URL}/api/sectors`, { method: 'GET', headers: getAuthHeaders() });
            if (response.ok) {
                const data = await response.json();
                setSectors(Array.isArray(data) ? data : []);
            } else setSectors([]);
        } catch (error) {
            setSectors([]);
        }
    }, []);

    useEffect(() => { fetchProfits(); fetchSectors(); }, [fetchProfits, fetchSectors]);

    const handleSaveProfit = useCallback(async (profitData: any) => {
        setIsLoading(true);
        closeAlert();
        
        const isUpdate = !!selectedProfit;
        const endpoint = isUpdate ? `${BACKEND_URL}/api/profits/${selectedProfit.purchaseId}` : `${BACKEND_URL}/api/profits`;
        const method = isUpdate ? 'PUT' : 'POST';

        try {
            const response = await authFetch(endpoint, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify(profitData),
            });

            if (response.ok) {
                setAlert({ type: 'success', message: isUpdate ? t("alerts.savedUpdated") : t("alerts.savedAdded") });
                setIsModalOpen(false);
                setSelectedProfit(null);
                fetchProfits();
            } else {
                const error = await response.json();
                setAlert({ type: 'error', message: t("alerts.saveError", { error: error.message || response.statusText }) });
            }
        } catch (error) {
            setAlert({ type: 'error', message: t("alerts.saveNetworkError") });
        } finally {
            setIsLoading(false);
        }
    }, [selectedProfit, fetchProfits, closeAlert, t]);

    const handleDeleteProfit = useCallback(async (profitId: number) => {
        if (!window.confirm(t("alerts.deleteConfirm"))) return;
        closeAlert();

        try {
            const response = await authFetch(`${BACKEND_URL}/api/profits/${profitId}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                setAlert({ type: 'success', message: t("alerts.deleteSuccess") });
                fetchProfits();
            } else {
                const error = await response.json();
                setAlert({ type: 'error', message: t("alerts.deleteError", { error: error.message || response.statusText }) });
            }
        } catch (error) {
            setAlert({ type: 'error', message: t("alerts.deleteNetworkError") });
        }
    }, [fetchProfits, closeAlert, t]);

    const openModal = useCallback((profit: Profit | null = null) => { setSelectedProfit(profit); setIsModalOpen(true); closeAlert(); }, [closeAlert]);
    const closeModal = useCallback(() => { setIsModalOpen(false); setSelectedProfit(null); }, []);

    const filteredProfits = useMemo(() => {
        let list = allProfits;
        if (selectedType) list = list.filter(p => p.profitType === selectedType);
        if (selectedPaymentStatus) {
            if (selectedPaymentStatus === 'received') list = list.filter(p => p.received === true);
            else if (selectedPaymentStatus === 'pending') list = list.filter(p => p.received === false);
        }
        if (selectedSectorId) list = list.filter(p => p.sectorDTO?.id === Number(selectedSectorId));
        if (selectedYear) list = list.filter(p => new Date(p.createdAt).getFullYear() === Number(selectedYear));
        if (selectedMonth) list = list.filter(p => new Date(p.createdAt).getMonth() + 1 === Number(selectedMonth));
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            list = list.filter(p =>
                (p.description?.toLowerCase().includes(term)) ||
                (p.profit?.toString().includes(term)) ||
                (p.createdAt?.includes(term)) ||
                (t(`types.${getProfitTypeDetails(p.profitType).value}`).toLowerCase().includes(term))
            );
        }
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [allProfits, selectedType, selectedPaymentStatus, selectedSectorId, selectedYear, selectedMonth, searchTerm, t]);

    const totalPages = Math.ceil(filteredProfits.length / itemsPerPage);
    const paginatedProfits = filteredProfits.slice((currentPage - 1) * itemsPerPage, (currentPage - 1) * itemsPerPage + itemsPerPage);

    const handlePageChange = useCallback((newPage: number) => {
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
        return sector ? (sector.description || t("sectorFallback", { id: sector.id })) : null;
    }, [selectedSectorId, sectors, t]);

    return {
        allProfits, sectors, selectedType, setSelectedType, selectedPaymentStatus, setSelectedPaymentStatus,
        selectedSectorId, setSelectedSectorId, selectedYear, setSelectedYear, selectedMonth, setSelectedMonth,
        searchTerm, setSearchTerm, currentPage, totalPages, isModalOpen, selectedProfit, isLoading, alert,
        filteredStats, selectedSectorName, paginatedProfits, filteredProfits, // <--- TUTAJ POPRAWKA: Eksportujemy filteredProfits
        handleSaveProfit, handleDeleteProfit, openModal, closeModal, handlePageChange, closeAlert
    };
};