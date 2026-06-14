import { useTranslation } from "react-i18next";
import { Alert } from "../../utils/common";
import { useAdminUsers } from './AdminUsersHooks';
import { LoadingState, EmptyState, StatCard, FilterBar, AdminUserRow } from './AdminUsersComponents';

export default function AdminUsers() {
  const { t } = useTranslation("adminUsers");
  const {
    filteredUsers,
    roles,
    stats,
    isLoading,
    alert,
    closeAlert,
    roleFilter,
    setRoleFilter,
    search,
    setSearch,
    refresh,
    toggleActive,
    resetPassword,
  } = useAdminUsers();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            <span className="text-slate-600 dark:text-gray-300 mr-3">👥</span> {t("header.title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            {t("header.subtitle")}
          </p>
        </header>

        {alert.message && (
          <Alert type={alert.type} message={alert.message} onClose={closeAlert} />
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <StatCard label={t("stats.gardeners")} value={stats.gardeners} icon="🌱" accent="bg-green-100 dark:bg-green-900/30" />
          <StatCard label={t("stats.active")} value={stats.gardeners - stats.blocked} icon="🟢" accent="bg-emerald-100 dark:bg-emerald-900/30" />
          <StatCard label={t("stats.blocked")} value={stats.blocked} icon="🔴" accent="bg-red-100 dark:bg-red-900/30" />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          <FilterBar
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            search={search}
            setSearch={setSearch}
            onRefresh={refresh}
            roles={roles}
          />

          {isLoading ? (
            <LoadingState />
          ) : filteredUsers.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredUsers.map((user) => (
                <AdminUserRow
                  key={user.id}
                  user={user}
                  onToggleActive={toggleActive}
                  onResetPassword={resetPassword}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
