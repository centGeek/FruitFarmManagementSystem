import React from 'react';

export const LoadingState = () => (
  <div className="text-center py-16">
    <div className="w-14 h-14 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto mb-6"></div>
    <p className="text-gray-500 text-xl font-medium">Ładowanie statystyk... 🔄</p>
  </div>
);

const fmtMoney = (v: any) => {
  const n = Number(v ?? 0);
  return n.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' zł';
};

export const StatCard = ({ label, value, icon, accent }: any) => (
  <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${accent}`}>{icon}</div>
    <div>
      <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  </div>
);

export const SectionCard = ({ title, icon, children }: any) => (
  <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
      <span>{icon}</span>{title}
    </h2>
    {children}
  </div>
);

const Row = ({ label, value, strong }: any) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
    <span className="text-gray-600">{label}</span>
    <span className={strong ? 'font-bold text-gray-900' : 'font-medium text-gray-800'}>{value}</span>
  </div>
);

export const FinanceSummary = ({ stats }: any) => {
  const balance = Number(stats.netBalance ?? 0);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
      <div>
        <Row label="Przychody łącznie" value={fmtMoney(stats.totalProfits)} />
        <Row label="Wydatki łącznie" value={fmtMoney(stats.totalExpenses)} />
        <Row label="Wydatki opłacone" value={fmtMoney(stats.paidExpenses)} />
        <Row label="Wydatki nieopłacone" value={fmtMoney(stats.unpaidExpenses)} />
      </div>
      <div>
        <Row label="Wypłacone wynagrodzenia" value={fmtMoney(stats.totalSalaries)} />
        <Row label="Zebrane kilogramy" value={`${stats.totalKilogramsPicked} kg`} />
        <Row label="Sprzedane kilogramy" value={`${stats.totalKilogramsSold} kg`} />
        <Row
          label="Bilans netto"
          strong
          value={<span className={balance >= 0 ? 'text-green-600' : 'text-red-600'}>{fmtMoney(balance)}</span>}
        />
      </div>
    </div>
  );
};

export const BarChart = ({ data, color = 'bg-slate-600', emptyText = 'Brak danych' }: any) => {
  if (!data || data.length === 0) {
    return <p className="text-gray-400 text-sm py-6 text-center">{emptyText}</p>;
  }
  const max = Math.max(...data.map((d: any) => d.count), 1);
  return (
    <div className="space-y-2">
      {data.map((d: any) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-28 shrink-0 text-sm text-gray-600 truncate" title={d.label}>{d.label}</span>
          <div className="flex-1 bg-gray-100 rounded-lg h-6 overflow-hidden">
            <div
              className={`${color} h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-2`}
              style={{ width: `${Math.max((d.count / max) * 100, 6)}%` }}
            >
              <span className="text-xs font-semibold text-white">{d.count}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const TicketStatusBars = React.memo(({ stats }: any) => (
  <BarChart
    color="bg-amber-500"
    data={[
      { label: 'Otwarte', count: stats.openTickets },
      { label: 'W trakcie', count: stats.inProgressTickets },
      { label: 'Zamknięte', count: stats.closedTickets },
    ]}
  />
));
