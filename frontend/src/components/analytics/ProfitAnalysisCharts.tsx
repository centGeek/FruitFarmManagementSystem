import { LineChart, Line, PieChart, Pie, Treemap, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell} from 'recharts';
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { formatCurrency } from "../../utils/common";
import { LABOR_COSTS_KEY, NO_SECTOR_KEY } from "./ProfitAnalysisHooks";

export const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

/**
 * Maps stable internal data-name identifiers (kept untranslated for click/lookup matching)
 * to their localized display labels. Any other name (sector descriptions, backend
 * profit-type codes, already-translated fallbacks) is shown as-is.
 */
const displayName = (name: string, t: TFunction): string => {
    if (name === LABOR_COSTS_KEY) return t("fallback.laborCosts");
    if (name === NO_SECTOR_KEY) return t("fallback.noSector");
    if (name === 'Nieokreślony') return t("fallback.undefinedType");
    return name;
};

/** Cultivar names stay as-is; the generic "OTHER" value renders the shared label. */
const varietyName = (name: string, t: TFunction): string =>
    name === 'OTHER' ? t("common:varietyOther") : name;

export const LoadingState = () => {
    const { t } = useTranslation("analytics");
    return (
        <div className="text-center py-16">
            <div className="w-14 h-14 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-gray-500 dark:text-gray-400 text-xl font-medium">{t("loading")}</p>
        </div>
    );
};

export const StatCard = ({ title, value, subtitle, icon, color }: any) => {
    const colorMap: any = {
        green: 'from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-900/30 text-green-600 dark:text-green-300',
        blue: 'from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-900/30 text-blue-600 dark:text-blue-300',
        amber: 'from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-900/30 text-amber-600 dark:text-amber-300',
        red: 'from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-900/30 text-red-600 dark:text-red-300',
        purple: 'from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-900/30 text-purple-600 dark:text-purple-300'
    };
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
            <div className="flex items-center space-x-4">
                <div className={`w-14 h-14 bg-gradient-to-br ${colorMap[color]} rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl`}>
                    {icon}
                </div>
                <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
                    <p className="text-2xl font-extrabold text-gray-900 dark:text-gray-50">{value}</p>
                    {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
                </div>
            </div>
        </div>
    );
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-gray-800 p-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                <p className="font-bold text-gray-800 dark:text-gray-100 mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} style={{ color: entry.color }} className="text-sm font-medium">
                        {entry.name}: {formatCurrency(entry.value)} PLN
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const PieTooltip = ({ active, payload }: any) => {
    const { t } = useTranslation("analytics");
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white dark:bg-gray-800 p-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                <p className="font-bold text-gray-800 dark:text-gray-100 mb-2">{displayName(data.name, t)}</p>
                <p className="text-sm font-medium text-green-600 dark:text-green-300">{t("tooltip.revenue")}: {formatCurrency(data.revenue)} PLN</p>
                <p className="text-sm font-medium text-red-600 dark:text-red-300">{t("tooltip.expenses")}: {formatCurrency(data.expenses)} PLN</p>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-300">{t("tooltip.profit")}: {formatCurrency(data.profit)} PLN</p>
            </div>
        );
    }
    return null;
};

const VarietyTooltip = ({ active, payload }: any) => {
    const { t } = useTranslation("analytics");
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white dark:bg-gray-800 p-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                <p className="font-bold text-gray-800 dark:text-gray-100 mb-2">{varietyName(data.name, t)}</p>
                <p className="text-sm font-medium text-green-600 dark:text-green-300">{t("tooltip.revenueSingular")}: {formatCurrency(data.revenue)} PLN</p>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-300">{t("tooltip.soldKg", { kilograms: data.kilograms })}</p>
                {data.revenue > 0 && data.kilograms > 0 && (
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-300">{t("tooltip.pricePerKg")}: {formatCurrency(data.revenue / data.kilograms)} PLN</p>
                )}
            </div>
        );
    }
    return null;
};

