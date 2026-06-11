import { Alert } from "../../utils/common";
import { useSupport } from './SupportHooks';
import { TicketForm, TicketCard, LoadingState, EmptyState } from './SupportComponents';

export default function Support() {
    const { tickets, isLoading, isSubmitting, alert, closeAlert, submitTicket } = useSupport();

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-slate-100 p-6 font-sans">
            <div className="max-w-5xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        <span className="text-indigo-600 mr-3">🛟</span> Zgłoś usterkę
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Coś nie działa? Zgłoś problem administratorowi systemu. 🛠️
                    </p>
                </header>

                {alert.message && (
                    <Alert type={alert.type} message={alert.message} onClose={closeAlert} />
                )}

                <div className="bg-white rounded-2xl shadow-lg border border-indigo-100 p-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <span className="mr-2">📝</span> Nowe zgłoszenie
                    </h2>
                    <TicketForm onSubmit={submitTicket} isSubmitting={isSubmitting} />
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                            <span className="mr-2">📋</span> Twoje zgłoszenia
                        </h2>
                        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-lg font-medium">
                            {tickets.length} {tickets.length === 1 ? 'zgłoszenie' : 'zgłoszeń'}
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
