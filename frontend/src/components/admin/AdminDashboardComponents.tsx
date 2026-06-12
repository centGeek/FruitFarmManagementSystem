import React, { useState } from 'react';
import { getCategoryDetails } from '../support/SupportHooks';
import { StatusBadge } from '../support/SupportComponents';

export const LoadingState = () => (
  <div className="text-center py-16">
    <div className="w-14 h-14 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-6"></div>
    <p className="text-gray-500 text-xl font-medium">Ładowanie zgłoszeń... 🔄</p>
  </div>
);

export const EmptyState = () => (
  <div className="text-center py-16">
    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">📭</div>
    <h3 className="text-xl font-semibold text-gray-900 mb-3">Brak zgłoszeń</h3>
    <p className="text-gray-500 max-w-md mx-auto">Żaden użytkownik nie zgłosił jeszcze usterki, albo żadne zgłoszenie nie pasuje do filtra.</p>
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

const STATUS_FILTERS = [
  { value: 'ALL', label: 'Wszystkie' },
  { value: 'OPEN', label: 'Otwarte' },
  { value: 'IN_PROGRESS', label: 'W trakcie' },
  { value: 'CLOSED', label: 'Zamknięte' },
];

export const FilterBar = ({ statusFilter, setStatusFilter, search, setSearch, onRefresh }: any) => (
  <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
    <div className="flex flex-wrap gap-2">
      {STATUS_FILTERS.map(f => (
        <button
          key={f.value}
          onClick={() => setStatusFilter(f.value)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === f.value
              ? 'bg-green-600 text-white shadow'
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
        placeholder="Szukaj po opisie lub zgłaszającym..."
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
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

const STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Otwarte', icon: '🟢', active: 'bg-blue-600 text-white', idle: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
  { value: 'IN_PROGRESS', label: 'W trakcie', icon: '🛠️', active: 'bg-amber-500 text-white', idle: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
  { value: 'CLOSED', label: 'Zamknięte', icon: '✅', active: 'bg-green-600 text-white', idle: 'bg-green-50 text-green-700 hover:bg-green-100' },
];

export const AdminTicketRow = React.memo(({ ticket, onUpdateStatus, onUpdateComment }: any) => {
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
    : 'Nieznany użytkownik';

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-2xl">{category.icon}</div>
          <div>
            <p className="font-semibold text-gray-800">{category.label}</p>
            <p className="text-xs text-gray-500">#{ticket.id} · Zgłoszono: {createdAt}</p>
          </div>
        </div>
        <StatusBadge status={ticket.status} />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-3">
        <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1">
          <span>👤</span>{reporterName}
        </span>
        {reporter?.email && (
          <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1">
            <span>✉️</span>{reporter.email}
          </span>
        )}
      </div>

      <div className="pt-3 border-t border-gray-100">
        <p className="text-sm font-medium text-gray-500 uppercase mb-1">Opis</p>
        <p className="text-base text-gray-900 whitespace-pre-wrap break-words">{ticket.description}</p>
      </div>
      {closedAt && <p className="text-xs text-gray-400 mt-3">Zamknięto: {closedAt}</p>}

      <div className="pt-3 mt-3 border-t border-gray-100">
        <p className="text-xs font-medium text-gray-500 uppercase mb-2">Zmień status</p>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(opt => {
            const isCurrent = ticket.status === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => !isCurrent && onUpdateStatus?.(ticket.id, opt.value)}
                disabled={isCurrent}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isCurrent ? `${opt.active} cursor-default` : opt.idle}`}
                title={isCurrent ? 'Aktualny status' : `Ustaw status: ${opt.label}`}
              >
                {opt.icon} {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-gray-100">
        <p className="text-xs font-medium text-gray-500 uppercase mb-2">Komentarz administratora</p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          maxLength={2000}
          placeholder="np. Rozwiązane — wymieniono uszkodzony czujnik."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={saveComment}
            disabled={!commentDirty || savingComment}
            className="px-4 py-1.5 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {savingComment ? 'Zapisywanie...' : 'Zapisz komentarz'}
          </button>
        </div>
      </div>
    </div>
  );
});
