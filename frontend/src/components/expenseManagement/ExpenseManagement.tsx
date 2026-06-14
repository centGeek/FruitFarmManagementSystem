import { useTranslation } from "react-i18next";
import { Alert } from "../../utils/common";
import { MONTH_OPTIONS } from '../../utils/common';
import { useExpenseManagement, EXPENSE_TYPES, PAYMENT_STATUS_OPTIONS, generateYearOptions } from './ExpenseManagementHooks';
import { StatCard, ExpenseCard, LoadingState, EmptyState, Modal, ExpenseForm, Pagination } from './ExpenseManagementComponents';

export default function ExpenseManagement() {
    const { t } = useTranslation("expenseManagement");
    const {allExpenses, sectors,
        selectedType, setSelectedType, selectedPaymentStatus, setSelectedPaymentStatus,
        selectedSectorId, setSelectedSectorId, selectedYear, setSelectedYear, selectedMonth, setSelectedMonth,
        searchTerm, setSearchTerm, currentPage, totalPages, isModalOpen, selectedExpense, isLoading, alert,
        filteredStats, selectedSectorName,  paginatedExpenses,handleSaveExpense,
        handleDeleteExpense, openModal, closeModal, handlePageChange, closeAlert
    } = useExpenseManagement();

    const hasActiveFilters = selectedType || selectedPaymentStatus || selectedSectorId || selectedYear || selectedMonth || searchTerm;

    const paymentStatusLabel = (value: string) => value === '' ? t('paymentStatus.all') : t(`paymentStatus.${value}`);
    const monthLabel = (value: string) => value === '' ? t('common:monthAll') : t(`common:month.${value}`);

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-50 to-orange-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-6 font-sans">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                        <span className="text-red-600 mr-3">💰</span> {t('header.title')}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 text-lg flex items-center">
                        {t('header.subtitle')}
                    </p>
                </header>

                {alert.message && (
                    <Alert
                        type={alert.type}
                        message={alert.message}
                        onClose={closeAlert}
                    />
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard
                        amount={filteredStats.total}
                        label={hasActiveFilters ? (selectedSectorId ? t('stats.totalFiltered', { sector: selectedSectorName }) : t('stats.totalFilteredNoSector')) : t('stats.total')}
                        color="blue"
                    />
                    <StatCard
                        amount={filteredStats.paid}
                        label={hasActiveFilters ? t('stats.paidFiltered') : t('stats.paid')}
                        color="green"
                    />
                    <StatCard
                        amount={filteredStats.unpaid}
                        label={hasActiveFilters ? t('stats.unpaidFiltered') : t('stats.unpaid')}
                        color="red"
                    />
                </div>

                {hasActiveFilters && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-2xl p-4 mb-6 shadow-md">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-purple-900 dark:text-purple-300 mb-2 flex items-center">
                                    <span className="mr-2">🔍</span> {t('activeFilters.title')}
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {selectedType && <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">{t('activeFilters.type', { value: t(`expenseType.${selectedType}`) })}</span>}
                                    {selectedPaymentStatus && <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">{t('activeFilters.status', { value: paymentStatusLabel(selectedPaymentStatus) })}</span>}
                                    {selectedSectorId && selectedSectorName && <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">{t('activeFilters.sector', { value: selectedSectorName })}</span>}
                                    {selectedYear && <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">{t('activeFilters.year', { value: selectedYear })}</span>}
                                    {selectedMonth && <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">{t('activeFilters.month', { value: monthLabel(selectedMonth) })}</span>}
                                    {searchTerm && <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">{t('activeFilters.search', { value: searchTerm })}</span>}
                                </div>
                            </div>
                            <button onClick={() => {
                                setSelectedType(''); setSelectedPaymentStatus(''); setSelectedSectorId('');
                                setSelectedYear(''); setSelectedMonth(''); setSearchTerm('');
                            }} className="ml-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors text-sm whitespace-nowrap">
                                {t('activeFilters.clear')}
                            </button>
                        </div>
                    </div>
                )}

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-red-100 dark:border-red-800 mb-8">
                    <div className="p-6 space-y-6">
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">{t('search.label')}</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 text-lg">🔍</span>
                                <input
                                    type="text"
                                    placeholder={t('search.placeholder')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-gray-50 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 focus:bg-white dark:focus:bg-gray-700"
                                />
                                {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" title={t('search.clearTitle')}>❌</button>}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">{t('filters.typeLabel')}</label>
                                    <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors shadow-sm">
                                        <option value="">{t('filters.allTypes')}</option>
                                        {EXPENSE_TYPES.map(item => <option key={item.value} value={item.value}>{t(`expenseType.${item.value}`)}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">{t('filters.statusLabel')}</label>
                                    <select value={selectedPaymentStatus} onChange={(e) => setSelectedPaymentStatus(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors shadow-sm">
                                        {PAYMENT_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{paymentStatusLabel(o.value)}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">{t('filters.sectorLabel')}</label>
                                    <select value={selectedSectorId} onChange={(e) => setSelectedSectorId(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors shadow-sm">
                                        <option value="">{t('filters.allSectors')}</option>
                                        {sectors.map((sector) => (
                                            <option key={sector.id} value={sector.id}>
                                                {sector.description || t('sectorFallback', { id: sector.id })}{sector.plantType && ` - ${sector.plantType}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">{t('filters.yearLabel')}</label>
                                    <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors shadow-sm">
                                        <option value="">{t('filters.allYears')}</option>
                                        {generateYearOptions().map(year => <option key={year} value={year}>{year}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">{t('filters.monthLabel')}</label>
                                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors shadow-sm">
                                        {MONTH_OPTIONS.map(o => <option key={o.value} value={o.value}>{monthLabel(o.value)}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                            <button onClick={() => openModal()} className="w-full md:w-auto bg-gradient-to-r from-red-600 to-orange-700 hover:from-red-700 hover:to-orange-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl group">
                                <span className="text-xl group-hover:scale-110 transition-transform">+</span>
                                <span>{t('addExpense')}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 flex items-center">{t('list.title')}</h2>
                        <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg font-medium">
                            {t('list.shown', { from: Math.min((currentPage - 1) * 15 + 1, filteredStats.total > 0 ? 1 : 0), to: Math.min(currentPage * 15, paginatedExpenses.length + (currentPage-1)*15) })}{allExpenses.length !== paginatedExpenses.length && t('list.filteredSuffix')}
                        </div>
                    </div>

                    {isLoading ? (
                        <LoadingState />
                    ) : paginatedExpenses.length === 0 ? (
                        <EmptyState
                            searchTerm={searchTerm || selectedType || selectedPaymentStatus || selectedSectorId || selectedYear}
                            expensesCount={allExpenses.length}
                            onAddClick={openModal}
                        />
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {paginatedExpenses.map((expense) => (
                                    <ExpenseCard
                                        key={expense.id}
                                        expense={expense}
                                        onEdit={openModal}
                                        onDelete={handleDeleteExpense}
                                        sectors={sectors}
                                    />
                                ))}
                            </div>
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                            />
                        </>
                    )}
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={selectedExpense ? t('modal.editTitle') : t('modal.addTitle')}
            >
                <ExpenseForm
                    expense={selectedExpense}
                    onSave={handleSaveExpense}
                    onCancel={closeModal}
                    isLoading={isLoading}
                    sectors={sectors}
                />
            </Modal>
        </div>
    );
}
