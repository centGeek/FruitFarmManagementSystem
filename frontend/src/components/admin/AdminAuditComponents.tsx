import React from 'react';

const ACTION_META: Record<string, { label: string; className: string; icon: string }> = {
  USER_BLOCKED: { label: 'Zablokowano konto', className: 'bg-red-100 text-red-700 border-red-200', icon: '🔒' },
  USER_UNBLOCKED: { label: 'Odblokowano konto', className: 'bg-green-100 text-green-700 border-green-200', icon: '🔓' },
  USER_ROLE_CHANGED: { label: 'Zmiana roli', className: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: '🪪' },
  USER_PASSWORD_RESET: { label: 'Reset hasła', className: 'bg-amber-100 text-amber-700 border-amber-200', icon: '🔑' },
};

export const actionLabel = (action: string) => ACTION_META[action]?.label ?? action;

export const LoadingState = () => (
  <div className="text-center py-16">
    <div className="w-14 h-14 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto mb-6"></div>
    <p className="text-gray-500 text-xl font-medium">Ładowanie dziennika... 🔄</p>
  </div>
);

export const EmptyState = () => (
  <div className="text-center py-16">
    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">📜</div>
    <h3 className="text-xl font-semibold text-gray-900 mb-3">Brak wpisów</h3>
    <p className="text-gray-500 max-w-md mx-auto">Żadna akcja administracyjna nie pasuje do wybranego filtra.</p>
  </div>
);

export const ActionBadge = ({ action }: { action: string }) => {
  const meta = ACTION_META[action] ?? { label: action, className: 'bg-gray-100 text-gray-700 border-gray-200', icon: '•' };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${meta.className}`}>
      <span>{meta.icon}</span>{meta.label}
    </span>
  );
};

export const FilterBar = ({ actionFilter, setActionFilter, search, setSearch, onRefresh, actions }: any) => {
  const filters = [{ value: 'ALL', label: 'Wszystkie' }, ...actions.map((a: string) => ({ value: a, label: actionLabel(a) }))];
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
      <div className="flex flex-wrap gap-2">
        {filters.map((f: any) => (
          <button
            key={f.value}
            onClick={() => setActionFilter(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              actionFilter === f.value
                ? 'bg-slate-700 text-white shadow'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="flex-1 flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Szukaj po osobie, szczegółach lub celu..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
        />
        <button onClick={onRefresh} title="Odśwież" className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">🔄</button>
      </div>
    </div>
  );
};

export const AuditTable = React.memo(({ logs }: any) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-gray-500 border-b border-gray-200">
          <th className="py-3 px-3 font-semibold">Data</th>
          <th className="py-3 px-3 font-semibold">Wykonał</th>
          <th className="py-3 px-3 font-semibold">Akcja</th>
          <th className="py-3 px-3 font-semibold">Cel</th>
          <th className="py-3 px-3 font-semibold">Szczegóły</th>
        </tr>
      </thead>
      <tbody>
        {logs.map((log: any) => (
          <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
            <td className="py-3 px-3 whitespace-nowrap text-gray-600">
              {log.createdAt ? new Date(log.createdAt).toLocaleString('pl-PL') : '—'}
            </td>
            <td className="py-3 px-3 text-gray-800">
              {log.performedByName ?? '—'}
              {log.performedById != null && <span className="text-gray-400"> #{log.performedById}</span>}
            </td>
            <td className="py-3 px-3"><ActionBadge action={log.action} /></td>
            <td className="py-3 px-3 text-gray-600">
              {log.targetType ? `${log.targetType} #${log.targetId}` : '—'}
            </td>
            <td className="py-3 px-3 text-gray-700">{log.details ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
));
