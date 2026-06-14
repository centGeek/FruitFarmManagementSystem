import React from 'react';
import { useTranslation } from "react-i18next";

export const LoadingState = () => {
  const { t } = useTranslation("adminStats");
  return (
    <div className="text-center py-16">
      <div className="w-14 h-14 border-4 border-slate-200 dark:border-gray-700 border-t-slate-600 rounded-full animate-spin mx-auto mb-6"></div>
      <p className="text-gray-500 dark:text-gray-400 text-xl font-medium">{t("loading")}</p>
    </div>
  );
};

const fmtMoney = (v: any) => {
  const n = Number(v ?? 0);
  return n.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' zł';
};

export const StatCard = ({ label, value, icon, accent }: any) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${accent}`}>{icon}</div>
    <div>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-50 leading-none">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</p>
    </div>
  </div>
);

export const SectionCard = ({ title, icon, children }: any) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-6">
    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
      <span>{icon}</span>{title}
    </h2>
    {children}
  </div>
);

const Row = ({ label, value, strong }: any) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
    <span className="text-gray-600 dark:text-gray-300">{label}</span>
    <span className={strong ? 'font-bold text-gray-900 dark:text-gray-50' : 'font-medium text-gray-800 dark:text-gray-100'}>{value}</span>
  </div>
);

export const FinanceSummary = ({ stats }: any) => {
  const { t } = useTranslation("adminStats");
  const balance = Number(stats.netBalance ?? 0);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
      <div>
        <Row label={t("finance.totalProfits")} value={fmtMoney(stats.totalProfits)} />
        <Row label={t("finance.totalExpenses")} value={fmtMoney(stats.totalExpenses)} />
        <Row label={t("finance.paidExpenses")} value={fmtMoney(stats.paidExpenses)} />
        <Row label={t("finance.unpaidExpenses")} value={fmtMoney(stats.unpaidExpenses)} />
      </div>
      <div>
        <Row label={t("finance.totalSalaries")} value={fmtMoney(stats.totalSalaries)} />
        <Row label={t("finance.kilogramsPicked")} value={`${stats.totalKilogramsPicked} kg`} />
        <Row label={t("finance.kilogramsSold")} value={`${stats.totalKilogramsSold} kg`} />
        <Row
          label={t("finance.netBalance")}
          strong
          value={<span className={balance >= 0 ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-300'}>{fmtMoney(balance)}</span>}
        />
      </div>
    </div>
  );
};

export const BarChart = ({ data, color = 'bg-slate-600', emptyText }: any) => {
  const { t } = useTranslation("adminStats");
  const empty = emptyText ?? t("common:status.noData");
  if (!data || data.length === 0) {
    return <p className="text-gray-400 dark:text-gray-500 text-sm py-6 text-center">{empty}</p>;
  }
  const max = Math.max(...data.map((d: any) => d.count), 1);
  return (
    <div className="space-y-2">
      {data.map((d: any) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-28 shrink-0 text-sm text-gray-600 dark:text-gray-300 truncate" title={d.label}>{d.label}</span>
          <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-lg h-6 overflow-hidden">
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

export const TicketStatusBars = React.memo(({ stats }: any) => {
  const { t } = useTranslation("adminStats");
  return (
    <BarChart
      color="bg-amber-500"
      data={[
        { label: t("ticketStatus.open"), count: stats.openTickets },
        { label: t("ticketStatus.inProgress"), count: stats.inProgressTickets },
        { label: t("ticketStatus.closed"), count: stats.closedTickets },
      ]}
    />
  );
});
