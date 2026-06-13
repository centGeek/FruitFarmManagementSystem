import { useState, useEffect, useCallback, useMemo } from 'react';
import { BACKEND_URL, getAuthHeaders } from "../../utils/apiConfigs";
import { authFetch } from "../../utils/authFetch";

export interface ScheduleSector {
  id: number;
  description?: string;
  plantType?: string;
  variety?: string;
}

export interface ScheduleEmployee {
  id: number;
  name?: string;
  surname?: string;
  nickname?: string;
  workDetails?: any;
}

export interface WorkEntry {
  entryId: number;
  workDate: string;
  workType?: string;
  description?: string;
  duration?: number;
  daySalary?: any;
  kilogramsPicked?: number;
  isPaid?: boolean;
  user?: any;
  sector?: { id?: number } | null;
}

export interface UnsettledAdvance {
  id?: number;
  amount: any;
  description?: string;
}

export const WORK_TYPE_OPTIONS = [
    { value: 'HARVEST', label: '🌾 Zbiory', icon: '🌾' },
    { value: 'WEEDING', label: '🌱 Pielenie', icon: '🌱' },
    { value: 'WATERING', label: '💧 Nawadnianie', icon: '💧' },
    { value: 'SPRAYING', label: '💨 Opryski', icon: '💨' },
    { value: 'PLANTING', label: '🌿 Sadzenie', icon: '🌿' },
    { value: 'PRUNING', label: '✂️ Przycinanie', icon: '✂️' },
    { value: 'FERTILIZING', label: '🧪 Nawożenie', icon: '🧪' },
    { value: 'OTHER', label: '📋 Inne', icon: '📋' }
];

export const getWorkTypeLabel = (workType: string) => {
    const option = WORK_TYPE_OPTIONS.find(opt => opt.value === workType);
    return option ? option.label : workType;
};

export const getWorkTypeIcon = (workType: string) => {
    const option = WORK_TYPE_OPTIONS.find(opt => opt.value === workType);
    return option ? option.icon : '📋';
};

