import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Treemap, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { BACKEND_URL, getAuthHeaders } from "../utils/apiConfigs";
import { formatCurrency } from "../utils/common";

const MONTH_OPTIONS = [
    { value: '', label: 'Wszystkie miesiące 📅' },
    { value: '1', label: 'Styczeń' },
    { value: '2', label: 'Luty' },
    { value: '3', label: 'Marzec' },
    { value: '4', label: 'Kwiecień' },
    { value: '5', label: 'Maj' },
    { value: '6', label: 'Czerwiec' },
    { value: '7', label: 'Lipiec' },
    { value: '8', label: 'Sierpień' },
    { value: '9', label: 'Wrzesień' },
    { value: '10', label: 'Październik' },
    { value: '11', label: 'Listopad' },
    { value: '12', label: 'Grudzień' }
];

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

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function ProfitAnalysis() {
    const [profits, setProfits] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [sectors, setSectors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [alert, setAlert] = useState({ type: '', message: '' });
    const [selectedYear, setSelectedYear] = useState('all');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [chartType, setChartType] = useState('pieTypes');
    const [dataType, setDataType] = useState('revenue');
    const [sectorLaborCosts, setSectorLaborCosts] = useState([]);
    const [selectedProfitType, setSelectedProfitType] = useState(null);

    const fetchSectorLaborCosts = useCallback(async () => {
    try {
        if (!sectors || sectors.length === 0) return;

        const laborCostsPromises = sectors.map(async (sector) => {
            const params = new URLSearchParams();
            params.append('sectorId', sector.id);
            
            const url = `${BACKEND_URL}/api/expenses/sector-labor-costs?${params}`;
            
            try {
                const response = await fetch(url, { 
                    method: 'GET', 
                    headers: getAuthHeaders() 
                });
                
                if (response.ok) {

                    const responseText = await response.text()
                    if (!responseText) {
                        return {
                            sectorId: sector.id,
                            totalCost: 0,
                            paidCost: 0,
                            unpaidCost: 0,
                            totalEntries: 0,
                            paidEntries: 0,
                            unpaidEntries: 0,
                        }
                    }
                    const data = JSON.parse(responseText);
                    return {
                        sectorId: sector.id,
                        totalCost: data.sectorLaborCost || 0,
                        paidCost: data.paidLaborCost || 0,
                        unpaidCost: data.unpaidLaborCost || 0,
                        totalEntries: data.totalEntries || 0,
                        paidEntries: data.paidEntries || 0,
                        unpaidEntries: data.unpaidEntries || 0
                    };
                }
            } catch (error) {
                console.error(`Error fetching labor costs for sector ${sector.id}:`, error);
            }
            return { sectorId: sector.id, totalCost: 0, totalEntries: 0 };
        });

        

        const generalLaborCostPromise = async () => {

            const url = `${BACKEND_URL}/api/expenses/sector-labor-costs`; 
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: getAuthHeaders()
                });

                if (response.ok) {
                    const data = await response.json();
                    return {
                        sectorId: 'no-sector',
                        totalCost: data.sectorLaborCost || 0,
                        paidCost: data.paidLaborCost || 0,
                        unpaidCost: data.unpaidLaborCost || 0,
                        totalEntries: data.totalEntries || 0,
                        paidEntries: data.paidEntries || 0,
                        unpaidEntries: data.unpaidEntries || 0
                    };
                }
            } catch (error) {
                console.error("Error fetching general labor costs:", error);
            }
            return { sectorId: 'no-sector', totalCost: 0, totalEntries: 0 };
        };

        const laborCostsResults = await Promise.all([...laborCostsPromises, generalLaborCostPromise()]);
        
        const laborCostsMap = laborCostsResults.reduce((acc, item) => {
            if (item && item.sectorId) {
                acc[item.sectorId] = item;
            }
            return acc;
        }, {});
        
        setSectorLaborCosts(laborCostsMap);
        
    } catch (error) {
        console.error('Error fetching sector labor costs:', error);
    }
}, [sectors]);

    useEffect(() => {
        fetchSectorLaborCosts();
    }, [fetchSectorLaborCosts]);

    useEffect(() => {
        fetchAllData();
    }, []);

    useEffect(() => {
    if (sectors.length > 0) {
        fetchSectorLaborCosts();
    }
}, [sectors, fetchSectorLaborCosts]);

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
        let filteredProfits = profits;
        let filteredExpenses = expenses;

        // Filtrowanie po roku
        if (selectedYear !== 'all') {
            const year = parseInt(selectedYear);
            filteredProfits = filteredProfits.filter(p => 
                new Date(p.createdAt).getFullYear() === year
            );
            filteredExpenses = filteredExpenses.filter(e => 
                new Date(e.createdAt).getFullYear() === year
            );
        }

        // Filtrowanie po miesiącu
        if (selectedMonth) {
            const month = parseInt(selectedMonth);
            filteredProfits = filteredProfits.filter(p => 
                new Date(p.createdAt).getMonth() + 1 === month
            );
            filteredExpenses = filteredExpenses.filter(e => 
                new Date(e.createdAt).getMonth() + 1 === month
            );
        }

        const totalProfits = filteredProfits.reduce((sum, p) => sum + Number(p.profit), 0);
        const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

        // Dodaj koszty pracownicze ze wszystkich sektorów
        const laborCosts = sectorLaborCosts && Object.keys(sectorLaborCosts).length > 0
            ? Object.values(sectorLaborCosts).reduce((sum, sector) => sum + Number(sector.totalCost || 0), 0)
            : 0;
        const totalExpensesWithLabor = totalExpenses + laborCosts;
        
        const netProfit = totalProfits - totalExpensesWithLabor;
        
        return {
            totalProfits,
            totalExpenses: totalExpensesWithLabor,
            totalExpensesNonLabor: totalExpenses,
            laborCosts,
            netProfit,
            profitMargin: totalProfits > 0 ? ((netProfit / totalProfits) * 100).toFixed(1) : 0
        };
    }, [profits, expenses, selectedYear, selectedMonth, sectorLaborCosts]);

    // Dane dla wykresów kołowych
    const pieChartData = useMemo(() => {
        const sectorData = {};
        let noSectorRevenue = 0;
        let noSectorExpenses = 0;

        profits.forEach(profit => {
            if (selectedYear !== 'all' && new Date(profit.createdAt).getFullYear() !== parseInt(selectedYear)) {
                return;
            }
            if (selectedMonth && new Date(profit.createdAt).getMonth() + 1 !== parseInt(selectedMonth)) {
                return;
            }
            if (profit.sectorDTO) {
                const sectorId = profit.sectorDTO.id;
                if (!sectorData[sectorId]) {
                    sectorData[sectorId] = {
                        name: profit.sectorDTO.description || `Sektor ${sectorId}`,
                        revenue: 0,
                        expenses: 0
                    };
                }
                sectorData[sectorId].revenue += Number(profit.profit);
            } else {
                noSectorRevenue += Number(profit.profit);
            }
        });

        expenses.forEach(expense => {
            if (selectedYear !== 'all' && new Date(expense.createdAt).getFullYear() !== parseInt(selectedYear)) {
                return;
            }
            if (selectedMonth && new Date(expense.createdAt).getMonth() + 1 !== parseInt(selectedMonth)) {
                return;
            }
            if (expense.sectorDTO) {
                const sectorId = expense.sectorDTO.id;
                if (!sectorData[sectorId]) {
                    sectorData[sectorId] = {
                        name: expense.sectorDTO.description || `Sektor ${sectorId}`,
                        revenue: 0,
                        expenses: 0
                    };
                }
                sectorData[sectorId].expenses += Number(expense.amount);
            } else {
                noSectorExpenses += Number(expense.amount);
            }
        });

        // Dodaj koszty pracownicze do wydatków (proporcjonalnie lub całość do "Brak sektoru")
        // Dodaj koszty pracownicze do wydatków właściwego sektora
        // Dodaj koszty pracownicze dla każdego sektora
        if (sectorLaborCosts && Object.keys(sectorLaborCosts).length > 0) {
    Object.values(sectorLaborCosts).forEach(laborCost => {
        const cost = Number(laborCost.totalCost || 0);
        if (cost > 0) {
            // Znajdź sektor w sectors array po ID
            const sector = sectors.find(s => s.id === laborCost.sectorId);
            if (sector) {
                const sectorName = sector.description || `Sektor ${sector.id}`;
                
                // Znajdź sektor w sectorData po nazwie
                const targetSector = Object.values(sectorData).find(
                    s => s.name === sectorName
                );
                
                if (targetSector) {
                    targetSector.expenses += cost;
                } else {
                    // Utwórz nowy wpis
                    const newSectorKey = `labor-sector-${laborCost.sectorId}`;
                    sectorData[newSectorKey] = {
                        name: sectorName,
                        revenue: 0,
                        expenses: cost
                    };
                }
            } else {
                // Brak sektora - dodaj do ogólnych
                noSectorExpenses += cost;
            }
        }
    });
}

        const data = Object.values(sectorData).map(sector => ({
            name: sector.name,
            value: dataType === 'revenue' ? sector.revenue : dataType === 'expenses' ? sector.expenses : (sector.revenue - sector.expenses),
            revenue: sector.revenue,
            expenses: sector.expenses,
            profit: sector.revenue - sector.expenses
        }));

        if (noSectorRevenue > 0 || noSectorExpenses > 0) {
            data.push({
                name: 'Ogólne (poza sektorami)',
                value: dataType === 'revenue' ? noSectorRevenue : dataType === 'expenses' ? noSectorExpenses : (noSectorRevenue - noSectorExpenses),
                revenue: noSectorRevenue,
                expenses: noSectorExpenses,
                profit: noSectorRevenue - noSectorExpenses
            });
        }

        return data.filter(d => d.value !== 0);
    }, [profits, expenses, selectedYear, selectedMonth, dataType, sectorLaborCosts]);

   // Dane dla wykresów kołowych według typów (ProfitType/ProductType)
    // Dane dla wykresów kołowych według typów (ProfitType/ProductType)
    const pieChartTypeData = useMemo(() => {
        const typeData = {};

        profits.forEach(profit => {
            if (selectedYear !== 'all' && new Date(profit.createdAt).getFullYear() !== parseInt(selectedYear)) {
                return;
            }
            if (selectedMonth && new Date(profit.createdAt).getMonth() + 1 !== parseInt(selectedMonth)) {
                return;
            }
            
            const typeName = profit.profitType || 'Nieokreślony';
            if (!typeData[typeName]) {
                typeData[typeName] = { name: typeName, revenue: 0, expenses: 0 };
            }
            typeData[typeName].revenue += Number(profit.profit);
        });

        expenses.forEach(expense => {
            if (selectedYear !== 'all' && new Date(expense.createdAt).getFullYear() !== parseInt(selectedYear)) {
                return;
            }
            if (selectedMonth && new Date(expense.createdAt).getMonth() + 1 !== parseInt(selectedMonth)) {
                return;
            }
            
            const typeName = expense.type || 'Nieokreślony';
            if (!typeData[typeName]) {
                typeData[typeName] = { name: typeName, revenue: 0, expenses: 0 };
            }
            typeData[typeName].expenses += Number(expense.amount);
        });

        if (sectorLaborCosts && Object.keys(sectorLaborCosts).length > 0) {
            const totalLaborCost = Object.values(sectorLaborCosts).reduce((sum, laborCost) => {
                return sum + Number(laborCost.totalCost || 0);
            }, 0);
            
            if (totalLaborCost > 0) {
                const laborTypeName = 'Koszty pracownicze';
                
                if (!typeData[laborTypeName]) {
                    typeData[laborTypeName] = { name: laborTypeName, revenue: 0, expenses: 0 };
                }
                typeData[laborTypeName].expenses += totalLaborCost;
            }
        }

        const data = Object.values(typeData).map(type => ({
            name: type.name,
            value: dataType === 'revenue' ? type.revenue : dataType === 'expenses' ? type.expenses : (type.revenue - type.expenses),
            revenue: type.revenue,
            expenses: type.expenses,
            profit: type.revenue - type.expenses
        }));

        return data.filter(d => d.value !== 0);
    }, [profits, expenses, selectedYear, selectedMonth, dataType, sectorLaborCosts, sectors]);

    // Dane dla wykresu odmian po kliknięciu w typ sprzedaży
    const varietyChartData = useMemo(() => {
        if (!selectedProfitType) return [];
        
        const varietyData = {};
        
        profits.forEach(profit => {
            if (selectedYear !== 'all' && new Date(profit.createdAt).getFullYear() !== parseInt(selectedYear)) {
                return;
            }
            if (selectedMonth && new Date(profit.createdAt).getMonth() + 1 !== parseInt(selectedMonth)) {
                return;
            }
            
            // Sprawdź czy to wybrany typ sprzedaży
            if (profit.profitType === selectedProfitType && profit.sectorDTO && profit.sectorDTO.variety) {
                const variety = profit.sectorDTO.variety;
                if (!varietyData[variety]) {
                    varietyData[variety] = { name: variety, revenue: 0, expenses: 0, kilograms: 0 };
                }
                varietyData[variety].revenue += Number(profit.profit);
                varietyData[variety].kilograms += Number(profit.kilogramsSold || 0);
            }
        });

        const data = Object.values(varietyData).map(variety => ({
            name: variety.name,
            value: dataType === 'revenue' ? variety.revenue : variety.kilograms,
            revenue: variety.revenue,
            kilograms: variety.kilograms,
            profit: variety.revenue
        }));

        return data.filter(d => d.value > 0);
    }, [profits, selectedYear, selectedMonth, selectedProfitType, dataType]);
    const tableData = useMemo(() => {
        const sectorData = {};

        profits.forEach(profit => {
            if (selectedYear !== 'all' && new Date(profit.createdAt).getFullYear() !== parseInt(selectedYear)) {
                return;
            }
            if (selectedMonth && new Date(profit.createdAt).getMonth() + 1 !== parseInt(selectedMonth)) {
                return;
            }
            const sectorId = profit.sectorDTO ? profit.sectorDTO.id : 'no-sector';
            const sectorName = profit.sectorDTO ? (profit.sectorDTO.description || `Sektor ${profit.sectorDTO.id}`) : 'Brak sektoru';
            
            if (!sectorData[sectorId]) {
                sectorData[sectorId] = { name: sectorName, revenue: 0, expenses: 0 };
            }
            sectorData[sectorId].revenue += Number(profit.profit);
        });

        expenses.forEach(expense => {
            if (selectedYear !== 'all' && new Date(expense.createdAt).getFullYear() !== parseInt(selectedYear)) {
                return;
            }
            if (selectedMonth && new Date(expense.createdAt).getMonth() + 1 !== parseInt(selectedMonth)) {
                return;
            }
            const sectorId = expense.sectorDTO ? expense.sectorDTO.id : 'no-sector';
            const sectorName = expense.sectorDTO ? (expense.sectorDTO.description || `Sektor ${expense.sectorDTO.id}`) : 'Brak sektoru';
            
            if (!sectorData[sectorId]) {
                sectorData[sectorId] = { name: sectorName, revenue: 0, expenses: 0 };
            }
            sectorData[sectorId].expenses += Number(expense.amount);
        });

        // Dodaj koszty pracownicze dla każdego sektora
    if (sectorLaborCosts && Object.keys(sectorLaborCosts).length > 0) {
     Object.values(sectorLaborCosts).forEach(laborCost => {
        const cost = Number(laborCost.totalCost || 0);
        if (cost > 0) {
            // Znajdź sektor w sectors array po ID
            const sector = sectors.find(s => s.id === laborCost.sectorId);
            if (sector) {
                const sectorName = sector.description || `Sektor ${sector.id}`;
                
                // Znajdź odpowiadający wpis w sectorData
                const sectorEntry = Object.entries(sectorData).find(
                    ([key, data]) => data.name === sectorName
                );
                
                if (sectorEntry) {
                    sectorEntry[1].expenses += cost;
                } else {
                    // Utwórz nowy wpis dla sektora
                    const sectorKey = `labor-sector-${laborCost.sectorId}`;
                    sectorData[sectorKey] = {
                        name: sectorName,
                        revenue: 0,
                        expenses: cost
                    };
                }
            } else {
                // Jeśli nie znaleziono sektora, dodaj do "Brak sektoru"
                if (!sectorData['no-sector']) {
                    sectorData['no-sector'] = { name: 'Brak sektoru', revenue: 0, expenses: 0 };
                }
                sectorData['no-sector'].expenses += cost;
            }
        }
    });
}

        const data = Object.values(sectorData).map(sector => ({
            name: sector.name,
            revenue: sector.revenue,
            expenses: sector.expenses,
            profit: sector.revenue - sector.expenses,
            margin: sector.revenue > 0 ? ((sector.revenue - sector.expenses) / sector.revenue * 100).toFixed(1) : 0
        }));

        return data.sort((a, b) => parseFloat(b.margin) - parseFloat(a.margin));
    }, [profits, expenses, selectedYear, selectedMonth, sectorLaborCosts]);

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

    const PieTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg">
                    <p className="font-bold text-gray-800 mb-2">{data.name}</p>
                    <p className="text-sm font-medium text-green-600">
                        Przychody: {formatCurrency(data.revenue)} PLN
                    </p>
                    <p className="text-sm font-medium text-red-600">
                        Wydatki: {formatCurrency(data.expenses)} PLN
                    </p>
                    <p className="text-sm font-medium text-blue-600">
                        Zysk: {formatCurrency(data.profit)} PLN
                    </p>
                    <p className="text-sm font-medium text-gray-600 mt-1">
                        Udział: {data.percent ? data.percent.toFixed(1) : 0}%
                    </p>
                </div>
            );
        }
        return null;
    };

    const VarietyTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg">
                    <p className="font-bold text-gray-800 mb-2">{data.name}</p>
                    <p className="text-sm font-medium text-green-600">
                        Przychód: {formatCurrency(data.revenue)} PLN
                    </p>
                    <p className="text-sm font-medium text-blue-600">
                        Sprzedano: {data.kilograms} kg
                    </p>
                    {data.revenue > 0 && data.kilograms > 0 && (
                        <p className="text-sm font-medium text-purple-600">
                            Cena/kg: {formatCurrency(data.revenue / data.kilograms)} PLN
                        </p>
                    )}
                    <p className="text-sm font-medium text-gray-600 mt-1">
                        Udział: {data.percent ? data.percent.toFixed(1) : 0}%
                    </p>
                </div>
            );
        }
        return null;
    };

     const handlePieClick = (data) => {
        // Sprawdź czy to typ sprzedaży owoców
        const fruitTypes = ['SPRZEDAZ_JABLEK', 'SPRZEDAZ_GRUSZEK', 'SPRZEDAZ_WISNI', 
                           'SPRZEDAZ_SLIW', 'SPRZEDAZ_MALIN', 'SPRZEDAZ_CZERESNI'];
        
        // Sprawdź czy to koszty pracownicze
        const isLaborCost = data.name.includes('Koszty pracownicze');
        
        if (fruitTypes.some(type => data.name.includes(type) || data.name === type) || isLaborCost) {
            setSelectedProfitType(data.name);
        } else {
            setSelectedProfitType(null);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 p-6">
                <LoadingState />
            </div>
        );
    }

    const CustomTreemapContent = ({ x, y, width, height, name, value, revenue, expenses, profit }) => {
    if (width < 80 || height < 60) return null;
    
    // Zabezpieczenie przed undefined
    const safeRevenue = revenue || 0;
    const safeExpenses = expenses || 0;
    const safeProfit = profit || 0;
    
    const displayValue = dataType === 'revenue' ? safeRevenue : 
                         dataType === 'expenses' ? safeExpenses : 
                         safeProfit;
    
    const totalValue = pieChartData.reduce((sum, item) => sum + (item.value || 0), 0);
    const percentage = totalValue > 0 ? ((displayValue / totalValue) * 100).toFixed(1) : 0;

    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: COLORS[pieChartData.findIndex(d => d.name === name) % COLORS.length],
                    stroke: '#fff',
                    strokeWidth: 2,
                }}
            />
            <text
                x={x + width / 2}
                y={y + height / 2 - 15}
                textAnchor="middle"
                fill="#fff"
                fontSize={14}
                fontWeight="bold"
            >
                {name.length > 15 ? name.substring(0, 12) + '...' : name}
            </text>
            <text
                x={x + width / 2}
                y={y + height / 2 + 5}
                textAnchor="middle"
                fill="#fff"
                fontSize={16}
                fontWeight="bold"
            >
                {formatCurrency(displayValue)} PLN
            </text>
            <text
                x={x + width / 2}
                y={y + height / 2 + 25}
                textAnchor="middle"
                fill="#fff"
                fontSize={12}
            >
                {percentage}%
            </text>
        </g>
    );
};

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
                        subtitle={`w tym pracownicze: ${formatCurrency(overallStats.laborCosts)} PLN`}
                        icon="💸"
                        color="red"
                    />
                    <StatCard
                        title="Zysk"
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

                {/* Panel kontrolny - wybór typu wykresu i filtrów */}
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                        <span className="mr-3">🎛️</span>
                        Panel Kontrolny - Wybierz Typ Analizy
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Typ wykresu */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Typ wyświetlania
                            </label>
                            <select
                                value={chartType}
                                onChange={(e) => setChartType(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            >
                                <option value="pieTypes">🔖 Wykres kołowy (typy)</option>
                                <option value="pie">📊 Wykres kołowy (sektory)</option>
                                <option value="table">📋 Tabela z marżami</option>
                                <option value="treemap">🗺️ Mapa drzewa (sektory)</option>
                                <option value="yearly">📈 Analiza rok do roku</option>
                            </select>
                        </div>

                        {/* Rok */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Rok 📅
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

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Miesiąc 📆
                            </label>
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            >
                                {MONTH_OPTIONS.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>

                        {(chartType === 'pie' || chartType === 'pieTypes' || chartType === 'treemap') && (  
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Typ danych
                                </label>
                                <select
                                    value={dataType}
                                    onChange={(e) => setDataType(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                >
                                    <option value="revenue">💰 Przychody</option>
                                    <option value="expenses">💸 Koszty</option>
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {chartType === 'pie' && (
                    pieChartData.length > 0 ? (
                        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                                <span className="mr-3">🥧</span>
                                Rozkład {dataType === 'revenue' ? 'Przychodów' : 'Kosztów'} według Sektorów
                                {selectedYear !== 'all' && ` - Rok ${selectedYear}`}
                                {selectedMonth && ` - ${MONTH_OPTIONS.find(m => m.value === selectedMonth)?.label}`}
                            </h2>
                            <ResponsiveContainer width="100%" height={500}>
                                <PieChart>
                                    <Pie
                                        data={pieChartData}
                                        dataKey="value"
                                        animationDuration={900}
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={180}
                                        label={pieChartData.length > 1 ? ({name, percent}) => `${name}: ${(percent * 100).toFixed(1)}%` : false}
                                        labelLine={false}
                                    >
                                        {pieChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<PieTooltip />} />
                                    <Legend 
                                        verticalAlign="bottom" 
                                        height={36}
                                        wrapperStyle={{ fontSize: '14px', fontWeight: '600' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 mb-8 text-center">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">
                                📊
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Brak Wykresu</h3>
                            <p className="text-gray-500">
                                Brak danych dla wybranego okresu i filtrów.
                            </p>
                        </div>
                    )
                )}
                    {chartType === 'pieTypes' && (
                        pieChartTypeData.length > 0 ? (
                            <div className="space-y-8">
                                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                                            <span className="mr-3">🔖</span>
                                            Rozkład {dataType === 'revenue' ? 'Przychodów' : dataType === 'expenses' ? 'Kosztów' : 'Zysków'} według Typów
                                            {selectedYear !== 'all' && ` - Rok ${selectedYear}`}
                                            {selectedMonth && ` - ${MONTH_OPTIONS.find(m => m.value === selectedMonth)?.label}`}
                                        </h2>
                                        {selectedProfitType && (
                                            <button
                                                onClick={() => setSelectedProfitType(null)}
                                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors text-sm font-medium"
                                            >
                                                ✖ Zamknij widok szczegółów
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-gray-600 mb-4 text-sm">
                                        💡 <strong>Wskazówka:</strong> Kliknij na segment sprzedaży owoców lub kosztów pracowniczych, aby zobaczyć szczegóły
                                    </p>
                                    
                                    <div className={`grid ${selectedProfitType ? 'grid-cols-2' : 'grid-cols-1'} gap-8`}>
                                        {/* Główny wykres typów */}
                                        <div>
                                            <ResponsiveContainer width="100%" height={500}>
                                                <PieChart>
                                                    <Pie
                                                        data={pieChartTypeData}
                                                        dataKey="value"
                                                        nameKey="name"
                                                        animationDuration={900}
                                                        cx="50%"
                                                        cy="50%"
                                                        outerRadius={180}
                                                        label={pieChartTypeData.length > 1 ? ({name, percent}) => `${name}: ${(percent * 100).toFixed(1)}%` : false}
                                                        labelLine={false}
                                                        onClick={handlePieClick}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        {pieChartTypeData.map((entry, index) => (
                                                            <Cell 
                                                                key={`cell-${index}`} 
                                                                fill={COLORS[index % COLORS.length]}
                                                                opacity={selectedProfitType && selectedProfitType !== entry.name ? 0.3 : 1}
                                                            />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip content={<PieTooltip />} />
                                                    <Legend 
                                                        verticalAlign="bottom" 
                                                        height={36}
                                                        wrapperStyle={{ fontSize: '14px', fontWeight: '600' }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        {/* Wykres odmian */}
                                        {/* Wykres odmian dla owoców */}
                                        {selectedProfitType && !selectedProfitType.includes('Koszty pracownicze') && varietyChartData.length > 0 && (
                                            <div className="border-l-4 border-blue-500 pl-8">
                                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                                    <span className="mr-2">🍎</span>
                                                    Rozkład odmian: {selectedProfitType}
                                                </h3>
                                                <ResponsiveContainer width="100%" height={500}>
                                                    <PieChart>
                                                        <Pie
                                                            data={varietyChartData}
                                                            dataKey="value"
                                                            nameKey="name"
                                                            animationDuration={900}
                                                            cx="50%"
                                                            cy="50%"
                                                            outerRadius={180}
                                                            label={varietyChartData.length > 1 ? ({name, percent}) => `${name}: ${(percent * 100).toFixed(1)}%` : false}
                                                            labelLine={false}
                                                        >
                                                            {varietyChartData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip content={<VarietyTooltip />} />
                                                        <Legend 
                                                            verticalAlign="bottom" 
                                                            height={36}
                                                            wrapperStyle={{ fontSize: '12px', fontWeight: '600' }}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}

                                        {/* Wykres kosztów pracowniczych według sektorów */}
                                        {selectedProfitType && selectedProfitType.includes('Koszty pracownicze') && (
                                            <div className="border-l-4 border-purple-500 pl-8">
                                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                                    <span className="mr-2">👥</span>
                                                    Rozkład kosztów pracowniczych według sektorów
                                                </h3>
                                                {(() => {
                                                    // Przygotuj dane kosztów pracowniczych według sektorów
                                                    const laborBySectorData = [];
                                                    let totalGeneralLabor = 0;
                                                    
                                                    if (sectorLaborCosts && Object.keys(sectorLaborCosts).length > 0) {
                                                        Object.values(sectorLaborCosts).forEach(laborCost => {
                                                            const cost = Number(laborCost.totalCost || 0);
                                                            if (cost > 0) {
                                                                const sector = sectors.find(s => s.id === laborCost.sectorId);
                                                                if (sector) {
                                                                    laborBySectorData.push({
                                                                        name: sector.description || `Sektor ${sector.id}`,
                                                                        value: cost,
                                                                        entries: laborCost.totalEntries || 0,
                                                                        paidCost: laborCost.paidCost || 0,
                                                                        unpaidCost: laborCost.unpaidCost || 0
                                                                    });
                                                                } else {
                                                                    totalGeneralLabor += cost;
                                                                }
                                                            }
                                                        });
                                                    }
                                                    
                                                    if (totalGeneralLabor > 0) {
                                                        laborBySectorData.push({
                                                            name: 'Ogólne (poza sektorami)',
                                                            value: totalGeneralLabor,
                                                            entries: 0,
                                                            paidCost: 0,
                                                            unpaidCost: 0
                                                        });
                                                    }
                                                    
                                                    const LaborTooltip = ({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            const data = payload[0].payload;
                                                            return (
                                                                <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg">
                                                                    <p className="font-bold text-gray-800 mb-2">{data.name}</p>
                                                                    <p className="text-sm font-medium text-purple-600">
                                                                        Koszt całkowity: {formatCurrency(data.value)} PLN
                                                                    </p>
                                                                    {data.paidCost > 0 && (
                                                                        <p className="text-sm font-medium text-green-600">
                                                                            Wypłacono: {formatCurrency(data.paidCost)} PLN
                                                                        </p>
                                                                    )}
                                                                    {data.unpaidCost > 0 && (
                                                                        <p className="text-sm font-medium text-amber-600">
                                                                            Do wypłaty: {formatCurrency(data.unpaidCost)} PLN
                                                                        </p>
                                                                    )}
                                                                    {data.entries > 0 && (
                                                                        <p className="text-sm font-medium text-gray-600">
                                                                            Liczba wpisów: {data.entries}
                                                                        </p>
                                                                    )}
                                                                    <p className="text-sm font-medium text-gray-600 mt-1">
                                                                        Udział: {data.percent ? data.percent.toFixed(1) : 0}%
                                                                    </p>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    };
                                                    
                                                    return laborBySectorData.length > 0 ? (
                                                        <ResponsiveContainer width="100%" height={500}>
                                                            <PieChart>
                                                                <Pie
                                                                    data={laborBySectorData}
                                                                    dataKey="value"
                                                                    nameKey="name"
                                                                    animationDuration={900}
                                                                    cx="50%"
                                                                    cy="50%"
                                                                    outerRadius={180}
                                                                    label={laborBySectorData.length > 1 ? ({name, percent}) => `${name}: ${(percent * 100).toFixed(1)}%` : false}
                                                                    labelLine={false}
                                                                >
                                                                    {laborBySectorData.map((entry, index) => (
                                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                                    ))}
                                                                </Pie>
                                                                <Tooltip content={<LaborTooltip />} />
                                                                <Legend 
                                                                    verticalAlign="bottom" 
                                                                    height={36}
                                                                    wrapperStyle={{ fontSize: '12px', fontWeight: '600' }}
                                                                />
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                    ) : (
                                                        <div className="text-center py-8">
                                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                                                                👥
                                                            </div>
                                                            <p className="text-gray-600 font-medium">
                                                                Brak danych o kosztach pracowniczych
                                                            </p>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        )}

                                        {selectedProfitType && !selectedProfitType.includes('Koszty pracownicze') && varietyChartData.length === 0 && (
                                            <div className="border-l-4 border-gray-300 pl-8 flex items-center justify-center">
                                                <div className="text-center">
                                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                                                        🍎
                                                    </div>
                                                    <p className="text-gray-600 font-medium">
                                                        Brak danych o odmianach dla<br/>{selectedProfitType}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 mb-8 text-center">
                                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">
                                    📊
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">Brak Wykresu</h3>
                                <p className="text-gray-500">
                                    Brak danych dla wybranego okresu i filtrów.
                                </p>
                            </div>
                        )
                )}
            {chartType === 'table' && (
                tableData.length > 0 ? (
                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                            <span className="mr-3">📋</span>
                            Tabela Rentowności Sektorów
                            {selectedYear !== 'all' && ` - Rok ${selectedYear}`}
                            {selectedMonth && ` - ${MONTH_OPTIONS.find(m => m.value === selectedMonth)?.label}`}
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
            <thead>
                <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-4 px-4 font-bold text-gray-700">Pozycja</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-700">Sektor</th>
                    <th className="text-right py-4 px-4 font-bold text-gray-700">Przychody</th>
                    <th className="text-right py-4 px-4 font-bold text-gray-700">Koszty</th>
                    <th className="text-right py-4 px-4 font-bold text-gray-700">W tym: Koszty pracy</th>
                    <th className="text-right py-4 px-4 font-bold text-gray-700">Zysk</th>
                    <th className="text-right py-4 px-4 font-bold text-gray-700">Marża</th>
                </tr>
            </thead>
            <tbody>
            {tableData.map((row, index) => {
                const sector = sectors.find(s => 
                    (s.description || `Sektor ${s.id}`) === row.name
                );

            const laborKey = row.name === 'Brak sektoru' ? 'no-sector' : sector?.id;

            const laborCost = laborKey ? (sectorLaborCosts[laborKey] || { totalCost: 0, totalEntries: 0 }) : { totalCost: 0, totalEntries: 0 };  
            return (
                <tr 
                    key={index}
                    className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                        index === 0 ? 'bg-green-50' : 
                        index === tableData.length - 1 ? 'bg-red-50' : ''
                    }`}
                >
                    <td className="py-4 px-4 font-medium text-gray-600">
                        {index === 0 && '🥇 '}
                        {index === 1 && '🥈 '}
                        {index === 2 && '🥉 '}
                        #{index + 1}
                    </td>
                    <td className="py-4 px-4">
                        <div className="flex flex-col">
                            <span className="font-semibold text-gray-900">{row.name}</span>
                        </div>
                    </td>
                    <td className="py-4 px-4 text-right text-green-600 font-medium">
                        {formatCurrency(row.revenue)} PLN
                    </td>
                    <td className="py-4 px-4 text-right text-red-600 font-medium">
                        {formatCurrency(row.expenses)} PLN
                    </td>
                    <td className="py-4 px-4 text-right">
                        <div className="flex flex-col items-end">
                            <span className="font-semibold text-purple-600">
                                {formatCurrency(laborCost.totalCost)} PLN
                            </span>
                        </div>
                    </td>
                    <td className={`py-4 px-4 text-right font-bold ${row.profit >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                        {formatCurrency(row.profit)} PLN
                    </td>
                    <td className={`py-4 px-4 text-right font-bold text-lg ${
                        parseFloat(row.margin) >= 50 ? 'text-green-600' :
                        parseFloat(row.margin) >= 20 ? 'text-blue-600' :
                        parseFloat(row.margin) >= 0 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                        {row.margin}%
                    </td>
                </tr>
            );
        })}
    </tbody>
</table>                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 mb-8 text-center">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">
                                📋
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Brak Wykresu</h3>
                            <p className="text-gray-500">
                                Brak danych dla wybranego okresu i filtrów.
                            </p>
                        </div>
                    )
                )}

                {/* Mapa drzewa */}
                {chartType === 'treemap' && (
                    pieChartData.length > 0 ? (
                        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                                <span className="mr-3">🗺️</span>
                                Mapa Drzewa - {dataType === 'revenue' ? 'Przychody' : dataType === 'expenses' ? 'Koszty' : 'Zyski'} według Sektorów
                                {selectedYear !== 'all' && ` - Rok ${selectedYear}`}
                                {selectedMonth && ` - ${MONTH_OPTIONS.find(m => m.value === selectedMonth)?.label}`}
                            </h2>
                            <ResponsiveContainer width="100%" height={500}>
                                <Treemap
                                    data={pieChartData}
                                    dataKey="value"
                                    animationDuration={900}
                                    stroke="#fff"
                                    fill="#8884d8"
                                    content={<CustomTreemapContent />}
                                >
                                    <Tooltip content={<PieTooltip />} />
                                </Treemap>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 mb-8 text-center">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">
                                🗺️
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Brak Mapy Drzewa</h3>
                            <p className="text-gray-500">
                                Brak danych dla wybranego okresu i filtrów.
                            </p>
                        </div>
                    )
                )}

                {chartType === 'yearly' && (
                    yearlyComparison.length > 0 ? (
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
                    ) : (
                        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 mb-8 text-center">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">
                                📈
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Brak Wykresu</h3>
                            <p className="text-gray-500">
                                Brak danych dla wybranego okresu i filtrów.
                            </p>
                        </div>
                    )
                )}

                {yearlyComparison.length === 0 && chartType !== 'pie' && chartType !== 'pieTypes' && chartType !== 'treemap' && chartType !== 'table' && chartType !== 'yearly' && (
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