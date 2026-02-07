import { useState } from 'react';
import { Alert, formatCurrency } from "../../utils/common";
import { useFinancialData, useFinancialCalculations } from './ProfitAnalysisHooks';
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

const MONTH_OPTIONS = [
  { value: '', label: 'Wszystkie miesiące 📅' },
  { value: '1', label: 'Styczeń' }, { value: '2', label: 'Luty' }, 
  { value: '3', label: 'Marzec' }, { value: '4', label: 'Kwiecień' }, 
  { value: '5', label: 'Maj' }, { value: '6', label: 'Czerwiec' },
  { value: '7', label: 'Lipiec' }, { value: '8', label: 'Sierpień' }, 
  { value: '9', label: 'Wrzesień' }, { value: '10', label: 'Październik' }, 
  { value: '11', label: 'Listopad' }, { value: '12', label: 'Grudzień' }
];

export default function ProfitAnalysis() {
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

  const monthLabel = selectedMonth && MONTH_OPTIONS.find(m => m.value === selectedMonth)?.label;
  const commonTitleSuffix = `${selectedYear !== 'all' ? ` - Rok ${selectedYear}` : ''}${selectedMonth ? ` - ${monthLabel}` : ''}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
            <span className="text-blue-600 mr-3">📊</span> Analiza Finansowa Gospodarstwa
          </h1>
          <p className="text-gray-600 text-lg">
            Szczegółowa analiza przychodów, wydatków i rentowności
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

        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">🎛️</span> Panel Kontrolny - Wybierz Typ Analizy
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Typ wyświetlania</label>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rok 📅</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Miesiąc 📆</label>
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)} 
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                {MONTH_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {['pie', 'pieTypes', 'treemap'].includes(chartType) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Typ danych</label>
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

        {chartType === 'pie' && (pieChartData.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="mr-3">🥧</span> Rozkład {dataType === 'revenue' ? 'Przychodów' : 'Kosztów'} według Sektorów {commonTitleSuffix}
            </h2>
            <PieChartSection data={pieChartData} />
          </div>
        ) : <NoData icon="📊" title="Brak Wykresu" />)}

        {chartType === 'pieTypes' && (pieChartTypeData.length > 0 ? (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <span className="mr-3">🔖</span> Rozkład {dataType === 'revenue' ? 'Przychodów' : 'Kosztów'} według Typów {commonTitleSuffix}
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
              
              <div className={`grid ${selectedProfitType ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'} gap-8`}>
                <PieChartSection 
                  data={pieChartTypeData} 
                  onSegmentClick={handlePieClick} 
                  selectedSegment={selectedProfitType} 
                />
                
                {selectedProfitType && !selectedProfitType.includes('Koszty pracownicze') && varietyChartData.length > 0 && (
                  <VarietyPieSection 
                    title={`Rozkład odmian: ${selectedProfitType}`} 
                    data={varietyChartData} 
                  />
                )}
                
                {selectedProfitType && selectedProfitType.includes('Koszty pracownicze') && (
                  (() => {
                    const laborBySectorData = Object.values(sectorLaborCosts)
                      .filter((l: any) => l.totalCost > 0)
                      .map((l: any) => ({
                        name: sectors.find(s => s.id === l.sectorId)?.description || 'Inne',
                        value: l.totalCost,
                        entries: l.totalEntries, 
                        paidCost: l.paidCost, 
                        unpaidCost: l.unpaidCost
                      }));
                    
                    return laborBySectorData.length > 0 
                      ? <LaborPieSection title="Rozkład kosztów pracowniczych" data={laborBySectorData} /> 
                      : <NoData icon="👥" title="Brak danych" />;
                  })()
                )}
                
                {selectedProfitType && !selectedProfitType.includes('Koszty pracownicze') && varietyChartData.length === 0 && (
                  <NoData icon="🍎" title={`Brak danych o odmianach dla ${selectedProfitType}`} />
                )}
              </div>
            </div>
          </div>
        ) : <NoData icon="📊" title="Brak Wykresu" />)}

        {chartType === 'table' && (tableData.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="mr-3">📋</span> Tabela Rentowności Sektorów {commonTitleSuffix}
            </h2>
            <ProfitTableSection 
              data={tableData} 
              sectors={sectors} 
              sectorLaborCosts={sectorLaborCosts} 
            />
          </div>
        ) : <NoData icon="📋" title="Brak Tabeli" />)}

        {chartType === 'treemap' && (pieChartData.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="mr-3">🗺️</span> Mapa Drzewa - {dataType === 'revenue' ? 'Przychody' : 'Koszty'} {commonTitleSuffix}
            </h2>
            <TreemapSection data={pieChartData} />
          </div>
        ) : <NoData icon="🗺️" title="Brak Mapy" />)}

        {chartType === 'yearly' && (yearlyComparison.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="mr-3">📈</span> Analiza Rok do Roku
            </h2>
            <YearlyChartSection data={yearlyComparison} />
          </div>
        ) : <NoData icon="📈" title="Brak Wykresu" />)}

        {yearlyComparison.length === 0 && !['pie', 'pieTypes', 'table', 'treemap', 'yearly'].includes(chartType) && (
          <NoData icon="📊" title="Brak danych do analizy" />
        )}
      </div>
    </div>
  );
}

const NoData = ({ icon, title }: any) => (
  <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 mb-8 text-center">
    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">
      {icon}
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-500">Brak danych dla wybranego okresu i filtrów.</p>
  </div>
);