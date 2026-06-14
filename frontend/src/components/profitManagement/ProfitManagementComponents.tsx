import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from "react-i18next";
import { formatCurrency } from "../../utils/common";
import { PROFIT_TYPES, getProfitTypeDetails } from './ProfitManagementHooks';

export const Modal = ({ isOpen, onClose, title, children }: any) => {
    if (!isOpen) return null;
    
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => { 
            if (event.key === 'Escape') onClose(); 
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-transform duration-300 scale-100">
                <div className="sticky top-0 bg-green-50 border-b border-green-200 px-6 py-4 rounded-t-2xl z-10 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                        <span className="mr-2 text-green-600">💰</span>{title}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-green-100 rounded-xl transition-colors text-lg">
                        ❌
                    </button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
};

export const InputField = React.memo(({ label, name, type = 'text', required = false, error, isLoading, handleChange, value, ...props }: any) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">
            {label} {required && '*'}
        </label>
        <div className="relative">
            <input
                id={name}
                type={type}
                name={name}
                onChange={handleChange}
                className={`w-full px-3 py-2 ${error ? 'border-red-500' : 'border-gray-300'} border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors`}
                disabled={isLoading} 
                value={value} 
                {...props} 
            />
        </div>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
));

export const LoadingState = () => {
    const { t } = useTranslation("profitManagement");
    return (
        <div className="text-center py-16">
            <div className="w-14 h-14 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-gray-500 text-xl font-medium">{t("loading")}</p>
        </div>
    );
};

export const EmptyState = ({ searchTerm, profitsCount, onAddClick }: any) => {
    const { t } = useTranslation("profitManagement");
    let title, message;
    if (searchTerm) {
        title = t("empty.searchTitle");
        message = t("empty.searchMessage");
    } else if (profitsCount === 0) {
        title = t("empty.noProfitsTitle");
        message = t("empty.noProfitsMessage");
    } else {
        title = t("empty.noCriteriaTitle");
        message = t("empty.noCriteriaMessage");
    }

    return (
        <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">
                💵
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">{message}</p>
            {profitsCount === 0 && (
                <button onClick={onAddClick} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-md flex items-center justify-center mx-auto">
                    <span className="inline mr-2 text-xl">+</span>{t("empty.addFirst")}
                </button>
            )}
        </div>
    );
};

