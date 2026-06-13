import { Alert } from "../../utils/common";
import { useAdminDashboard } from './AdminDashboardHooks';
import { LoadingState, EmptyState, StatCard, FilterBar, AdminTicketRow, Pagination } from './AdminDashboardComponents';

export default function AdminDashboard() {
  const {
    tickets,
    stats,
    isLoading,
    alert,
    closeAlert,
    statusFilter,
    setStatusFilter,
    search,
    setSearch,
    currentPage,
    totalPages,
    handlePageChange,
    refresh,
    updateStatus,
    updateComment,
  } = useAdminDashboard();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            <span className="text-green-600 mr-3">🛠️</span> Panel administratora — zgłoszenia
          </h1>
          <p className="text-gray-600 text-lg">
            Wszystkie usterki i sugestie zgłoszone przez użytkowników systemu.
          </p>
        </header>

        {alert.message && (
          <Alert type={alert.type} message={alert.message} onClose={closeAlert} />
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Wszystkie" value={stats.total} icon="📋" accent="bg-gray-100" />
          <StatCard label="Otwarte" value={stats.open} icon="🟢" accent="bg-blue-100" />
          <StatCard label="W trakcie" value={stats.inProgress} icon="🛠️" accent="bg-amber-100" />
          <StatCard label="Zamknięte" value={stats.closed} icon="✅" accent="bg-green-100" />
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          <FilterBar
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            search={search}
            setSearch={setSearch}
            onRefresh={refresh}
          />

          {isLoading ? (
            <LoadingState />
          ) : tickets.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {tickets.map((ticket) => (
                  <AdminTicketRow key={ticket.id} ticket={ticket} onUpdateStatus={updateStatus} onUpdateComment={updateComment} />
                ))}
              </div>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
