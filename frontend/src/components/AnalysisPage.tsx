import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { BACKEND_URL, getAuthHeaders } from "../utils/apiConfigs";
import { formatCurrency } from "../utils/common";

const LoadingState = () => (
    <div className="text-center py-16">
        <div className="w-14 h-14 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
        <p className="text-gray-500 text-xl font-medium">Ładowanie danych analitycznych... 📊</p>
    </div>
);

const Alert = ({ type, message, onClose }) => {
    if (!message) return null;
    const colors = {
        error: 'bg-red-50 border-red-300 text-red-700',
        success: 'bg-green-50 border-green-300 text-green-700',
        warning: 'bg-amber-50 border-amber-300 text-amber-700'
    };
    
    return (
        <div className={`mb-4 p-4 border rounded-xl ${colors[type]} flex items-center justify-between shadow-sm`} role="alert">
            <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                <p className="font-medium">{message}</p>
            </div>
            {onClose && (
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1 transition-colors text-lg">
                    ❌
                </button>
            )}
        </div>
    );
};

const StatCard = ({ title, value, subtitle, icon, color }) => {
    const colorMap = {
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

export default function ProfitAnalysis() {
    const [profits, setProfits] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [sectors, setSectors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [alert, setAlert] = useState({ type: '', message: '' });
    const [selectedYear, setSelectedYear] = useState('all');
    const [selectedSector, setSelectedSector] = useState('all');

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setIsLoading(true);
        try {
            await Promise.all([
                fetchProfits(),
                fetchExpenses(),
                fetchSectors()
            ]);
        } catch (error) {
            setAlert({ type: 'error', message: 'Błąd podczas ładowania danych' });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchProfits = async () => {
        let allData = [];
        let currentPage = 0;
        let totalPages = 1;
        
        try {
            while (currentPage < totalPages) {
                const response = await fetch(
                    `${BACKEND_URL}/api/profits?page=${currentPage}&size=100`,
                    { method: 'GET', headers: getAuthHeaders() }
                );
                
                if (response.ok) {
                    const data = await response.json();
                    allData = [...allData, ...data.content];
                    totalPages = data.totalPages;
                    currentPage++;
                } else break;
            }
            setProfits(allData);
        } catch (error) {
            console.error('Error fetching profits:', error);
        }
    };

    const fetchExpenses = async () => {
        let allData = [];
        let currentPage = 0;
        let totalPages = 1;
        
        try {
            while (currentPage < totalPages) {
                const response = await fetch(
                    `${BACKEND_URL}/api/expenses?page=${currentPage}&size=100`,
                    { method: 'GET', headers: getAuthHeaders() }
                );
                
                if (response.ok) {
                    const data = await response.json();
                    allData = [...allData, ...data.content];
                    totalPages = data.totalPages;
                    currentPage++;
                } else break;
            }
            setExpenses(allData);
        } catch (error) {
            console.error('Error fetching expenses:', error);
        }
    };

    const fetchSectors = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/sectors`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                const data = await response.json();
                setSectors(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Error fetching sectors:', error);
        }
    };

    // Analiza rok do roku - przychody vs wydatki
    const yearlyComparison = useMemo(() => {
        const yearData = {};

        profits.forEach(profit => {
            const year = new Date(profit.createdAt).getFullYear();
            if (!yearData[year]) {
                yearData[year] = { year, przychody: 0, wydatki: 0 };
            }
            yearData[year].przychody += Number(profit.profit);
        });

        expenses.forEach(expense => {
            const year = new Date(expense.createdAt).getFullYear();
            if (!yearData[year]) {
                yearData[year] = { year, przychody: 0, wydatki: 0 };
            }
            yearData[year].wydatki += Number(expense.amount);
        });

        return Object.values(yearData)
            .sort((a, b) => a.year - b.year)
            .map(data => ({
                ...data,
                zysk: data.przychody - data.wydatki
            }));
    }, [profits, expenses]);

    // Analiza sektorów rok do roku
    const sectorYearlyAnalysis = useMemo(() => {
        const sectorData = {};

        profits.forEach(profit => {
            if (profit.sectorDTO) {
                const year = new Date(profit.createdAt).getFullYear();
                const sectorId = profit.sectorDTO.id;
                const key = `${sectorId}-${year}`;
                
                if (!sectorData[key]) {
                    sectorData[key] = {
                        sectorId,
                        sectorName: profit.sectorDTO.description || `Sektor ${sectorId}`,
                        year,
                        przychody: 0,
                        wydatki: 0
                    };
                }
                sectorData[key].przychody += Number(profit.profit);
            }
        });

        expenses.forEach(expense => {
            if (expense.sectorDTO) {
                const year = new Date(expense.createdAt).getFullYear();
                const sectorId = expense.sectorDTO.id;
                const key = `${sectorId}-${year}`;
                
                if (!sectorData[key]) {
                    sectorData[key] = {
                        sectorId,
                        sectorName: expense.sectorDTO.description || `Sektor ${sectorId}`,
                        year,
                        przychody: 0,
                        wydatki: 0
                    };
                }
                sectorData[key].wydatki += Number(expense.amount);
            }
        });

        return Object.values(sectorData)
            .map(data => ({
                ...data,
                zysk: data.przychody - data.wydatki
            }))
            .sort((a, b) => a.year - b.year || a.sectorId - b.sectorId);
    }, [profits, expenses]);

    // Porównanie wszystkich sektorów w danym roku
    const sectorComparisonByYear = useMemo(() => {
        const yearSectorData = {};

        profits.forEach(profit => {
            if (profit.sectorDTO) {
                const year = new Date(profit.createdAt).getFullYear();
                const sectorId = profit.sectorDTO.id;
                
                if (!yearSectorData[year]) yearSectorData[year] = {};
                if (!yearSectorData[year][sectorId]) {
                    yearSectorData[year][sectorId] = {
                        sectorId,
                        sectorName: profit.sectorDTO.description || `Sektor ${sectorId}`,
                        przychody: 0,
                        wydatki: 0
                    };
                }
                yearSectorData[year][sectorId].przychody += Number(profit.profit);
            }
        });

        expenses.forEach(expense => {
            if (expense.sectorDTO) {
                const year = new Date(expense.createdAt).getFullYear();
                const sectorId = expense.sectorDTO.id;
                
                if (!yearSectorData[year]) yearSectorData[year] = {};
                if (!yearSectorData[year][sectorId]) {
                    yearSectorData[year][sectorId] = {
                        sectorId,
                        sectorName: expense.sectorDTO.description || `Sektor ${sectorId}`,
                        przychody: 0,
                        wydatki: 0
                    };
                }
                yearSectorData[year][sectorId].wydatki += Number(expense.amount);
            }
        });

        const result = {};
        Object.keys(yearSectorData).forEach(year => {
            result[year] = Object.values(yearSectorData[year])
                .map(data => ({
                    ...data,
                    zysk: data.przychody - data.wydatki
                }))
                .sort((a, b) => b.przychody - a.przychody);
        });

        return result;
    }, [profits, expenses]);

    // Wykres dla wybranego sektora (rok do roku)
    const selectedSectorData = useMemo(() => {
        if (selectedSector === 'all') return [];
        
        return sectorYearlyAnalysis.filter(data => 
            data.sectorId === parseInt(selectedSector)
        );
    }, [sectorYearlyAnalysis, selectedSector]);

    // Wykres porównania sektorów w wybranym roku
    const selectedYearSectorData = useMemo(() => {
        if (selectedYear === 'all') return [];
        return sectorComparisonByYear[selectedYear] || [];
    }, [sectorComparisonByYear, selectedYear]);

    const availableYears = useMemo(() => {
        const years = new Set();
        [...profits, ...expenses].forEach(item => {
            const date = item.createdAt;
            if (date) {
                years.add(new Date(date).getFullYear());
            }
        });
        return Array.from(years).sort((a, b) => b - a);
    }, [profits, expenses]);

    // Statystyki ogólne
    const overallStats = useMemo(() => {
        const totalProfits = profits.reduce((sum, p) => sum + Number(p.profit), 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
        const netProfit = totalProfits - totalExpenses;
        
        return {
            totalProfits,
            totalExpenses,
            netProfit,
            profitMargin: totalProfits > 0 ? ((netProfit / totalProfits) * 100).toFixed(1) : 0
        };
    }, [profits, expenses]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg">
                    <p className="font-bold text-gray-800 mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }} className="text-sm font-medium">
                            {entry.name}: {formatCurrency(entry.value)} PLN
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 p-6">
                <LoadingState />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 p-6 font-sans">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
                        <span className="text-blue-600 mr-3">📊</span>
                        Analiza Finansowa Gospodarstwa
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Szczegółowa analiza przychodów, wydatków i rentowności
                    </p>
                </header>

                {alert.message && (
                    <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />
                )}

                {/* Statystyki ogólne */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Całkowite Przychody"
                        value={`${formatCurrency(overallStats.totalProfits)} PLN`}
                        icon="💰"
                        color="green"
                    />
                    <StatCard
                        title="Całkowite Wydatki"
                        value={`${formatCurrency(overallStats.totalExpenses)} PLN`}
                        icon="💸"
                        color="red"
                    />
                    <StatCard
                        title="Zysk Netto"
                        value={`${formatCurrency(overallStats.netProfit)} PLN`}
                        subtitle={overallStats.netProfit >= 0 ? '✅ Dodatni' : '⚠️ Ujemny'}
                        icon="📈"
                        color={overallStats.netProfit >= 0 ? 'blue' : 'amber'}
                    />
                    <StatCard
                        title="Marża Zysku"
                        value={`${overallStats.profitMargin}%`}
                        icon="🎯"
                        color="purple"
                    />
                </div>

                {/* Wykres 1: Przychody vs Wydatki Rok do Roku */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                        <span className="mr-3">📈</span>
                        Analiza Rok do Roku - Przychody vs Wydatki
                    </h2>
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={yearlyComparison}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis 
                                dataKey="year" 
                                stroke="#6b7280"
                                style={{ fontSize: '14px', fontWeight: '600' }}
                            />
                            <YAxis 
                                stroke="#6b7280"
                                style={{ fontSize: '14px', fontWeight: '600' }}
                                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend 
                                wrapperStyle={{ fontSize: '14px', fontWeight: '600' }}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="przychody" 
                                name="Przychody"
                                stroke="#10b981" 
                                strokeWidth={3}
                                dot={{ fill: '#10b981', r: 6 }}
                                activeDot={{ r: 8 }}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="wydatki" 
                                name="Wydatki"
                                stroke="#ef4444" 
                                strokeWidth={3}
                                dot={{ fill: '#ef4444', r: 6 }}
                                activeDot={{ r: 8 }}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="zysk" 
                                name="Zysk Netto"
                                stroke="#3b82f6" 
                                strokeWidth={3}
                                dot={{ fill: '#3b82f6', r: 6 }}
                                activeDot={{ r: 8 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Filtry dla analizy sektorów */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">🔧 Filtry Analizy</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Wybierz Sektor (dla analizy rok do roku)
                            </label>
                            <select
                                value={selectedSector}
                                onChange={(e) => setSelectedSector(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            >
                                <option value="all">Wszystkie sektory</option>
                                {sectors.map(sector => (
                                    <option key={sector.id} value={sector.id}>
                                        {sector.description || `Sektor ${sector.id}`}
                                        {sector.plantType && ` - ${sector.plantType}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Wybierz Rok (dla porównania sektorów)
                            </label>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            >
                                <option value="all">Wszystkie lata</option>
                                {availableYears.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Wykres 2: Wybrany sektor rok do roku */}
                {selectedSector !== 'all' && selectedSectorData.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                            <span className="mr-3">🗺️</span>
                            Analiza Sektora: {sectors.find(s => s.id === parseInt(selectedSector))?.description || `Sektor ${selectedSector}`}
                        </h2>
                        <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={selectedSectorData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis 
                                    dataKey="year" 
                                    stroke="#6b7280"
                                    style={{ fontSize: '14px', fontWeight: '600' }}
                                />
                                <YAxis 
                                    stroke="#6b7280"
                                    style={{ fontSize: '14px', fontWeight: '600' }}
                                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '14px', fontWeight: '600' }} />
                                <Line 
                                    type="monotone" 
                                    dataKey="przychody" 
                                    name="Przychody"
                                    stroke="#10b981" 
                                    strokeWidth={3}
                                    dot={{ fill: '#10b981', r: 6 }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="wydatki" 
                                    name="Wydatki"
                                    stroke="#ef4444" 
                                    strokeWidth={3}
                                    dot={{ fill: '#ef4444', r: 6 }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="zysk" 
                                    name="Zysk"
                                    stroke="#3b82f6" 
                                    strokeWidth={3}
                                    dot={{ fill: '#3b82f6', r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Wykres 3: Porównanie sektorów w wybranym roku - Przychody */}
                {selectedYear !== 'all' && selectedYearSectorData.length > 0 && (
                    <>
                        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                                <span className="mr-3">💰</span>
                                Porównanie Przychodów Sektorów - Rok {selectedYear}
                            </h2>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={selectedYearSectorData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis 
                                        dataKey="sectorName" 
                                        stroke="#6b7280"
                                        style={{ fontSize: '12px', fontWeight: '600' }}
                                        angle={-45}
                                        textAnchor="end"
                                        height={100}
                                    />
                                    <YAxis 
                                        stroke="#6b7280"
                                        style={{ fontSize: '14px', fontWeight: '600' }}
                                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: '14px', fontWeight: '600' }} />
                                    <Bar dataKey="przychody" name="Przychody" fill="#10b981" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Wykres 4: Porównanie sektorów w wybranym roku - Wydatki */}
                        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                                <span className="mr-3">💸</span>
                                Porównanie Wydatków Sektorów - Rok {selectedYear}
                            </h2>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={selectedYearSectorData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis 
                                        dataKey="sectorName" 
                                        stroke="#6b7280"
                                        style={{ fontSize: '12px', fontWeight: '600' }}
                                        angle={-45}
                                        textAnchor="end"
                                        height={100}
                                    />
                                    <YAxis 
                                        stroke="#6b7280"
                                        style={{ fontSize: '14px', fontWeight: '600' }}
                                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: '14px', fontWeight: '600' }} />
                                    <Bar dataKey="wydatki" name="Wydatki" fill="#ef4444" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Wykres 5: Porównanie sektorów w wybranym roku - Zysk */}
                        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                                <span className="mr-3">📊</span>
                                Porównanie Zysków Sektorów - Rok {selectedYear}
                            </h2>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={selectedYearSectorData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis 
                                        dataKey="sectorName" 
                                        stroke="#6b7280"
                                        style={{ fontSize: '12px', fontWeight: '600' }}
                                        angle={-45}
                                        textAnchor="end"
                                        height={100}
                                    />
                                    <YAxis 
                                        stroke="#6b7280"
                                        style={{ fontSize: '14px', fontWeight: '600' }}
                                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: '14px', fontWeight: '600' }} />
                                    <Bar dataKey="zysk" name="Zysk Netto" radius={[8, 8, 0, 0]}>
                                        {selectedYearSectorData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.zysk >= 0 ? '#3b82f6' : '#f59e0b'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </>
                )}

                {/* Informacja gdy brak danych */}
                {yearlyComparison.length === 0 && (
                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 text-center">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">
                            📊
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">Brak danych do analizy</h3>
                        <p className="text-gray-500 mb-6">
                            Dodaj przychody i wydatki, aby zobaczyć szczegółowe analizy finansowe.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}