export const useWorkEntryManagement = () => {
    const [workEntries, setWorkEntries] = useState<WorkEntry[]>([]);
    const [employees, setEmployees] = useState<ScheduleEmployee[]>([]);
    const [sectors, setSectors] = useState<ScheduleSector[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<any>(null);
    const [bulkAssignDate, setBulkAssignDate] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [alert, setAlert] = useState({ type: '', message: '' });
    const [criticalError, setCriticalError] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<any>(null);
    
    const [isPayAllModalOpen, setIsPayAllModalOpen] = useState(false);
    const [selectedEmployeeForPayment, setSelectedEmployeeForPayment] = useState<any>(null);
    const [paymentModalType, setPaymentModalType] = useState('all');
    const [unpaidEntriesForPayment, setUnpaidEntriesForPayment] = useState<WorkEntry[]>([]);
    const [unsettledAdvances, setUnsettledAdvances] = useState<UnsettledAdvance[]>([]);

    const [isAdvancePayModalOpen, setIsAdvancePayModalOpen] = useState(false);
    const [selectedEmployeeForAdvance, setSelectedEmployeeForAdvance] = useState<any>(null);

    const closeAlert = useCallback(() => setAlert({ type: '', message: '' }), []);

    const parseApiError = useCallback(async (response: Response) => {
        let errorData = {
            status: response.status,
            error: response.statusText,
            message: 'Wystąpił nieoczekiwany błąd',
            timestamp: new Date().toISOString()
        };
        try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const json = await response.json();
                errorData = { ...errorData, ...json, message: json.message || json.detail || errorData.message };
            } else {
                const text = await response.text();
                errorData.message = text || errorData.message;
            }
        } catch (e) { console.error('Błąd parsowania odpowiedzi:', e); }
        return errorData;
    }, []);

    const fetchData = useCallback(async (setter: any, endpoint: string, entityName: string) => {
        try {
            const response = await authFetch(`${BACKEND_URL}${endpoint}`, { method: 'GET', headers: getAuthHeaders() });
            if (response.ok) {
                const data = await response.json();
                setter(Array.isArray(data) ? data.map((item: any) => ({ ...item, id: item.id || item.sectorId })) : []);
            } else {
                setAlert({ type: 'error', message: `Błąd ładowania ${entityName}: ${response.status}` });
                setter([]);
            }
        } catch (error) {
            setAlert({ type: 'error', message: `Błąd połączenia z serwerem podczas ładowania ${entityName}.` });
            setter([]);
        }
    }, []);

    const fetchEmployees = useCallback(async () => {
        try {
            const response = await authFetch(`${BACKEND_URL}/api/users/active`, { method: 'GET', headers: getAuthHeaders() });
            if (response.ok) {
                const employeesData = await response.json();
                const employeesWithDetails = await Promise.all(employeesData.map(async (emp: any) => {
                    try {
                        const detailsResponse = await authFetch(`${BACKEND_URL}/api/work-details/user/${emp.id}/latest`, { method: 'GET', headers: getAuthHeaders() });
                        if (detailsResponse.ok) return { ...emp, workDetails: await detailsResponse.json() };
                        return { ...emp, workDetails: null };
                    } catch { return { ...emp, workDetails: null }; }
                }));
                setEmployees(employeesWithDetails);
            } else {
                setEmployees([]);
                setAlert({ type: 'error', message: `Błąd ładowania pracowników: ${response.status}` });
            }
        } catch {
            setEmployees([]);
            setAlert({ type: 'error', message: 'Błąd połączenia z serwerem.' });
        }
    }, []);

    const fetchSectors = useCallback(() => fetchData(setSectors, '/api/sectors', 'sektorów'), [fetchData]);
    const fetchUnsettledAdvances = useCallback(async (userId: number) => {
        try {
            const response = await authFetch(`${BACKEND_URL}/api/advances/user/${userId}/unsettled`, { method: 'GET', headers: getAuthHeaders() });
            if (response.ok) setUnsettledAdvances(await response.json());
            else setUnsettledAdvances([]);
        } catch { setUnsettledAdvances([]); }
    }, []);

    const fetchWorkEntries = useCallback(async () => {
        setIsLoading(true);
        try {
            const startOfWeek = new Date(currentDate);
            startOfWeek.setHours(0, 0, 0, 0);
            const day = (startOfWeek.getDay() + 6) % 7;
            startOfWeek.setDate(startOfWeek.getDate() - day);
            
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);
            
            const formatDate = (date: Date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const d = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${d}`;
            };
            
            const response = await authFetch(
                `${BACKEND_URL}/api/work-entries/week?startDate=${formatDate(startOfWeek)}&endDate=${formatDate(endOfWeek)}`, 
                { method: 'GET', headers: getAuthHeaders() }
            );

            if (response.ok) setWorkEntries(await response.json());
            else setWorkEntries([]);
        } catch { setWorkEntries([]); setAlert({ type: 'error', message: 'Błąd ładowania wpisów.' }); }
        finally { setIsLoading(false); }
    }, [currentDate]);

    useEffect(() => { fetchEmployees(); fetchSectors(); }, [fetchEmployees, fetchSectors]);
    useEffect(() => { fetchWorkEntries(); }, [currentDate, fetchWorkEntries]);

    const handleSaveBulkEntries = useCallback(async (entries: any[]) => {
        setIsLoading(true);
        closeAlert();
        const workDateString = bulkAssignDate ? new Date(bulkAssignDate).toISOString().split('T')[0] : null;
        
        if (!workDateString) { setAlert({ type: 'error', message: 'Nie wybrano daty pracy.' }); setIsLoading(false); return; }

        const entriesToSend = entries.map(entry => {
            const fullEmployee = employees.find(emp => emp.id === entry.employeeId);
            return {
                user: fullEmployee ? { ...fullEmployee } : { id: entry.employeeId },
                sector: entry.sectorId ? { id: parseInt(entry.sectorId), sectorId: parseInt(entry.sectorId) } : null,
                workType: entry.workType || null,
                workDate: workDateString,
                description: entry.description || '',
                duration: parseFloat(entry.hours) || 0,
                daySalary: 0,
                kilogramsPicked: !entry.employee.workDetails?.isPaidHourly ? parseFloat(entry.kilogramsPicked || 0) : 0,
                isPaid: false,
            };
        });

        try {
            const response = await authFetch(`${BACKEND_URL}/api/work-entries`, {
                method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(entriesToSend),
            });
            if (response.ok) {
                setIsModalOpen(false);
                setBulkAssignDate(null);
                setAlert({ type: 'success', message: `Zapisano ${entriesToSend.length} wpisów.` });
                await fetchWorkEntries();
            } else {
                setCriticalError(await parseApiError(response));
            }
        } catch { setCriticalError({ status: 0, error: 'Błąd', message: 'Błąd połączenia', timestamp: new Date().toISOString() }); }
        finally { setIsLoading(false); }
    }, [bulkAssignDate, employees, fetchWorkEntries, parseApiError, closeAlert]);

    const handleEditEntry = useCallback(async (updatedEntry: any) => {
        setIsLoading(true);
        try {
            const entryToSend = {
                user: updatedEntry.user, sector: updatedEntry.sector?.id ? { id: updatedEntry.sector.id } : null,
                workType: updatedEntry.workType || null, workDate: updatedEntry.workDate,
                duration: parseFloat(updatedEntry.duration) || 0, description: updatedEntry.description || '',
                daySalary: parseFloat(updatedEntry.daySalary) || 0, isPaid: Boolean(updatedEntry.isPaid),
                kilogramsPicked: parseFloat(updatedEntry.kilogramsPicked) || 0
            };
            const response = await authFetch(`${BACKEND_URL}/api/work-entries/${updatedEntry.entryId}`, {
                method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(entryToSend),
            });
            if (response.ok) {
                await fetchWorkEntries();
                setIsEditModalOpen(false); setEditingEntry(null); setSelectedEntry(null);
                setAlert({ type: 'success', message: 'Wpis zaktualizowany.' });
            } else {
                const err = await parseApiError(response);
                setAlert({ type: 'error', message: `Błąd: ${err.message}` });
            }
        } catch { setAlert({ type: 'error', message: 'Błąd połączenia.' }); }
        finally { setIsLoading(false); }
    }, [fetchWorkEntries, parseApiError]);

    const handleDeleteEntry = useCallback(async (entryId: number) => {
        setIsLoading(true);
        try {
            const response = await authFetch(`${BACKEND_URL}/api/work-entries/${entryId}`, { method: 'DELETE', headers: getAuthHeaders() });
            if (response.ok) {
                setWorkEntries(prev => prev.filter(e => e.entryId !== entryId));
                setSelectedEntry(null);
                setAlert({ type: 'success', message: 'Wpis usunięty.' });
            } else {
                const err = await parseApiError(response);
                setAlert({ type: 'error', message: `Błąd: ${err.message}` });
            }
        } catch { setAlert({ type: 'error', message: 'Błąd połączenia.' }); }
        finally { setIsLoading(false); }
    }, [parseApiError]);

    const handleTogglePaid = useCallback(async (entryId: number) => {
        const entry = workEntries.find(e => e.entryId === entryId);
        if (!entry) return;
        setIsLoading(true);
        try {
            const response = await authFetch(`${BACKEND_URL}/api/work-entries/${entryId}/paid`, {
                method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify({ isPaid: !entry.isPaid }),
            });
            if (response.ok) {
                setWorkEntries(prev => prev.map(e => e.entryId === entryId ? { ...e, isPaid: !e.isPaid } : e));
                setAlert({ type: 'success', message: !entry.isPaid ? 'Oznaczono jako zapłacone' : 'Oznaczono jako niezapłacone' });
            } else {
                const err = await parseApiError(response);
                setAlert({ type: 'error', message: `Błąd: ${err.message}` });
            }
        } catch { setAlert({ type: 'error', message: 'Błąd połączenia.' }); }
        finally { setIsLoading(false); }
    }, [workEntries, parseApiError]);

    const handlePayAllForEmployee = useCallback(async (userId: number) => { return performMassPayment(userId, 'pay-all-and-settle'); }, []);
    const handlePayAllForMonth = useCallback(async (userId: number) => { return performMassPayment(userId, 'pay-month-and-settle'); }, []);

    const performMassPayment = async (userId: number, endpointSuffix: string) => {
        setIsLoading(true); closeAlert();
        try {
            const response = await authFetch(`${BACKEND_URL}/api/work-entries/user/${userId}/${endpointSuffix}`, { method: 'PATCH', headers: getAuthHeaders() });
            if (response.ok) {
                await fetchWorkEntries();
                handleClosePayAllModal();
                setAlert({ type: 'success', message: 'Płatność zakończona sukcesem.' });
            } else {
                const err = await parseApiError(response);
                setAlert({ type: 'error', message: `Błąd: ${err.message}` });
            }
        } catch { setAlert({ type: 'error', message: 'Błąd połączenia.' }); }
        finally { setIsLoading(false); }
    };

    const handleConfirmAdvancePayment = useCallback(async (userId: number, amount: number, description: string) => {
        setIsLoading(true); closeAlert();
        try {
            const response = await authFetch(`${BACKEND_URL}/api/advances`, {
                method: 'POST', headers: getAuthHeaders(),
                body: JSON.stringify({ userId, amount, description, advanceDate: new Date().toISOString().split('T')[0] }),
            });
            if (response.ok) {
                handleCloseAdvancePayModal();
                setAlert({ type: 'success', message: `Zapisano zaliczkę ${amount.toFixed(2)} zł.` });
                fetchUnsettledAdvances(userId);
            } else {
                const err = await parseApiError(response);
                setAlert({ type: 'error', message: `Błąd: ${err.message}` });
            }
        } catch { setAlert({ type: 'error', message: 'Błąd połączenia.' }); }
        finally { setIsLoading(false); }
    }, [closeAlert, parseApiError, fetchUnsettledAdvances]);

    const fetchUnpaidEntriesForEmployee = useCallback(async (userId: number) => {
        try {
            const response = await authFetch(`${BACKEND_URL}/api/work-entries/user/${userId}/unpaid`, { method: 'GET', headers: getAuthHeaders() });
            if (response.ok) setUnpaidEntriesForPayment(await response.json());
            else setUnpaidEntriesForPayment([]);
        } catch { setUnpaidEntriesForPayment([]); }
    }, []);

    const handleOpenPayAllModal = useCallback((employeeId: number) => {
        const emp = employees.find(e => e.id === Number(employeeId));
        if (emp) {
            setSelectedEmployeeForPayment(emp); setPaymentModalType('all'); setIsPayAllModalOpen(true);
            fetchUnpaidEntriesForEmployee(emp.id); fetchUnsettledAdvances(emp.id);
        } else setAlert({ type: 'error', message: 'Nie znaleziono pracownika.' });
    }, [employees, fetchUnpaidEntriesForEmployee, fetchUnsettledAdvances]);

    const handleOpenPayAllMonthModal = useCallback((employeeId: number) => {
        const emp = employees.find(e => e.id === Number(employeeId));
        if (emp) {
            setSelectedEmployeeForPayment(emp); setPaymentModalType('month'); setIsPayAllModalOpen(true);
            fetchUnpaidEntriesForEmployee(emp.id); fetchUnsettledAdvances(emp.id);
        } else setAlert({ type: 'error', message: 'Nie znaleziono pracownika.' });
    }, [employees, fetchUnpaidEntriesForEmployee, fetchUnsettledAdvances]);

    const handleOpenAdvancePayModal = useCallback((employeeId: number) => {
        const emp = employees.find(e => e.id === Number(employeeId));
        if (emp) { setSelectedEmployeeForAdvance(emp); setIsAdvancePayModalOpen(true); setSelectedEntry(null); }
        else setAlert({ type: 'error', message: 'Nie znaleziono pracownika.' });
    }, [employees]);

    const handleCloseModal = (type?: string, message?: string) => {
        setIsModalOpen(false); setBulkAssignDate(null); setSelectedEntry(null); setIsEditModalOpen(false); setEditingEntry(null);
        if (type && message) setAlert({ type, message });
    };
    const handleClosePayAllModal = () => { setIsPayAllModalOpen(false); setSelectedEmployeeForPayment(null); setPaymentModalType('all'); setUnpaidEntriesForPayment([]); setUnsettledAdvances([]); };
    const handleCloseAdvancePayModal = () => { setIsAdvancePayModalOpen(false); setSelectedEmployeeForAdvance(null); };

    const handleConfirmPayment = () => {
        if (!selectedEmployeeForPayment) return;
        if (paymentModalType === 'month') handlePayAllForMonth(selectedEmployeeForPayment.id);
        else handlePayAllForEmployee(selectedEmployeeForPayment.id);
    };

    const stats = useMemo(() => {
        const startOfWeek = new Date(currentDate); startOfWeek.setHours(0, 0, 0, 0);
        const day = (startOfWeek.getDay() + 6) % 7; startOfWeek.setDate(startOfWeek.getDate() - day);
        const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(startOfWeek.getDate() + 6); endOfWeek.setHours(23, 59, 59, 999);
        const weekly = workEntries.filter(e => { const d = new Date(e.workDate); return d >= startOfWeek && d <= endOfWeek; });
        return {
            total: weekly.length, paid: weekly.filter(e => e.isPaid).length, unpaid: weekly.filter(e => !e.isPaid).length,
            totalSalaryWeek: weekly.reduce((sum, e) => sum + (parseFloat(e.daySalary) || 0), 0)
        };
    }, [workEntries, currentDate]);

    const employeeEntriesForPayment = useMemo(() => {
        if (!selectedEmployeeForPayment) return { entries: [], totalGrossAmount: 0, advances: [], netAmount: 0 };
        const today = new Date(); today.setHours(23, 59, 59, 999);
        let filtered = [];
        if (paymentModalType === 'month') {
            const start = new Date(today.getFullYear(), today.getMonth(), 1); start.setHours(0,0,0,0);
            const end = new Date(today.getFullYear(), today.getMonth() + 1, 0); end.setHours(23,59,59,999);
            filtered = unpaidEntriesForPayment.filter(e => { const d = new Date(e.workDate); return d >= start && d <= end; });
        } else {
            filtered = unpaidEntriesForPayment.filter(e => new Date(e.workDate) <= today);
        }
        const totalGross = filtered.reduce((s, e) => s + (parseFloat(e.daySalary) || 0), 0);
        const totalAdv = unsettledAdvances.reduce((s, a) => s + (parseFloat(a.amount) || 0), 0);
        return { entries: filtered, totalGrossAmount: totalGross, advances: unsettledAdvances, netAmount: Math.max(0, totalGross - totalAdv) };
    }, [unpaidEntriesForPayment, unsettledAdvances, selectedEmployeeForPayment, paymentModalType]);

    const handleOpenEditModal = (entry: any) => {
        setEditingEntry({
            ...entry, duration: entry.duration || 0, sectorId: entry.sector?.id || '', workType: entry.workType || '',
            daySalary: parseFloat(entry.daySalary) || 0, isPaid: Boolean(entry.isPaid), kilogramsPicked: entry.kilogramsPicked || 0
        });
        setSelectedEntry(null); setIsEditModalOpen(true);
    };

    return {
        workEntries, employees, sectors, currentDate, setCurrentDate, isModalOpen, setIsModalOpen, selectedEntry, setSelectedEntry,
        bulkAssignDate, setBulkAssignDate, isLoading, alert, setAlert, closeAlert, criticalError, setCriticalError,
        isEditModalOpen, setIsEditModalOpen, editingEntry, setEditingEntry,
        isPayAllModalOpen, selectedEmployeeForPayment, paymentModalType, isAdvancePayModalOpen, selectedEmployeeForAdvance,
        stats, employeeEntriesForPayment,
        handleOpenBulkAssignModal: (date: string) => { setBulkAssignDate(date); setSelectedEntry(null); setIsModalOpen(true); },
        handleOpenDetailsModal: setSelectedEntry, handleCloseModal, handleClosePayAllModal, handleCloseAdvancePayModal,
        handleSaveBulkEntries, handleEditEntry, handleDeleteEntry, handleTogglePaid, handleConfirmPayment, handleConfirmAdvancePayment,
        handleOpenEditModal, handleOpenPayAllModal, handleOpenPayAllMonthModal, handleOpenAdvancePayModal
    };
};