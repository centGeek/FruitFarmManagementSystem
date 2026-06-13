import { useState, useEffect, useCallback } from 'react';
import { BACKEND_URL, getAuthHeaders } from "../../utils/apiConfigs";
import { authFetch } from '../../utils/authFetch';

export const TICKET_CATEGORIES = [
  { value: 'SYSTEM_ERROR', label: 'System nie działa / błąd aplikacji', icon: '💥' },
  { value: 'DISPLAY', label: 'Błąd wyświetlania', icon: '🖥️' },
  { value: 'DATA', label: 'Nieprawidłowe dane', icon: '📊' },
  { value: 'PERFORMANCE', label: 'Wolne działanie', icon: '🐢' },
  { value: 'SUGGESTION', label: 'Sugestia / usprawnienie', icon: '💡' },
  { value: 'OTHER', label: 'Inne', icon: '❓' },
];

export const TICKET_STATUS: Record<string, { label: string; icon: string; color: string }> = {
  OPEN: { label: 'Otwarte', icon: '🟢', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  IN_PROGRESS: { label: 'W trakcie', icon: '🛠️', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  CLOSED: { label: 'Zamknięte', icon: '✅', color: 'bg-gray-100 text-gray-600 border-gray-200' },
};

export const getCategoryDetails = (value: string) => {
  return TICKET_CATEGORIES.find(c => c.value === value)
    || { value, label: 'Inne', icon: '❓' };
};

export const getStatusDetails = (value: string) => {
  return TICKET_STATUS[value] || { label: value || 'Nieznany', icon: '❔', color: 'bg-gray-100 text-gray-600 border-gray-200' };
};

export interface Ticket {
  id: number;
  description?: string;
  category?: string;
  createdAt?: string;
  closedAt?: string | null;
  status?: string;
  userDto?: any;
}

export const useSupport = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const closeAlert = useCallback(() => setAlert({ type: '', message: '' }), []);

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await authFetch(`${BACKEND_URL}/api/tickets`, {
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

  const submitTicket = useCallback(async (ticketData: any) => {
    setIsSubmitting(true);
    closeAlert();
    try {
      const response = await authFetch(`${BACKEND_URL}/api/tickets`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(ticketData),
      });
      if (response.ok) {
        setAlert({ type: 'success', message: 'Zgłoszenie zostało wysłane do administratora. Dziękujemy!' });
        await fetchTickets();
        return true;
      } else {
        const error = await response.json().catch(() => ({}));
        setAlert({ type: 'error', message: `Nie udało się wysłać zgłoszenia: ${error.message || error.error || response.statusText}` });
        return false;
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Błąd sieci: nie można wysłać zgłoszenia.' });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [fetchTickets, closeAlert]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return { tickets, isLoading, isSubmitting, alert, closeAlert, submitTicket };
};
