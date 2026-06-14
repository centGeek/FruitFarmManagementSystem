import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from "react-i18next";
import { BACKEND_URL, getAuthHeaders } from "../../utils/apiConfigs";
import { authFetch } from '../../utils/authFetch';

export const TICKET_CATEGORIES = [
  { value: 'SYSTEM_ERROR', icon: '💥' },
  { value: 'DISPLAY', icon: '🖥️' },
  { value: 'DATA', icon: '📊' },
  { value: 'PERFORMANCE', icon: '🐢' },
  { value: 'SUGGESTION', icon: '💡' },
  { value: 'OTHER', icon: '❓' },
];

export const TICKET_STATUS: Record<string, { icon: string; color: string }> = {
  OPEN: { icon: '🟢', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  IN_PROGRESS: { icon: '🛠️', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  CLOSED: { icon: '✅', color: 'bg-gray-100 text-gray-600 border-gray-200' },
};

export const getCategoryDetails = (value: string) => {
  return TICKET_CATEGORIES.find(c => c.value === value)
    || { value, icon: '❓' };
};

export const getStatusDetails = (value: string) => {
  return TICKET_STATUS[value] || { icon: '❔', color: 'bg-gray-100 text-gray-600 border-gray-200' };
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
  const { t } = useTranslation("support");
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
        setAlert({ type: 'error', message: t('messages.fetchError') });
      }
    } catch (error) {
      setAlert({ type: 'error', message: t('messages.fetchNetworkError') });
    } finally {
      setIsLoading(false);
    }
  }, [t]);

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
        setAlert({ type: 'success', message: t('messages.submitSuccess') });
        await fetchTickets();
        return true;
      } else {
        const error = await response.json().catch(() => ({}));
        setAlert({ type: 'error', message: t('messages.submitError', { error: error.message || error.error || response.statusText }) });
        return false;
      }
    } catch (error) {
      setAlert({ type: 'error', message: t('messages.submitNetworkError') });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [fetchTickets, closeAlert, t]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return { tickets, isLoading, isSubmitting, alert, closeAlert, submitTicket };
};
