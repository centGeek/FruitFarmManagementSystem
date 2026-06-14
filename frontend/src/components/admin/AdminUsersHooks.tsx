import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from "react-i18next";
import { BACKEND_URL, getAuthHeaders } from "../../utils/apiConfigs";
import { authFetch } from '../../utils/authFetch';

export interface AdminUser {
  id: number;
  name?: string;
  surname?: string;
  nickname?: string;
  email?: string;
  roleName?: string;
  active: boolean;
}

export const useAdminUsers = () => {
  const { t } = useTranslation("adminUsers");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const closeAlert = useCallback(() => setAlert({ type: '', message: '' }), []);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await authFetch(`${BACKEND_URL}/api/admin/users`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(Array.isArray(data) ? data : []);
      } else {
        setAlert({ type: 'error', message: t('messages.fetchUsersError') });
      }
    } catch (error) {
      setAlert({ type: 'error', message: t('messages.fetchUsersNetworkError') });
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  const fetchRoles = useCallback(async () => {
    try {
      const response = await authFetch(`${BACKEND_URL}/api/admin/roles`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setRoles(Array.isArray(data) ? data : []);
      }
    } catch {
      /* niekrytyczne — lista ról jest pomocnicza */
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [fetchUsers, fetchRoles]);

  const toggleActive = useCallback(async (user: any) => {
    try {
      const response = await authFetch(`${BACKEND_URL}/api/admin/users/${user.id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ active: !user.active }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setUsers(prev => prev.map(u => (u.id === user.id ? data : u)));
        setAlert({ type: 'success', message: t(data.active ? 'messages.statusUnblocked' : 'messages.statusBlocked', { nickname: user.nickname }) });
      } else {
        setAlert({ type: 'error', message: data.message || t('messages.statusError') });
      }
    } catch {
      setAlert({ type: 'error', message: t('messages.statusNetworkError') });
    }
  }, [t]);

  const resetPassword = useCallback(async (user: any, password: string) => {
    try {
      const response = await authFetch(`${BACKEND_URL}/api/admin/users/${user.id}/reset-password`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ password }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setAlert({ type: 'success', message: t('messages.resetSuccess', { nickname: user.nickname }) });
        return true;
      }
      setAlert({ type: 'error', message: data.message || t('messages.resetError') });
      return false;
    } catch {
      setAlert({ type: 'error', message: t('messages.resetNetworkError') });
      return false;
    }
  }, [t]);

  const stats = useMemo(() => ({
    total: users.length,
    gardeners: users.filter(u => u.roleName === 'Gardener').length,
    employees: users.filter(u => u.roleName === 'Employee').length,
    blocked: users.filter(u => !u.active).length,
  }), [users]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter(u => {
      if (roleFilter !== 'ALL' && u.roleName !== roleFilter) return false;
      if (!query) return true;
      const haystack = `${u.name ?? ''} ${u.surname ?? ''} ${u.nickname ?? ''} ${u.email ?? ''}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [users, roleFilter, search]);

  return {
    filteredUsers,
    roles,
    stats,
    isLoading,
    alert,
    closeAlert,
    roleFilter,
    setRoleFilter,
    search,
    setSearch,
    refresh: fetchUsers,
    toggleActive,
    resetPassword,
  };
};
