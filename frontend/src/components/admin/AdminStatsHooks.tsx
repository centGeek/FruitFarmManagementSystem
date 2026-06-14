import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from "react-i18next";
import { BACKEND_URL, getAuthHeaders } from "../../utils/apiConfigs";

type TFn = (key: string, opts?: Record<string, unknown>) => string;
import { authFetch } from '../../utils/authFetch';

interface ReportRow {
  label: string;
  value: number | null; // null -> shown as "—" / empty in CSV
  unit?: string;        // "zł" | "kg" | "h"
  money?: boolean;      // format with 2 decimals
}
interface ReportSection {
  title: string;
  rows: ReportRow[];
}

// Single source of truth for both the CSV and the PDF export, so they never drift apart.
const buildSections = (stats: any, t: TFn): ReportSection[] => {
  const num = (v: any): number | null => (v == null ? null : Number(v));

  const sections: ReportSection[] = [
    {
      title: t('report.sectionUsers'),
      rows: [
        { label: t('report.rows.totalUsers'), value: num(stats.totalUsers) },
        { label: t('report.rows.admins'), value: num(stats.admins) },
        { label: t('report.rows.gardeners'), value: num(stats.gardeners) },
        { label: t('report.rows.employees'), value: num(stats.employees) },
        { label: t('report.rows.activeUsers'), value: num(stats.activeUsers) },
        { label: t('report.rows.blockedUsers'), value: num(stats.blockedUsers) },
      ],
    },
    {
      title: t('report.sectionSectors'),
      rows: [
        { label: t('report.rows.totalSectors'), value: num(stats.totalSectors) },
        { label: t('report.rows.activeSectors'), value: num(stats.activeSectors) },
      ],
    },
    {
      title: t('report.sectionWorkAndHarvest'),
      rows: [
        { label: t('report.rows.totalWorkEntries'), value: num(stats.totalWorkEntries) },
        { label: t('report.rows.kilogramsPicked'), value: num(stats.totalKilogramsPicked), unit: 'kg' },
        { label: t('report.rows.kilogramsSold'), value: num(stats.totalKilogramsSold), unit: 'kg' },
      ],
    },
    {
      title: t('report.sectionFinances'),
      rows: [
        { label: t('report.rows.totalProfits'), value: num(stats.totalProfits), unit: 'zł', money: true },
        { label: t('report.rows.totalExpenses'), value: num(stats.totalExpenses), unit: 'zł', money: true },
        { label: t('report.rows.paidExpenses'), value: num(stats.paidExpenses), unit: 'zł', money: true },
        { label: t('report.rows.unpaidExpenses'), value: num(stats.unpaidExpenses), unit: 'zł', money: true },
        { label: t('report.rows.totalSalaries'), value: num(stats.totalSalaries), unit: 'zł', money: true },
        { label: t('report.rows.netBalance'), value: num(stats.netBalance), unit: 'zł', money: true },
      ],
    },
    {
      title: t('report.sectionTickets'),
      rows: [
        { label: t('report.rows.totalTickets'), value: num(stats.totalTickets) },
        { label: t('report.rows.openTickets'), value: num(stats.openTickets) },
        { label: t('report.rows.inProgressTickets'), value: num(stats.inProgressTickets) },
        { label: t('report.rows.closedTickets'), value: num(stats.closedTickets) },
        { label: t('report.rows.avgCloseHours'), value: num(stats.avgTicketCloseHours), unit: 'h' },
      ],
    },
  ];

  const breakdown = (title: string, arr: any): ReportSection | null => {
    const rows: ReportRow[] = (arr ?? []).map((d: any) => ({ label: String(d.label), value: Number(d.count) }));
    return rows.length ? { title, rows } : null;
  };
  const byMonth = breakdown(t('report.ticketsByMonth'), stats.ticketsByMonth);
  const byCategory = breakdown(t('report.ticketsByCategory'), stats.ticketsByCategory);
  if (byMonth) sections.push(byMonth);
  if (byCategory) sections.push(byCategory);

  return sections;
};

// CSV: raw Polish-locale number (comma decimal, no grouping) so Excel parses it as a number.
const fmtCsvValue = (r: ReportRow): string => {
  if (r.value == null) return '';
  if (r.money || !Number.isInteger(r.value)) return r.value.toFixed(2).replace('.', ',');
  return String(r.value);
};

// PDF: human-friendly Polish formatting with grouping and the unit inline.
const fmtPdfValue = (r: ReportRow): string => {
  if (r.value == null) return '—';
  const n = r.money
    ? r.value.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : r.value.toLocaleString('pl-PL');
  return r.unit ? `${n} ${r.unit}` : n;
};

