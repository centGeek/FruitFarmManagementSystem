import { LineChart, Line, PieChart, Pie, Treemap, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell} from 'recharts';
import { formatCurrency } from "../../utils/common";

export const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export const LoadingState = () => (
    <div className="text-center py-16">
        <div className="w-14 h-14 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
        <p className="text-gray-500 text-xl font-medium">Ładowanie danych analitycznych... 📊</p>
    </div>
);

export const StatCard = ({ title, value, subtitle, icon, color }: any) => {
    const colorMap: any = {
        green: 'from-green-100 to-green-200 text-green-600',
        blue: 'from-blue-100 to-blue-200 text-blue-600',
        amber: 'from-amber-100 to-amber-200 text-amber-600',
        red: 'from-red-100 to-red-200 text-red-600',
        purple: 'from-purple-100 to-purple-200 text-purple-600'
    };
    return (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center space-x-4">
                <div className={`w-14 h-14 bg-gradient-to-br ${colorMap[color]} rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl`}>
                    {icon}
                </div>
                <div className="flex-1">
                    <p className="text-sm text-gray-500 mb-1">{title}</p>
                    <p className="text-2xl font-extrabold text-gray-900">{value}</p>
                    {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
                </div>
            </div>
        </div>
    );
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg">
                <p className="font-bold text-gray-800 mb-2">{label}</p>
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
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg">
                <p className="font-bold text-gray-800 mb-2">{data.name}</p>
                <p className="text-sm font-medium text-green-600">Przychody: {formatCurrency(data.revenue)} PLN</p>
                <p className="text-sm font-medium text-red-600">Wydatki: {formatCurrency(data.expenses)} PLN</p>
                <p className="text-sm font-medium text-blue-600">Zysk: {formatCurrency(data.profit)} PLN</p>
            </div>
        );
    }
    return null;
};

const VarietyTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg">
                <p className="font-bold text-gray-800 mb-2">{data.name}</p>
                <p className="text-sm font-medium text-green-600">Przychód: {formatCurrency(data.revenue)} PLN</p>
                <p className="text-sm font-medium text-blue-600">Sprzedano: {data.kilograms} kg</p>
                {data.revenue > 0 && data.kilograms > 0 && (
                    <p className="text-sm font-medium text-purple-600">Cena/kg: {formatCurrency(data.revenue / data.kilograms)} PLN</p>
                )}
            </div>
        );
    }
    return null;
};

export const PieChartSection = ({ data, onSegmentClick, selectedSegment }: any) => (
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
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '14px', fontWeight: '600' }} />
            </PieChart>
        </ResponsiveContainer>
    </div>
);

export const VarietyPieSection = ({ title, data }: any) => (
    <div className="border-l-4 border-blue-500 pl-8 h-full">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">🍎</span> {title}
        </h3>
        <ResponsiveContainer width="100%" height={500}>
            <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" animationDuration={900} cx="50%" cy="50%" outerRadius={180} label={false}>
                    {data.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<VarietyTooltip />} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: '600' }} />
            </PieChart>
        </ResponsiveContainer>
    </div>
);

export const LaborPieSection = ({ data, title }: any) => {
    const LaborTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const d = payload[0].payload;
            return (
                <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg">
                    <p className="font-bold text-gray-800 mb-2">{d.name}</p>
                    <p className="text-sm font-medium text-purple-600">Koszt całkowity: {formatCurrency(d.value)} PLN</p>
                    {d.paidCost > 0 && <p className="text-sm font-medium text-green-600">Wypłacono: {formatCurrency(d.paidCost)} PLN</p>}
                    {d.unpaidCost > 0 && <p className="text-sm font-medium text-amber-600">Do wypłaty: {formatCurrency(d.unpaidCost)} PLN</p>}
                    {d.entries > 0 && <p className="text-sm font-medium text-gray-600">Liczba wpisów: {d.entries}</p>}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="border-l-4 border-purple-500 pl-8 h-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
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

export const ProfitTableSection = ({ data, sectors, sectorLaborCosts }: any) => (
    <div className="overflow-x-auto">
        <table className="w-full">
            <thead>
                <tr className="border-b-2 border-gray-300">
                    {['Pozycja', 'Sektor', 'Przychody', 'Koszty', 'W tym: Koszty pracy', 'Zysk', 'Marża'].map((h, i) => (
                        <th key={i} className={`py-4 px-4 font-bold text-gray-700 ${i > 1 ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {data.map((row: any, index: number) => {
                    const sector = sectors.find((s: any) => (s.description || `Sektor ${s.id}`) === row.name);
                    const laborKey = row.name === 'Brak sektoru' ? 'no-sector' : sector?.id;
                    const laborCost = laborKey ? (sectorLaborCosts[laborKey] || { totalCost: 0 }) : { totalCost: 0 };
                    return (
                        <tr key={index} className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${index === 0 ? 'bg-green-50' : index === data.length - 1 ? 'bg-red-50' : ''}`}>
                            <td className="py-4 px-4 font-medium text-gray-600">{index === 0 && '🥇 '}{index === 1 && '🥈 '}{index === 2 && '🥉 '}#{index + 1}</td>
                            <td className="py-4 px-4"><span className="font-semibold text-gray-900">{row.name}</span></td>
                            <td className="py-4 px-4 text-right text-green-600 font-medium">{formatCurrency(row.revenue)} PLN</td>
                            <td className="py-4 px-4 text-right text-red-600 font-medium">{formatCurrency(row.expenses)} PLN</td>
                            <td className="py-4 px-4 text-right"><span className="font-semibold text-purple-600">{formatCurrency(laborCost.totalCost)} PLN</span></td>
                            <td className={`py-4 px-4 text-right font-bold ${row.profit >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>{formatCurrency(row.profit)} PLN</td>
                            <td className={`py-4 px-4 text-right font-bold text-lg ${parseFloat(row.margin) >= 50 ? 'text-green-600' : parseFloat(row.margin) >= 0 ? 'text-amber-600' : 'text-red-600'}`}>{row.margin}%</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    </div>
);

export const YearlyChartSection = ({ data }: any) => (
    <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="year" stroke="#6b7280" style={{ fontSize: '14px', fontWeight: '600' }} />
            <YAxis stroke="#6b7280" style={{ fontSize: '14px', fontWeight: '600' }} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '14px', fontWeight: '600' }} />
            <Line type="monotone" dataKey="przychody" name="Przychody" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 6 }} activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="wydatki" name="Wydatki" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#ef4444', r: 6 }} activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="zysk" name="Zysk Netto" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 6 }} activeDot={{ r: 8 }} />
        </LineChart>
    </ResponsiveContainer>
);

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