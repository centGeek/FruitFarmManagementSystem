import { useEffect, useState } from 'react';
import { useTranslation } from "react-i18next";
import { Trash2, Layers, X, Search, MapPin, Loader, Check, AlertCircle, Edit3 } from 'lucide-react';
import { CROP_TYPES } from "../../utils/common";
import LocationSearch from '../../utils/LocationSearch';
import BasicMap from '../../utils/BasicMap';
import type { Sector } from './OrchardMapSystemHooks';

export const SectorConfirmationModal = ({ isOpen, onClose, sectorData, onConfirm, onEdit }: any) => {
  const { t } = useTranslation("orchardMap");
  const [editedSector, setEditedSector] = useState({
    id: null,
    name: '',
    cropType: '',
    variety: '',
    corners: []
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (sectorData && isOpen) {
      setEditedSector({
        id: sectorData.id || null,
        name: sectorData.name || '',
        cropType: sectorData.cropType || '',
        variety: sectorData.variety || '',
        corners: sectorData.corners || []
      });
    }
  }, [sectorData, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (field: string, value: any) => {
    setEditedSector(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'cropType' ? { variety: '' } : {})
    }));
  };

  const handleConfirm = async () => {
    if (!editedSector.name.trim()) {
      alert(t("validation.nameRequired"));
      return;
    }
    setIsLoading(true);
    try {
      await onConfirm(editedSector);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCropType = CROP_TYPES.find(c => c.value === editedSector.cropType);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50">{t("confirmModal.title")}</h3>
            </div>
            <button onClick={onClose} disabled={isLoading} className="text-gray-400 dark:text-gray-500 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-4">{t("sectorData.groupTitle")}</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                    {t("sectorData.nameLabel")}
                  </label>
                  <input
                    type="text"
                    value={editedSector.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full p-3 border border-blue-300 dark:border-blue-800 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                    placeholder={t("sectorData.namePlaceholder")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">{t("sectorData.cropTypeLabel")}</label>
                  <select
                    value={editedSector.cropType}
                    onChange={(e) => handleInputChange('cropType', e.target.value)}
                    className="w-full p-3 border border-blue-300 dark:border-blue-800 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="">{t("sectorData.cropTypePlaceholder")}</option>
                    {CROP_TYPES.map(c => (
                      <option key={c.value} value={c.value}>{t(`common:cropType.${c.value}`)}</option>
                    ))}
                  </select>
                </div>

                {editedSector.cropType && selectedCropType && (
                  <div>
                    <label className="block text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">{t("sectorData.varietyLabel")}</label>
                    <select
                      value={editedSector.variety}
                      onChange={(e) => handleInputChange('variety', e.target.value)}
                      className="w-full p-3 border border-blue-300 dark:border-blue-800 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                    >
                      <option value="">{t("sectorData.varietyPlaceholder")}</option>
                      {selectedCropType.varieties.map(v => (
                        <option key={v.value} value={v.value}>{v.value === 'OTHER' ? t("common:varietyOther") : v.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {editedSector.cropType && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">{t("selectedCrop.title")}</h4>
                <div className="p-3 bg-white dark:bg-gray-800 rounded border border-green-300 dark:border-green-800">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">
                      {t(`common:cropType.${editedSector.cropType}`).split(' ')[0]}
                    </span>
                    <div className="flex-1">
                      <div className="font-bold text-green-900 dark:text-green-300">
                        {t(`common:cropType.${editedSector.cropType}`)}
                      </div>
                      <div className="text-xs text-green-700 dark:text-green-300">{t("selectedCrop.typeLabel", { type: editedSector.cropType })}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <details className="bg-gray-50 dark:bg-gray-900 rounded-lg border dark:border-gray-700">
              <summary className="p-4 cursor-pointer font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg">
                {t("gpsCoords.summary")}
              </summary>
              <div className="px-4 pb-4">
                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1 max-h-32 overflow-y-auto bg-white dark:bg-gray-800 p-3 rounded border dark:border-gray-700 font-mono">
                  {editedSector.corners.map((corner: any, idx: number) => (
                    <div key={idx} className="flex justify-between">
                      <span>{t("gpsCoords.point", { index: idx + 1 })}</span>
                      <span>{corner[0].toFixed(6)}, {corner[1].toFixed(6)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onEdit}
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-center gap-2"
            >
              <Edit3 className="w-4 h-4" /> {t("confirmModal.redraw")}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading || !editedSector.name.trim()}
              className="flex-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 shadow-lg"
            >
              {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {isLoading ? t("confirmModal.sending") : t("confirmModal.create")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const EditSectorModal = ({ isOpen, onClose, sectorData, onSave, onArchive }: any) => {
  const { t } = useTranslation("orchardMap");
  const [editedSector, setEditedSector] = useState({
    id: null,
    name: '',
    cropType: '',
    variety: '',
    corners: []
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (sectorData && isOpen) {
      setEditedSector({
        id: sectorData.id,
        name: sectorData.name || '',
        cropType: sectorData.cropType || '',
        variety: sectorData.variety || '',
        corners: sectorData.corners || []
      });
    }
  }, [sectorData, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (field: string, value: any) => {
    setEditedSector(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'cropType' ? { variety: '' } : {})
    }));
  };

  const handleSave = async () => {
    if (!editedSector.name.trim()) {
      alert(t("validation.nameRequired"));
      return;
    }
    setIsLoading(true);
    try {
      await onSave(editedSector);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCropType = CROP_TYPES.find(c => c.value === editedSector.cropType);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                <Edit3 className="w-5 h-5 text-orange-600 dark:text-orange-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50">{t("editModal.title")}</h3>
            </div>
            <button onClick={onClose} disabled={isLoading} className="text-gray-400 dark:text-gray-500 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-6 mb-6">
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
              <h4 className="font-semibold text-orange-900 dark:text-orange-300 mb-4">{t("sectorData.groupTitle")}</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-orange-800 dark:text-orange-300 mb-2">{t("sectorData.nameLabel")}</label>
                  <input
                    type="text"
                    value={editedSector.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full p-3 border border-orange-300 dark:border-orange-800 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                    placeholder={t("sectorData.namePlaceholder")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-orange-800 dark:text-orange-300 mb-2">{t("sectorData.cropTypeLabel")}</label>
                  <select
                    value={editedSector.cropType}
                    onChange={(e) => handleInputChange('cropType', e.target.value)}
                    className="w-full p-3 border border-orange-300 dark:border-orange-800 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="">{t("sectorData.cropTypePlaceholder")}</option>
                    {CROP_TYPES.map(c => (
                      <option key={c.value} value={c.value}>{t(`common:cropType.${c.value}`)}</option>
                    ))}
                  </select>
                </div>
                {editedSector.cropType && selectedCropType && (
                  <div>
                    <label className="block text-sm font-medium text-orange-800 dark:text-orange-300 mb-2">{t("sectorData.varietyLabel")}</label>
                    <select
                      value={editedSector.variety}
                      onChange={(e) => handleInputChange('variety', e.target.value)}
                      className="w-full p-3 border border-orange-300 dark:border-orange-800 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                    >
                      <option value="">{t("sectorData.varietyPlaceholder")}</option>
                      {selectedCropType.varieties.map(v => (
                        <option key={v.value} value={v.value}>{v.value === 'OTHER' ? t("common:varietyOther") : v.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
            {editedSector.cropType && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">{t("selectedCrop.title")}</h4>
                <div className="p-3 bg-white dark:bg-gray-800 rounded border border-green-300 dark:border-green-800">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">
                      {t(`common:cropType.${editedSector.cropType}`).split(' ')[0]}
                    </span>
                    <div className="flex-1">
                      <div className="font-bold text-green-900 dark:text-green-300">
                        {t(`common:cropType.${editedSector.cropType}`)}
                      </div>
                      <div className="text-xs text-green-700 dark:text-green-300">{t("selectedCrop.typeLabel", { type: editedSector.cropType })}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => onArchive && onArchive(sectorData)}
              disabled={isLoading}
              className="w-full px-4 py-3 border-2 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center gap-2 font-medium"
            >
              <Trash2 className="w-4 h-4" /> {t("editModal.archive")}
            </button>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                {t("common:actions.cancel")}
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading || !editedSector.name.trim()}
                className="flex-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center justify-center gap-2 shadow-lg"
              >
                {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {isLoading ? t("common:status.saving") : t("common:actions.save")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const InteractiveMap = ({
  mapRef,
  onMapLoad,
  drawingMode,
  editMode,
  disableEditMode,
  startDrawing,
  cancelDrawing,
  getDrawingInstructions,
  sectors,
  visibleSectorIndices
}: any) => {
  const { t } = useTranslation("orchardMap");
  return (
  <div className="relative">
    <LocationSearch map={mapRef.current} />

    <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
      <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">{t("map.howTo")}</h3>
      <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
        <div><strong>{t("map.step1Label")}</strong> {t("map.step1Text")}</div>
        <div><strong>{t("map.step2Label")}</strong> {t("map.step2Text")}</div>
        {drawingMode !== 'none' && (
          <div className="text-orange-700 dark:text-orange-300 font-medium mt-2 p-2 bg-orange-100 dark:bg-orange-900/30 rounded">
            {getDrawingInstructions()}
          </div>
        )}
      </div>
    </div>

    <div className="relative">
      <BasicMap onMapLoad={onMapLoad} style={{ height: '500px', width: '100%' }} />
    </div>

    <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-[1000]">
      {editMode !== null ? (
        <button
          onClick={disableEditMode}
          className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-lg shadow-lg flex items-center gap-2 transition-colors"
        >
          <Check size={20} />
          <span className="text-sm font-medium">{t("map.finishEdit")}</span>
        </button>
      ) : drawingMode === 'none' ? (
        <button
          onClick={startDrawing}
          className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg shadow-lg flex items-center gap-2 transition-colors"
        >
          <Layers size={20} />
          <span className="text-sm font-medium">{t("map.drawSector")}</span>
        </button>
      ) : (
        <button
          onClick={cancelDrawing}
          className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg shadow-lg flex items-center gap-2 transition-colors"
        >
          <X size={20} />
          <span className="text-sm font-medium">{t("map.cancel")}</span>
        </button>
      )}

      {sectors.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg text-xs max-w-48">
          <div className="font-semibold text-gray-700 dark:text-gray-200 mb-1">{t("map.statistics")}</div>
          <div className="text-gray-600 dark:text-gray-300">{t("map.sectorsCount", { count: sectors.length })}</div>
          {editMode !== null && (
            <div className="text-orange-600 dark:text-orange-300 mt-2 text-xs font-medium">
              {t("map.editModeActive")}
            </div>
          )}
          <div className="text-gray-500 dark:text-gray-400 mt-2 text-xs">
            {visibleSectorIndices.length < sectors.length
              ? t("map.loadingProgress", { loaded: visibleSectorIndices.length, total: sectors.length })
              : editMode !== null
                ? t("map.dragVertices")
                : t("map.clickForDetails")}
          </div>
        </div>
      )}
    </div>
  </div>
  );
};

export const SectorsList = ({
  sectors,
  archivedSectors,
  onRefresh,
  isLoading,
  onEditSector,
  onActivateSector
}: any) => {
  const { t } = useTranslation("orchardMap");
  if (sectors.length === 0 && archivedSectors.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="flex justify-center gap-4 mb-4">
          <Layers size={48} className="text-gray-400 dark:text-gray-500" />
          <Search size={48} className="text-gray-400 dark:text-gray-500" />
        </div>
        <p className="text-xl text-gray-500 dark:text-gray-400 mb-2">
          {isLoading ? t("sectorsList.loadingSectors") : t("sectorsList.noSectors")}
        </p>
        <p className="text-gray-400 dark:text-gray-500 mb-4">
          {isLoading ? t("sectorsList.pleaseWait") : t("sectorsList.searchHint")}
        </p>
        {!isLoading && (
          <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
            <div>• <strong>{t("sectorsList.tip1Label")}</strong> {t("sectorsList.tip1Text")}</div>
            <div>• <strong>{t("sectorsList.tip2Label")}</strong> {t("sectorsList.tip2Text")}</div>
          </div>
        )}
      </div>
    );
  }

  const renderSectorCard = (sector: Sector, isActive = false) => {
    const cropTypeData = CROP_TYPES.find(c => c.value === sector.cropType);
    const varietyData = cropTypeData?.varieties.find(v => v.value === sector.variety);

    return (
      <div
        key={sector.id}
        className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${isActive ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 opacity-75' : 'border-gray-200 dark:border-gray-700'}`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              {t("sectorsList.nameLabel")} {isActive && <span className="text-gray-500 dark:text-gray-400">{t("sectorsList.archivedBadge")}</span>}
            </label>
            <div className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-100">
              {sector.name}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t("sectorsList.cropTypeLabel")}</label>
            <div className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-100">
              {cropTypeData ? t(`common:cropType.${sector.cropType}`) : (sector.cropType || t("sectorsList.notDefined"))}
            </div>
          </div>
        </div>

        {sector.variety && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t("sectorsList.varietyLabel")}</label>
            <div className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              🌱 {varietyData ? (varietyData.value === 'OTHER' ? t("common:varietyOther") : varietyData.label) : sector.variety}
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-4">
          {isActive ? (
            <button
              onClick={() => onActivateSector(sector)}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
            >
              <Check className="w-4 h-4" /> {t("sectorsList.activateAgain")}
            </button>
          ) : (
            <button
              onClick={() => onEditSector(sector)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
            >
              <Edit3 className="w-4 h-4" /> {t("sectorsList.editSector")}
            </button>
          )}

          {sector.corners && sector.corners.length > 0 && (
            <details className="text-xs">
              <summary className="cursor-pointer text-blue-600 dark:text-blue-300 hover:text-blue-800 font-medium flex items-center gap-1">
                <MapPin className="w-4 h-4" /> {t("sectorsList.gpsCoords")}
              </summary>
              <div className="absolute right-0 mt-2 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg z-10 max-h-40 overflow-y-auto min-w-64">
                <div className="space-y-1 font-mono text-xs">
                  {sector.corners.map((corner, idx) => (
                    <div key={idx} className="flex justify-between gap-4">
                      <span className="text-gray-600 dark:text-gray-300">{t("sectorsList.point", { index: idx + 1 })}</span>
                      <span className="text-gray-800 dark:text-gray-100">{corner[0].toFixed(6)}, {corner[1].toFixed(6)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">{t("sectorsList.title")}</h2>
      </div>

      {sectors.length > 0 && (
        <div className="grid gap-4 mb-6">
          {sectors.map((sector: any) => renderSectorCard(sector, false))}
        </div>
      )}

      {archivedSectors.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-300 dark:border-gray-600">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-gray-500 dark:text-gray-400" /> {t("sectorsList.archivedTitle", { count: archivedSectors.length })}
          </h3>
          <div className="grid gap-4">
            {archivedSectors.map((sector: any) => renderSectorCard(sector, true))}
          </div>
        </div>
      )}
    </div>
  );
};