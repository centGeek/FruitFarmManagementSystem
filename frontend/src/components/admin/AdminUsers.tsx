import { Alert } from "../../utils/common";
import { useAdminUsers } from './AdminUsersHooks';
import { LoadingState, EmptyState, StatCard, FilterBar, AdminUserRow } from './AdminUsersComponents';

export default function AdminUsers() {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            <span className="text-slate-600 mr-3">👥</span> Panel administratora — użytkownicy
          </h1>
          <p className="text-gray-600 text-lg">
            Zarządzaj kontami: blokuj i resetuj hasła.
          </p>
        </header>

        {alert.message && (
          <Alert type={alert.type} message={alert.message} onClose={closeAlert} />
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <StatCard label="Sadownicy" value={stats.gardeners} icon="🌱" accent="bg-green-100" />
          <StatCard label="Aktywni" value={stats.gardeners - stats.blocked} icon="🟢" accent="bg-emerald-100" />
          <StatCard label="Zablokowani" value={stats.blocked} icon="🔴" accent="bg-red-100" />
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
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
