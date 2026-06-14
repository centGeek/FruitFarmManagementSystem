import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from "react-i18next";
import { formatCurrency } from "../../utils/common";
import { EXPENSE_TYPES, getExpenseTypeDetails } from './ExpenseManagementHooks';

export const Modal = ({ isOpen, onClose, title, children }: any) => {
    if (!isOpen) return null;
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-transform duration-300 scale-100">
                <div className="sticky top-0 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-6 py-4 rounded-t-2xl z-10 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center"><span className="mr-2 text-red-600 dark:text-red-300">💰</span>{title}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-colors text-lg">❌</button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
};

export const InputField = React.memo(({ label, name, type = 'text', required = false, error, isLoading, handleChange, value, ...props }: any) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{label} {required && '*'}</label>
        <div className="relative">
            <input id={name} type={type} name={name} onChange={handleChange} className={`w-full px-3 py-2 ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400`} disabled={isLoading} value={value} {...props} />
        </div>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
));

export const LoadingState = () => {
    const { t } = useTranslation("expenseManagement");
    return (
        <div className="text-center py-16">
            <div className="w-14 h-14 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-gray-500 dark:text-gray-400 text-xl font-medium">{t('loading')}</p>
        </div>
    );
};

export const EmptyState = ({ searchTerm, expensesCount, onAddClick }: any) => {
    const { t } = useTranslation("expenseManagement");
    let title, message;
    if (searchTerm) { title = t('empty.noResultsTitle'); message = t('empty.noResultsMessage'); }
    else if (expensesCount === 0) { title = t('empty.noExpensesTitle'); message = t('empty.noExpensesMessage'); }
    else { title = t('empty.noMatchTitle'); message = t('empty.noMatchMessage'); }

    return (
        <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">💸</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-3">{title}</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">{message}</p>
            {expensesCount === 0 && (
                <button onClick={onAddClick} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-md flex items-center justify-center mx-auto">
                    <span className="inline mr-2 text-xl">+</span>{t('empty.addFirst')}
                </button>
            )}
        </div>
    );
};

export const ExpenseForm = ({ expense, onSave, onCancel, isLoading, sectors }: any) => {
    const { t } = useTranslation("expenseManagement");
    const isUpdating = !!expense;
    const today = new Date().toISOString().split('T')[0];
    const initialState = useMemo(() => ({
        id: expense?.id || null,
        date: expense?.createdAt || today,
        amount: expense?.amount?.toString() || '',
        type: expense?.type || EXPENSE_TYPES[0].value,
        description: expense?.description || '',
        paid: expense?.paid ?? true,
        sectorId: expense?.sectorDTO?.id?.toString() || '',
    }), [expense, today]);

    const [formData, setFormData] = useState(initialState);
    const [errors, setErrors] = useState<any>({});
    
    useEffect(() => { setFormData(initialState); setErrors({}); }, [initialState]);

    const handleChange = useCallback((e: any) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        if (errors[name]) setErrors((prev: any) => ({ ...prev, [name]: '' }));
    }, [errors]);

    const validate = useCallback(() => {
        const newErrors: any = {};
        const amountNum = Number(formData.amount);
        if (!formData.date.trim()) newErrors.date = t('form.errors.dateRequired');
        if (!formData.amount || isNaN(amountNum) || amountNum <= 0) newErrors.amount = t('form.errors.amountPositive');
        if (!formData.type) newErrors.type = t('form.errors.typeRequired');
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData, t]);

    const handleSubmit = useCallback((e: any) => {
        e.preventDefault();
        if (validate()) {
            const submitData = { ...formData, amount: Number(formData.amount), createdAt: formData.date, sectorDTO: formData.sectorId ? { id: Number(formData.sectorId) } : null };
            delete submitData.sectorId;
            onSave(submitData);
        }
    }, [validate, formData, onSave]);

    const selectedSector = sectors?.find((s: any) => s.id === Number(formData.sectorId));

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <InputField label={t('form.dateLabel')} name="date" type="date" required value={formData.date} error={errors.date} handleChange={handleChange} isLoading={isLoading} />
            <InputField label={t('form.amountLabel')} name="amount" type="number" required value={formData.amount} error={errors.amount} handleChange={handleChange} isLoading={isLoading} step="0.01" min="0.01" />
            <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t('form.typeLabel')} *</label>
                <select id="type" name="type" value={formData.type} onChange={handleChange} className={`w-full px-3 py-2 ${errors.type ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white dark:bg-gray-700 dark:text-gray-100`} disabled={isLoading}>
                    {EXPENSE_TYPES.map(item => <option key={item.value} value={item.value}>{t(`expenseType.${item.value}`)}</option>)}
                </select>
                {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
            </div>
            <div>
                <label htmlFor="sectorId" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t('form.sectorLabel')}</label>
                <select id="sectorId" name="sectorId" value={formData.sectorId} onChange={handleChange} className="w-full px-3 py-2 border-gray-300 dark:border-gray-600 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white dark:bg-gray-700 dark:text-gray-100" disabled={isLoading}>
                    <option value="">{t('form.noSector')}</option>
                    {sectors && sectors.map((sector: any) => <option key={sector.id} value={sector.id}>{sector.description || t('sectorFallback', { id: sector.id })}{sector.plantType && ` - ${sector.plantType}`}</option>)}
                </select>
                {selectedSector && <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-800 dark:text-blue-300">{t('form.sectorAssignInfo')} <strong>{selectedSector.description || t('sectorFallback', { id: selectedSector.id })}</strong></div>}
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t('form.descriptionLabel')}</label>
                <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3} className={`w-full px-3 py-2 ${errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400`} disabled={isLoading} />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>
            <div className="flex items-center pt-2">
                <input type="checkbox" name="paid" id="paid" checked={formData.paid} onChange={handleChange} className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 dark:border-gray-600 rounded" disabled={isLoading} />
                <label htmlFor="paid" className="ml-2 text-sm text-gray-700 dark:text-gray-200 font-medium">{t('form.paidLabel')}</label>
            </div>
            <div className="flex space-x-3 pt-6 border-t border-gray-100 dark:border-gray-700">
                <button type="submit" disabled={isLoading} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center shadow-md text-lg">
                    {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> : '💾'} {isUpdating ? t('form.saveChanges') : t('form.addExpense')}
                </button>
                <button type="button" onClick={onCancel} className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 py-3 px-4 rounded-xl font-semibold transition-colors" disabled={isLoading}>{t('form.cancel')}</button>
            </div>
        </form>
    );
};

