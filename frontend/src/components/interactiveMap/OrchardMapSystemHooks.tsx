import { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import { BACKEND_URL, getAuthHeaders } from "../../utils/apiConfigs";
import { authFetch } from '../../utils/authFetch';
import { CROP_TYPES } from "../../utils/common";

export interface Sector {
    id: number | null;
    name: string;
    cropType: string;
    variety: string;
    corners: [number, number][];
}

export interface BackendSector {
    id: number;
    description: string;
    plantType: string;
    variety: string;
    coordinates: { latitude: number; longitude: number }[];
}

export interface EditSectorModalState {
    isOpen: boolean;
    sectorData: Sector | null;
}

export interface ConfirmationModalState {
    isOpen: boolean;
    sectorData: Sector | null;
}

export const sortPointsClockwise = (points: { lat: number; lng: number }[]) => {
    if (points.length !== 4) return points;
    const centroid = {
        lat: points.reduce((sum, p) => sum + p.lat, 0) / points.length,
        lng: points.reduce((sum, p) => sum + p.lng, 0) / points.length
    };
    const topPoints = points.filter(p => p.lat >= centroid.lat);
    const bottomPoints = points.filter(p => p.lat < centroid.lat);
    topPoints.sort((a, b) => a.lng - b.lng);
    bottomPoints.sort((a, b) => b.lng - a.lng);
    return [topPoints[0], topPoints[1], bottomPoints[0], bottomPoints[1]];
};

export const useOrchardMapSystem = () => {
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [archivedSectors, setArchivedSectors] = useState<Sector[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [editSectorModal, setEditSectorModal] = useState<EditSectorModalState>({ isOpen: false, sectorData: null });
    const [confirmationModal, setConfirmationModal] = useState<ConfirmationModalState>({ isOpen: false, sectorData: null });

    // Stan mapy
    const leafletMapRef = useRef<any>(null);
    const drawnItemsRef = useRef<any>(null);
    const editMarkersRef = useRef<any[]>([]);
    const [mapInstance, setMapInstance] = useState<any>(null);
    const [drawingMode, setDrawingMode] = useState<'none' | 'polygon'>('none');
    const [editMode, setEditMode] = useState<{ sectorIndex: number; cornerIndex: number | null } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [drawingPoints, setDrawingPoints] = useState<{ lat: number; lng: number }[]>([]);
    const [tempLayer, setTempLayer] = useState<any>(null);
    const [selectedSector] = useState<number | null>(null);
    const [visibleSectorIndices, setVisibleSectorIndices] = useState<number[]>([]);
    const animationTimeoutRef = useRef<any[]>([]);

    const loadSectorsFromBackend = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await authFetch(`${BACKEND_URL}/api/sectors`, { method: 'GET', headers: getAuthHeaders() });
            if (!response.ok) throw new Error(`Błąd HTTP: ${response.status}`);
            const backendSectors: BackendSector[] = await response.json();

            const mappedSectors = backendSectors.map(sector => ({
                id: sector.id,
                name: sector.description || `Sektor ${sector.id}`,
                cropType: sector.plantType || '',
                variety: sector.variety || '',
                corners: sector.coordinates?.map(coord => [coord.latitude, coord.longitude] as [number, number]) || []
            }));
            setSectors(mappedSectors);

            const archivedResponse = await authFetch(`${BACKEND_URL}/api/sectors/archived`, { method: 'GET', headers: getAuthHeaders() });
            if (archivedResponse.ok) {
                const archivedBackendSectors: BackendSector[] = await archivedResponse.json();
                const mappedArchivedSectors = archivedBackendSectors.map(sector => ({
                    id: sector.id,
                    name: sector.description || `Sektor ${sector.id}`,
                    cropType: sector.plantType || '',
                    variety: sector.variety || '',
                    corners: sector.coordinates?.map(coord => [coord.latitude, coord.longitude] as [number, number]) || []
                }));
                setArchivedSectors(mappedArchivedSectors.reverse());
            }
        } catch (error: any) {
            console.error('❌ Błąd podczas ładowania sektorów:', error);
            setLoadError(error.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadSectorsFromBackend(); }, [loadSectorsFromBackend]);

    const handleMapLoad = (map: any) => {
        leafletMapRef.current = map;
        setMapInstance(map);
    };

    const startDrawing = () => {
        setDrawingMode('polygon');
        setDrawingPoints([]);
        if (tempLayer && mapInstance) { mapInstance.removeLayer(tempLayer); setTempLayer(null); }
    };

    const cancelDrawing = () => {
        setDrawingMode('none');
        setDrawingPoints([]);
        if (tempLayer && mapInstance) { mapInstance.removeLayer(tempLayer); setTempLayer(null); }
    };

    const finishDrawing = async (points: { lat: number; lng: number }[]) => {
        if (points.length < 3) { alert('Wymagane co najmniej 4 punkty'); cancelDrawing(); return; }
        const sortedPoints = sortPointsClockwise(points);
        const newSector: Sector = {
            id: Date.now(),
            name: `Sektor ${sectors.length + 1}`,
            corners: sortedPoints.map(p => [p.lat, p.lng]),
            cropType: '',
            variety: ''
        };
        setConfirmationModal({ isOpen: true, sectorData: newSector });
    };

    const handleSectorConfirm = async (editedSectorData: Sector) => {
        try {
            const coordinatesDTO = editedSectorData.corners.map(corner => ({ latitude: corner[0], longitude: corner[1] }));
            const backendData = {
                description: editedSectorData.name,
                plantType: editedSectorData.cropType || null,
                variety: editedSectorData.variety || null,
                coordinates: coordinatesDTO
            };
            const response = await authFetch(`${BACKEND_URL}/api/sectors`, {
                method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(backendData)
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            let result = null;
            try { result = await response.json(); } catch (e) { }

            const finalSector = { ...editedSectorData };
            if (result && result.id) finalSector.id = result.id;

            setSectors(prev => [...prev, finalSector]);
            alert('Sektor został pomyślnie dodany!');
        } catch (error) {
            console.error('Błąd podczas wysyłania sektora:', error);
        }
        setConfirmationModal({ isOpen: false, sectorData: null });
        cancelDrawing();
    };

    const handleSaveEditedSector = async (editedSector: Sector) => {
        try {
            if (!editedSector.id) { alert('Brak ID backendu'); return; }
            const coordinatesDTO = editedSector.corners.map(corner => ({ latitude: corner[0], longitude: corner[1] }));
            const backendData = {
                id: editedSector.id,
                description: editedSector.name,
                plantType: editedSector.cropType || null,
                variety: editedSector.variety || null,
                coordinates: coordinatesDTO
            };
            const response = await authFetch(`${BACKEND_URL}/api/sectors/${editedSector.id}`, {
                method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(backendData)
            });
            if (!response.ok) throw new Error(`HTTP error!`);
            
            setSectors(prev => prev.map(s => s.id === editedSector.id ? editedSector : s));
            setEditSectorModal({ isOpen: false, sectorData: null });
            alert('Sektor został pomyślnie zaktualizowany!');
        } catch (error: any) {
            alert(`Nie udało się zaktualizować sektora: ${error.message}`);
        }
    };

    const handleActivateSector = async (sector: Sector) => {
        try {
            if (!sector.id) { alert('Brak ID backendu'); return; }
            const coordinatesDTO = sector.corners.map(corner => ({ latitude: corner[0], longitude: corner[1] }));
            const backendData = {
                id: sector.id, description: sector.name, plantType: sector.cropType || null,
                variety: sector.variety || null, coordinates: coordinatesDTO, isActive: true
            };
            const response = await authFetch(`${BACKEND_URL}/api/sectors/${sector.id}`, {
                method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(backendData)
            });
            if (!response.ok) throw new Error(`HTTP error!`);
            await loadSectorsFromBackend();
            alert('Sektor został pomyślnie aktywowany!');
        } catch (error: any) { alert(`Nie udało się aktywować sektora: ${error.message}`); }
    };

    const handleArchiveSector = async (sector: Sector) => {
        try {
            if (!sector.id) { alert('Brak ID backendu'); return; }
            const coordinatesDTO = sector.corners.map(corner => ({ latitude: corner[0], longitude: corner[1] }));
            const backendData = {
                id: sector.id, description: sector.name, plantType: sector.cropType || null,
                variety: sector.variety || null, coordinates: coordinatesDTO, isActive: false
            };
            const response = await authFetch(`${BACKEND_URL}/api/sectors/${sector.id}`, {
                method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(backendData)
            });
            if (!response.ok) throw new Error(`HTTP error!`);
            setEditSectorModal({ isOpen: false, sectorData: null });
            await loadSectorsFromBackend();
        } catch (error: any) { alert(`Nie udało się zarchiwizować sektora: ${error.message}`); }
    };

    const enableSectorEdit = (sectorIndex: number) => {
        if (mapInstance) { mapInstance.closePopup(); mapInstance.dragging.disable(); }
        setEditMode({ sectorIndex, cornerIndex: null });
        setDrawingMode('none');
    };

    const disableEditMode = () => {
        setEditMode(null);
        if (mapInstance) mapInstance.dragging.enable();
        if (editMarkersRef.current && mapInstance) {
            editMarkersRef.current.forEach(marker => { if (mapInstance.hasLayer(marker)) mapInstance.removeLayer(marker); });
            editMarkersRef.current = [];
        }
    };

    const updateCornerPosition = async (sectorIndex: number, cornerIndex: number, newLatLng: { lat: number; lng: number }) => {
        const updatedSectors = [...sectors];
        updatedSectors[sectorIndex].corners[cornerIndex] = [newLatLng.lat, newLatLng.lng];
        if (updatedSectors[sectorIndex].id) {
            try {
                const coordinatesDTO = updatedSectors[sectorIndex].corners.map(corner => ({ latitude: corner[0], longitude: corner[1] }));
                const sectorData = {
                    id: updatedSectors[sectorIndex].id, description: updatedSectors[sectorIndex].name,
                    plantType: updatedSectors[sectorIndex].cropType || null, variety: updatedSectors[sectorIndex].variety || null,
                    coordinates: coordinatesDTO
                };
                await authFetch(`${BACKEND_URL}/api/sectors/${updatedSectors[sectorIndex].id}`, {
                    method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(sectorData)
                });
            } catch (error) { console.error(error); }
        }
        setSectors(updatedSectors);
    };

    const handleMapClick = useCallback((e: any) => {
        if (drawingMode !== 'polygon') return;
        const clickPoint = e.latlng;
        setDrawingPoints(prevPoints => {
            const newPoints = [...prevPoints, clickPoint];
            if (newPoints.length === 4) { finishDrawing(newPoints); return []; }
            return newPoints;
        });
    }, [drawingMode, sectors]);

    // Efekty mapy
    useEffect(() => {
        if (sectors.length === 0) { setVisibleSectorIndices([]); return; }
        setVisibleSectorIndices([]);
        if (animationTimeoutRef.current) animationTimeoutRef.current.forEach(t => clearTimeout(t));
        const timeouts: any[] = [];
        sectors.forEach((_, index) => {
            const timeout = setTimeout(() => {
                setVisibleSectorIndices(prev => [...prev, index]);
                if (index === sectors.length - 1 && mapInstance && sectors.length > 0) {
                    setTimeout(() => {
                        const allCorners = sectors.flatMap(s => s.corners || []);
                        if (allCorners.length > 0) {
                            const bounds = L.latLngBounds(allCorners as any);
                            mapInstance.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
                        }
                    }, 100);
                }
            }, 0);
            timeouts.push(timeout);
        });
        animationTimeoutRef.current = timeouts;
        return () => timeouts.forEach(t => clearTimeout(t));
    }, [sectors.length, mapInstance]);

    useEffect(() => {
        if (!mapInstance) return;
        const map = mapInstance;
        if (!drawnItemsRef.current) drawnItemsRef.current = new L.FeatureGroup().addTo(map);
        const drawnItems = drawnItemsRef.current;
        drawnItems.clearLayers();

        editMarkersRef.current.forEach(marker => { if (map.hasLayer(marker)) map.removeLayer(marker); });
        editMarkersRef.current = [];

        if (drawingMode === 'polygon' && drawingPoints.length > 0) {
            drawingPoints.forEach((point, index) => {
                const marker = L.circleMarker([point.lat, point.lng], { radius: 8, fillColor: '#ff6b00', color: '#ffffff', weight: 3, opacity: 1, fillOpacity: 0.9 }).addTo(drawnItems);
                marker.bindTooltip(`Punkt ${index + 1}`, { permanent: true, direction: 'top' });
            });
            if (drawingPoints.length > 1) {
                const linePoints = drawingPoints.map(p => [p.lat, p.lng]);
                L.polyline(linePoints as any, { color: '#ff6b00', weight: 2, opacity: 0.7, dashArray: '5, 5' }).addTo(drawnItems);
            }
            if (drawingPoints.length === 3) {
                const closingLine = [[drawingPoints[2].lat, drawingPoints[2].lng], [drawingPoints[0].lat, drawingPoints[0].lng]];
                L.polyline(closingLine as any, { color: '#ff6b00', weight: 2, opacity: 0.5, dashArray: '10, 10' }).addTo(drawnItems);
            }
        }

        const sectorsToShow = sectors.filter((_, index) => visibleSectorIndices.includes(index));
        sectorsToShow.forEach((sector) => {
            if (!sector.corners || sector.corners.length === 0) return;
            const actualIndex = sectors.indexOf(sector);
            const isBeingEdited = editMode?.sectorIndex === actualIndex;
            const polygon = L.polygon(sector.corners, {
                color: isBeingEdited ? '#ff6b00' : (selectedSector === actualIndex ? '#ff0000' : '#3388ff'),
                weight: isBeingEdited ? 3 : (selectedSector === actualIndex ? 3 : 2),
                fillColor: isBeingEdited ? '#ff6b00' : '#3388ff',
                fillOpacity: isBeingEdited ? 0.3 : 0.2
            });

            const cropTypeLabel = sector.cropType ? CROP_TYPES.find(c => c.value === sector.cropType)?.label || sector.cropType : 'Nie określono';
            const varietyLabel = sector.variety ? CROP_TYPES.find(c => c.value === sector.cropType)?.varieties.find(v => v.value === sector.variety)?.label || sector.variety : null;
            
            polygon.bindPopup(`
                <div style="padding: 12px;">
                    <div style="font-size: 16px; font-weight: bold; color: #1f2937; margin-bottom: 6px;">📍 ${sector.name}</div>
                    <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">Uprawa: <b> ${cropTypeLabel} </b></div>
                    ${varietyLabel ? `<div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">🌱Odmiana: <b>${varietyLabel} </b></div>` : ''}
                    ${!isBeingEdited ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;"><button onclick="window.editSectorVertices(${actualIndex})" style="width: 100%; padding: 6px 12px; background: #ff6b00; color: white; border: none; border-radius: 4px; cursor: pointer;">✏️ Edytuj wierzchołki</button></div>` : ''}
                </div>`, { maxWidth: 250 });
            
            drawnItems.addLayer(polygon);

            sector.corners.forEach((corner, cornerIndex) => {
                if (isBeingEdited) {
                    const editIcon = L.divIcon({ className: 'custom-edit-marker', html: `<div style="background: #ff6b00; border: 3px solid white; border-radius: 50%; width: 24px; height: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); cursor: move;"></div>`, iconSize: [24, 24], iconAnchor: [12, 12] });
                    const marker = L.marker(corner, { icon: editIcon, draggable: true, autoPan: true });
                    marker.on('dragstart', () => setIsDragging(true));
                    marker.on('drag', (e) => {
                         const newLatLng = e.target.getLatLng();
                         const updatedCorners = [...sector.corners];
                         updatedCorners[cornerIndex] = [newLatLng.lat, newLatLng.lng];
                         polygon.setLatLngs(updatedCorners);
                    });
                    marker.on('dragend', (e) => {
                        const newLatLng = e.target.getLatLng();
                        updateCornerPosition(actualIndex, cornerIndex, newLatLng);
                        setIsDragging(false);
                    });
                    marker.bindTooltip(`Przeciągnij punkt ${cornerIndex + 1}`, { permanent: false, direction: 'top' });
                    editMarkersRef.current.push(marker);
                    drawnItems.addLayer(marker);
                } else {
                    const marker = L.circleMarker(corner, { radius: 4, fillColor: '#3388ff', color: '#ffffff', weight: 2, opacity: 1, fillOpacity: 0.8 });
                    marker.bindTooltip(`Punkt ${cornerIndex + 1}`, { permanent: false, direction: 'top' });
                    drawnItems.addLayer(marker);
                }
            });
        });

        // @ts-ignore
        window.editSectorVertices = enableSectorEdit;
        map.getContainer().style.cursor = drawingMode !== 'none' ? 'crosshair' : (isDragging ? 'grabbing' : '');
    }, [sectors, selectedSector, drawingMode, drawingPoints, mapInstance, visibleSectorIndices, editMode, isDragging]);

    useEffect(() => {
        if (!mapInstance) return;
        const map = mapInstance;
        if (drawingMode === 'polygon') { map.on('click', handleMapClick); map.doubleClickZoom.disable(); }
        else { map.off('click', handleMapClick); map.doubleClickZoom.enable(); }
        return () => { map.off('click', handleMapClick); map.doubleClickZoom.enable(); };
    }, [drawingMode, handleMapClick, mapInstance]);

    const getDrawingInstructions = () => {
        if (drawingMode !== 'polygon') return '';
        const currentCount = drawingPoints.length;
        if (currentCount === 0) return 'Kliknij pierwszy z 4 punktów wielokąta.';
        if (currentCount < 4) return `Kliknij, aby dodać punkt. Masz: ${currentCount}/4 punkty.`;
        return 'Rysowanie zakończone, tworzenie sektora...';
    };

    return {
        sectors, setSectors, archivedSectors, isLoading, loadError, editSectorModal, setEditSectorModal,
        confirmationModal, setConfirmationModal, mapInstance, drawingMode, editMode, isDragging,
        drawingPoints, leafletMapRef, handleMapLoad, startDrawing, cancelDrawing, handleSectorConfirm,
        handleSectorEdit: () => { setConfirmationModal({ isOpen: false, sectorData: null }); startDrawing(); },
        handleSaveEditedSector, handleActivateSector, handleArchiveSector, disableEditMode,
        loadSectorsFromBackend, getDrawingInstructions
    };
};