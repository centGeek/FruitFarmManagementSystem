import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from "react-i18next";
import { BACKEND_URL, getAuthHeaders } from "../../utils/apiConfigs";
import { authFetch } from '../../utils/authFetch';

export interface Ticket {
  id: number;
  description?: string;
  category?: string;
  createdAt?: string;
  closedAt?: string | null;
  status?: string;
  adminComment?: string | null;
  userDto?: any;
}

export interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  closed: number;
}

const PAGE_SIZE = 12;

export const useAdminDashboard = () => {
  const { t } = useTranslation("adminDashboard");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<TicketStats>({ total: 0, open: 0, inProgress: 0, closed: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const closeAlert = useCallback(() => setAlert({ type: '', message: '' }), []);

  // Debounce the search box so we don't hit the backend on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Filtering or searching always resets back to the first page.
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, debouncedSearch]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await authFetch(`${BACKEND_URL}/api/tickets/stats`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        setStats(await response.json());
      }
    } catch {
      // Stats are non-critical; ignore transient errors.
    }
  }, []);

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(currentPage - 1));
    params.set('size', String(PAGE_SIZE));
    if (statusFilter !== 'ALL') params.set('status', statusFilter);
    if (debouncedSearch) params.set('search', debouncedSearch);

    try {
      const response = await authFetch(`${BACKEND_URL}/api/tickets/all?${params.toString()}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setTickets(Array.isArray(data.content) ? data.content : []);
        setTotalPages(data.totalPages || 1);
      } else {
        setAlert({ type: 'error', message: t('alerts.fetchFailed') });
      }
    } catch {
      setAlert({ type: 'error', message: t('alerts.fetchNetworkError') });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, statusFilter, debouncedSearch, t]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refresh = useCallback(() => {
    fetchTickets();
    fetchStats();
  }, [fetchTickets, fetchStats]);

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [totalPages]);

  const updateStatus = useCallback(async (ticketId: number, status: string) => {
    try {
      const response = await authFetch(`${BACKEND_URL}/api/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setAlert({ type: 'success', message: t('alerts.statusUpdated', { id: ticketId }) });
        // A status change affects both counts and the active filter, so refresh from the server.
        fetchTickets();
        fetchStats();
      } else {
        setAlert({ type: 'error', message: data.message || t('alerts.statusUpdateFailed') });
      }
    } catch {
      setAlert({ type: 'error', message: t('alerts.statusNetworkError') });
    }
  }, [fetchTickets, fetchStats, t]);

  const updateComment = useCallback(async (ticketId: number, comment: string) => {
    try {
      const response = await authFetch(`${BACKEND_URL}/api/tickets/${ticketId}/comment`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ comment }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setTickets(prev => prev.map(item => (item.id === ticketId ? data : item)));
        setAlert({ type: 'success', message: t('alerts.commentSaved', { id: ticketId }) });
        return true;
      }
      setAlert({ type: 'error', message: data.message || t('alerts.commentSaveFailed') });
      return false;
    } catch {
      setAlert({ type: 'error', message: t('alerts.commentNetworkError') });
      return false;
    }
  }, [t]);

  return {
    tickets,
    stats,
    isLoading,
    alert,
    closeAlert,
    statusFilter,
    setStatusFilter,
    search,
    setSearch,
    currentPage,
    totalPages,
    handlePageChange,
    refresh,
    updateStatus,
    updateComment,
  };
};