export const ProfitForm = ({ profit, onSave, onCancel, isLoading, sectors }: any) => {
    const { t } = useTranslation("profitManagement");
    const isUpdating = !!profit;
    const today = new Date().toISOString().split('T')[0];
    const initialState = useMemo(() => ({
        id: profit?.purchaseId || null,
        date: profit?.createdAt || today,
        amount: profit?.profit?.toString() || '',
        kilogramsSold: profit?.kilogramsSold?.toString() || '', 
        profitType: profit?.profitType || PROFIT_TYPES[0].value,
        description: profit?.description || '',
        received: profit ? (profit.received ?? false) : true, 
        sectorId: profit?.sectorDTO?.id?.toString() || '',
    }), [profit, today]);

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
        const kgNum = formData.kilogramsSold ? Number(formData.kilogramsSold) : 0;
        
        if (!formData.date.trim()) newErrors.date = t("validation.dateRequired");
        if (amountNum < 0) newErrors.amount = t("validation.amountPositive");
        if (formData.kilogramsSold && (isNaN(kgNum) || kgNum < 0)) newErrors.kilogramsSold = t("validation.kilogramsNonNegative");
        if (!formData.profitType) newErrors.profitType = t("validation.typeRequired");

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData, t]);

    const handleSubmit = useCallback((e: any) => {
        e.preventDefault();
        if (validate()) {
            const submitData = {
                ...formData,
                profit: Number(formData.amount),
                kilogramsSold: formData.kilogramsSold ? Number(formData.kilogramsSold) : null, 
                createdAt: formData.date,
                sectorDTO: formData.sectorId ? { id: Number(formData.sectorId) } : null
            };
            // @ts-ignore
            delete submitData.amount; delete submitData.date; delete submitData.sectorId;
            onSave(submitData);
        }
    }, [validate, formData, onSave]);

    const selectedSector = sectors?.find((s: any) => s.id === Number(formData.sectorId));

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <InputField
                label={t("form.date")}
                name="date"
                type="date"
                required
                value={formData.date}
                error={errors.date}
                handleChange={handleChange}
                isLoading={isLoading}
            />
            <InputField
                label={t("form.amount")}
                name="amount"
                type="number"
                value={formData.amount}
                error={errors.amount}
                handleChange={handleChange}
                isLoading={isLoading}
                step="0.01"
                min="0.01"
            />
            <InputField
                label={t("form.kilogramsSold")}
                name="kilogramsSold"
                type="number"
                value={formData.kilogramsSold}
                error={errors.kilogramsSold}
                handleChange={handleChange}
                isLoading={isLoading}
                step="1"
                min="0"
            />
            
            <div>
                <label htmlFor="profitType" className="block text-sm font-medium text-gray-700 mb-2">
                    {t("form.type")} *
                </label>
                <select
                    id="profitType"
                    name="profitType"
                    value={formData.profitType}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 ${errors.profitType ? 'border-red-500' : 'border-gray-300'} border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white`}
                    disabled={isLoading}
                >
                    {PROFIT_TYPES.map(pt => <option key={pt.value} value={pt.value}>{t(`types.${pt.value}`)}</option>)}
                </select>
                {errors.profitType && <p className="text-red-500 text-xs mt-1">{errors.profitType}</p>}
            </div>

            <div>
                <label htmlFor="sectorId" className="block text-sm font-medium text-gray-700 mb-2">
                    {t("form.sector")}
                </label>
                <select
                    id="sectorId"
                    name="sectorId"
                    value={formData.sectorId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border-gray-300 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white"
                    disabled={isLoading}
                >
                    <option value="">{t("form.noSector")}</option>
                    {sectors && sectors.map((sector: any) => (
                        <option key={sector.id} value={sector.id}>
                            {sector.description || t("sectorFallback", { id: sector.id })}{sector.plantType && ` - ${sector.plantType}`}
                        </option>
                    ))}
                </select>
                {selectedSector && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                        {t("form.sectorAssignedTo")} <strong>{selectedSector.description || t("sectorFallback", { id: selectedSector.id })}</strong>
                    </div>
                )}
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    {t("form.description")}
                </label>
                <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className={`w-full px-3 py-2 ${errors.description ? 'border-red-500' : 'border-gray-300'} border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors`}
                    disabled={isLoading}
                />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>

            <div className="flex items-center pt-2">
                <input 
                    type="checkbox" 
                    name="received" 
                    id="received" 
                    checked={formData.received} 
                    onChange={handleChange} 
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    disabled={isLoading}
                />
                <label htmlFor="received" className="ml-2 text-sm text-gray-700 font-medium">
                    {t("form.received")}
                </label>
            </div>

            <div className="flex space-x-3 pt-6 border-t border-gray-100">
                <button type="submit" disabled={isLoading} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center shadow-md text-lg">
                    {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> : '💾'}
                    {isUpdating ? t("form.saveChanges") : t("form.addProfit")}
                </button>
                <button type="button" onClick={onCancel} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-xl font-semibold transition-colors" disabled={isLoading}>
                    {t("common:actions.cancel")}
                </button>
            </div>
        </form>
    );
};

export const ProfitCard = ({ profit, onEdit, onDelete }: any) => {
    const { t } = useTranslation("profitManagement");
    const typeDetails = getProfitTypeDetails(profit.profitType);
    const isReceived = profit.received;
    const profitDate = new Date(profit.createdAt).toLocaleDateString('pl-PL');
    const assignedSector = profit.sectorDTO || null;
    const kilograms = profit.kilogramsSold;
    const isSoldByWeight = kilograms && kilograms > 0;
    const pricePerKg = isSoldByWeight ? (profit.profit / kilograms).toFixed(2) : null;

    return (
        <div className={`bg-white border-2 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 ${isReceived ? 'border-green-300' : 'border-amber-300'}`}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl ${typeDetails.color.split(' ')[0]} border ${typeDetails.color.split(' ')[2]}`}>
                        {typeDetails.icon}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800">{formatCurrency(profit.profit)} PLN</h3>
                        <p className="text-sm text-gray-500">{profitDate}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={() => onEdit(profit)} className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors text-base" title={t("card.editTitle")}>✏️</button>
                    <button onClick={() => onDelete(profit.purchaseId)} className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors text-base" title={t("card.deleteTitle")}>🗑️</button>
                </div>
            </div>
            
            <div className="mb-4 space-x-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${typeDetails.color}`}>
                    {t(`types.${typeDetails.value}`)}
                </span>
                {isReceived ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        {t("card.received")}
                    </span>
                ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        {t("card.pending")}
                    </span>
                )}
            </div>

            {isSoldByWeight && (
                <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-800 font-medium space-x-2">
                        <span>{t("card.sold")} <strong>{kilograms.toFixed(2)} kg</strong></span>
                        <span className="text-gray-500">|</span>
                        <span>{t("card.pricePerKg")} <strong>{pricePerKg} PLN</strong></span>
                    </p>
                </div>
            )}

            {!isReceived && (
                <div className="mb-3 p-2 bg-amber-50 border border-amber-300 rounded-lg">
                    <p className="text-xs text-amber-800 font-medium">{t("card.waitingForPayment")}</p>
                </div>
            )}

            {assignedSector && (
                <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-600 font-medium">
                        {t("card.sector", { value: `${assignedSector.description || t("sectorFallback", { id: assignedSector.id })}${assignedSector.plantType ? ` (${assignedSector.plantType})` : ''}` })}
                    </p>
                </div>
            )}

            <div className="pt-4 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-500 uppercase mb-1">{t("card.descriptionLabel")}</p>
                <p className="text-base text-gray-900 line-clamp-2">{profit.description || t("card.noDescription")}</p>
            </div>
        </div>
    );
};

