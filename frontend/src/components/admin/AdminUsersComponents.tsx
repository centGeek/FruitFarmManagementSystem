import React, { useState } from 'react';

const ROLE_BADGE: Record<string, { label: string; className: string; icon: string }> = {
  Admin: { label: 'Administrator', className: 'bg-purple-100 text-purple-700 border-purple-200', icon: '🛠️' },
  Gardener: { label: 'Sadownik', className: 'bg-green-100 text-green-700 border-green-200', icon: '🌱' },
  Employee: { label: 'Pracownik', className: 'bg-blue-100 text-blue-700 border-blue-200', icon: '👷' },
};

export const LoadingState = () => (
  <div className="text-center py-16">
    <div className="w-14 h-14 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto mb-6"></div>
    <p className="text-gray-500 text-xl font-medium">Ładowanie użytkowników... 🔄</p>
  </div>
);

export const EmptyState = () => (
  <div className="text-center py-16">
    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">👥</div>
    <h3 className="text-xl font-semibold text-gray-900 mb-3">Brak użytkowników</h3>
    <p className="text-gray-500 max-w-md mx-auto">Żaden użytkownik nie pasuje do wybranego filtra.</p>
  </div>
);

export const StatCard = ({ label, value, icon, accent }: any) => (
  <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${accent}`}>{icon}</div>
    <div>
      <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  </div>
);

export const RoleBadge = ({ roleName }: { roleName: string }) => {
  const badge = ROLE_BADGE[roleName] ?? { label: roleName, className: 'bg-gray-100 text-gray-700 border-gray-200', icon: '❔' };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${badge.className}`}>
      <span>{badge.icon}</span>{badge.label}
    </span>
  );
};

export const FilterBar = ({ roleFilter, setRoleFilter, search, setSearch, onRefresh, roles }: any) => {
  const filters = [{ value: 'ALL', label: 'Wszyscy' }, ...roles.map((r: string) => ({
    value: r, label: ROLE_BADGE[r]?.label ?? r,
  }))];
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
      <div className="flex flex-wrap gap-2">
        {filters.map((f: any) => (
          <button
            key={f.value}
            onClick={() => setRoleFilter(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              roleFilter === f.value
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
          placeholder="Szukaj po imieniu, loginie lub e-mailu..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
        />
        <button
          onClick={onRefresh}
          title="Odśwież"
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
        >
          🔄
        </button>
      </div>
    </div>
  );
};

const ResetPasswordModal = ({ user, onClose, onSubmit }: any) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    if (password.length < 6) {
      setError('Hasło musi mieć co najmniej 6 znaków.');
      return;
    }
    if (password !== confirm) {
      setError('Hasła nie są identyczne.');
      return;
    }
    const ok = await onSubmit(user, password);
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-gray-900 mb-1">Reset hasła</h3>
        <p className="text-sm text-gray-500 mb-4">Ustaw nowe hasło dla użytkownika <strong>{user.nickname}</strong>.</p>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(''); }}
          placeholder="Nowe hasło"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-slate-500"
        />
        <input
          type="password"
          value={confirm}
          onChange={(e) => { setConfirm(e.target.value); setError(''); }}
          placeholder="Powtórz hasło"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-5 focus:ring-2 focus:ring-slate-500"
        />
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Anuluj</button>
          <button onClick={submit} className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-800">Zapisz hasło</button>
        </div>
      </div>
    </div>
  );
};

export const AdminUserRow = React.memo(({ user, onToggleActive, onResetPassword }: any) => {
  const [showReset, setShowReset] = useState(false);
  const fullName = `${user.name ?? ''} ${user.surname ?? ''}`.trim() || user.nickname || `#${user.id}`;
  const created = user.creationDate ? new Date(user.creationDate).toLocaleDateString('pl-PL') : '—';
  const isAdmin = user.roleName === 'Admin';

  return (
    <div className={`bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 ${user.active ? 'border-gray-200' : 'border-red-200 bg-red-50/40'}`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="font-semibold text-gray-800 text-lg">{fullName}</p>
          <p className="text-xs text-gray-500">@{user.nickname} · #{user.id} · Dołączył: {created}</p>
        </div>
        <RoleBadge roleName={user.roleName} />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-3">
        {user.email && (
          <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1">✉️ {user.email}</span>
        )}
        {user.phoneNumber && (
          <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1">📞 {user.phoneNumber}</span>
        )}
        {user.localityName && (
          <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1">📍 {user.localityName}</span>
        )}
        <span className={`inline-flex items-center gap-1 rounded-lg px-3 py-1 border ${user.active ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {user.active ? '🟢 Aktywne' : '🔴 Zablokowane'}
        </span>
      </div>

      {user.roleName === 'Gardener' && (
        <p className="text-sm text-gray-600 mb-3">👷 Liczba pracowników: <strong>{user.employeeCount}</strong></p>
      )}
      {user.gardenerName && (
        <p className="text-sm text-gray-600 mb-3">🌱 Sadownik: <strong>{user.gardenerName}</strong></p>
      )}

      <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center gap-3">
        <button
          onClick={() => onToggleActive(user)}
          disabled={isAdmin}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            user.active
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          {user.active ? 'Zablokuj' : 'Odblokuj'}
        </button>

        <button
          onClick={() => setShowReset(true)}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
        >
          Reset hasła
        </button>

        {isAdmin && <span className="text-xs text-gray-400">Konta administratora nie można modyfikować</span>}
      </div>

      {showReset && (
        <ResetPasswordModal user={user} onClose={() => setShowReset(false)} onSubmit={onResetPassword} />
      )}
    </div>
  );
});