export const ExpenseCard = ({ expense, onEdit, onDelete }: any) => {
    const { t } = useTranslation("expenseManagement");
    const typeDetails = getExpenseTypeDetails(expense.type);
    const isKnownType = EXPENSE_TYPES.some(item => item.value === expense.type);
    const typeLabel = isKnownType ? t(`expenseType.${expense.type}`) : t('expenseType.UNKNOWN');
    const isPaid = expense.paid;
    const expenseDate = new Date(expense.createdAt).toLocaleDateString('pl-PL');
    const assignedSector = expense.sectorDTO || null;

    return (
        <div className={`bg-white dark:bg-gray-800 border-2 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 ${isPaid ? 'border-green-300 dark:border-green-800' : 'border-red-300 dark:border-red-800'}`}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl ${typeDetails.color.split(' ')[0]} border ${typeDetails.color.split(' ')[2]}`}>{typeDetails.icon}</div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('card.amountWithCurrency', { amount: formatCurrency(expense.amount) })}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{expenseDate}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={() => onEdit(expense)} className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors text-base" title={t('card.editTitle')}>✏️</button>
                    <button onClick={() => onDelete(expense.id)} className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-base" title={t('card.deleteTitle')}>🗑️</button>
                </div>
            </div>
            <div className="mb-4 space-x-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${typeDetails.color}`}>{typeLabel}</span>
                {isPaid ? <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">{t('card.paid')}</span> : <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">{t('card.unpaid')}</span>}
            </div>
            {assignedSector && (
                <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-xs text-blue-600 dark:text-blue-300 font-medium">{t('card.sector', { value: assignedSector.description || t('sectorFallback', { id: assignedSector.id }) })}{assignedSector.plantType && ` (${assignedSector.plantType})`}</p>
                </div>
            )}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">{t('card.descriptionLabel')}</p>
                <p className="text-base text-gray-900 dark:text-gray-50 line-clamp-2">{expense.description || t('card.noDescription')}</p>
            </div>
        </div>
    );
};

export const StatCard = ({ count, label, color, amount }: any) => {
    const { t } = useTranslation("expenseManagement");
    const colorMap: any = {
        green: { bg: 'from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30', text: 'text-green-600 dark:text-green-300', icon: '✅' },
        red: { bg: 'from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30', text: 'text-red-600 dark:text-red-300', icon: '💸' },
        blue: { bg: 'from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30', text: 'text-blue-600 dark:text-blue-300', icon: '📊' },
        purple: { bg: 'from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30', text: 'text-purple-600 dark:text-purple-300', icon: '🧑‍🌾' }
    };
    const colors = colorMap[color] || colorMap.red;
    const displayValue = amount !== undefined ? t('card.amountWithCurrency', { amount: formatCurrency(amount) }) : count;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
            <div className="flex items-center space-x-4">
                <div className={`w-14 h-14 bg-gradient-to-br ${colors.bg} rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl`}>{colors.icon}</div>
                <div>
                    <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-50">{displayValue}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                </div>
            </div>
        </div>
    );
};

export const Pagination = ({ currentPage, totalPages, onPageChange }: any) => {
    const { t } = useTranslation("expenseManagement");
    if (totalPages <= 1) return null;
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        if (totalPages <= maxVisible) for (let i = 1; i <= totalPages; i++) pages.push(i);
        else {
            if (currentPage <= 3) { for (let i = 1; i <= 4; i++) pages.push(i); pages.push('...'); pages.push(totalPages); }
            else if (currentPage >= totalPages - 2) { pages.push(1); pages.push('...'); for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i); }
            else { pages.push(1); pages.push('...'); for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i); pages.push('...'); pages.push(totalPages); }
        }
        return pages;
    };

    return (
        <div className="flex items-center justify-center gap-2 mt-8 pb-4">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-red-500 disabled:hover:bg-white dark:disabled:hover:bg-gray-800 disabled:hover:border-gray-300 dark:disabled:hover:border-gray-600">{t('pagination.previous')}</button>
            <div className="flex items-center gap-1">
                {getPageNumbers().map((page, index) => page === '...' ? <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-400 dark:text-gray-500">...</span> : <button key={page} onClick={() => onPageChange(page)} className={`min-w-[40px] h-[40px] rounded-lg font-semibold transition-all ${currentPage === page ? 'bg-gradient-to-r from-red-600 to-orange-700 text-white shadow-lg scale-110' : 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-red-500'}`}>{page}</button>)}
            </div>
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-red-500 disabled:hover:bg-white dark:disabled:hover:bg-gray-800 disabled:hover:border-gray-300 dark:disabled:hover:border-gray-600">{t('pagination.next')}</button>
        </div>
    );
};