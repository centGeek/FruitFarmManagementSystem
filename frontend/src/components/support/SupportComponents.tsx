import React, { useState, useCallback } from 'react';
import { useTranslation } from "react-i18next";
import { TICKET_CATEGORIES, TICKET_STATUS, getCategoryDetails, getStatusDetails } from './SupportHooks';

export const LoadingState = () => {
    const { t } = useTranslation("support");
    return (
        <div className="text-center py-16">
            <div className="w-14 h-14 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-gray-500 text-xl font-medium">{t('loading')}</p>
        </div>
    );
};

export const EmptyState = () => {
    const { t } = useTranslation("support");
    return (
        <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">📭</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('empty.title')}</h3>
            <p className="text-gray-500 max-w-md mx-auto">{t('empty.message')}</p>
        </div>
    );
};

export const StatusBadge = ({ status }: any) => {
    const { t } = useTranslation("support");
    const details = getStatusDetails(status);
    const label = status && TICKET_STATUS[status] ? t(`status.${status}`) : (status || t('status.UNKNOWN'));
    return (
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${details.color}`}>
            <span>{details.icon}</span>{label}
        </span>
    );
};

export const TicketForm = ({ onSubmit, isSubmitting }: any) => {
    const { t } = useTranslation("support");
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState(TICKET_CATEGORIES[0].value);
    const [error, setError] = useState('');

    const handleSubmit = useCallback(async (e: any) => {
        e.preventDefault();
        const trimmed = description.trim();
        if (trimmed.length < 5) {
            setError(t('form.minLengthError'));
            return;
        }
        setError('');
        const ok = await onSubmit({ description: trimmed, category });
        if (ok) {
            setDescription('');
            setCategory(TICKET_CATEGORIES[0].value);
        }
    }, [description, category, onSubmit, t]);

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">{t('form.categoryLabel')}</label>
                <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                >
                    {TICKET_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {t(`category.${c.value}`)}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">{t('form.descriptionLabel')}</label>
                <textarea
                    id="description"
                    value={description}
                    onChange={(e) => { setDescription(e.target.value); if (error) setError(''); }}
                    rows={5}
                    placeholder={t('form.descriptionPlaceholder')}
                    disabled={isSubmitting}
                    className={`w-full px-3 py-2 ${error ? 'border-red-500' : 'border-gray-300'} border rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                />
                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                <p className="text-xs text-gray-400 mt-1">{t('form.charCount', { count: description.length })}</p>
            </div>
            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full md:w-auto bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
                {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <span className="text-xl">📨</span>}
                {t('form.submit')}
            </button>
        </form>
    );
};

export const TicketCard = React.memo(({ ticket }: any) => {
    const { t } = useTranslation("support");
    const category = getCategoryDetails(ticket.category);
    const categoryLabel = ticket.category && TICKET_CATEGORIES.some(c => c.value === ticket.category)
        ? t(`category.${ticket.category}`)
        : t('category.OTHER');
    const createdAt = ticket.createdAt ? new Date(ticket.createdAt).toLocaleString('pl-PL') : '—';
    const closedAt = ticket.closedAt ? new Date(ticket.closedAt).toLocaleString('pl-PL') : null;

    return (
        <div className="bg-white border-2 border-indigo-100 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-2xl">{category.icon}</div>
                    <div>
                        <p className="font-semibold text-gray-800">{categoryLabel}</p>
                        <p className="text-xs text-gray-500">{t('card.reportedAt', { date: createdAt })}</p>
                    </div>
                </div>
                <StatusBadge status={ticket.status} />
            </div>
            <div className="pt-3 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-500 uppercase mb-1">{t('card.descriptionLabel')}</p>
                <p className="text-base text-gray-900 whitespace-pre-wrap break-words">{ticket.description}</p>
            </div>
            {ticket.adminComment && (
                <div className="mt-3 p-3 rounded-xl bg-green-50 border border-green-200">
                    <p className="text-sm font-medium text-green-700 mb-1 flex items-center gap-1">
                        {t('card.adminReply')}
                    </p>
                    <p className="text-base text-gray-900 whitespace-pre-wrap break-words">{ticket.adminComment}</p>
                </div>
            )}
            {closedAt && <p className="text-xs text-gray-400 mt-3">{t('card.closedAt', { date: closedAt })}</p>}
        </div>
    );
});
