import { useTranslation } from "react-i18next";
import { Loader, AlertCircle } from 'lucide-react';
import { useOrchardMapSystem } from './OrchardMapSystemHooks';
import { InteractiveMap, SectorsList, EditSectorModal, SectorConfirmationModal } from './OrchardMapSystemComponents';

const OrchardMapSystem = () => {
    const { t } = useTranslation("orchardMap");
    const {
        sectors, archivedSectors, isLoading, loadError, editSectorModal, setEditSectorModal,
        confirmationModal, setConfirmationModal, drawingMode, editMode,
        leafletMapRef, handleMapLoad, startDrawing, cancelDrawing, handleSectorConfirm,
        handleSectorEdit, handleSaveEditedSector, handleActivateSector, handleArchiveSector, disableEditMode,
        loadSectorsFromBackend, getDrawingInstructions
    } = useOrchardMapSystem();

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">{t("page.title")}</h1>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{t("page.subtitle")}</p>

                {isLoading && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-3">
                            <Loader className="w-5 h-5 text-blue-600 dark:text-blue-300 animate-spin" />
                            <div><div className="font-semibold text-blue-900 dark:text-blue-300">
                                {t("loading.title")}</div><div className="text-sm text-blue-700 dark:text-blue-300">{t("loading.subtitle")}</div></div>
                        </div>
                    </div>
                )}

                {loadError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-300" />
                                <div><div className="font-semibold text-red-900 dark:text-red-300">{t("loadError.title")}
                                </div><div className="text-sm text-red-700 dark:text-red-300">{loadError}</div></div>
                            </div>
                            <button onClick={loadSectorsFromBackend}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
                                {t("loadError.retry")}</button>
                        </div>
                    </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg"><div className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                        {sectors.length}</div><div className="text-blue-800 dark:text-blue-300">{t("stats.definedSectors")}</div></div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg"><div className="text-2xl font-bold text-green-600 dark:text-green-300">
                        {sectors.filter(s => s.cropType).length}</div><div className="text-green-800 dark:text-green-300">{t("stats.sectorsWithCrop")}</div></div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg"><div className="text-2xl font-bold text-amber-600 dark:text-amber-300">
                        {new Set(sectors.map(s => s.variety).filter(Boolean)).size}</div><div className="text-amber-800 dark:text-amber-300">{t("stats.varietyKinds")}</div></div>
                </div>
            </div>

            <div className="mb-6 rounded-lg overflow-hidden shadow-lg">
                <InteractiveMap 
                    mapRef={leafletMapRef} onMapLoad={handleMapLoad} drawingMode={drawingMode} editMode={editMode}
                    disableEditMode={disableEditMode} startDrawing={startDrawing} cancelDrawing={cancelDrawing}
                    getDrawingInstructions={getDrawingInstructions} sectors={sectors} visibleSectorIndices={[...Array(sectors.length).keys()]} 
                />
            </div>

            <SectorsList 
                sectors={sectors} archivedSectors={archivedSectors} onRefresh={loadSectorsFromBackend} isLoading={isLoading}
                onEditSector={(sector: any) => setEditSectorModal({ isOpen: true, sectorData: sector })}
                onActivateSector={handleActivateSector}
            />

            <SectorConfirmationModal
                isOpen={confirmationModal.isOpen}
                onClose={() => setConfirmationModal({ isOpen: false, sectorData: null })}
                sectorData={confirmationModal.sectorData}
                onConfirm={handleSectorConfirm}
                onEdit={handleSectorEdit}
            />

            <EditSectorModal
                isOpen={editSectorModal.isOpen}
                onClose={() => setEditSectorModal({ isOpen: false, sectorData: null })}
                sectorData={editSectorModal.sectorData}
                onSave={handleSaveEditedSector}
                onArchive={handleArchiveSector}
            />
        </div>
    );
};

export default OrchardMapSystem;