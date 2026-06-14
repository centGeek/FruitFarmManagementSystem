import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from "react-i18next";
import { BACKEND_URL, getAuthHeaders } from "../../utils/apiConfigs";
import { authFetch } from "../../utils/authFetch";

/** Stable internal identifier (not translated) used for click matching / table lookup. */
export const LABOR_COSTS_KEY = 'Koszty pracownicze';
/** Stable internal identifier (not translated) used for table no-sector lookup. */
export const NO_SECTOR_KEY = 'Brak sektoru';

export interface SectorDTO {
    id: string;
    description?: string;
    variety?: string;
}

export interface FinancialEntry {
    id: string;
    profit?: number;
    amount?: number;
    profitType?: string;
    type?: string;
    createdAt: string;
    sectorDTO?: SectorDTO;
    kilogramsSold?: number;
}

export interface LaborCost {
    sectorId: string;
    totalCost: number;
    paidCost: number;
    unpaidCost: number;
    totalEntries: number;
    paidEntries: number;
    unpaidEntries: number;
}

export type LaborCostMap = Record<string, LaborCost>;

export interface ChartDataPoint {
    name: string;
    value: number;
    revenue: number;
    expenses: number;
    profit: number;
    margin?: string;
    kilograms?: number;
    percent?: number;
    entries?: number;
    paidCost?: number;
    unpaidCost?: number;
}

export interface YearlyDataPoint {
    year: number;
    przychody: number;
    wydatki: number;
    zysk: number;
}

export interface OverallStats {
    totalProfits: number;
    totalExpenses: number;
    totalExpensesNonLabor: number;
    laborCosts: number;
    netProfit: number;
    profitMargin: string | number;
}

