import { useTranslation } from "react-i18next";
import { Alert } from "../../utils/common";
import { useSupport } from './SupportHooks';
import { TicketForm, TicketCard, LoadingState, EmptyState } from './SupportComponents';

export default function Support() {
    const { t } = useTranslation("support");
    const { tickets, isLoading, isSubmitting, alert, closeAlert, submitTicket } = useSupport();

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-slate-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-6 font-sans">
            <div className="max-w-5xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                        <span className="text-indigo-600 dark:text-indigo-300 mr-3">🛟</span> {t('header.title')}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 text-lg">
                        {t('header.subtitle')}
                    </p>
                </header>

                {alert.message && (
                    <Alert type={alert.type} message={alert.message} onClose={closeAlert} />
                )}

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-indigo-100 dark:border-indigo-800 p-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-4 flex items-center">
                        <span className="mr-2">📝</span> {t('newTicket.title')}
                    </h2>
                    <TicketForm onSubmit={submitTicket} isSubmitting={isSubmitting} />
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 flex items-center">
                            <span className="mr-2">📋</span> {t('yourTickets.title')}
                        </h2>
                        <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg font-medium">
                            {t('yourTickets.count', { count: tickets.length })}
                        </span>
                    </div>

                    {isLoading ? (
                        <LoadingState />
                    ) : tickets.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {tickets.map((ticket) => (
                                <TicketCard key={ticket.id} ticket={ticket} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
