import { useState, useEffect, useCallback, useMemo } from 'react';
import { BACKEND_URL, getAuthHeaders } from "../../utils/apiConfigs";
import { authFetch } from '../../utils/authFetch';

export interface Ticket {
  id: number;
  description?: string;
  category?: string;
  createdAt?: string;
  closedAt?: string | null;
  status?: string;
  userDto?: any;
}

export const useAdminDashboard = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const closeAlert = useCallback(() => setAlert({ type: '', message: '' }), []);

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await authFetch(`${BACKEND_URL}/api/tickets/all`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setTickets(Array.isArray(data) ? data : []);
      } else {
        setAlert({ type: 'error', message: 'Nie udało się pobrać zgłoszeń.' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Błąd sieci podczas pobierania zgłoszeń.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const updateStatus = useCallback(async (ticketId: number, status: string) => {
    try {
      const response = await authFetch(`${BACKEND_URL}/api/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setTickets(prev => prev.map(t => (t.id === ticketId ? data : t)));
        setAlert({ type: 'success', message: `Status zgłoszenia #${ticketId} został zaktualizowany.` });
      } else {
        setAlert({ type: 'error', message: data.message || 'Nie udało się zmienić statusu zgłoszenia.' });
      }
    } catch {
      setAlert({ type: 'error', message: 'Błąd sieci podczas zmiany statusu zgłoszenia.' });
    }
  }, []);

  const stats = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter(t => t.status === 'OPEN').length,
    inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
    closed: tickets.filter(t => t.status === 'CLOSED').length,
  }), [tickets]);

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tickets.filter(t => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (!query) return true;
      const reporter = t.userDto
        ? `${t.userDto.name ?? ''} ${t.userDto.surname ?? ''} ${t.userDto.nickname ?? ''} ${t.userDto.email ?? ''}`
        : '';
      return (
        (t.description ?? '').toLowerCase().includes(query) ||
        reporter.toLowerCase().includes(query)
      );
    });
  }, [tickets, statusFilter, search]);

  return {
    tickets,
    filteredTickets,
    stats,
    isLoading,
    alert,
    closeAlert,
    statusFilter,
    setStatusFilter,
    search,
    setSearch,
    refresh: fetchTickets,
    updateStatus,
  };
};