export const useFinancialData = (selectedYear: string, selectedMonth: string) => {
    const { t } = useTranslation("analytics");
    const [profits, setProfits] = useState<FinancialEntry[]>([]);
    const [expenses, setExpenses] = useState<FinancialEntry[]>([]);
    const [sectors, setSectors] = useState<SectorDTO[]>([]);
    const [sectorLaborCosts, setSectorLaborCosts] = useState<LaborCostMap>({});
    const [isLoading, setIsLoading] = useState(true);
    const [alert, setAlert] = useState({ type: '', message: '' });

    const fetchPaginatedData = async (endpoint: string, params: URLSearchParams) => {
        let allData: FinancialEntry[] = [];
        let currentPage = 0;
        let totalPages = 1;
        
        try {
            while (currentPage < totalPages) {
                params.set('page', currentPage.toString());
                params.set('size', '100');
                const response = await authFetch(`${BACKEND_URL}/api/${endpoint}?${params}`, { method: 'GET', headers: getAuthHeaders() });
                if (response.ok) {
                    const data = await response.json();
                    allData = [...allData, ...data.content];
                    totalPages = data.totalPages;
                    currentPage++;
                } else {
                    throw new Error('Fetch failed');
                }
            }
            return allData;
        } catch (error) {
            console.error(error);
            return [];
        }
    };

    const fetchSectorLaborCosts = useCallback(async () => {
        try {
            if (!sectors || sectors.length === 0) return;

            const laborCostsPromises = sectors.map(async (sector) => {
                const params = new URLSearchParams();
                params.append('sectorId', sector.id);
                if (selectedYear !== 'all') params.append('year', selectedYear);
                if (selectedMonth) params.append('month', selectedMonth);

                try {
                    const response = await authFetch(`${BACKEND_URL}/api/expenses/sector-labor-costs?${params}`, { method: 'GET', headers: getAuthHeaders() });
                    if (response.ok) {
                        const data = await response.json();
                        return {
                            sectorId: sector.id,
                            totalCost: Number(data.totalCost || 0),
                            paidCost: Number(data.paidCost || 0),
                            unpaidCost: Number(data.unpaidCost || 0),
                            totalEntries: Number(data.totalEntries || 0),
                            paidEntries: Number(data.paidEntries || 0),
                            unpaidEntries: Number(data.unpaidEntries || 0)
                        } as LaborCost;
                    }
                } catch (error) { console.error(error); }
                return { sectorId: sector.id, totalCost: 0, totalEntries: 0 } as LaborCost;
            });

            const generalLaborCostPromise = async () => {
                const params = new URLSearchParams();
                if (selectedYear !== 'all') params.append('year', selectedYear);
                if (selectedMonth) params.append('month', selectedMonth);
                try {
                    const response = await authFetch(`${BACKEND_URL}/api/expenses/sector-labor-costs?${params}`, { method: 'GET', headers: getAuthHeaders() });
                    if (response.ok) {
                        const data = await response.json();
                        return {
                            sectorId: 'no-sector',
                            totalCost: Number(data.totalCost || 0),
                            paidCost: Number(data.paidCost || 0),
                            unpaidCost: Number(data.unpaidCost || 0),
                            totalEntries: Number(data.totalEntries || 0),
                            paidEntries: Number(data.paidEntries || 0),
                            unpaidEntries: Number(data.unpaidEntries || 0)
                        } as LaborCost;
                    }
                } catch (e) { }
                return { sectorId: 'no-sector', totalCost: 0, totalEntries: 0 } as LaborCost;
            };

            const results = await Promise.all([...laborCostsPromises, generalLaborCostPromise()]);
            const laborMap = results.reduce((acc: any, item: any) => {
                if (item && item.sectorId) acc[item.sectorId] = item;
                return acc;
            }, {});
            setSectorLaborCosts(laborMap);
        } catch (error) {
            console.error(error);
            setAlert({ type: 'error', message: t("errors.refreshLaborCosts") });
        }
    }, [sectors, selectedYear, selectedMonth, t]);

    useEffect(() => {
        if (sectors.length > 0) fetchSectorLaborCosts();
    }, [sectors, selectedYear, selectedMonth, fetchSectorLaborCosts]);

    useEffect(() => {
        const loadAll = async () => {
            setIsLoading(true);
            try {
                const sRes = await authFetch(`${BACKEND_URL}/api/sectors`, { headers: getAuthHeaders() });
                if (sRes.ok) setSectors(await sRes.json());

                const params = new URLSearchParams();
                if (selectedYear !== 'all') params.append('year', selectedYear);
                if (selectedMonth) params.append('month', selectedMonth);

                const [pData, eData] = await Promise.all([
                    fetchPaginatedData('profits', new URLSearchParams(params)),
                    fetchPaginatedData('expenses', new URLSearchParams(params))
                ]);
                setProfits(pData);
                setExpenses(eData);
            } catch (e) {
                setAlert({ type: 'error', message: t("errors.loadData") });
            } finally {
                setIsLoading(false);
            }
        };
        loadAll();
    }, [selectedYear, selectedMonth]);

    return { profits, expenses, sectors, sectorLaborCosts, isLoading, alert, setAlert };
};

