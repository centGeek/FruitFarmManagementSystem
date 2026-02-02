import { Alert, formatCurrency } from "../../utils/common";
import { 
    useExpenseManagement, 
    EXPENSE_TYPES, 
    PAYMENT_STATUS_OPTIONS, 
    MONTH_OPTIONS, 
    generateYearOptions 
} from './ExpenseManagementHooks';
import { 
    StatCard, 
    ExpenseCard, 
    LoadingState, 
    EmptyState, 
    Modal, 
    ExpenseForm, 
    Pagination 
} from './ExpenseManagementComponents';

export default function ExpenseManagement() {
    const {
        allExpenses, sectors, selectedType, setSelectedType, selectedPaymentStatus, setSelectedPaymentStatus,
        selectedSectorId, setSelectedSectorId, selectedYear, setSelectedYear, selectedMonth, setSelectedMonth,
        searchTerm, setSearchTerm, currentPage, totalPages, isModalOpen, selectedExpense, isLoading, alert,
        sectorLaborCosts, advancesSum, isLoadingLaborCosts, filteredStats, selectedSectorName, paginatedExpenses,
        handleSaveExpense, handleDeleteExpense, openModal, closeModal, handlePageChange, closeAlert
    } = useExpenseManagement();

    const hasActiveFilters = selectedType || selectedPaymentStatus || selectedSectorId || selectedYear || selectedMonth || searchTerm;

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-50 to-orange-100 p-6 font-sans">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2"><span className="text-red-600 mr-3">💰</span> Zarządzanie Wydatkami</h1>
                    <p className="text-gray-600 text-lg flex items-center">Monitoruj koszty paliwa, maszyn i zaopatrzenia. 💸</p>
                </header>
                
                {alert.message && <Alert type={alert.type} message={alert.message} onClose={closeAlert} />}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard amount={filteredStats.total} label={hasActiveFilters ? "Suma Przefiltrowanych (niepracownicze)" : "Całkowite Wydatki (niepracownicze)"} color="blue" />
                    <StatCard amount={filteredStats.paid} label={hasActiveFilters ? "Opłacone (Przefiltrowane, niepracownicze)" : "Wydatki Opłacone (niepracownicze)"} color="green" />
                    <StatCard amount={filteredStats.unpaid} label={hasActiveFilters ? "Nieopłacone (Przefiltrowane, niepracownicze)" : "Wydatki Nieopłacone (niepracownicze)"} color="red" />
                    
                    {isLoadingLaborCosts ? (
                        <div className="col-span-full bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
                            <div className="text-center">
                                <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-gray-500 font-medium">Obliczam koszty pracowników... 🔄</p>
                            </div>
                        </div>
                    ) : sectorLaborCosts ? (
                        <>
                            <div className="col-span-full md:col-span-1">
                                <StatCard amount={sectorLaborCosts.sectorLaborCost || 0} label={`Łączne koszty pracownicze - ${sectorLaborCosts.sectorName || 'Wszystkie'}`} color="purple" />
                            </div>
                            <div className="col-span-full md:col-span-1">
                                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl">✅</div>
                                        <div className="flex-1">
                                            <p className="text-3xl font-extrabold text-gray-900">{formatCurrency((sectorLaborCosts.paidLaborCost || 0) + (advancesSum || 0))} PLN</p>
                                            <p className="text-sm text-gray-500">Koszty pracownicze: Opłacone ({sectorLaborCosts.paidEntries || 0} {sectorLaborCosts.paidEntries === 1 ? 'wpis' : 'wpisów'})</p>
                                            {(advancesSum || 0) > 0 && <p className="text-xs text-green-600 font-medium mt-1">💰 w tym zaliczki: +{formatCurrency(advancesSum)} PLN</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-full md:col-span-1">
                                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl">⚠️</div>
                                        <div className="flex-1">
                                            {(() => {
                                                const unpaidAfterAdvances = (sectorLaborCosts.unpaidLaborCost || 0) - (advancesSum || 0);
                                                const isNegative = unpaidAfterAdvances < 0;
                                                return (
                                                    <>
                                                        <p className={`text-3xl font-extrabold ${isNegative ? 'text-green-600' : 'text-gray-900'}`}>
                                                            {isNegative ? '-' : ''}{formatCurrency(Math.abs(unpaidAfterAdvances))} PLN
                                                        </p>
                                                        <p className="text-sm text-gray-500">Koszty pracownicze: Nieopłacone ({sectorLaborCosts.unpaidEntries || 0} {sectorLaborCosts.unpaidEntries === 1 ? 'wpis' : 'wpisów'})</p>
                                                        {(advancesSum || 0) > 0 && <p className="text-xs text-orange-600 font-medium mt-1">⚡ w tym pomniejszone o zaliczki: -{formatCurrency(advancesSum)} PLN</p>}
                                                        {isNegative && <p className="text-xs text-green-600 font-semibold mt-1">💰 Nadpłata zaliczek</p>}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : null}
                </div>

                {hasActiveFilters && (
                    <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-4 mb-6 shadow-md">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-purple-900 mb-2 flex items-center"><span className="mr-2">🔍</span> Aktywne Filtry</h3>
                                <div className="flex flex-wrap gap-2">
                                    {selectedType && <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">Typ: {EXPENSE_TYPES.find(t => t.value === selectedType)?.label}</span>}
                                    {selectedPaymentStatus && <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">Status: {PAYMENT_STATUS_OPTIONS.find(o => o.value === selectedPaymentStatus)?.label}</span>}
                                    {selectedSectorId && selectedSectorName && <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">🗺️ Sektor: {selectedSectorName}</span>}
                                    {selectedYear && <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">📅 Rok: {selectedYear}</span>}
                                    {selectedMonth && <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">📆 Miesiąc: {MONTH_OPTIONS.find(m => m.value === selectedMonth)?.label}</span>}
                                    {searchTerm && <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">Szukaj: "{searchTerm}"</span>}
                                </div>
                            </div>
                            <button onClick={() => {
                                setSelectedType(''); setSelectedPaymentStatus(''); setSelectedSectorId('');
                                setSelectedYear(''); setSelectedMonth(''); setSearchTerm('');
                            }} className="ml-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors text-sm whitespace-nowrap">Wyczyść Filtry</button>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-lg border border-red-100 mb-8">
                    <div className="p-6 space-y-6">
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">🔍 Wyszukiwanie w wydatkach</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">🔍</span>
                                <input type="text" placeholder="Wpisz opis, kwotę, datę lub typ wydatku..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-gray-50 focus:bg-white" />
                                {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" title="Wyczyść wyszukiwanie">❌</button>}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide">Typ wydatku</label>
                                    <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors shadow-sm">
                                        <option value="">🛠️ Wszystkie typy</option>
                                        {EXPENSE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide">Status płatności</label>
                                    <select value={selectedPaymentStatus} onChange={(e) => setSelectedPaymentStatus(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors shadow-sm">
                                        {PAYMENT_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide">Sektor 🗺️</label>
                                    <select value={selectedSectorId} onChange={(e) => setSelectedSectorId(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors shadow-sm">
                                        <option value="">📋 Wszystkie sektory</option>
                                        {sectors.map((sector: any) => <option key={sector.id} value={sector.id}>{sector.description || `Sektor ${sector.id}`}{sector.plantType && ` - ${sector.plantType}`}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide">Rok 📅</label>
                                    <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors shadow-sm">
                                        <option value="">📆 Wszystkie lata</option>
                                        {generateYearOptions().map(year => <option key={year} value={year}>{year}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide">Miesiąc 📆</label>
                                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors shadow-sm">
                                        {MONTH_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <button onClick={() => openModal()} className="w-full md:w-auto bg-gradient-to-r from-red-600 to-orange-700 hover:from-red-700 hover:to-orange-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl group">
                                <span className="text-xl group-hover:scale-110 transition-transform">+</span>
                                <span>Dodaj Nowy Wydatek</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center">Lista Wydatków</h2>
                        <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-lg font-medium">
                            Wyświetlono: {Math.min((currentPage - 1) * 15 + 1, filteredStats.total > 0 ? filteredStats.total : 0)}-{Math.min(currentPage * 15, allExpenses.length)} z {allExpenses.length} {allExpenses.length !== paginatedExpenses.length && ` (przefiltrowano)`}
                        </div>
                    </div>
                    
                    {isLoading ? <LoadingState /> : paginatedExpenses.length === 0 ? (
                        <EmptyState searchTerm={searchTerm || selectedType || selectedPaymentStatus || selectedSectorId || selectedYear} expensesCount={allExpenses.length} onAddClick={openModal} />
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {paginatedExpenses.map((expense: any) => (
                                    <ExpenseCard key={expense.id} expense={expense} onEdit={openModal} onDelete={handleDeleteExpense} sectors={sectors} />
                                ))}
                            </div>
                            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                        </>
                    )}
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={closeModal} title={selectedExpense ? 'Edytuj Wydatek' : 'Dodaj Nowy Wydatek'}>
                <ExpenseForm expense={selectedExpense} onSave={handleSaveExpense} onCancel={closeModal} isLoading={isLoading} sectors={sectors} />
            </Modal>
        </div>
    );
}