export const PieChartSection = ({ data, onSegmentClick, selectedSegment }: any) => {
    const { t } = useTranslation("analytics");
    return (
        <div className="h-full w-full">
            <ResponsiveContainer width="100%" height={500}>
                <PieChart>
                    <Pie
                        data={data}
                        dataKey="value"
                        animationDuration={900}
                        nameKey="name"
                        cx="50%" cy="50%"
                        outerRadius={180}
                        label={false} labelLine={false}
                        onClick={onSegmentClick}
                        style={{ cursor: onSegmentClick ? 'pointer' : 'default' }}
                    >
                        {data.map((entry: any, index: number) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                                opacity={selectedSegment && selectedSegment !== entry.name ? 0.3 : 1}
                            />
                        ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '14px', fontWeight: '600' }} formatter={(value: any) => displayName(value, t)} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export const VarietyPieSection = ({ title, data }: any) => {
    const { t } = useTranslation("analytics");
    return (
        <div className="border-l-4 border-blue-500 pl-8 h-full">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-4 flex items-center">
                <span className="mr-2">🍎</span> {title}
            </h3>
            <ResponsiveContainer width="100%" height={500}>
                <PieChart>
                    <Pie data={data} dataKey="value" nameKey="name" animationDuration={900} cx="50%" cy="50%" outerRadius={180} label={false}>
                        {data.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<VarietyTooltip />} />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: '600' }} formatter={(value: any) => varietyName(value, t)} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export const LaborPieSection = ({ data, title }: any) => {
    const { t } = useTranslation("analytics");
    const LaborTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const d = payload[0].payload;
            return (
                <div className="bg-white dark:bg-gray-800 p-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                    <p className="font-bold text-gray-800 dark:text-gray-100 mb-2">{d.name}</p>
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-300">{t("tooltip.totalCost")}: {formatCurrency(d.value)} PLN</p>
                    {d.paidCost > 0 && <p className="text-sm font-medium text-green-600 dark:text-green-300">{t("tooltip.paid")}: {formatCurrency(d.paidCost)} PLN</p>}
                    {d.unpaidCost > 0 && <p className="text-sm font-medium text-amber-600 dark:text-amber-300">{t("tooltip.toPay")}: {formatCurrency(d.unpaidCost)} PLN</p>}
                    {d.entries > 0 && <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t("tooltip.entriesCount", { count: d.entries })}</p>}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="border-l-4 border-purple-500 pl-8 h-full">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-4 flex items-center">
                <span className="mr-2">👥</span> {title}
            </h3>
            <ResponsiveContainer width="100%" height={500}>
                <PieChart>
                    <Pie data={data} dataKey="value" nameKey="name" animationDuration={900} cx="50%" cy="50%" outerRadius={180} label={false}>
                        {data.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<LaborTooltip />} />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: '600' }} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export const ProfitTableSection = ({ data, sectors, sectorLaborCosts }: any) => {
    const { t } = useTranslation("analytics");
    const headers = [
        t("table.position"),
        t("table.sector"),
        t("table.revenue"),
        t("table.expenses"),
        t("table.laborCosts"),
        t("table.profit"),
        t("table.margin"),
    ];
    return (
    <div className="overflow-x-auto">
        <table className="w-full">
            <thead>
                <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                    {headers.map((h, i) => (
                        <th key={i} className={`py-4 px-4 font-bold text-gray-700 dark:text-gray-200 ${i > 1 ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {data.map((row: any, index: number) => {
                    const sector = sectors.find((s: any) => (s.description || t("fallback.sectorName", { id: s.id })) === row.name);
                    const laborKey = row.name === NO_SECTOR_KEY ? 'no-sector' : sector?.id;
                    const laborCost = laborKey ? (sectorLaborCosts[laborKey] || { totalCost: 0 }) : { totalCost: 0 };
                    return (
                        <tr key={index} className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${index === 0 ? 'bg-green-50 dark:bg-green-900/20' : index === data.length - 1 ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                            <td className="py-4 px-4 font-medium text-gray-600 dark:text-gray-300">{index === 0 && '🥇 '}{index === 1 && '🥈 '}{index === 2 && '🥉 '}#{index + 1}</td>
                            <td className="py-4 px-4"><span className="font-semibold text-gray-900 dark:text-gray-50">{displayName(row.name, t)}</span></td>
                            <td className="py-4 px-4 text-right text-green-600 dark:text-green-300 font-medium">{formatCurrency(row.revenue)} PLN</td>
                            <td className="py-4 px-4 text-right text-red-600 dark:text-red-300 font-medium">{formatCurrency(row.expenses)} PLN</td>
                            <td className="py-4 px-4 text-right"><span className="font-semibold text-purple-600 dark:text-purple-300">{formatCurrency(laborCost.totalCost)} PLN</span></td>
                            <td className={`py-4 px-4 text-right font-bold ${row.profit >= 0 ? 'text-blue-600 dark:text-blue-300' : 'text-amber-600 dark:text-amber-300'}`}>{formatCurrency(row.profit)} PLN</td>
                            <td className={`py-4 px-4 text-right font-bold text-lg ${parseFloat(row.margin) >= 50 ? 'text-green-600 dark:text-green-300' : parseFloat(row.margin) >= 0 ? 'text-amber-600 dark:text-amber-300' : 'text-red-600 dark:text-red-300'}`}>{row.margin}%</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    </div>
    );
};

export const YearlyChartSection = ({ data }: any) => {
    const { t } = useTranslation("analytics");
    return (
    <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#9ca3af" strokeOpacity={0.3} />
            <XAxis dataKey="year" stroke="#9ca3af" style={{ fontSize: '14px', fontWeight: '600' }} />
            <YAxis stroke="#9ca3af" style={{ fontSize: '14px', fontWeight: '600' }} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '14px', fontWeight: '600' }} />
            <Line type="monotone" dataKey="przychody" name={t("yearlyLegend.revenue")} stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 6 }} activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="wydatki" name={t("yearlyLegend.expenses")} stroke="#ef4444" strokeWidth={3} dot={{ fill: '#ef4444', r: 6 }} activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="zysk" name={t("yearlyLegend.netProfit")} stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 6 }} activeDot={{ r: 8 }} />
        </LineChart>
    </ResponsiveContainer>
    );
};

const CustomTreemapContent = ({ x, y, width, height, name, value, index }: any) => {
    if (width < 80 || height < 60) return null;
    return (
        <g>
            <rect x={x} y={y} width={width} height={height} style={{ fill: COLORS[index % COLORS.length], stroke: '#fff', strokeWidth: 2 }} />
            <text x={x + width / 2} y={y + height / 2 - 15} textAnchor="middle" fill="#fff" fontSize={14} fontWeight="bold">
                {name.length > 15 ? name.substring(0, 12) + '...' : name}
            </text>
            <text x={x + width / 2} y={y + height / 2 + 5} textAnchor="middle" fill="#fff" fontSize={16} fontWeight="bold">
                {formatCurrency(value)} PLN
            </text>
        </g>
    );
};

export const TreemapSection = ({ data }: any) => (
    <ResponsiveContainer width="100%" height={500}>
        <Treemap data={data} dataKey="value" animationDuration={900} stroke="#fff" content={<CustomTreemapContent />}>
            <Tooltip content={<PieTooltip />} />
        </Treemap>
    </ResponsiveContainer>
);