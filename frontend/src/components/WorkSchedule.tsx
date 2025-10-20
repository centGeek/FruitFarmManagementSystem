import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar, Clock, Users, CheckCircle, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, X} from 'lucide-react';
import { BACKEND_URL, getAuthHeaders } from "../utils/apiConfigs";
import ErrorPage from './ErrorPage'; 

const WORK_TYPE_OPTIONS = [
    { value: 'HARVEST', label: '🌾 Zbiory', icon: '🌾' },
    { value: 'WEEDING', label: '🌱 Pielenie', icon: '🌱' },
    { value: 'WATERING', label: '💧 Nawadnianie', icon: '💧' },
    { value: 'SPRAYING', label: '💨 Opryski', icon: '💨' },
    { value: 'PLANTING', label: '🌿 Sadzenie', icon: '🌿' },
    { value: 'PRUNING', label: '✂️ Przycinanie', icon: '✂️' },
    { value: 'FERTILIZING', label: '🧪 Nawożenie', icon: '🧪' },
    { value: 'OTHER', label: '📋 Inne', icon: '📋' }
];

const getWorkTypeLabel = (workType) => {
    const option = WORK_TYPE_OPTIONS.find(opt => opt.value === workType);
    return option ? option.label : workType;
};

const getWorkTypeIcon = (workType) => {
    const option = WORK_TYPE_OPTIONS.find(opt => opt.value === workType);
    return option ? option.icon : '📋';
};

const Alert = ({ type, message, onClose }) => {
    if (!message) return null;
    const colors = {
        error: 'bg-red-50 border-red-300 text-red-700',
        success: 'bg-green-50 border-green-300 text-green-700',
        warning: 'bg-amber-50 border-amber-300 text-amber-700'
    };
    
    return (
        <div className={`mb-4 p-4 border rounded-xl ${colors[type]} flex items-center justify-between shadow-sm`}>
            <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                <p className="font-medium">{message}</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1 text-lg">❌</button>
        </div>
    );
};

const Modal = ({ isOpen, onClose, title, children, size = 'large' }) => {
    if (!isOpen) return null;
    const sizeClasses = { small: 'max-w-md', medium: 'max-w-2xl', large: 'max-w-4xl', xlarge: 'max-w-6xl' };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className={`bg-white rounded-2xl shadow-2xl ${sizeClasses[size]} w-full max-h-[90vh] overflow-y-auto`}>
                <div className="sticky top-0 bg-gradient-to-r from-green-50 to-lime-50 border-b border-green-200 px-6 py-4 rounded-t-2xl z-10">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center">
                            <Clock className="mr-2 text-green-600" size={24} />
                            {title}
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-green-100 rounded-xl transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
};

const StatCard = ({ icon: Icon, count, label, color }) => {
    const colorMap = {
        green: 'from-green-100 to-green-200 text-green-600',
        blue: 'from-blue-100 to-blue-200 text-blue-600',
        amber: 'from-amber-100 to-amber-200 text-amber-600',
        purple: 'from-purple-100 to-purple-200 text-purple-600'
    };
    
    return (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center space-x-4">
                <div className={`w-14 h-14 bg-gradient-to-br ${colorMap[color]} rounded-2xl flex items-center justify-center`}>
                    <Icon size={28} />
                </div>
                <div>
                    <p className="text-3xl font-extrabold text-gray-900">{count}</p>
                    <p className="text-sm text-gray-500">{label}</p>
                </div>
            </div>
        </div>
    );
};

