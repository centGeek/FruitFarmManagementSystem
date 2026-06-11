import { Alert } from "../../utils/common";
import { useAdminAudit } from './AdminAuditHooks';
import { LoadingState, EmptyState, FilterBar, AuditTable } from './AdminAuditComponents';

export default function AdminAudit() {
  const {
    filteredLogs, actions, isLoading, alert, closeAlert,
    actionFilter, setActionFilter, search, setSearch, refresh,
  } = useAdminAudit();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            <span className="text-slate-600 mr-3">📜</span> Panel administratora — dziennik audytu
          </h1>
          <p className="text-gray-600 text-lg">
            Rejestr działań administracyjnych: kto, co i kiedy zrobił.
          </p>
        </header>

        {alert.message && <Alert type={alert.type} message={alert.message} onClose={closeAlert} />}

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          <FilterBar
            actionFilter={actionFilter}
            setActionFilter={setActionFilter}
            search={search}
            setSearch={setSearch}
            onRefresh={refresh}
            actions={actions}
          />

          {isLoading ? (
            <LoadingState />
          ) : filteredLogs.length === 0 ? (
            <EmptyState />
          ) : (
            <AuditTable logs={filteredLogs} />
          )}
        </div>
      </div>
    </div>
  );
}
