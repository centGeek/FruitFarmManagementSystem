import React, { useState, useCallback } from 'react';
import { TICKET_CATEGORIES, getCategoryDetails, getStatusDetails } from './SupportHooks';

export const LoadingState = () => (
    <div className="text-center py-16">
        <div className="w-14 h-14 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
        <p className="text-gray-500 text-xl font-medium">Ładowanie zgłoszeń... 🔄</p>
    </div>
);

export const EmptyState = () => (
    <div className="text-center py-16">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">📭</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">Brak zgłoszeń</h3>
        <p className="text-gray-500 max-w-md mx-auto">Nie wysłałeś jeszcze żadnego zgłoszenia. Skorzystaj z formularza powyżej, aby zgłosić usterkę.</p>
    </div>
);

export const StatusBadge = ({ status }: any) => {
    const details = getStatusDetails(status);
    return (
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${details.color}`}>
            <span>{details.icon}</span>{details.label}
        </span>
    );
};

export const TicketForm = ({ onSubmit, isSubmitting }: any) => {
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState(TICKET_CATEGORIES[0].value);
    const [error, setError] = useState('');

    const handleSubmit = useCallback(async (e: any) => {
        e.preventDefault();
        const trimmed = description.trim();
        if (trimmed.length < 5) {
            setError('Opis musi mieć co najmniej 5 znaków.');
            return;
        }
        setError('');
        const ok = await onSubmit({ description: trimmed, category });
        if (ok) {
            setDescription('');
            setCategory(TICKET_CATEGORIES[0].value);
        }
    }, [description, category, onSubmit]);

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">Kategoria zgłoszenia</label>
                <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                >
                    {TICKET_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">Opis usterki *</label>
                <textarea
                    id="description"
                    value={description}
                    onChange={(e) => { setDescription(e.target.value); if (error) setError(''); }}
                    rows={5}
                    placeholder="Opisz, co nie działa lub co chcesz zgłosić administratorowi..."
                    disabled={isSubmitting}
                    className={`w-full px-3 py-2 ${error ? 'border-red-500' : 'border-gray-300'} border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                />
                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                <p className="text-xs text-gray-400 mt-1">{description.length}/2000 znaków</p>
            </div>
            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full md:w-auto bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
                {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <span className="text-xl">📨</span>}
                Wyślij zgłoszenie
            </button>
        </form>
    );
};

export const TicketCard = React.memo(({ ticket }: any) => {
    const category = getCategoryDetails(ticket.category);
    const createdAt = ticket.createdAt ? new Date(ticket.createdAt).toLocaleString('pl-PL') : '—';
    const closedAt = ticket.closedAt ? new Date(ticket.closedAt).toLocaleString('pl-PL') : null;

    return (
        <div className="bg-white border-2 border-indigo-100 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-2xl">{category.icon}</div>
                    <div>
                        <p className="font-semibold text-gray-800">{category.label}</p>
                        <p className="text-xs text-gray-500">Zgłoszono: {createdAt}</p>
                    </div>
                </div>
                <StatusBadge status={ticket.status} />
            </div>
            <div className="pt-3 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-500 uppercase mb-1">Opis</p>
                <p className="text-base text-gray-900 whitespace-pre-wrap break-words">{ticket.description}</p>
            </div>
            {closedAt && <p className="text-xs text-gray-400 mt-3">Zamknięto: {closedAt}</p>}
        </div>
    );
});