const DailyWorkForm = ({ date, employees, sectors, onSave, onCancel, isLoading }) => {
    const [entries, setEntries] = useState(() => 
    employees.map(emp => ({
        employeeId: emp.id, 
        employee: emp,
        hours: '',
        kilogramsPicked: '',
        sectorId: '',
        workType: '',
        description: '',
        isApproved: true,
        isPaidHourly: emp.isPaidHourly !== false
    }))
);

    const updateEntry = useCallback((employeeId, field, value) => {
        setEntries(prev => prev.map(e => e.employeeId === employeeId ? { ...e, [field]: value } : e));
    }, []);

    const handleSubmit = () => {
    const valid = entries.filter(e => {
        const hasHours = e.hours && parseFloat(e.hours) > 0;
        if (e.isPaidHourly) {
            return hasHours;
        } else {
            const hasKg = e.kilogramsPicked && parseFloat(e.kilogramsPicked) > 0;
            return hasHours && hasKg;
        }
    });
    if (valid.length === 0) {
        onCancel('warning', 'Podaj wymagane dane dla co najmniej jednego pracownika');
        return;
    }
    onSave(valid);
};

    const quickFillAll = (field, value) => setEntries(prev => prev.map(e => ({ ...e, [field]: value })));

    const totalHours = useMemo(() => entries.reduce((sum, e) => sum + (parseFloat(e.hours) || 0), 0), [entries]);
    const totalKilograms = useMemo(() => entries.reduce((sum, e) => sum + (parseFloat(e.kilogramsPicked) || 0), 0), [entries]);
    const filledCount = useMemo(() => entries.filter(e => {
        if (e.isPaidHourly) {
            return e.hours && parseFloat(e.hours) > 0;
        } else {
            return e.kilogramsPicked && parseFloat(e.kilogramsPicked) > 0;
        }
    }).length, [entries]);

    return (
        <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-lg font-bold text-green-800">
                    📅 {new Date(date).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm font-bold text-blue-800 mb-3">⚡ Szybkie wypełnienie dla wszystkich:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                        <label className="text-xs text-gray-600 mb-1 block">Godziny</label>
                        <div className="flex gap-2">
                            {[4, 6, 8, 10, 11, 12].map(h => (
                                <button key={h} onClick={() => quickFillAll('hours', h.toString())} 
                                    className="flex-1 bg-white hover:bg-blue-100 border border-blue-300 rounded-lg py-2 text-sm font-bold transition-colors">
                                    {h}h
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-gray-600 mb-1 block">Sektor</label>
                        <select onChange={(e) => quickFillAll('sectorId', e.target.value)} 
                            className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm">
                            <option value="">Wybierz...</option>
                            {sectors.map(s => <option key={s.id} value={s.id}>{s.description}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-xs text-gray-600 mb-1 block">Typ pracy</label>
                        <select onChange={(e) => quickFillAll('workType', e.target.value)} 
                            className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm">
                            <option value="">Wybierz...</option>
                            {WORK_TYPE_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {entries.map(entry => (
                    <div key={entry.employeeId} className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-green-300 transition-colors">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                            <div className="md:col-span-3">
                                <p className="font-bold text-gray-900">{entry.employee.name} {entry.employee.surname}</p>
                                {entry.employee.nickname && <p className="text-xs text-gray-500 italic">"{entry.employee.nickname}"</p>}
                            </div>

                            {entry.isPaidHourly ? (
                                <div className="md:col-span-2">
                                    <label className="text-xs text-gray-500 mb-1 block">Godziny *</label>
                                    <input type="number" step="0.5" min="0" max="24" value={entry.hours}
                                        onChange={(e) => updateEntry(entry.employeeId, 'hours', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-lg font-bold" 
                                        placeholder="8" />
                                </div>
                            ) : (
                                <>
                                    <div className="md:col-span-1">
                                        <label className="text-xs text-gray-500 mb-1 block">Godziny *</label>
                                        <input type="number" step="0.5" min="0" max="24" value={entry.hours}
                                            onChange={(e) => updateEntry(entry.employeeId, 'hours', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-lg font-bold" 
                                            placeholder="8" />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-xs text-gray-500 mb-1 block">Kilogramy *</label>
                                        <input type="number" step="0.1" min="0" value={entry.kilogramsPicked}
                                            onChange={(e) => updateEntry(entry.employeeId, 'kilogramsPicked', e.target.value)}
                                            className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-lg font-bold" 
                                            placeholder="50" />
                                    </div>
                                </>
                            )}

                            <div className="md:col-span-3">
                                <label className="text-xs text-gray-500 mb-1 block">Sektor</label>
                                <select value={entry.sectorId} onChange={(e) => updateEntry(entry.employeeId, 'sectorId', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                                    <option value="">Brak</option>
                                    {sectors.map(s => <option key={s.id} value={s.id}>{s.description} ({s.plantType})</option>)}
                                </select>
                            </div>

                            <div className="md:col-span-4">
                                <label className="text-xs text-gray-500 mb-1 block">Typ pracy</label>
                                <select value={entry.workType} onChange={(e) => updateEntry(entry.employeeId, 'workType', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                                    <option value="">Brak</option>
                                    {WORK_TYPE_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {(entry.hours || entry.kilogramsPicked) && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                                <input type="text" value={entry.description} 
                                    onChange={(e) => updateEntry(entry.employeeId, 'description', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 text-sm" 
                                    placeholder="Uwagi (opcjonalnie)..." />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-1">
                    Pracowników z danymi: <span className="font-bold text-green-600">{filledCount} / {employees.length}</span>
                </p>
                <p className="text-sm text-gray-600 mb-1">
                    Suma godzin: <span className="font-bold text-blue-600">{totalHours.toFixed(1)}h</span>
                </p>
                <p className="text-sm text-gray-600">
                    Suma kilogramów: <span className="font-bold text-orange-600">{totalKilograms.toFixed(1)} kg</span>
                </p>
            </div>
            <div className="flex space-x-3 pt-2">
                <button onClick={handleSubmit} disabled={isLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center shadow-md">
                    {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> : <CheckCircle className="mr-2" size={20} />}
                    Zapisz wpisy
                </button>
                <button onClick={() => onCancel()} disabled={isLoading}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-xl font-semibold transition-colors">
                    Anuluj
                </button>
            </div>
        </div>
    );
};

const CalendarEvent = ({ entry, onClick, onQuickApprove }) => (
    <div onClick={onClick}
        className={`${entry.isApproved ? 'bg-green-100 border-green-400 text-green-800' : 'bg-amber-100 border-amber-400 text-amber-800'} border-l-4 rounded-lg p-2 cursor-pointer hover:shadow-md transition-all text-xs`}>
        <div className="flex items-center justify-between mb-1">
            <span className="font-bold truncate text-xs">{entry.user?.name} {entry.user?.surname?.[0]}.</span>
            <button onClick={(e) => { e.stopPropagation(); onQuickApprove(entry.entryId); }}
                className="p-1 hover:bg-white rounded transition-colors text-sm">
                {entry.isApproved ? '✅' : '⏳'}
            </button>
        </div>
        <div className="flex items-center space-x-2">
            {entry.duration > 0 && <div className="text-xs font-bold opacity-90 text-black">⏱️ {entry.duration}h</div>}
            {entry.kilogramsPicked > 0 && <div className="text-xs font-bold opacity-90 text-orange-600">⚖️ {entry.kilogramsPicked} kg</div>}
            {entry.daySalary !== undefined && entry.daySalary !== null && (
            <div className="text-xs font-medium text-orange-900 opacity-90 flex items-center">
                💰 {parseFloat(entry.daySalary).toFixed(0)} zł 
            </div>
        )}
        </div>
        
        {entry.workType && <div className="text-xs mt-1 opacity-75">{getWorkTypeIcon(entry.workType)}</div>}
        {entry.sector && <div className="text-xs mt-1 truncate opacity-75">📍 {entry.sector.description}</div>}
    </div>
);

const WeekCalendar = ({ workEntries, onAddClick, onEventClick, onQuickApprove, currentDate, onDateChange }) => {
    const getWeekDays = useCallback((date) => {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const day = (start.getDay() + 6) % 7;
        start.setDate(start.getDate() - day);
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            return d;
        });
    }, []);

    const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate, getWeekDays]);

    const getEntriesForDate = useCallback((date) => {
        const dateStr = date.toISOString().split('T')[0];
        return workEntries.filter(entry => new Date(entry.workDate).toISOString().split('T')[0] === dateStr);
    }, [workEntries]);

    const isToday = useCallback((date) => date.toDateString() === new Date().toDateString(), []);

    const navigate = (days) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + days);
        onDateChange(newDate);
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-lime-600 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <button onClick={() => navigate(-7)} className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors">
                            <ChevronLeft className="text-white" size={20} />
                        </button>
                        <button onClick={() => navigate(7)} className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors">
                            <ChevronRight className="text-white" size={20} />
                        </button>
                        <button onClick={() => onDateChange(new Date())} 
                            className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors text-white font-medium text-sm">
                            Dzisiaj
                        </button>
                    </div>
                    <h3 className="text-xl font-bold text-white">
                        {weekDays[0].toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}
                    </h3>
                </div>
            </div>

            <div className="grid grid-cols-7">
                {weekDays.map((day, idx) => {
                    const entries = getEntriesForDate(day);
                    const totalHours = entries.reduce((sum, e) => sum + (e.duration || 0), 0);
                    const totalSalary = entries.reduce((sum, e) => sum + (parseFloat(e.daySalary) || 0), 0); // SUMOWANIE daySalary
                    const dateStr = day.toISOString().split('T')[0];
                    
                    return (
                        <div key={idx} className={`border-r border-b border-gray-200 min-h-64 ${isToday(day) ? 'bg-green-50' : 'bg-white'}`}>
                            <div className={`p-3 border-b border-gray-200 ${isToday(day) ? 'bg-green-100' : 'bg-gray-50'}`}>
                                <div className="text-xs text-gray-500 uppercase">{day.toLocaleDateString('pl-PL', { weekday: 'short' })}</div>
                                <div className={`text-2xl font-bold ${isToday(day) ? 'text-green-600' : 'text-gray-800'}`}>{day.getDate()}</div>
                                <div className="space-y-0.5 mt-1">
                                    {totalHours > 0 && <div className="text-xs font-medium text-blue-600">⏱️ {totalHours.toFixed(1)}h</div>}
                                    {totalSalary > 0 && <div className="text-xs font-medium text-orange-900 opacity-90 flex items-center">💰 {totalSalary.toFixed(2)} zł</div>}
                                </div>
                            </div>

                            <div className="p-2">
                                {entries.length === 0 ? (
                                    <button onClick={() => onAddClick(dateStr)}
                                        className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all flex flex-col items-center justify-center group">
                                        <Plus className="text-gray-400 group-hover:text-green-600 mb-2" size={32} />
                                        <span className="text-sm text-gray-500 group-hover:text-green-600 font-medium">Dodaj wpisy</span>
                                    </button>
                                ) : (
                                    <>
                                        <div className="space-y-1 mb-2 max-h-96 overflow-y-auto pr-1">
                                            {entries.map(e => <CalendarEvent key={e.entryId} entry={e} onClick={() => onEventClick(e)} onQuickApprove={onQuickApprove} />)}
                                        </div>
                                        <button onClick={() => onAddClick(dateStr)}
                                            className="w-full py-2 border border-green-500 text-green-600 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium">
                                            + Dodaj więcej
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const EventDetailsModal = ({ entry, onClose, onEdit, onDelete, onToggleApproval }) => {
    if (!entry) return null;

    return (
        <Modal isOpen={!!entry} onClose={onClose} title="Szczegóły wpisu" size="medium">
            <div className="space-y-4">
                <div className={`p-4 rounded-xl ${entry.isApproved ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">{entry.user?.name} {entry.user?.surname}</h3>
                            {entry.user?.nickname && <p className="text-sm text-gray-500 italic">"{entry.user.nickname}"</p>}
                        </div>
                        <div className={`text-3xl ${entry.isApproved ? 'text-green-600' : 'text-amber-600'}`}>
                            {entry.isApproved ? <CheckCircle size={40} /> : <Clock size={40} />}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                        {entry.duration !== undefined && entry.duration !== null && (
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                            <p className="text-xs font-medium text-blue-700 uppercase mb-1">Czas trwania</p>
                            <p className="text-lg font-bold text-blue-900">{entry.duration}h</p>
                        </div>
                    )}
                    {entry.kilogramsPicked !== undefined && entry.kilogramsPicked !== null && entry.kilogramsPicked > 0 && (
                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                            <p className="text-xs font-medium text-orange-700 uppercase mb-1">Zebrane kilogramy</p>
                            <p className="text-lg font-bold text-orange-900">{entry.kilogramsPicked} kg</p>
                        </div>
                    )}
                    {entry.daySalary !== undefined && entry.daySalary !== null && entry.daySalary > 0 && (
                        <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                            <p className="text-xs font-medium text-red-700 uppercase mb-1">Wynagrodzenie dzienne</p>
                            <p className="text-lg font-bold text-red-900">{parseFloat(entry.daySalary).toFixed(2)} zł</p>
                        </div>
                    )}
                </div>


                {entry.sector && (
                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                        <p className="text-xs font-medium text-purple-700 uppercase mb-1">Sektor</p>
                        <p className="text-sm font-bold text-purple-900">📍 {entry.sector.description} ({entry.sector.plantType})</p>
                    </div>
                )}

                {entry.workType && (
                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
                        <p className="text-xs font-medium text-indigo-700 uppercase mb-1">Typ pracy</p>
                        <p className="text-sm font-bold text-indigo-900">{getWorkTypeLabel(entry.workType)}</p>
                    </div>
                )}

                {entry.description && (
                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Opis:</p>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{entry.description}</p>
                    </div>
                )}

                <div className="flex space-x-2 pt-4 border-t border-gray-200">
                    <button onClick={() => onToggleApproval(entry.entryId)}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                            entry.isApproved ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}>
                        {entry.isApproved ? '↩️ Cofnij zatwierdzenie' : '✅ Zatwierdź'}
                    </button>
                    <button onClick={() => onEdit(entry)} className="flex-1 bg-blue-100 text-blue-700 hover:bg-blue-200 py-2 px-4 rounded-lg font-medium transition-colors">
                        <Edit2 className="inline mr-1" size={16} /> Edytuj
                    </button>
                    <button onClick={() => confirm('Czy na pewno chcesz usunąć ten wpis?') && onDelete(entry.entryId)}
                        className="flex-1 bg-red-100 text-red-700 hover:bg-red-200 py-2 px-4 rounded-lg font-medium transition-colors">
                        <Trash2 className="inline mr-1" size={16} /> Usuń
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default function WorkEntryManagement() {
    const [workEntries, setWorkEntries] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [sectors, setSectors] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState(null); 
    const [bulkAssignDate, setBulkAssignDate] = useState(null); 
    const [isLoading, setIsLoading] = useState(false);
    const [alert, setAlert] = useState({ type: '', message: '' });
    const [criticalError, setCriticalError] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);

    const closeAlert = useCallback(() => setAlert({ type: '', message: '' }), []);

    const fetchData = useCallback(async (setter, endpoint, entityName) => {
        console.log(`[FETCH] Rozpoczynam pobieranie ${entityName} z: ${BACKEND_URL}${endpoint}`);
        try {
            const headers = getAuthHeaders();
            
            const response = await fetch(`${BACKEND_URL}${endpoint}`, {
                method: 'GET',
                headers: headers,
            });

            console.log(`[FETCH] Odpowiedź serwera dla ${entityName} - Status: ${response.status} ${response.statusText}`);

            if (response.ok) {
                const data = await response.json();
                console.log(`[FETCH] ✅ Załadowano ${entityName}:`, data);
                setter(Array.isArray(data) ? data.map(item => ({
                    ...item, 
                    id: item.id || item.sectorId 
                })) : []);
            } else {
                 const errorText = await response.text();
                 console.error(`[FETCH] ❌ Błąd HTTP dla ${entityName}: ${response.status}`, errorText);
                 setAlert({ type: 'error', message: `Błąd ładowania ${entityName}: ${response.status}. Sprawdź, czy serwer działa i token jest ważny.` });
                 setter([]);
            }
        } catch (error) {
             console.error(`[FETCH] ❌ Błąd połączenia dla ${entityName}:`, error);
             setAlert({ type: 'error', message: `Błąd połączenia z serwerem podczas ładowania ${entityName}.` });
             setter([]);
        }
    }, []);

    const fetchEmployeeWorkDetails = useCallback(async (userId) => {
    try {
        const headers = getAuthHeaders();
        const response = await fetch(`${BACKEND_URL}/api/work-details/user/${userId}/latest`, {
            method: 'GET',
            headers: headers,
        });

        if (response.ok) {
            const data = await response.json();
            return data;
        } else if (response.status === 204) {
            // Brak danych - domyślnie isPaidHourly = true
            return null;
        }
    } catch (error) {
        console.error(`[FETCH] Błąd pobierania WorkDetails dla użytkownika ${userId}:`, error);
        return null;
    }
}, []);

const fetchEmployees = useCallback(async () => {
    console.log('[FETCH] Rozpoczynam pobieranie pracowników');
    try {
        const headers = getAuthHeaders();
        const response = await fetch(`${BACKEND_URL}/api/users/active`, {
            method: 'GET',
            headers: headers,
        });

        if (response.ok) {
            const employeesData = await response.json();
            console.log('[FETCH] ✅ Załadowano pracowników:', employeesData);
            
            // Dla każdego pracownika pobierz jego WorkDetails
            const employeesWithDetails = await Promise.all(
                employeesData.map(async (emp) => {
                    const workDetails = await fetchEmployeeWorkDetails(emp.id);
                    return {
                        ...emp,
                        isPaidHourly: workDetails?.isPaidHourly !== false // domyślnie true
                    };
                })
            );
            
            console.log('[FETCH] ✅ Pracownicy z WorkDetails:', employeesWithDetails);
            setEmployees(employeesWithDetails);
        } else {
            const errorText = await response.text();
            console.error(`[FETCH] ❌ Błąd HTTP dla pracowników: ${response.status}`, errorText);
            setAlert({ type: 'error', message: `Błąd ładowania pracowników: ${response.status}` });
            setEmployees([]);
        }
    } catch (error) {
        console.error('[FETCH] ❌ Błąd połączenia dla pracowników:', error);
        setAlert({ type: 'error', message: 'Błąd połączenia z serwerem podczas ładowania pracowników.' });
        setEmployees([]);
    }
}, [fetchEmployeeWorkDetails]);

const fetchSectors = useCallback(async () => {
    await fetchData(setSectors, '/api/sectors', 'sektorów');
}, [fetchData]);

    useEffect(() => {
        fetchEmployees();
        fetchSectors();
    }, [fetchEmployees, fetchSectors]);

    const fetchWorkEntries = useCallback(async () => {
        console.log('[FETCH] Rozpoczynam pobieranie wpisów pracy');
        setIsLoading(true);
        
        try {
            const headers = getAuthHeaders();
            const response = await fetch(`${BACKEND_URL}/api/work-entries`, {
                method: 'GET',
                headers: headers,
            });

            console.log(`[FETCH] Odpowiedź serwera dla wpisów - Status: ${response.status}`);
            if (response.ok) {
                const data = await response.json();
                console.log('[FETCH] ✅ Załadowano wpisy pracy:', data);
                setWorkEntries(Array.isArray(data) ? data : []);
            } else {
                const errorText = await response.text();
                console.error(`[FETCH] ❌ Błąd HTTP dla wpisów: ${response.status}`, errorText);
                setAlert({ type: 'error', message: `Błąd ładowania wpisów: ${response.status}` });
                setWorkEntries([]);
            }
        } catch (error) {
            console.error('[FETCH] ❌ Błąd połączenia dla wpisów:', error);
            setAlert({ type: 'error', message: 'Błąd połączenia z serwerem podczas ładowania wpisów.' });
            setWorkEntries([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWorkEntries();
    }, [currentDate, fetchWorkEntries]);

    const parseApiError = async (response) => {
        let errorData = {
            status: response.status,
            error: response.statusText,
            message: 'Wystąpił nieoczekiwany błąd',
            timestamp: new Date().toISOString()
        };

        try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const json = await response.json();
                errorData = {
                    ...errorData,
                    error: json.error || json.title || errorData.error,
                    message: json.message || json.detail || errorData.message,
                    path: json.path,
                    timestamp: json.timestamp || errorData.timestamp
                };
            } else {
                const text = await response.text();
                errorData.message = text || errorData.message;
            }
        } catch (e) {
            console.error('Błąd parsowania odpowiedzi:', e);
        }

        return errorData;
    };

    const handleSaveBulkEntries = useCallback(async (entries) => {
        setIsLoading(true);
        closeAlert();

        const workDateString = bulkAssignDate ? new Date(bulkAssignDate).toISOString().split('T')[0] : null; 
        if (!workDateString) {
            setAlert({ type: 'error', message: 'Nie wybrano daty pracy.' });
            setIsLoading(false);
            return;
        }

        const entriesToSend = entries.map(entry => {
    const fullEmployee = employees.find(emp => emp.id === entry.employeeId);
    
    return {
        user: fullEmployee ? {
            id: fullEmployee.id,
            name: fullEmployee.name,
            surname: fullEmployee.surname,
            email: fullEmployee.email,
            nickname: fullEmployee.nickname,
            phoneNumber: fullEmployee.phoneNumber,
            active: fullEmployee.active
        } : { id: entry.employeeId },
        sector: entry.sectorId ? { 
            id: parseInt(entry.sectorId),
            sectorId: parseInt(entry.sectorId) 
        } : null,
        workType: entry.workType || null,
        workDate: workDateString,
        description: entry.description || '',
        isApproved: entry.isApproved,
        duration: parseFloat(entry.hours) || 0,
        daySalary: 0,
        kilogramsPicked: !entry.isPaidHourly ? parseFloat(entry.kilogramsPicked || 0) : 0,
    };
});
        console.log("Dane do wysłania do API:", entriesToSend);

        try {
            const headers = getAuthHeaders();
            const response = await fetch(`${BACKEND_URL}/api/work-entries`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(entriesToSend),
            });

            if (response.ok) {
                const data = await response.json();
                console.log("✅ Wpisy zapisane pomyślnie:", data);
                
                setIsModalOpen(false);
                setBulkAssignDate(null);
                setAlert({ 
                    type: 'success', 
                    message: `Zapisano ${entriesToSend.length} wpisów dla dnia ${new Date(bulkAssignDate).toLocaleDateString()}.` 
                });
                
                await fetchWorkEntries();
            } else {
                const errorData = await parseApiError(response);
                console.error("❌ Błąd API:", errorData);
                setCriticalError(errorData);
            }
        } catch (error) {
            console.error("❌ Błąd połączenia:", error);
            setCriticalError({
                status: 0,
                error: 'Błąd połączenia',
                message: 'Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe.',
                timestamp: new Date().toISOString()
            });
        } finally {
            setIsLoading(false);
        }
    }, [closeAlert, fetchWorkEntries, bulkAssignDate, employees, parseApiError]);

    const handleEditEntry = useCallback(async (updatedEntry) => {
        setIsLoading(true);
        
        try {
            
            const durationFloat = parseFloat(updatedEntry.duration || 0);

            const entryToSend = {
                
                user: updatedEntry.user, 
                
                sector: updatedEntry.sector?.id ? {
                    id: updatedEntry.sector.id,
                } : null,
                workType: updatedEntry.workType || null,
                workDate: updatedEntry.workDate, 
                duration: durationFloat,
                description: updatedEntry.description || '',
                isApproved: Boolean(updatedEntry.isApproved),
                daySalary: parseFloat(updatedEntry.daySalary) || 0, 
            };

            console.log("📤 Wysyłam dane do API (Z USEREM):", JSON.stringify(entryToSend, null, 2));
            
            const headers = getAuthHeaders();
            const response = await fetch(`${BACKEND_URL}/api/work-entries/${updatedEntry.entryId}`, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify(entryToSend),
            });

           
           if (response.ok) {
    

    console.log("✅ Wpis zaktualizowany pomyślnie (ominięto parsowanie JSON odpowiedzi).");
    
    await fetchWorkEntries(); 
    
    setIsEditModalOpen(false);
    setEditingEntry(null);
    setSelectedEntry(null);
    setAlert({ 
        type: 'success', 
        message: 'Wpis zaktualizowany pomyślnie.'
    });
            } else {
                const errorData = await parseApiError(response);
                console.error("❌ Błąd aktualizacji:", errorData);
                setAlert({ 
                    type: 'error', 
                    message: `Błąd aktualizacji: ${errorData.message}` 
                });
            }
        } catch (error) {
            console.error("❌ Błąd połączenia:", error);
            setAlert({ 
                type: 'error', 
                message: 'Błąd połączenia z serwerem' 
            });
        } finally {
            setIsLoading(false);
        }
    }, [fetchWorkEntries, parseApiError]);

    const handleDeleteEntry = useCallback(async (entryId) => {
        setIsLoading(true);
        
        try {
            const headers = getAuthHeaders();
            const response = await fetch(`${BACKEND_URL}/api/work-entries/${entryId}`, {
                method: 'DELETE',
                headers: headers,
            });

            if (response.ok) {
                const result = await response.json();
                console.log("✅ Wpis usunięty:", result);
                
                setWorkEntries(prev => prev.filter(e => e.entryId !== entryId));
                setSelectedEntry(null);
                
                setAlert({ 
                    type: 'success', 
                    message: 'Wpis usunięty pomyślnie' 
                });
            } else {
                const errorData = await parseApiError(response);
                console.error("❌ Błąd usuwania:", errorData);
                setAlert({ 
                    type: 'error', 
                    message: `Błąd usuwania: ${errorData.message}` 
                });
            }
        } catch (error) {
            console.error("❌ Błąd połączenia:", error);
            setAlert({ 
                type: 'error', 
                message: 'Błąd połączenia z serwerem' 
            });
        } finally {
            setIsLoading(false);
        }
    }, [parseApiError]);

const handleOpenEditModal = useCallback((entry) => {
        
        setEditingEntry({
            ...entry,
            hours: entry.duration || '',
            sectorId: entry.sector?.id || '',
            workType: entry.workType || '',
            daySalary: entry.daySalary !== undefined && entry.daySalary !== null ? parseFloat(entry.daySalary) : '', // Dodajemy do stanu, aby wysłać PUT
        });
        setSelectedEntry(null);
        setIsEditModalOpen(true);
    }, []);
    const handleToggleApproval = useCallback(async (entryId) => {
        const entry = workEntries.find(e => e.entryId === entryId);
        if (!entry) return;

        setIsLoading(true);
        const newApprovalStatus = !entry.isApproved;

        try {
            const headers = getAuthHeaders();
            const response = await fetch(`${BACKEND_URL}/api/work-entries/${entryId}/approval`, {
                method: 'PATCH',
                headers: headers,
                body: JSON.stringify({ isApproved: newApprovalStatus }),
            });

            if (response.ok) {
                const result = await response.json();
                console.log("✅ Zatwierdzenie zmienione:", result);
                
                setWorkEntries(prev => prev.map(e => 
                    e.entryId === entryId ? { ...e, isApproved: newApprovalStatus } : e
                ));
                setSelectedEntry(prev => 
                    prev && prev.entryId === entryId ? { ...prev, isApproved: newApprovalStatus } : prev
                );
                
                setAlert({ 
                    type: 'success', 
                    message: newApprovalStatus ? 'Wpis zatwierdzony' : 'Cofnięto zatwierdzenie' 
                });
            } else {
                const errorData = await parseApiError(response);
                console.error("❌ Błąd zmiany zatwierdzenia:", errorData);
                setAlert({ 
                    type: 'error', 
                    message: `Błąd: ${errorData.message}` 
                });
            }
        } catch (error) {
            console.error("❌ Błąd połączenia:", error);
            setAlert({ 
                type: 'error', 
                message: 'Błąd połączenia z serwerem' 
            });
        } finally {
            setIsLoading(false);
        }
    }, [workEntries, parseApiError]);

    const stats = useMemo(() => ({
        total: workEntries.length,
        approved: workEntries.filter(e => e.isApproved).length,
        pending: workEntries.filter(e => !e.isApproved).length,
        today: workEntries.filter(e => {
            const today = new Date().toDateString();
            return new Date(e.workDate).toDateString() === today;
        }).length
    }), [workEntries]);

    const handleOpenBulkAssignModal = (dateStr) => {
        setBulkAssignDate(dateStr);
        setSelectedEntry(null);
        setIsModalOpen(true);
    };

    const handleOpenDetailsModal = (entry) => {
        setSelectedEntry(entry);
    };
    
    const handleCloseModal = (alertType, alertMessage) => {
        setIsModalOpen(false);
        setBulkAssignDate(null);
        setSelectedEntry(null);
        if (alertType && alertMessage) {
             setAlert({ type: alertType, message: alertMessage });
        }
    };

    if (criticalError) {
        return (
            <ErrorPage
                error={criticalError}
                onRetry={() => setCriticalError(null)}
                onGoBack={() => setCriticalError(null)}
                onGoHome={() => {
                    setCriticalError(null);
                    setIsModalOpen(false);
                    setBulkAssignDate(null);
                }}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-lime-50 to-green-100 p-6 font-sans">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-2 flex items-center">
                        <Calendar className="text-green-600 mr-3" size={40} />
                        Planowanie Pracy Zespołów
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Planowanie tygodniowe i przypisywanie zadań/godzin do pracowników 🗓️
                    </p>
                </header>

                {alert.message && <Alert type={alert.type} message={alert.message} onClose={closeAlert} />}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard icon={Calendar} count={stats.total} label="Wszystkie Plany" color="green" />
                    <StatCard icon={CheckCircle} count={stats.approved} label="Zatwierdzone" color="blue" />
                    <StatCard icon={Clock} count={stats.pending} label="Oczekujące" color="amber" />
                    <StatCard icon={Users} count={stats.today} label="Dzisiaj" color="purple" />
                </div>
                                                
                <div className="mb-8">
                    <WeekCalendar
                        workEntries={workEntries}
                        onAddClick={handleOpenBulkAssignModal}
                        onEventClick={handleOpenDetailsModal}
                        onQuickApprove={handleToggleApproval}
                        currentDate={currentDate}
                        onDateChange={setCurrentDate}
                    />
                </div>

                <Modal
                    isOpen={isModalOpen && !!bulkAssignDate}
                    onClose={() => handleCloseModal()}
                    title={`Masowe przypisanie pracy: ${new Date(bulkAssignDate).toLocaleDateString()}`}
                    size="xlarge"
                >
                    <DailyWorkForm
                        date={bulkAssignDate}
                        employees={employees}
                        sectors={sectors}
                        onSave={handleSaveBulkEntries}
                        onCancel={handleCloseModal}
                        isLoading={isLoading}
                    />
                </Modal>
                
                {isEditModalOpen && editingEntry && (
                    <Modal
                        isOpen={isEditModalOpen}
                        onClose={() => {
                            setIsEditModalOpen(false);
                            setEditingEntry(null);
                        }}
                        title={`Edycja wpisu: ${editingEntry.user?.name} ${editingEntry.user?.surname}`}
                        size="large"
                    >
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                {editingEntry.user?.isPaidHourly !== false ? (
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">Godziny</label>
                                    <input 
                                        type="number" 
                                        step="0.5" 
                                        min="0" 
                                        max="24"
                                        value={editingEntry.duration || ''}
                                        onChange={(e) => setEditingEntry(prev => ({ ...prev, duration: parseFloat(e.target.value) }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                    />
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1 block">Godziny</label>
                                        <input 
                                            type="number" 
                                            step="0.5" 
                                            min="0" 
                                            max="24"
                                            value={editingEntry.duration || ''}
                                            onChange={(e) => setEditingEntry(prev => ({ ...prev, duration: parseFloat(e.target.value) }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1 block">Kilogramy</label>
                                        <input 
                                            type="number" 
                                            step="0.1" 
                                            min="0"
                                            value={editingEntry.kilogramsPicked || ''}
                                            onChange={(e) => setEditingEntry(prev => ({ ...prev, kilogramsPicked: parseFloat(e.target.value) }))}
                                            className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                        />
                                    </div>
                                </>
)}
                                
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">Wynagrodzenie (zł)</label>
                                    <p className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-800 font-bold">
                                        {parseFloat(editingEntry.daySalary).toFixed(2)} zł
                                    </p>
                                </div>
                                
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">Sektor</label>
                                    <select 
                                        value={editingEntry.sector?.id || ''}
                                        onChange={(e) => {
                                            const sector = sectors.find(s => s.id === parseInt(e.target.value));
                                            setEditingEntry(prev => ({ ...prev, sector: sector || null }));
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                    >
                                        <option value="">Brak</option>
                                        {sectors.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.description} ({s.plantType})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Typ pracy</label>
                                <select 
                                    value={editingEntry.workType || ''}
                                    onChange={(e) => setEditingEntry(prev => ({ ...prev, workType: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                >
                                    <option value="">Brak</option>
                                    {WORK_TYPE_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Opis</label>
                                <textarea
                                    value={editingEntry.description || ''}
                                    onChange={(e) => setEditingEntry(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                    rows="3"
                                    placeholder="Dodatkowe uwagi..."
                                />
                            </div>

                            <div className="flex space-x-3 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => {
                                        const durationHours = parseFloat(editingEntry.duration) || 0;
                                        
                                        const updatedEntry = {
                                            ...editingEntry,
                                            duration: durationHours,
                                        };
                                        
                                        console.log("🔧 Edytowany wpis przed wysłaniem:", updatedEntry);
                                        handleEditEntry(updatedEntry);
                                    }}
                                    disabled={isLoading}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl font-semibold transition-colors disabled:opacity-50"
                                >
                                    {isLoading ? 'Zapisywanie...' : 'Zapisz zmiany'}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditModalOpen(false);
                                        setEditingEntry(null);
                                    }}
                                    disabled={isLoading}
                                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-xl font-semibold transition-colors"
                                >
                                    Anuluj
                                </button>
                            </div>
                        </div>
                    </Modal>
                )}
                
                <EventDetailsModal
                    entry={selectedEntry}
                    onClose={() => handleCloseModal()}
                    onEdit={() => handleOpenEditModal(selectedEntry)}
                    onDelete={handleDeleteEntry}
                    onToggleApproval={handleToggleApproval}
                />
            </div>
        </div>
    );
}