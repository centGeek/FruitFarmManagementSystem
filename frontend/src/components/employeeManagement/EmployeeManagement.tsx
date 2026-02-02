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
    const {
        employees, allEmployees, searchTerm, setSearchTerm, showArchived, setShowArchived,
        isModalOpen, isFinanceModalOpen, selectedEmployee, isLoading, alert,
        filteredEmployees, activeCount, archivedCount,
        handleSaveEmployee, toggleEmployeeStatus, openModal, closeModal, handleFinanceDetails, closeFinanceModal, handleFinanceSave, closeAlert
    } = useEmployeeManagement();

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-50 to-lime-100 p-6 font-sans">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
                        <span className="text-red-500 mr-3">🍎</span> Zarządzaj pracownikami
                    </h1>
                    <p className="text-gray-600 text-lg flex items-center">Przeglądaj, dodawaj i zarządzaj kontami użytkowników. Gotowi do zbiorów! 🍎</p>
                </header>
                
                {alert.message && <Alert type={alert.type} message={alert.message} onClose={closeAlert} />}

                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-green-100">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative flex-1 w-full md:max-w-md">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                            <input type="text" placeholder="Szukaj: imię, email, numer telefonu..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow" />
                        </div>

                        <div className="flex items-center space-x-4 w-full md:w-auto justify-end">
                            <label className="flex items-center space-x-3 cursor-pointer bg-green-50 px-4 py-3 rounded-xl hover:bg-green-100 transition-colors flex-shrink-0">
                                <input type="checkbox" checked={showArchived} onChange={(e) => { setShowArchived(e.target.checked); setSearchTerm(''); }} className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded" />
                                <span className="text-sm font-medium text-gray-700">Pokaż Zarchiwizowanych 📦</span>
                            </label>
                            
                            <button onClick={() => openModal()} className="bg-gradient-to-r from-green-600 to-lime-700 hover:from-green-700 hover:to-lime-800 text-white px-5 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl flex-shrink-0">
                                <span className="text-xl">+</span><span className="hidden sm:inline">Dodaj Pracownika</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                    <StatCard count={activeCount} label="Aktywni Pracownicy" color="green" />
                    <StatCard count={archivedCount} label="Zarchiwizowani" color="red" />
                    <StatCard count={filteredEmployees.length} label="Wyświetlani w Filtrze" color="lime" />
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center">{showArchived ? 'Zarchiwizowani pracownicy 🧑‍🌾' : 'Aktywny Zespół 🧑‍🌾'}</h2>
                        <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-lg font-medium">Wyświetlono: {filteredEmployees.length} z {employees.length}</div>
                    </div>
                    
                    {isLoading ? <LoadingState /> : filteredEmployees.length === 0 ? (
                        <EmptyState searchTerm={searchTerm} employeesCount={allEmployees.length} showArchived={showArchived} onAddClick={openModal} />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredEmployees.map((employee) => (
                                <EmployeeCard key={employee.id} employee={employee} onEdit={openModal} onArchive={(id: number) => toggleEmployeeStatus(id, false)} onRestore={(id: number) => toggleEmployeeStatus(id, true)} onFinanceDetails={handleFinanceDetails} />
                            ))}
                        </div>
                    )}
                </div>

                <Modal isOpen={isModalOpen} onClose={closeModal} title={<span><span className="mr-2 text-green-600">🌱</span>{selectedEmployee ? 'Edytuj Pracownika' : 'Dodaj Nowego Pracownika'} ✨</span>} headerColor="bg-green-50">
                    <EmployeeForm employee={selectedEmployee} onSave={handleSaveEmployee} onCancel={closeModal} isLoading={isLoading} />
                </Modal>

                <EmployeeFinanceModal isOpen={isFinanceModalOpen} onClose={closeFinanceModal} employee={selectedEmployee} onWorkDetailsSave={handleFinanceSave} />
            </div>
        </div>
    );
}