export const useFinancialCalculations = (
    profits: FinancialEntry[], 
    expenses: FinancialEntry[], 
    sectors: SectorDTO[], 
    sectorLaborCosts: LaborCostMap, 
    dataType: string,
    selectedProfitType: string | null
) => {
    const { t } = useTranslation("analytics");

    const overallStats: OverallStats = useMemo(() => {
        const totalProfits = profits.reduce((sum, p) => sum + Number(p.profit || 0), 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
        const laborCosts = Object.values(sectorLaborCosts || {}).reduce((sum, entry) => sum + Number(entry.totalCost || 0), 0);
        const totalOutgoings = totalExpenses + laborCosts;
        const netProfit = totalProfits - totalOutgoings;

        return {
            totalProfits,
            totalExpenses: totalOutgoings,
            totalExpensesNonLabor: totalExpenses,
            laborCosts,
            netProfit,
            profitMargin: totalProfits > 0 ? ((netProfit / totalProfits) * 100).toFixed(1) : 0
        };
    }, [profits, expenses, sectorLaborCosts]);

    const pieChartData: ChartDataPoint[] = useMemo(() => {
        const sectorData: any = {};
        let noSectorRevenue = 0, noSectorExpenses = 0;

        profits.forEach(p => {
            if (p.sectorDTO) {
                const id = p.sectorDTO.id;
                if (!sectorData[id]) sectorData[id] = { name: p.sectorDTO.description || t("fallback.sectorName", { id }), revenue: 0, expenses: 0 };
                sectorData[id].revenue += Number(p.profit);
            } else noSectorRevenue += Number(p.profit);
        });

        expenses.forEach(e => {
            if (e.sectorDTO) {
                const id = e.sectorDTO.id;
                if (!sectorData[id]) sectorData[id] = { name: e.sectorDTO.description || t("fallback.sectorName", { id }), revenue: 0, expenses: 0 };
                sectorData[id].expenses += Number(e.amount);
            } else noSectorExpenses += Number(e.amount);
        });

        if (sectorLaborCosts) {
            Object.values(sectorLaborCosts).forEach((labor: any) => {
                const cost = Number(labor.totalCost || 0);
                if (cost > 0) {
                    const sector = sectors.find(s => s.id === labor.sectorId);
                    if (sector) {
                        const target = Object.values(sectorData).find((s: any) => s.name === (sector.description || t("fallback.sectorName", { id: sector.id })));
                        if (target) (target as any).expenses += cost;
                        else {
                            sectorData[`labor-${labor.sectorId}`] = { name: sector.description, revenue: 0, expenses: cost };
                        }
                    } else noSectorExpenses += cost;
                }
            });
        }

        const data = Object.values(sectorData).map((s: any) => ({
            name: s.name,
            value: dataType === 'revenue' ? s.revenue : dataType === 'expenses' ? s.expenses : (s.revenue - s.expenses),
            revenue: s.revenue, expenses: s.expenses, profit: s.revenue - s.expenses
        }));

        if (noSectorRevenue > 0 || noSectorExpenses > 0) {
            data.push({
                name: t("fallback.general"),
                value: dataType === 'revenue' ? noSectorRevenue : dataType === 'expenses' ? noSectorExpenses : (noSectorRevenue - noSectorExpenses),
                revenue: noSectorRevenue, expenses: noSectorExpenses, profit: noSectorRevenue - noSectorExpenses
            });
        }
        return data.filter((d: any) => d.value !== 0);
    }, [profits, expenses, sectors, sectorLaborCosts, dataType, t]);

    const pieChartTypeData: ChartDataPoint[] = useMemo(() => {
        const typeData: any = {};
        profits.forEach(p => {
            const key = p.profitType || 'Nieokreślony';
            if (!typeData[key]) typeData[key] = { name: key, revenue: 0, expenses: 0 };
            typeData[key].revenue += Number(p.profit);
        });
        expenses.forEach(e => {
            const key = e.type || 'Nieokreślony';
            if (!typeData[key]) typeData[key] = { name: key, revenue: 0, expenses: 0 };
            typeData[key].expenses += Number(e.amount);
        });

        const totalLabor = Object.values(sectorLaborCosts || {}).reduce((s: any, l: any) => s + Number(l.totalCost || 0), 0);
        if (totalLabor > 0) {
            typeData[LABOR_COSTS_KEY] = { name: LABOR_COSTS_KEY, revenue: 0, expenses: totalLabor };
        }

        return Object.values(typeData).map((entry: any) => ({
            name: entry.name,
            value: dataType === 'revenue' ? entry.revenue : dataType === 'expenses' ? entry.expenses : (entry.revenue - entry.expenses),
            revenue: entry.revenue, expenses: entry.expenses, profit: entry.revenue - entry.expenses
        })).filter((d: any) => d.value !== 0);
    }, [profits, expenses, sectorLaborCosts, dataType]);

    const varietyChartData: ChartDataPoint[] = useMemo(() => {
        if (!selectedProfitType) return [];
        const varietyData: any = {};
        profits.forEach(p => {
            if (p.profitType === selectedProfitType && p.sectorDTO?.variety) {
                const v = p.sectorDTO.variety;
                if (!varietyData[v]) varietyData[v] = { name: v, revenue: 0, kilograms: 0 };
                varietyData[v].revenue += Number(p.profit);
                varietyData[v].kilograms += Number(p.kilogramsSold || 0);
            }
        });
        return Object.values(varietyData).map((v: any) => ({
            name: v.name,
            value: dataType === 'revenue' ? v.revenue : v.kilograms,
            revenue: v.revenue, kilograms: v.kilograms, profit: v.revenue
        })).filter((d: any) => d.value > 0);
    }, [profits, selectedProfitType, dataType]);

    const tableData: ChartDataPoint[] = useMemo(() => {
        const sData: any = {};
        profits.forEach(p => {
            const id = p.sectorDTO ? p.sectorDTO.id : 'no-sector';
            const name = p.sectorDTO ? (p.sectorDTO.description || t("fallback.sectorName", { id })) : NO_SECTOR_KEY;
            if (!sData[id]) sData[id] = { name, revenue: 0, expenses: 0 };
            sData[id].revenue += Number(p.profit);
        });
        expenses.forEach(e => {
            const id = e.sectorDTO ? e.sectorDTO.id : 'no-sector';
            const name = e.sectorDTO ? (e.sectorDTO.description || t("fallback.sectorName", { id })) : NO_SECTOR_KEY;
            if (!sData[id]) sData[id] = { name, revenue: 0, expenses: 0 };
            sData[id].expenses += Number(e.amount);
        });

        if (sectorLaborCosts) {
            Object.values(sectorLaborCosts).forEach((l: any) => {
                const cost = Number(l.totalCost || 0);
                if (cost > 0) {
                    const sector = sectors.find(s => s.id === l.sectorId);
                    if (sector) {
                        const match = Object.values(sData).find((d: any) => d.name === (sector.description || t("fallback.sectorName", { id: l.sectorId })));
                        if (match) (match as any).expenses += cost;
                        else sData[`labor-${l.sectorId}`] = { name: sector.description, revenue: 0, expenses: cost };
                    } else {
                        if (!sData['no-sector']) sData['no-sector'] = { name: NO_SECTOR_KEY, revenue: 0, expenses: 0 };
                        sData['no-sector'].expenses += cost;
                    }
                }
            });
        }
        return Object.values(sData).map((s: any) => ({
            ...s,
            profit: s.revenue - s.expenses,
            margin: s.revenue > 0 ? ((s.revenue - s.expenses) / s.revenue * 100).toFixed(1) : "0"
        })).sort((a: any, b: any) => parseFloat(b.margin) - parseFloat(a.margin));
    }, [profits, expenses, sectorLaborCosts, sectors, t]);

    const yearlyComparison: YearlyDataPoint[] = useMemo(() => {
        const yearData: any = {};
        profits.forEach(p => {
            const y = new Date(p.createdAt).getFullYear();
            if (!yearData[y]) yearData[y] = { year: y, przychody: 0, wydatki: 0 };
            yearData[y].przychody += Number(p.profit);
        });
        expenses.forEach(e => {
            const y = new Date(e.createdAt).getFullYear();
            if (!yearData[y]) yearData[y] = { year: y, przychody: 0, wydatki: 0 };
            yearData[y].wydatki += Number(e.amount);
        });
        return Object.values(yearData).sort((a: any, b: any) => a.year - b.year)
            .map((d: any) => ({ ...d, zysk: d.przychody - d.wydatki }));
    }, [profits, expenses]);

    const availableYears: number[] = useMemo(() => {
        const years = new Set<number>();
        [...profits, ...expenses].forEach(i => i.createdAt && years.add(new Date(i.createdAt).getFullYear()));
        return Array.from(years).sort((a, b) => b - a);
    }, [profits, expenses]);

    return { overallStats, pieChartData, pieChartTypeData, varietyChartData, tableData, yearlyComparison, availableYears };
};