import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { getCategoryDetails } from '../support/SupportHooks';
import { StatusBadge } from '../support/SupportComponents';

export const LoadingState = () => {
  const { t } = useTranslation("adminDashboard");
  return (
    <div className="text-center py-16">
      <div className="w-14 h-14 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-6"></div>
      <p className="text-gray-500 dark:text-gray-400 text-xl font-medium">{t("loading")}</p>
    </div>
  );
};

export const EmptyState = () => {
  const { t } = useTranslation("adminDashboard");
  return (
    <div className="text-center py-16">
      <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">📭</div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-3">{t("empty.title")}</h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">{t("empty.description")}</p>
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

const STATUS_FILTERS = [
  { value: 'ALL', labelKey: 'filters.all' },
  { value: 'OPEN', labelKey: 'filters.open' },
  { value: 'IN_PROGRESS', labelKey: 'filters.inProgress' },
  { value: 'CLOSED', labelKey: 'filters.closed' },
];

export const FilterBar = ({ statusFilter, setStatusFilter, search, setSearch, onRefresh }: any) => {
  const { t } = useTranslation("adminDashboard");
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === f.value
                ? 'bg-green-600 text-white shadow'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            {t(f.labelKey)}
          </button>
        ))}
      </div>
      <div className="flex-1 flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("filters.searchPlaceholder")}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
        />
        <button
          onClick={onRefresh}
          title={t("common:actions.refresh")}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-gray-600 dark:text-gray-300"
        >
          🔄
        </button>
      </div>
    </div>
  );
};

const STATUS_OPTIONS = [
  { value: 'OPEN', labelKey: 'statusOptions.open', icon: '🟢', active: 'bg-blue-600 text-white', idle: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30' },
  { value: 'IN_PROGRESS', labelKey: 'statusOptions.inProgress', icon: '🛠️', active: 'bg-amber-500 text-white', idle: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30' },
  { value: 'CLOSED', labelKey: 'statusOptions.closed', icon: '✅', active: 'bg-green-600 text-white', idle: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30' },
];

export const Pagination = ({ currentPage, totalPages, onPageChange }: any) => {
  const { t } = useTranslation("adminDashboard");
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i);
      pages.push('...', totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, '...');
      for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1, '...');
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
      pages.push('...', totalPages);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-green-500 disabled:hover:bg-white dark:disabled:hover:bg-gray-800 disabled:hover:border-gray-300 dark:disabled:hover:border-gray-600"
      >
        {t("pagination.previous")}
      </button>
      <div className="flex items-center gap-1">
        {getPageNumbers().map((page, index) =>
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-400 dark:text-gray-500">...</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`min-w-[40px] h-[40px] rounded-lg font-semibold transition-all ${
                currentPage === page
                  ? 'bg-green-600 text-white shadow-lg scale-110'
                  : 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-green-500'
              }`}
            >
              {page}
            </button>
          )
        )}
      </div>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-green-500 disabled:hover:bg-white dark:disabled:hover:bg-gray-800 disabled:hover:border-gray-300 dark:disabled:hover:border-gray-600"
      >
        {t("pagination.next")}
      </button>
    </div>
  );
};

export const AdminTicketRow = React.memo(({ ticket, onUpdateStatus, onUpdateComment }: any) => {
  const { t } = useTranslation("adminDashboard");
  const category = getCategoryDetails(ticket.category);
  const createdAt = ticket.createdAt ? new Date(ticket.createdAt).toLocaleString('pl-PL') : '—';
  const closedAt = ticket.closedAt ? new Date(ticket.closedAt).toLocaleString('pl-PL') : null;
  const reporter = ticket.userDto;
  const [comment, setComment] = useState(ticket.adminComment ?? '');
  const [savingComment, setSavingComment] = useState(false);
  const commentDirty = (comment ?? '') !== (ticket.adminComment ?? '');

  const saveComment = async () => {
    setSavingComment(true);
    await onUpdateComment?.(ticket.id, comment);
    setSavingComment(false);
  };
  const reporterName = reporter
    ? `${reporter.name ?? ''} ${reporter.surname ?? ''}`.trim() || reporter.nickname || `#${reporter.id}`
    : t("ticket.unknownReporter");

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 flex items-center justify-center text-2xl">{category.icon}</div>
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-100">{category.label}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">#{ticket.id} · {t("ticket.reportedAt", { date: createdAt })}</p>
          </div>
        </div>
        <StatusBadge status={ticket.status} />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-3">
        <span className="inline-flex items-center gap-1 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1">
          <span>👤</span>{reporterName}
        </span>
        {reporter?.email && (
          <span className="inline-flex items-center gap-1 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1">
            <span>✉️</span>{reporter.email}
          </span>
        )}
      </div>

      <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">{t("ticket.descriptionLabel")}</p>
        <p className="text-base text-gray-900 dark:text-gray-50 whitespace-pre-wrap break-words">{ticket.description}</p>
      </div>
      {closedAt && <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">{t("ticket.closedAt", { date: closedAt })}</p>}

      <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-700">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">{t("ticket.changeStatus")}</p>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(opt => {
            const isCurrent = ticket.status === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => !isCurrent && onUpdateStatus?.(ticket.id, opt.value)}
                disabled={isCurrent}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isCurrent ? `${opt.active} cursor-default` : opt.idle}`}
                title={isCurrent ? t("ticket.currentStatusTitle") : t("ticket.setStatusTitle", { status: t(opt.labelKey) })}
              >
                {opt.icon} {t(opt.labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-700">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">{t("ticket.adminCommentLabel")}</p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          maxLength={2000}
          placeholder={t("ticket.commentPlaceholder")}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={saveComment}
            disabled={!commentDirty || savingComment}
            className="px-4 py-1.5 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {savingComment ? t("ticket.saving") : t("ticket.saveComment")}
          </button>
        </div>
      </div>
    </div>
  );
});
