import { useTranslation } from "react-i18next";
import { Alert } from "../../utils/common";
import { useEmployeeManagement } from './EmployeeManagementHooks';
import { 
    StatCard, 
    EmployeeCard, 
    LoadingState, 
    EmptyState, 
    Modal, 
    EmployeeForm, 
    EmployeeFinanceModal 
} from './EmployeeManagementComponents';

export default function EmployeeManagement() {
    const { t } = useTranslation("employeeManagement");
    const {
        employees, allEmployees, searchTerm, 
        setSearchTerm, showArchived, setShowArchived,isModalOpen, isFinanceModalOpen, 
        selectedEmployee, isLoading, alert, filteredEmployees, activeCount, 
        archivedCount,handleSaveEmployee, toggleEmployeeStatus, openModal, closeModal, 
        handleFinanceDetails, closeFinanceModal, handleFinanceSave, closeAlert} = useEmployeeManagement();

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-50 to-lime-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-6 font-sans">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center">
                        <span className="text-red-500 mr-3">🍎</span> {t("header.title")}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 text-lg flex items-center">
                        {t("header.subtitle")}
                    </p>
                </header>
                
                {alert.message && (
                    <Alert 
                        type={alert.type} 
                        message={alert.message} 
                        onClose={closeAlert} 
                    />
                )}

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 border border-green-100 dark:border-green-800">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative flex-1 w-full md:max-w-md">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500">
                                🔍
                            </span>
                            <input
                                type="text"
                                placeholder={t("searchPlaceholder")}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)} 
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow"
                            />
                        </div>

                        <div className="flex items-center space-x-4 w-full md:w-auto justify-end">
                            <label className="flex items-center space-x-3 cursor-pointer bg-green-50 dark:bg-green-900/20 px-4 py-3 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors flex-shrink-0">
                                <input 
                                    type="checkbox" 
                                    checked={showArchived} 
                                    onChange={(e) => { 
                                        setShowArchived(e.target.checked); 
                                        setSearchTerm(''); 
                                    }} 
                                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
                                />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                    {t("showArchived")}
                                </span>
                            </label>
                            
                            <button 
                                onClick={() => openModal()} 
                                className="bg-gradient-to-r from-green-600 to-lime-700 hover:from-green-700 hover:to-lime-800 text-white px-5 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl flex-shrink-0"
                            >
                                <span className="text-xl">+</span>
                                <span className="hidden sm:inline">{t("addEmployee")}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                    <StatCard
                        count={activeCount}
                        label={t("stats.active")}
                        color="green"
                    />
                    <StatCard
                        count={archivedCount}
                        label={t("stats.archived")}
                        color="red"
                    />
                    <StatCard
                        count={filteredEmployees.length}
                        label={t("stats.filtered")}
                        color="lime"
                    />
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 flex items-center">
                            {showArchived ? t("list.archivedTitle") : t("list.activeTitle")}
                        </h2>
                        <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg font-medium">
                            {t("list.shownCount", { shown: filteredEmployees.length, total: employees.length })}
                        </div>
                    </div>
                    
                    {isLoading ? (
                        <LoadingState />
                    ) : filteredEmployees.length === 0 ? (
                        <EmptyState 
                            searchTerm={searchTerm} 
                            employeesCount={allEmployees.length} 
                            showArchived={showArchived} 
                            onAddClick={openModal} 
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredEmployees.map((employee) => (
                                <EmployeeCard 
                                    key={employee.id} 
                                    employee={employee} 
                                    onEdit={openModal} 
                                    onArchive={(id) => toggleEmployeeStatus(id, false)} 
                                    onRestore={(id) => toggleEmployeeStatus(id, true)} 
                                    onFinanceDetails={handleFinanceDetails} 
                                />
                            ))}
                        </div>
                    )}
                </div>

                <Modal 
                    isOpen={isModalOpen} 
                    onClose={closeModal} 
                    title={
                        <span>
                            <span className="mr-2 text-green-600 dark:text-green-300">🌱</span>
                            {selectedEmployee ? t("modal.editTitle") : t("modal.addTitle")} ✨
                        </span>
                    }
                    headerColor="bg-green-50"
                >
                    <EmployeeForm 
                        employee={selectedEmployee} 
                        onSave={handleSaveEmployee} 
                        onCancel={closeModal} 
                        isLoading={isLoading} 
                    />
                </Modal>

                <EmployeeFinanceModal 
                    isOpen={isFinanceModalOpen} 
                    onClose={closeFinanceModal} 
                    employee={selectedEmployee} 
                    onWorkDetailsSave={handleFinanceSave} 
                />
            </div>
        </div>
    );
}