export const StatCard = ({ label, color, amount }: any) => {
    const colorMap: any = {
        green: { bg: 'from-green-100 to-green-200', text: 'text-green-600', icon: '✅' },
        amber: { bg: 'from-amber-100 to-amber-200', text: 'text-amber-600', icon: '⏳' },
        blue: { bg: 'from-blue-100 to-blue-200', text: 'text-blue-600', icon: '📊' }
    };
    const colors = colorMap[color] || colorMap.blue;

    return (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center space-x-4">
                <div className={`w-14 h-14 bg-gradient-to-br ${colors.bg} rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl`}>
                    {colors.icon}
                </div>
                <div>
                    <p className="text-3xl font-extrabold text-gray-900">{formatCurrency(amount)} PLN</p>
                    <p className="text-sm text-gray-500">{label}</p>
                </div>
            </div>
        </div>
    );
};

export const Pagination = ({ currentPage, totalPages, onPageChange }: any) => {
    const { t } = useTranslation("profitManagement");
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
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-green-500 disabled:hover:bg-white disabled:hover:border-gray-300">
                {t("pagination.previous")}
            </button>
            <div className="flex items-center gap-1">
                {getPageNumbers().map((page, index) => 
                    page === '...' ? (
                        <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-400">...</span>
                    ) : (
                        <button 
                            key={page} 
                            onClick={() => onPageChange(page)} 
                            className={`min-w-[40px] h-[40px] rounded-lg font-semibold transition-all ${currentPage === page ? 'bg-gradient-to-r from-green-600 to-emerald-700 text-white shadow-lg scale-110' : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-green-500'}`}
                        >
                            {page}
                        </button>
                    )
                )}
            </div>
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-green-500 disabled:hover:bg-white disabled:hover:border-gray-300">
                {t("pagination.next")}
            </button>
        </div>
    );
};