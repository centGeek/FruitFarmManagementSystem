import { useState, useEffect, useCallback, useMemo } from 'react';
import { BACKEND_URL, getAuthHeaders } from "../../utils/apiConfigs";
import { authFetch } from '../../utils/authFetch';

export const useAdminAudit = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const closeAlert = useCallback(() => setAlert({ type: '', message: '' }), []);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await authFetch(`${BACKEND_URL}/api/admin/audit`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(Array.isArray(data) ? data : []);
      } else {
        setAlert({ type: 'error', message: 'Nie udało się pobrać dziennika audytu.' });
      }
    } catch {
      setAlert({ type: 'error', message: 'Błąd sieci podczas pobierania dziennika audytu.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const actions = useMemo(
    () => Array.from(new Set(logs.map(l => l.action).filter(Boolean))),
    [logs]
  );

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return logs.filter(l => {
      if (actionFilter !== 'ALL' && l.action !== actionFilter) return false;
      if (!query) return true;
      const haystack = `${l.performedByName ?? ''} ${l.details ?? ''} ${l.targetType ?? ''} ${l.targetId ?? ''}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [logs, actionFilter, search]);

  return {
    filteredLogs,
    actions,
    isLoading,
    alert,
    closeAlert,
    actionFilter,
    setActionFilter,
    search,
    setSearch,
    refresh: fetchLogs,
  };
};
