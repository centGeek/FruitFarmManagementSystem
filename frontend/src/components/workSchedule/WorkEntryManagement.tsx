import { Calendar, Clock, Users, DollarSign } from 'lucide-react';
import { useTranslation } from "react-i18next";
import { Alert } from "../../utils/common";
import { useWorkEntryManagement } from './WorkEntryManagementHooks';
import { 
    StatCard, WeekCalendar, Modal, DailyWorkForm, 
    EventDetailsModal, PayConfirmationModal, AdvancePayModal 
} from './WorkEntryManagementComponents';
import ErrorPage from './../ErrorPage';

export default function WorkEntryManagement() {
    const { t } = useTranslation("workSchedule");
    const {
        workEntries, employees, sectors, currentDate, setCurrentDate, isModalOpen, setIsModalOpen, selectedEntry,
        bulkAssignDate, setBulkAssignDate, isLoading, alert, closeAlert, criticalError, setCriticalError,
        isEditModalOpen, editingEntry, setEditingEntry,
        isPayAllModalOpen, selectedEmployeeForPayment, paymentModalType,
        isAdvancePayModalOpen, selectedEmployeeForAdvance,
        stats, employeeEntriesForPayment,
        handleOpenBulkAssignModal, handleOpenDetailsModal, handleCloseModal, handleClosePayAllModal, handleCloseAdvancePayModal,
        handleSaveBulkEntries, handleEditEntry, handleDeleteEntry, handleTogglePaid, handleConfirmPayment, handleConfirmAdvancePayment,
        handleOpenEditModal, handleOpenPayAllModal, handleOpenPayAllMonthModal, handleOpenAdvancePayModal
    } = useWorkEntryManagement();

    if (criticalError) {
        return <ErrorPage error={criticalError} onRetry={() => setCriticalError(null)} onGoBack={() => setCriticalError(null)} onGoHome={() => { setCriticalError(null); setIsModalOpen(false); setBulkAssignDate(null); }} />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-lime-50 to-green-100 p-6 font-sans">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center"><Calendar className="text-green-600 mr-3" size={40} /> {t("header.title")}</h1>
                    <p className="text-gray-600 text-lg">{t("header.subtitle")}</p>
                </header>

                {alert.message && <Alert type={alert.type} message={alert.message} onClose={closeAlert} />}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard icon={Calendar} count={stats.total} label={t("stats.total")} color="green" />
                    <StatCard icon={Clock} count={stats.unpaid} label={t("stats.unpaid")} color="red" />
                    <StatCard icon={Users} count={stats.paid} label={t("stats.paid")} color="purple" />
                    <StatCard icon={DollarSign} count={stats.totalSalaryWeek} label={t("stats.totalSalaryWeek")} color="indigo" isCurrency={true} />
                </div>
                
                <div className="mb-8">
                    <WeekCalendar
                        workEntries={workEntries}
                        onAddClick={handleOpenBulkAssignModal}
                        onEventClick={handleOpenDetailsModal}
                        onTogglePaid={handleTogglePaid} 
                        currentDate={currentDate}
                        onDateChange={setCurrentDate}
                    />
                </div>

                <Modal isOpen={isModalOpen && !!bulkAssignDate} onClose={() => handleCloseModal()} title={t("bulkModal.title", { date: new Date(bulkAssignDate || '').toLocaleDateString() })} size="xlarge">
                    <DailyWorkForm date={bulkAssignDate} employees={employees} sectors={sectors} onSave={handleSaveBulkEntries} onCancel={handleCloseModal} isLoading={isLoading} />
                </Modal>
                
                {isEditModalOpen && editingEntry && (
                    <Modal isOpen={isEditModalOpen} onClose={() => handleCloseModal()} title={t("editModal.title", { name: editingEntry.user?.name, surname: editingEntry.user?.surname })} size="large">
                        <div className="space-y-4">
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {editingEntry.user?.isPaidHourly !== false ? (
                                    <div><label className="text-sm font-medium text-gray-700 mb-1 block">{t("fields.hours")}</label><input type="number" step="0.5" min="0" max="24" value={editingEntry.duration || ''} onChange={(e) => setEditingEntry((prev: any) => ({ ...prev, duration: parseFloat(e.target.value) }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" /></div>
                                ) : (
                                    <>
                                        <div><label className="text-sm font-medium text-gray-700 mb-1 block">{t("fields.hours")}</label><input type="number" step="0.5" min="0" max="24" value={editingEntry.duration || ''} onChange={(e) => setEditingEntry((prev: any) => ({ ...prev, duration: parseFloat(e.target.value) }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" /></div>
                                        <div><label className="text-sm font-medium text-gray-700 mb-1 block">{t("fields.kilograms")}</label><input type="number" step="0.1" min="0" value={editingEntry.kilogramsPicked || ''} onChange={(e) => setEditingEntry((prev: any) => ({ ...prev, kilogramsPicked: parseFloat(e.target.value) }))} className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500" /></div>
                                    </>
                                )}
                                <div><label className="text-sm font-medium text-gray-700 mb-1 block">{t("fields.salary")}</label><p className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-800 font-bold">{t("currency.zl", { value: parseFloat(editingEntry.daySalary).toFixed(2) })}</p></div>
                                <div><label className="text-sm font-medium text-gray-700 mb-1 block">{t("fields.sector")}</label><select value={editingEntry.sector?.id || ''} onChange={(e) => { const sector = sectors.find((s: any) => s.id === parseInt(e.target.value)); setEditingEntry((prev: any) => ({ ...prev, sector: sector || null })); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"><option value="">{t("fields.noSector")}</option>{sectors.map((s: any) => <option key={s.id} value={s.id}>{s.description} ({s.plantType})</option>)}</select></div>
                            </div>
                            <div><label className="text-sm font-medium text-gray-700 mb-1 block">{t("fields.workType")}</label><select value={editingEntry.workType || ''} onChange={(e) => setEditingEntry((prev: any) => ({ ...prev, workType: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"><option value="">{t("fields.noSector")}</option>{/* Opcje typów pracy */}</select></div>
                            <div><label className="text-sm font-medium text-gray-700 mb-1 block">{t("fields.description")}</label><textarea value={editingEntry.description || ''} onChange={(e) => setEditingEntry((prev: any) => ({ ...prev, description: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" rows={3} placeholder={t("editModal.descriptionPlaceholder")} /></div>
                            <div className="flex space-x-3 pt-4 border-t border-gray-200">
                                <button onClick={() => handleEditEntry(editingEntry)} disabled={isLoading} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl font-semibold transition-colors disabled:opacity-50">{isLoading ? t("editModal.saving") : t("editModal.saveChanges")}</button>
                                <button onClick={() => handleCloseModal()} disabled={isLoading} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-xl font-semibold transition-colors">{t("common:actions.cancel")}</button>
                            </div>
                        </div>
                    </Modal>
                )}
                
                <EventDetailsModal entry={selectedEntry} onClose={() => handleCloseModal()} onEdit={handleOpenEditModal} onDelete={handleDeleteEntry} onTogglePaid={handleTogglePaid} onOpenPayAllModal={handleOpenPayAllModal} onOpenPayAllMonthModal={handleOpenPayAllMonthModal} onOpenAdvancePayModal={handleOpenAdvancePayModal} />
                <PayConfirmationModal isOpen={isPayAllModalOpen} onClose={handleClosePayAllModal} employee={selectedEmployeeForPayment} entries={employeeEntriesForPayment.entries} totalGrossAmount={employeeEntriesForPayment.totalGrossAmount} advances={employeeEntriesForPayment.advances} netAmount={employeeEntriesForPayment.netAmount} paymentType={paymentModalType} onConfirm={handleConfirmPayment} isLoading={isLoading} />
                <AdvancePayModal isOpen={isAdvancePayModalOpen} onClose={handleCloseAdvancePayModal} employee={selectedEmployeeForAdvance} onConfirm={handleConfirmAdvancePayment} isLoading={isLoading} />
            </div>
        </div>
    );
}