export const useAdminStats = () => {
  const { t } = useTranslation("adminStats");
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const closeAlert = useCallback(() => setAlert({ type: '', message: '' }), []);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await authFetch(`${BACKEND_URL}/api/admin/stats`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        setStats(await response.json());
      } else {
        setAlert({ type: 'error', message: t('errors.fetchFailed') });
      }
    } catch {
      setAlert({ type: 'error', message: t('errors.network') });
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const exportCsv = useCallback(() => {
    if (!stats) return;
    const sections = buildSections(stats, t);

    const grid: string[][] = [[
      t('report.csvHeaders.section'),
      t('report.csvHeaders.metric'),
      t('report.csvHeaders.value'),
      t('report.csvHeaders.unit'),
    ]];
    for (const s of sections) {
      for (const r of s.rows) {
        grid.push([s.title, r.label, fmtCsvValue(r), r.unit ?? '']);
      }
    }

    // Only quote cells that need it, so numeric cells stay numeric in Excel.
    const esc = (c: string) => (/[";\r\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c);
    // "sep=;" hint + UTF-8 BOM makes Excel split into columns regardless of locale.
    const csv = 'sep=;\r\n' + grid.map(row => row.map(esc).join(';')).join('\r\n');

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statystyki-sadu-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [stats, t]);

  const exportPdf = useCallback(async () => {
    if (!stats) return;
    setAlert({ type: '', message: '' });
    try {
      // pdfmake (with its bundled Roboto font – full Polish glyph support) is heavy (~2.8 MB),
      // so load it lazily on first export instead of in the initial bundle.
      const [pdfMakeMod, vfsMod] = await Promise.all([
        import('pdfmake/build/pdfmake'),
        import('pdfmake/build/vfs_fonts'),
      ]);
      const pdfMake: any = (pdfMakeMod as any).default ?? pdfMakeMod;
      const vfsRaw: any = vfsMod as any;
      pdfMake.vfs = vfsRaw.vfs ?? vfsRaw.pdfMake?.vfs ?? vfsRaw.default?.vfs ?? vfsRaw.default ?? vfsRaw;

      const sections = buildSections(stats, t);
      const generatedAt = new Date().toLocaleString('pl-PL');
      const fileDate = new Date().toISOString().slice(0, 10);

      const content: any[] = [
        { text: t('report.pdf.title'), style: 'title' },
        { text: t('report.pdf.subtitle'), style: 'subtitle' },
        { text: t('report.pdf.generatedAt', { date: generatedAt }), style: 'meta', margin: [0, 2, 0, 18] },
      ];

      for (const s of sections) {
        if (!s.rows.length) continue;
        content.push({ text: s.title, style: 'section' });
        content.push({
          table: {
            headerRows: 1,
            widths: ['*', 'auto'],
            body: [
              [
                { text: t('report.pdf.thMetric'), style: 'th' },
                { text: t('report.pdf.thValue'), style: 'th', alignment: 'right' },
              ],
              ...s.rows.map(r => [
                { text: r.label, style: 'td' },
                { text: fmtPdfValue(r), style: 'td', alignment: 'right' },
              ]),
            ],
          },
          layout: {
            fillColor: (rowIndex: number) => (rowIndex === 0 ? '#0f766e' : rowIndex % 2 === 0 ? '#f1f5f9' : null),
            hLineWidth: () => 0.5,
            vLineWidth: () => 0,
            hLineColor: () => '#e2e8f0',
            paddingTop: () => 5,
            paddingBottom: () => 5,
          },
          margin: [0, 0, 0, 16],
        });
      }

      const docDefinition = {
        pageSize: 'A4',
        pageMargins: [40, 48, 40, 48],
        defaultStyle: { font: 'Roboto', fontSize: 10, color: '#1f2937' },
        footer: (currentPage: number, pageCount: number) => ({
          text: t('report.pdf.pageFooter', { currentPage, pageCount }),
          alignment: 'center',
          fontSize: 8,
          color: '#94a3b8',
          margin: [0, 12, 0, 0],
        }),
        content,
        styles: {
          title: { fontSize: 22, bold: true, color: '#0f172a' },
          subtitle: { fontSize: 11, color: '#475569', margin: [0, 4, 0, 0] },
          meta: { fontSize: 9, color: '#94a3b8' },
          section: { fontSize: 13, bold: true, color: '#0f766e', margin: [0, 8, 0, 6] },
          th: { bold: true, color: '#ffffff', margin: [2, 1, 2, 1] },
          td: { margin: [2, 1, 2, 1] },
        },
      };

      pdfMake.createPdf(docDefinition).download(`statystyki-sadu-${fileDate}.pdf`);
    } catch {
      setAlert({ type: 'error', message: t('errors.pdfFailed') });
    }
  }, [stats, t]);

  return { stats, isLoading, alert, closeAlert, refresh: fetchStats, exportCsv, exportPdf };
};
