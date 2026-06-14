import { Alert } from "../../utils/common";
import { useAdminStats } from './AdminStatsHooks';
import {
  LoadingState, StatCard, SectionCard, FinanceSummary, BarChart, TicketStatusBars,
} from './AdminStatsComponents';

export default function AdminStats() {
  const { stats, isLoading, alert, closeAlert, refresh, exportCsv, exportPdf } = useAdminStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              <span className="text-slate-600 mr-3">📊</span> Panel administratora — statystyki
            </h1>
            <p className="text-gray-600 text-lg">Globalny przegląd całego systemu.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={refresh} className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600" title="Odśwież">🔄</button>
            <button onClick={exportCsv} disabled={!stats} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40">Eksportuj CSV</button>
            <button onClick={exportPdf} disabled={!stats} className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-40">Eksportuj PDF</button>
          </div>
        </header>

        {alert.message && <Alert type={alert.type} message={alert.message} onClose={closeAlert} />}

        {isLoading || !stats ? (
          <LoadingState />
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Użytkownicy" value={stats.totalUsers} icon="👥" accent="bg-gray-100" />
              <StatCard label="Sektory aktywne" value={`${stats.activeSectors}/${stats.totalSectors}`} icon="🌳" accent="bg-green-100" />
              <StatCard label="Wpisy pracy" value={stats.totalWorkEntries} icon="🧾" accent="bg-blue-100" />
              <StatCard label="Zgłoszenia" value={stats.totalTickets} icon="🛠️" accent="bg-amber-100" />
            </div>

            <SectionCard title="Finanse" icon="💰">
              <FinanceSummary stats={stats} />
            </SectionCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <SectionCard title="Użytkownicy wg roli" icon="👥">
                <BarChart
                  color="bg-indigo-500"
                  data={[
                    { label: 'Administratorzy', count: stats.admins },
                    { label: 'Sadownicy', count: stats.gardeners },
                    { label: 'Pracownicy', count: stats.employees },
                    { label: 'Zablokowani', count: stats.blockedUsers },
                  ]}
                />
              </SectionCard>

              <SectionCard title="Zgłoszenia wg statusu" icon="📌">
                <TicketStatusBars stats={stats} />
                {stats.avgTicketCloseHours != null && (
                  <p className="text-sm text-gray-500 mt-4">⏱️ Średni czas zamknięcia: <strong>{stats.avgTicketCloseHours} h</strong></p>
                )}
              </SectionCard>

              <SectionCard title="Zgłoszenia w czasie (miesiące)" icon="📈">
                <BarChart color="bg-sky-500" data={stats.ticketsByMonth} emptyText="Brak zgłoszeń" />
              </SectionCard>

              <SectionCard title="Zgłoszenia wg kategorii" icon="🏷️">
                <BarChart color="bg-purple-500" data={stats.ticketsByCategory} emptyText="Brak zgłoszeń" />
              </SectionCard>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
