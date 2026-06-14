import React, { useState } from 'react';
import { useTranslation, Trans } from "react-i18next";

const ROLE_BADGE: Record<string, { className: string; icon: string }> = {
  Admin: { className: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800', icon: '🛠️' },
  Gardener: { className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800', icon: '🌱' },
  Employee: { className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800', icon: '👷' },
};

export const LoadingState = () => {
  const { t } = useTranslation("adminUsers");
  return (
    <div className="text-center py-16">
      <div className="w-14 h-14 border-4 border-slate-200 dark:border-gray-700 border-t-slate-600 rounded-full animate-spin mx-auto mb-6"></div>
      <p className="text-gray-500 dark:text-gray-400 text-xl font-medium">{t("loading")}</p>
    </div>
  );
};

export const EmptyState = () => {
  const { t } = useTranslation("adminUsers");
  return (
    <div className="text-center py-16">
      <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">👥</div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-3">{t("empty.title")}</h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">{t("empty.subtitle")}</p>
    </div>
  );
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

export const RoleBadge = ({ roleName }: { roleName: string }) => {
  const { t } = useTranslation("adminUsers");
  const badge = ROLE_BADGE[roleName] ?? { className: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700', icon: '❔' };
  const label = t(`roles.${roleName}`, { defaultValue: roleName });
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${badge.className}`}>
      <span>{badge.icon}</span>{label}
    </span>
  );
};

export const FilterBar = ({ roleFilter, setRoleFilter, search, setSearch, onRefresh, roles }: any) => {
  const { t } = useTranslation("adminUsers");
  const filters = [{ value: 'ALL', label: t('filter.all') }, ...roles.map((r: string) => ({
    value: r, label: t(`roles.${r}`, { defaultValue: r }),
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
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
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
          placeholder={t('filter.searchPlaceholder')}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
        />
        <button
          onClick={onRefresh}
          title={t('common:actions.refresh')}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-gray-600 dark:text-gray-300"
        >
          🔄
        </button>
      </div>
    </div>
  );
};

const ResetPasswordModal = ({ user, onClose, onSubmit }: any) => {
  const { t } = useTranslation("adminUsers");
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    if (password.length < 6) {
      setError(t('resetModal.errorTooShort'));
      return;
    }
    if (password !== confirm) {
      setError(t('resetModal.errorMismatch'));
      return;
    }
    const ok = await onSubmit(user, password);
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-1">{t('resetModal.title')}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          <Trans
            ns="adminUsers"
            i18nKey="resetModal.subtitle"
            values={{ nickname: user.nickname }}
            components={{ strong: <strong /> }}
          />
        </p>
        {error && <p className="text-sm text-red-600 dark:text-red-300 mb-3">{error}</p>}
        <input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(''); }}
          placeholder={t('resetModal.newPassword')}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 rounded-lg mb-3 focus:ring-2 focus:ring-slate-500"
        />
        <input
          type="password"
          value={confirm}
          onChange={(e) => { setConfirm(e.target.value); setError(''); }}
          placeholder={t('resetModal.repeatPassword')}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 rounded-lg mb-5 focus:ring-2 focus:ring-slate-500"
        />
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50">{t('common:actions.cancel')}</button>
          <button onClick={submit} className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-800">{t('resetModal.save')}</button>
        </div>
      </div>
    </div>
  );
};

export const AdminUserRow = React.memo(({ user, onToggleActive, onResetPassword }: any) => {
  const { t } = useTranslation("adminUsers");
  const [showReset, setShowReset] = useState(false);
  const fullName = `${user.name ?? ''} ${user.surname ?? ''}`.trim() || user.nickname || `#${user.id}`;
  const created = user.creationDate ? new Date(user.creationDate).toLocaleDateString('pl-PL') : '—';
  const isAdmin = user.roleName === 'Admin';

  return (
    <div className={`bg-white dark:bg-gray-800 border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 ${user.active ? 'border-gray-200 dark:border-gray-700' : 'border-red-200 dark:border-red-800 bg-red-50/40 dark:bg-red-900/20'}`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="font-semibold text-gray-800 dark:text-gray-100 text-lg">{fullName}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">@{user.nickname} · #{user.id} · {t('row.joined', { date: created })}</p>
        </div>
        <RoleBadge roleName={user.roleName} />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-3">
        {user.email && (
          <span className="inline-flex items-center gap-1 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1">✉️ {user.email}</span>
        )}
        {user.phoneNumber && (
          <span className="inline-flex items-center gap-1 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1">📞 {user.phoneNumber}</span>
        )}
        {user.localityName && (
          <span className="inline-flex items-center gap-1 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1">📍 {user.localityName}</span>
        )}
        <span className={`inline-flex items-center gap-1 rounded-lg px-3 py-1 border ${user.active ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'}`}>
          {user.active ? t('row.active') : t('row.blocked')}
        </span>
      </div>

      {user.roleName === 'Gardener' && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{t('row.employeeCount')} <strong>{user.employeeCount}</strong></p>
      )}
      {user.gardenerName && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{t('row.gardener')} <strong>{user.gardenerName}</strong></p>
      )}

      <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex flex-wrap items-center gap-3">
        <button
          onClick={() => onToggleActive(user)}
          disabled={isAdmin}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            user.active
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200'
              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200'
          }`}
        >
          {user.active ? t('row.block') : t('row.unblock')}
        </button>

        <button
          onClick={() => setShowReset(true)}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-200 hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors"
        >
          {t('row.resetPassword')}
        </button>

        {isAdmin && <span className="text-xs text-gray-400 dark:text-gray-500">{t('row.adminLocked')}</span>}
      </div>

      {showReset && (
        <ResetPasswordModal user={user} onClose={() => setShowReset(false)} onSubmit={onResetPassword} />
      )}
    </div>
  );
});
