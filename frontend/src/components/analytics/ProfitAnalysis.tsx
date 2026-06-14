import { useState } from 'react';
import { useTranslation, Trans } from "react-i18next";
import { Alert, formatCurrency } from "../../utils/common";
import { useFinancialData, useFinancialCalculations, LABOR_COSTS_KEY } from './ProfitAnalysisHooks';
import {
  StatCard,
  LoadingState,
  PieChartSection,
  VarietyPieSection,
  LaborPieSection,
  ProfitTableSection,
  YearlyChartSection,
  TreemapSection
} from './ProfitAnalysisCharts';

const MONTH_VALUES = ['', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

export default function ProfitAnalysis() {
  const { t } = useTranslation("analytics");
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [chartType, setChartType] = useState('pieTypes');
  const [dataType, setDataType] = useState('revenue');
  const [selectedProfitType, setSelectedProfitType] = useState<string | null>(null);

  const { profits, expenses, sectors, sectorLaborCosts, isLoading, alert, setAlert 
  } = useFinancialData(selectedYear, selectedMonth);

  const { overallStats, pieChartData, pieChartTypeData, varietyChartData, tableData, yearlyComparison, availableYears 
  } = useFinancialCalculations(profits, expenses, sectors, sectorLaborCosts, dataType, selectedProfitType);

  const handlePieClick = (data: any) => {
    const fruitTypes = [
      'SPRZEDAZ_JABLEK', 'SPRZEDAZ_GRUSZEK', 'SPRZEDAZ_WISNI', 
      'SPRZEDAZ_SLIW', 'SPRZEDAZ_MALIN', 'SPRZEDAZ_CZERESNI'
    ];
    const isLaborCost = data.name.includes(LABOR_COSTS_KEY);
    
    if (fruitTypes.some(type => data.name.includes(type) || data.name === type) || isLaborCost) {
      setSelectedProfitType(data.name);
    } else {
      setSelectedProfitType(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-6">
        <LoadingState />
      </div>
    );
  }

  const monthLabel = selectedMonth ? t(`common:month.${selectedMonth}`) : '';
  const commonTitleSuffix = `${selectedYear !== 'all' ? t("titleSuffix.year", { year: selectedYear }) : ''}${selectedMonth ? t("titleSuffix.month", { month: monthLabel }) : ''}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center">
            <span className="text-blue-600 dark:text-blue-300 mr-3">📊</span> {t("header.title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            {t("header.subtitle")}
          </p>
        </header>

        {alert.message && (
          <Alert 
            type={alert.type} 
            message={alert.message} 
            onClose={() => setAlert({ type: '', message: '' })} 
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title={t("stats.totalRevenue")}
            value={`${formatCurrency(overallStats.totalProfits)} PLN`}
            icon="💰"
            color="green"
          />
          <StatCard
            title={t("stats.totalExpenses")}
            value={`${formatCurrency(overallStats.totalExpenses)} PLN`}
            subtitle={t("stats.laborSubtitle", { amount: formatCurrency(overallStats.laborCosts) })}
            icon="💸"
            color="red"
          />
          <StatCard
            title={t("stats.profit")}
            value={`${formatCurrency(overallStats.netProfit)} PLN`}
            subtitle={overallStats.netProfit >= 0 ? t("stats.profitPositive") : t("stats.profitNegative")}
            icon="📈"
            color={overallStats.netProfit >= 0 ? 'blue' : 'amber'}
          />
          <StatCard
            title={t("stats.profitMargin")}
            value={`${overallStats.profitMargin}%`}
            icon="🎯"
            color="purple"
          />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-6 flex items-center">
            <span className="mr-3">🎛️</span> {t("controlPanel.title")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t("controlPanel.displayType")}</label>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="pieTypes">{t("chartType.pieTypes")}</option>
                <option value="pie">{t("chartType.pie")}</option>
                <option value="table">{t("chartType.table")}</option>
                <option value="treemap">{t("chartType.treemap")}</option>
                <option value="yearly">{t("chartType.yearly")}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t("controlPanel.year")}</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="all">{t("controlPanel.allYears")}</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t("controlPanel.month")}</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                {MONTH_VALUES.map(v => (
                  <option key={v} value={v}>{v === '' ? t("common:monthAll") : t(`common:month.${v}`)}</option>
                ))}
              </select>
            </div>

            {['pie', 'pieTypes', 'treemap'].includes(chartType) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t("controlPanel.dataType")}</label>
                <select
                  value={dataType}
                  onChange={(e) => setDataType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="revenue">{t("dataTypeOption.revenue")}</option>
                  <option value="expenses">{t("dataTypeOption.expenses")}</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {chartType === 'pie' && (pieChartData.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-6 flex items-center">
              <span className="mr-3">🥧</span> {t("sections.pieBySectors", { kind: t(dataType === 'revenue' ? "sections.kindRevenueGenitive" : "sections.kindExpensesGenitive"), suffix: commonTitleSuffix })}
            </h2>
            <PieChartSection data={pieChartData} />
          </div>
        ) : <NoData icon="📊" title={t("noData.noChart")} />)}

        {chartType === 'pieTypes' && (pieChartTypeData.length > 0 ? (
          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 flex items-center">
                  <span className="mr-3">🔖</span> {t("sections.pieByTypes", { kind: t(dataType === 'revenue' ? "sections.kindRevenueGenitive" : "sections.kindExpensesGenitive"), suffix: commonTitleSuffix })}
                </h2>
                {selectedProfitType && (
                  <button
                    onClick={() => setSelectedProfitType(null)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 dark:text-gray-100 rounded-lg transition-colors text-sm font-medium"
                  >
                    {t("detailView.close")}
                  </button>
                )}
              </div>

              <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                <Trans i18nKey="detailView.hint" ns="analytics" components={{ 1: <strong /> }} />
              </p>

              <div className={`grid ${selectedProfitType ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'} gap-8`}>
                <PieChartSection
                  data={pieChartTypeData}
                  onSegmentClick={handlePieClick}
                  selectedSegment={selectedProfitType}
                />

                {selectedProfitType && !selectedProfitType.includes(LABOR_COSTS_KEY) && varietyChartData.length > 0 && (
                  <VarietyPieSection
                    title={t("detailView.varietyDistribution", { type: selectedProfitType })}
                    data={varietyChartData}
                  />
                )}

                {selectedProfitType && selectedProfitType.includes(LABOR_COSTS_KEY) && (
                  (() => {
                    const laborBySectorData = Object.values(sectorLaborCosts)
                      .filter((l: any) => l.totalCost > 0)
                      .map((l: any) => ({
                        name: sectors.find(s => s.id === l.sectorId)?.description || t("fallback.otherSector"),
                        value: l.totalCost,
                        entries: l.totalEntries,
                        paidCost: l.paidCost,
                        unpaidCost: l.unpaidCost
                      }));

                    return laborBySectorData.length > 0
                      ? <LaborPieSection title={t("detailView.laborDistribution")} data={laborBySectorData} />
                      : <NoData icon="👥" title={t("noData.noLaborData")} />;
                  })()
                )}

                {selectedProfitType && !selectedProfitType.includes(LABOR_COSTS_KEY) && varietyChartData.length === 0 && (
                  <NoData icon="🍎" title={t("noData.noVarietyData", { type: selectedProfitType })} />
                )}
              </div>
            </div>
          </div>
        ) : <NoData icon="📊" title={t("noData.noChart")} />)}

        {chartType === 'table' && (tableData.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-6 flex items-center">
              <span className="mr-3">📋</span> {t("sections.table", { suffix: commonTitleSuffix })}
            </h2>
            <ProfitTableSection
              data={tableData}
              sectors={sectors}
              sectorLaborCosts={sectorLaborCosts}
            />
          </div>
        ) : <NoData icon="📋" title={t("noData.noTable")} />)}

        {chartType === 'treemap' && (pieChartData.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-6 flex items-center">
              <span className="mr-3">🗺️</span> {t("sections.treemap", { kind: t(dataType === 'revenue' ? "sections.kindRevenue" : "sections.kindExpenses"), suffix: commonTitleSuffix })}
            </h2>
            <TreemapSection data={pieChartData} />
          </div>
        ) : <NoData icon="🗺️" title={t("noData.noMap")} />)}

        {chartType === 'yearly' && (yearlyComparison.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-6 flex items-center">
              <span className="mr-3">📈</span> {t("sections.yearly")}
            </h2>
            <YearlyChartSection data={yearlyComparison} />
          </div>
        ) : <NoData icon="📈" title={t("noData.noChart")} />)}

        {yearlyComparison.length === 0 && !['pie', 'pieTypes', 'table', 'treemap', 'yearly'].includes(chartType) && (
          <NoData icon="📊" title={t("noData.noAnalysisData")} />
        )}
      </div>
    </div>
  );
}

const NoData = ({ icon, title }: any) => {
  const { t } = useTranslation("analytics");
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700 mb-8 text-center">
      <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-3">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400">{t("noData.periodHint")}</p>
    </div>
  );
};