import { useState, useEffect, useCallback } from 'react';
import { BACKEND_URL, getAuthHeaders } from "../../utils/apiConfigs";
import { authFetch } from '../../utils/authFetch';

export const useAdminStats = () => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const closeAlert = useCallback(() => setAlert({ type: '', message: '' }), []);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await authFetch(`${BACKEND_URL}/api/admin/stats`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        setStats(await response.json());
      } else {
        setAlert({ type: 'error', message: 'Nie udało się pobrać statystyk.' });
      }
    } catch {
      setAlert({ type: 'error', message: 'Błąd sieci podczas pobierania statystyk.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const exportCsv = useCallback(() => {
    if (!stats) return;
    const rows: [string, string | number][] = [
      ['Metryka', 'Wartość'],
      ['Użytkownicy łącznie', stats.totalUsers],
      ['Administratorzy', stats.admins],
      ['Sadownicy', stats.gardeners],
      ['Pracownicy', stats.employees],
      ['Konta aktywne', stats.activeUsers],
      ['Konta zablokowane', stats.blockedUsers],
      ['Sektory łącznie', stats.totalSectors],
      ['Sektory aktywne', stats.activeSectors],
      ['Wpisy pracy', stats.totalWorkEntries],
      ['Zebrane kilogramy', stats.totalKilogramsPicked],
      ['Wypłacone wynagrodzenia', stats.totalSalaries],
      ['Wydatki łącznie', stats.totalExpenses],
      ['Wydatki opłacone', stats.paidExpenses],
      ['Wydatki nieopłacone', stats.unpaidExpenses],
      ['Przychody łącznie', stats.totalProfits],
      ['Bilans netto', stats.netBalance],
      ['Sprzedane kilogramy', stats.totalKilogramsSold],
      ['Zgłoszenia łącznie', stats.totalTickets],
      ['Zgłoszenia otwarte', stats.openTickets],
      ['Zgłoszenia w trakcie', stats.inProgressTickets],
      ['Zgłoszenia zamknięte', stats.closedTickets],
      ['Śr. czas zamknięcia (h)', stats.avgTicketCloseHours ?? '—'],
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statystyki-sadu-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [stats]);

  const printReport = useCallback(() => window.print(), []);

  return { stats, isLoading, alert, closeAlert, refresh: fetchStats, exportCsv, printReport };
};
