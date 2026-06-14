import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from "react-i18next";
import { BACKEND_URL, getAuthHeaders } from "../../utils/apiConfigs";
import { authFetch } from '../../utils/authFetch';

export interface Employee {
    id: number;
    name: string;
    surname: string;
    nickname?: string;
    phoneNumber?: string;
    email?: string;
    creationDate?: string;
    active: boolean;
    role?: { roleName: string };
    workDetails?: any;
}

export interface WorkDetails {
    isPaidHourly: boolean;
    hourlyPay?: number;
    payPerKilogram?: number;
    createdAt: string;
}

export interface Advance {
    id: number;
    amount: number;
    description?: string;
    date?: string;
    createdAt: string;
}

export const useEmployeeManagement = () => {
    const { t } = useTranslation("employeeManagement");
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [alert, setAlert] = useState({ type: '', message: '' });

    const closeAlert = useCallback(() => setAlert({ type: '', message: '' }), []);

    const fetchEmployees = useCallback(async () => {
        setIsLoading(true);
        setEmployees([]);
        const endpoint = showArchived ? '/api/users/archived' : '/api/users/active';
        try {
            const response = await authFetch(`${BACKEND_URL}${endpoint}`, { method: 'GET', headers: getAuthHeaders() });
            if (response.ok) {
                const data = await response.json();
                setEmployees(Array.isArray(data) ? data : []);
            } else {
                const error = await response.json();
                setAlert({ type: 'error', message: t("messages.fetchError", { error: error.message || response.statusText }) });
            }
        } catch (error) {
            setAlert({ type: 'error', message: t("messages.fetchNetworkError") });
        } finally {
            setIsLoading(false);
        }
    }, [showArchived, t]);

    const fetchAllEmployeesForStats = useCallback(async () => {
        try {
            const response = await authFetch(`${BACKEND_URL}/api/users`, { method: 'GET', headers: getAuthHeaders() });
            if (response.ok) {
                const data = await response.json();
                setAllEmployees(Array.isArray(data) ? data : []);
            }
        } catch (error) { }
    }, []);

    useEffect(() => {
        fetchEmployees();
        fetchAllEmployeesForStats();
    }, [fetchEmployees, fetchAllEmployeesForStats]);

    const filteredEmployees = useMemo(() => {
        let list = employees;
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            list = list.filter(emp =>
                (emp.name?.toLowerCase().includes(term)) ||
                (emp.surname?.toLowerCase().includes(term)) ||
                (emp.nickname?.toLowerCase().includes(term)) ||
                (emp.email?.toLowerCase().includes(term)) ||
                (emp.phoneNumber?.includes(term))
            );
        }
        return list;
    }, [employees, searchTerm]);

    const activeCount = allEmployees.filter(e => e.active).length;
    const archivedCount = allEmployees.filter(e => !e.active).length;

    const handleSaveEmployee = useCallback(async (employeeData: any) => {
        setIsLoading(true);
        closeAlert();
        const isUpdate = !!selectedEmployee;
        const endpoint = isUpdate ? `${BACKEND_URL}/api/users/${selectedEmployee.id}` : `${BACKEND_URL}/api/users`;
        const method = isUpdate ? 'PUT' : 'POST';

        try {
            const response = await authFetch(endpoint, {
                method, headers: getAuthHeaders(), body: JSON.stringify(employeeData)
            });

            if (response.ok) {
                setAlert({ type: 'success', message: isUpdate ? t("messages.saveUpdated") : t("messages.saveAdded") });
                setIsModalOpen(false);
                setSelectedEmployee(null);
                fetchEmployees();
                fetchAllEmployeesForStats();
            } else {
                const error = await response.json();
                setAlert({ type: 'error', message: `${error.message || error.error || response.statusText}` });
            }
        } catch (error) {
            setAlert({ type: 'error', message: t("messages.saveNetworkError") });
        } finally {
            setIsLoading(false);
        }
    }, [selectedEmployee, fetchEmployees, fetchAllEmployeesForStats, closeAlert, t]);

    const toggleEmployeeStatus = useCallback(async (employeeId: number, newStatus: boolean) => {
        closeAlert();
        const endpoint = `${BACKEND_URL}/api/users/${employeeId}/toggle-status`;

        try {
            const response = await authFetch(endpoint, {
                method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ active: newStatus })
            });

            if (response.ok) {
                setAlert({ type: 'success', message: newStatus ? t("messages.statusRestored") : t("messages.statusArchived") });
                fetchEmployees();
                fetchAllEmployeesForStats();
            } else {
                const error = await response.json();
                const errorDetail = error.message || response.statusText;
                setAlert({ type: 'error', message: newStatus ? t("messages.statusErrorActivate", { error: errorDetail }) : t("messages.statusErrorArchive", { error: errorDetail }) });
            }
        } catch (error) {
            setAlert({ type: 'error', message: newStatus ? t("messages.statusNetworkErrorActivate") : t("messages.statusNetworkErrorArchive") });
        }
    }, [fetchEmployees, fetchAllEmployeesForStats, closeAlert, t]);

    const openModal = useCallback((employee: Employee | null = null) => { setSelectedEmployee(employee); setIsModalOpen(true); closeAlert(); }, [closeAlert]);
    const closeModal = useCallback(() => { setIsModalOpen(false); setSelectedEmployee(null); }, []);
    
    const handleFinanceDetails = useCallback((employee: Employee) => { setSelectedEmployee(employee); setIsFinanceModalOpen(true); closeAlert(); }, [closeAlert]);
    const closeFinanceModal = useCallback(() => { setIsFinanceModalOpen(false); setSelectedEmployee(null); }, []);
    const handleFinanceSave = useCallback((type: string, message: string) => { setAlert({ type, message }); }, []);

    return {
        employees, allEmployees, searchTerm, setSearchTerm, showArchived, setShowArchived,
        isModalOpen, setIsModalOpen, isFinanceModalOpen, setIsFinanceModalOpen, selectedEmployee, setSelectedEmployee,
        isLoading, alert, filteredEmployees, activeCount, archivedCount,
        handleSaveEmployee, toggleEmployeeStatus, openModal, closeModal, handleFinanceDetails, closeFinanceModal, handleFinanceSave, closeAlert
    };
};