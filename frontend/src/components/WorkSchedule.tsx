import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar, Clock, Users, DollarSign, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, X, Loader2 } from 'lucide-react';
import { BACKEND_URL, getAuthHeaders } from "../utils/apiConfigs";
import { Alert } from "../utils/common";

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

const StatCard = ({ icon: Icon, count, label, color, isCurrency = false }) => {
    const colorMap = {
        green: 'from-green-100 to-green-200 text-green-600',
        blue: 'from-blue-100 to-blue-200 text-blue-600',
        amber: 'from-amber-100 to-amber-200 text-amber-600',
        purple: 'from-purple-100 to-purple-200 text-purple-600',
        red: 'from-red-100 to-red-200 text-red-600',
        indigo: 'from-indigo-100 to-indigo-200 text-indigo-600'
    };
    
    return (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center space-x-4">
                <div className={`w-14 h-14 bg-gradient-to-br ${colorMap[color]} rounded-2xl flex items-center justify-center`}>
                    <Icon size={28} />
                </div>
                <div>
                    <p className="text-3xl font-extrabold text-gray-900">
                            {isCurrency ? `${parseFloat(count).toFixed(2)} zł` : count}
                    </p>
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
        isPaidHourly: emp.workDetails?.isPaidHourly !== false
    }))
);

    const updateEntry = useCallback((employeeId, field, value) => {
        setEntries(prev => prev.map(e => e.employeeId === employeeId ? { ...e, [field]: value } : e));
    }, []);

    const handleSubmit = () => {
    const valid = entries.filter(e => {
        const hasHours = e.hours && parseFloat(e.hours) > 0;
        if (e.employee.workDetails?.isPaidHourly) {
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
    if (e.employee.workDetails?.isPaidHourly) {
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
                {employees.map(emp => {
                    const entry = entries.find(e => e.employeeId === emp.id);
                    if (!entry) return null;

                    return (
                        <div key={entry.employeeId} className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-green-300 transition-colors">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                                <div className="md:col-span-3">
                                    <p className="font-bold text-gray-900">{entry.employee.name} {entry.employee.surname}</p>
                                    {entry.employee.nickname && <p className="text-xs text-gray-500 italic">"{entry.employee.nickname}"</p>}
                                </div>

                                {entry.employee.workDetails?.isPaidHourly ? (
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
                    );
                })}
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-1">
                    Pracowników z danymi: <span className="font-bold text-green-600">{filledCount} / {employees.length}</span>
                </p>
                <p className="text-sm text-gray-600 mb-1">
                    Suma godzin: <span className="font-bold text-blue-600">{totalHours.toFixed(1)}h</span>
                </p>
                {totalKilograms > 0 && (
                    <p className="text-sm text-gray-600">
                        Suma kilogramów: <span className="font-bold text-orange-600">{totalKilograms.toFixed(1)} kg</span>
                    </p>
                )}
            </div>
            <div className="flex space-x-3 pt-2">
                <button onClick={handleSubmit} disabled={isLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center shadow-md">
                    {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> : <DollarSign className="mr-2" size={20} />}
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

const CalendarEvent = ({ entry, onClick, onTogglePaid }) => {
    const paidClass = entry.isPaid ? 'bg-emerald-100 border-emerald-400 text-emerald-800' : 'bg-amber-100 border-amber-400 text-amber-800';
    
    return (
        <div 
            onClick={onClick}
            className={`${paidClass} border-l-4 rounded-lg p-2 cursor-pointer hover:shadow-md transition-all text-xs mb-1`}
        >
            <div className="flex items-center justify-between">
                <span className="font-bold truncate text-xs">{entry.user?.name} {entry.user?.surname?.[0]}.</span>
                <div className="flex items-center space-x-1">
                    <button onClick={(e) => { e.stopPropagation(); onTogglePaid(entry.entryId); }}
                        className={`p-1 rounded transition-colors text-sm ${entry.isPaid ? 'text-amber-700 hover:bg-amber-200' : 'text-emerald-700 hover:bg-emerald-200'}`}
                        title={entry.isPaid ? 'Anuluj płatność (Oznacz jako nieopłacone)' : 'Oznacz jako opłacone'}>
                        {entry.isPaid ? '❌' : '💵'}
                    </button>
                </div>
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
};


const WeekCalendar = ({ workEntries, onAddClick, onEventClick, onTogglePaid, currentDate, onDateChange }) => {
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
    const dateStr = formatDateToLocal(date);
    return workEntries.filter(entry => formatDateToLocal(new Date(entry.workDate)) === dateStr);
}, [workEntries]);

    const isToday = useCallback((date) => date.toDateString() === new Date().toDateString(), []);

    const navigate = (days) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + days);
        onDateChange(newDate);
    };
    const formatDateToLocal = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
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
                    const totalSalary = entries.reduce((sum, e) => sum + (parseFloat(e.daySalary) || 0), 0); 
                    const dateStr = formatDateToLocal(day);
                    
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
                                            {entries.map(e => <CalendarEvent key={e.entryId} entry={e} onClick={() => onEventClick(e)} onTogglePaid={onTogglePaid} />)}
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

// ZAKTUALIZOWANY KOMPONENT: AdvancePayModal
const AdvancePayModal = ({ isOpen, onClose, employee, onConfirm, isLoading }) => {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setAmount('');
            setDescription('');
        }
    }, [isOpen]);

    if (!isOpen || !employee) return null;

    const handleSubmit = () => {
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            alert('Podaj prawidłową kwotę zaliczki większą od 0.');
            return;
        }
        onConfirm(employee.id, amountNum, description);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Wypłata zaliczki dla: ${employee.name} ${employee.surname}`} size="medium">
            <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-300 rounded-xl p-4">
                    <h3 className="text-base font-medium text-blue-800 flex items-center mb-2">
                        <DollarSign className="mr-2 text-blue-600" size={20} /> Wypłata zaliczki
                    </h3>
                    <p className="text-sm text-blue-700">
                        Wypłać pracownikowi część należności jako zaliczkę. Kwota ta zostanie odliczona od kolejnej wypłaty.
                    </p>
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Kwota zaliczki (zł) *</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="np. 500.00"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-lg font-bold"
                    />
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Opis (opcjonalnie)</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="np. Zaliczka na poczet wypłaty tygodniowej..."
                        rows="3"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                </div>

                <div className="mt-6 flex space-x-3">
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !amount || parseFloat(amount) <= 0}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center shadow-md"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        ) : (
                            <DollarSign className="mr-2" size={20} />
                        )}
                        {isLoading ? 'Przetwarzanie...' : 'Potwierdź wypłatę zaliczki'}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-xl font-semibold transition-colors"
                    >
                        Anuluj
                    </button>
                </div>
            </div>
        </Modal>
    );
};

// ZAKTUALIZOWANY KOMPONENT: EventDetailsModal
const EventDetailsModal = ({ entry, onClose, onEdit, onDelete, onTogglePaid, onOpenPayAllModal, onOpenPayAllMonthModal, onOpenAdvancePayModal }) => {
    if (!entry) return null;

    return (
        <Modal isOpen={!!entry} onClose={onClose} title={`Szczegóły wpisu dla: ${entry.user?.name} ${entry.user?.surname}`} size="medium">
            <div className="space-y-4">
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
                    <button onClick={() => onEdit(entry)} className="flex-1 bg-blue-100 text-blue-700 hover:bg-blue-200 py-2 px-4 rounded-lg font-medium transition-colors">
                        <Edit2 className="inline mr-1" size={16} /> Edytuj
                    </button>
                    <button onClick={() => confirm('Czy na pewno chcesz usunąć ten wpis?') && onDelete(entry.entryId)}
                        className="flex-1 bg-red-100 text-red-700 hover:bg-red-200 py-2 px-4 rounded-lg font-medium transition-colors">
                        <Trash2 className="inline mr-1" size={16} /> Usuń
                    </button>
                </div>
                    
                <div className={`p-4 rounded-xl border ${entry.isPaid ? 'bg-emerald-50 border-emerald-300' : 'bg-amber-50 border-amber-300'}`}>
                    <div className="flex items-center justify-between">
                        <div className="mt-1">
                            <p className="text-xs font-medium text-gray-600 uppercase mb-1">Status płatności</p>
                            <p className={`text-base font-bold ${entry.isPaid ? 'text-emerald-700' : 'text-amber-700'}`}>
                                {entry.isPaid ? '✅ Zapłacono' : '🟡 Niezapłacono'}
                            </p>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => onTogglePaid(entry.entryId)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                    entry.isPaid 
                                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                }`}
                            >
                                {entry.isPaid ? '❌ Oznacz jako niezapłacone' : '💵 Oznacz jako zapłacone'}
                            </button>
                        </div>
                    </div>
                    {/* ZAKTUALIZOWANY BLOK PRZYCISKÓW MASOWEJ PŁATNOŚCI */}
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                    <p className="text-xs font-medium text-gray-500 uppercase">Szybkie płatności dla pracownika:</p>
                    <div className="grid grid-cols-2 gap-2">
                        <button 
                            onClick={() => onOpenPayAllModal(entry.user?.id)}
                            className="w-full py-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg text-sm font-medium transition-colors"
                        >
                            Zapłać za wszystko (zaległe)
                        </button>
                        <button 
                            onClick={() => onOpenPayAllMonthModal(entry.user?.id)}
                            className="w-full py-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg text-sm font-medium transition-colors"
                        >
                            Zapłać za miesiąc
                        </button>
                    </div>
                    <button 
                        onClick={() => onOpenAdvancePayModal(entry.user?.id)}
                        className="w-full py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                    >
                        <DollarSign size={16} className="mr-2" /> Wypłać część (zaliczka)
                    </button>
                </div>
                </div>
            </div>
        </Modal>
    );
};


const PayConfirmationModal = ({ isOpen, onClose, employee, entries, totalGrossAmount, advances, netAmount, paymentType, onConfirm, isLoading }) => {
    if (!isOpen || !employee || entries.length === 0) return null;
    
    const isMonthPayment = paymentType === 'month';
    const title = isMonthPayment 
        ? `Potwierdź płatność za cały miesiąc dla: ${employee.name} ${employee.surname}` 
        : `Potwierdź płatność za wszystkie zaległe wpisy dla: ${employee.name} ${employee.surname}`;
        
    const description = isMonthPayment
        ? `Ta operacja oznaczy wszystkie: ${entries.length} nieopłacone wpisy z bieżącego miesiąca jako opłacone.`
        : `Ta operacja oznaczy wszystkie: ${entries.length} nieopłacone wpisy do dzisiaj jako opłacone.`;

    const confirmButtonText = isLoading 
        ? 'Przetwarzanie...' 
        : isMonthPayment ? 'Potwierdź zapłatę za miesiąc' : 'Potwierdź zapłatę za wszystko';
        
    const listTitle = isMonthPayment ? 'Lista wpisów z bieżącego miesiąca:' : 'Lista wszystkich zaległych wpisów:';

    const totalAdvanceAmount = advances.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="medium">
            <div className="space-y-4">
                <div className="bg-red-50 border border-red-300 rounded-xl p-4">
                    <p className="text-sm font-medium text-red-700 mb-2">
                        ⚠️ WAŻNE: Upewnij się, że płatność została faktycznie wykonana.
                    </p>
                </div>

                <div className="bg-amber-50 border border-amber-300 rounded-xl p-4">
                    <h3 className="text-base font-medium text-amber-800 flex items-center mb-2">
                        <DollarSign className="mr-2" size={20} /> Podsumowanie Płatności
                    </h3>
                    <p className="text-sm text-amber-700">{description}</p>
                    
                    <div className="mt-3 flex justify-between items-center">
                        <span className="text-sm text-amber-800 font-medium">Łączne wynagrodzenie: </span>
                        <span className="text-lg font-extrabold text-amber-800">{totalGrossAmount.toFixed(2)} zł</span>
                    </div>

                    {totalAdvanceAmount > 0 && (
                        <div className="mt-1 flex justify-between items-center border-t border-amber-300 pt-2">
                            <span className="text-sm text-red-700 font-medium">Odliczone zaliczki:</span>
                            <span className="text-lg font-extrabold text-red-700">-{totalAdvanceAmount.toFixed(2)} zł</span>
                        </div>
                    )}
                    
                    <div className="mt-3 flex justify-between items-center border-t border-amber-300 pt-2">
                        <span className="text-lg text-green-700 font-bold">Kwota do zapłaty:</span>
                        <span className="text-2xl font-extrabold text-green-700">{netAmount.toFixed(2)} zł</span>
                    </div>
                </div>

                {advances.length > 0 && (
                    <div className="max-h-40 overflow-y-auto space-y-2 p-2 border border-blue-200 rounded-xl bg-blue-50">
                        <p className="text-sm font-medium text-blue-700 flex items-center">
                            <DollarSign size={16} className="mr-1" /> Nieuregulowane zaliczki:
                        </p>
                        {advances.map(advance => (
                            <div key={advance.id} className="flex justify-between items-center text-xs p-2 bg-blue-100 rounded-lg border-l-4 border-blue-400">
                                <span>{new Date(advance.createdAt).toLocaleDateString()} - {advance.description || 'Brak opisu'}</span>
                                <span className="font-bold text-red-700">-{parseFloat(advance.amount).toFixed(2)} zł</span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="max-h-60 overflow-y-auto space-y-2 p-2 border border-gray-200 rounded-xl bg-white">
                    <p className="text-sm font-medium text-gray-700">{listTitle}</p>
                    {entries.map(entry => (
                        <div key={entry.entryId} className="flex justify-between items-center text-xs p-2 bg-gray-50 rounded-lg border-l-4 border-amber-400">
                            <span>{new Date(entry.workDate).toLocaleDateString()} - {entry.duration}h</span>
                            <span className="font-bold text-amber-700">{parseFloat(entry.daySalary).toFixed(2)} zł</span>
                        </div>
                    ))}
                </div>

                <div className="mt-6 flex space-x-3">
                    <button
                        onClick={onConfirm}
                        disabled={isLoading || entries.length === 0}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center shadow-md"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        ) : (
                            <DollarSign className="mr-2" size={20} />
                        )}
                        {confirmButtonText}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-xl font-semibold transition-colors"
                    >
                        Anuluj
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
    
    const [isPayAllModalOpen, setIsPayAllModalOpen] = useState(false);
    const [selectedEmployeeForPayment, setSelectedEmployeeForPayment] = useState(null);
    const [paymentModalType, setPaymentModalType] = useState('all');
    const [unpaidEntriesForPayment, setUnpaidEntriesForPayment] = useState([]);
    const [unsettledAdvances, setUnsettledAdvances] = useState([]); 

    const [isAdvancePayModalOpen, setIsAdvancePayModalOpen] = useState(false);
    const [selectedEmployeeForAdvance, setSelectedEmployeeForAdvance] = useState(null);


    const closeAlert = useCallback(() => setAlert({ type: '', message: '' }), []);

    const fetchData = useCallback(async (setter, endpoint, entityName) => {
        try {
            const headers = getAuthHeaders();
            
            const response = await fetch(`${BACKEND_URL}${endpoint}`, {
                method: 'GET',
                headers: headers,
            });

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
            console.log('[FETCH] ✅ Pracownicy:', employeesData);
            
            // Pobierz workDetails dla każdego pracownika
            const employeesWithDetails = await Promise.all(
                employeesData.map(async (emp) => {
                    try {
                        const detailsResponse = await fetch(
                            `${BACKEND_URL}/api/work-details/user/${emp.id}/latest`,
                            { method: 'GET', headers: headers }
                        );
                        
                        if (detailsResponse.ok) {
                            const workDetails = await detailsResponse.json();
                            console.log(`[FETCH] ✅ WorkDetails dla ${emp.name}:`, workDetails);
                            return { ...emp, workDetails };
                        } else {
                            console.warn(`[FETCH] ⚠️ Brak workDetails dla ${emp.name}`);
                            return { ...emp, workDetails: null };
                        }
                    } catch (error) {
                        console.error(`[FETCH] ❌ Błąd workDetails dla ${emp.name}:`, error);
                        return { ...emp, workDetails: null };
                    }
                })
            );
            
            console.log('[FETCH] ✅ Pracownicy z workDetails:', employeesWithDetails);
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
}, []);
    const fetchSectors = useCallback(async () => {
        await fetchData(setSectors, '/api/sectors', 'sektorów');
    }, [fetchData]);

    const fetchUnsettledAdvances = useCallback(async (userId) => {
        try {
            const headers = getAuthHeaders();
            const response = await fetch(`${BACKEND_URL}/api/advances/user/${userId}/unsettled`, {
                method: 'GET',
                headers: headers,
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`✅ Załadowano ${data.length} nieuregulowanych zaliczek dla pracownika ${userId}`);
                setUnsettledAdvances(data);
            } else {
                console.error(`❌ Błąd pobierania nieuregulowanych zaliczek: ${response.status}`);
                setUnsettledAdvances([]);
            }
        } catch (error) {
            console.error("❌ Błąd połączenia (zaliczki):", error);
            setUnsettledAdvances([]);
        }
    }, []);

    useEffect(() => {
        fetchEmployees();
        fetchSectors();
    }, [fetchEmployees, fetchSectors]);

    const fetchWorkEntries = useCallback(async () => {
        console.log('[FETCH] Rozpoczynam pobieranie wpisów pracy dla tygodnia');
        setIsLoading(true);
        
        try {
            const startOfWeek = new Date(currentDate);
            startOfWeek.setHours(0, 0, 0, 0);
            const day = (startOfWeek.getDay() + 6) % 7;
            startOfWeek.setDate(startOfWeek.getDate() - day);
            
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);
            
            const formatDate = (date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };
            
            const startDateStr = formatDate(startOfWeek);
            const endDateStr = formatDate(endOfWeek);
            
            console.log(`[FETCH] Pobieranie wpisów od ${startDateStr} do ${endDateStr}`);
            
            const headers = getAuthHeaders();
            const response = await fetch(
                `${BACKEND_URL}/api/work-entries/week?startDate=${startDateStr}&endDate=${endDateStr}`, 
                {
                    method: 'GET',
                    headers: headers,
                }
            );

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
    }, [currentDate]);

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
            duration: parseFloat(entry.hours) || 0,
            daySalary: 0,
            kilogramsPicked: !entry.employee.workDetails?.isPaidHourly ? parseFloat(entry.kilogramsPicked || 0) : 0,
            isPaid: false,
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
            
            const durationFloat = parseFloat(updatedEntry.duration) || 0;

            const entryToSend = {
                user: updatedEntry.user, 
                sector: updatedEntry.sector?.id ? {
                    id: updatedEntry.sector.id,
                } : null,
                workType: updatedEntry.workType || null,
                workDate: updatedEntry.workDate, 
                duration: durationFloat,
                description: updatedEntry.description || '',
                daySalary: parseFloat(updatedEntry.daySalary) || 0,
                isPaid: Boolean(updatedEntry.isPaid),
                kilogramsPicked: parseFloat(updatedEntry.kilogramsPicked) || 0
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
            duration: entry.duration || 0,
            sectorId: entry.sector?.id || '',
            workType: entry.workType || '',
            daySalary: entry.daySalary !== undefined && entry.daySalary !== null ? parseFloat(entry.daySalary) : 0,
            isPaid: Boolean(entry.isPaid),
            kilogramsPicked: entry.kilogramsPicked || 0,
        });
        setSelectedEntry(null);
        setIsEditModalOpen(true);
    }, []);

    const handleTogglePaid = useCallback(async (entryId) => {
    const entry = workEntries.find(e => e.entryId === entryId);
    if (!entry) return;

    setIsLoading(true);
    const newPaidStatus = !entry.isPaid;

    try {
        const headers = getAuthHeaders();
        const response = await fetch(`${BACKEND_URL}/api/work-entries/${entryId}/paid`, {
            method: 'PATCH',
            headers: headers,
            body: JSON.stringify({ isPaid: newPaidStatus }),
        });

        if (response.ok) {
            setWorkEntries(prev => prev.map(e => 
                e.entryId === entryId ? { ...e, isPaid: newPaidStatus } : e
            ));
            setSelectedEntry(prev => 
                prev && prev.entryId === entryId ? { ...prev, isPaid: newPaidStatus } : prev
            );
            
            setAlert({ 
                type: 'success', 
                message: newPaidStatus ? '✅ Oznaczono jako zapłacone' : '❌ Oznaczono jako niezapłacone' 
            });
        } else {
            const errorData = await parseApiError(response);
            console.error("❌ Błąd zmiany statusu płatności:", errorData);
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


const handlePayAllForEmployee = useCallback(async (userId) => {
    setIsLoading(true);
    closeAlert();

    try {
        const headers = getAuthHeaders();
        // Endpoint do płacenia za wszystko (i rozliczania zaliczek)
        const response = await fetch(`${BACKEND_URL}/api/work-entries/user/${userId}/pay-all-and-settle`, { 
            method: 'PATCH',
            headers: headers,
        });

        if (response.ok) {
            const result = await response.json();
            console.log(`✅ Zmiana statusu płatności na opłacone dla pracownika ${userId}:`, result);
            
            await fetchWorkEntries();
            handleClosePayAllModal();
            
            setAlert({
                type: 'success',
                message: `✅ Pomyślnie rozliczono zaległe wpisy`,
            });
        } else {
            const errorData = await parseApiError(response);
            console.error("❌ Błąd masowej płatności:", errorData);
            setAlert({
                type: 'error',
                message: `Błąd masowej płatności: ${errorData.message}`
            });
        }
    } catch (error) {
        console.error("❌ Błąd połączenia:", error);
        setAlert({
            type: 'error',
            message: 'Błąd połączenia z serwerem podczas płatności.'
        });
    } finally {
        setIsLoading(false);
    }
}, [closeAlert, fetchWorkEntries, parseApiError]);


    const stats = useMemo(() => {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setHours(0, 0, 0, 0);
        const day = (startOfWeek.getDay() + 6) % 7; 
        startOfWeek.setDate(startOfWeek.getDate() - day);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const weeklyEntries = workEntries.filter(e => {
            const workDate = new Date(e.workDate);
            return workDate >= startOfWeek && workDate <= endOfWeek;
        });

        const totalSalaryWeek = weeklyEntries.reduce((sum, e) => sum + (parseFloat(e.daySalary) || 0), 0);

        return {
            total: weeklyEntries.length,
            paid: weeklyEntries.filter(e => e.isPaid).length, 
            unpaid: weeklyEntries.filter(e => !e.isPaid).length,
            totalSalaryWeek: totalSalaryWeek
        };
    }, [workEntries, currentDate]);

    const fetchUnpaidEntriesForEmployee = useCallback(async (userId) => {
        try {
            const headers = getAuthHeaders();
            const response = await fetch(`${BACKEND_URL}/api/work-entries/user/${userId}/unpaid`, {
                method: 'GET',
                headers: headers,
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`✅ Załadowano ${data.length} nieopłaconych wpisów dla pracownika ${userId}`);
                setUnpaidEntriesForPayment(data);
            } else {
                console.error(`❌ Błąd pobierania nieopłaconych wpisów: ${response.status}`);
                setUnpaidEntriesForPayment([]);
            }
        } catch (error) {
            console.error("❌ Błąd połączenia:", error);
            setUnpaidEntriesForPayment([]);
        }
    }, []);

    // ZAKTUALIZOWANA LOGIKA: Obliczanie kwoty do zapłaty z uwzględnieniem zaliczek
    const employeeEntriesForPayment = useMemo(() => {
        if (!selectedEmployeeForPayment) return { entries: [], totalGrossAmount: 0, advances: [], netAmount: 0 };
        
        const today = new Date();
        today.setHours(23, 59, 59, 999); 
        
        let filteredEntries = [];
        
        if (paymentModalType === 'month') {
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            startOfMonth.setHours(0, 0, 0, 0);
            
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            endOfMonth.setHours(23, 59, 59, 999);

            filteredEntries = unpaidEntriesForPayment.filter(e => {
                const workDate = new Date(e.workDate);
                return workDate >= startOfMonth && workDate <= endOfMonth;
            });
        } else { 
            filteredEntries = unpaidEntriesForPayment.filter(e => {
                const workDate = new Date(e.workDate);
                return workDate <= today;
            });
        }

        const totalGrossAmount = filteredEntries.reduce((sum, e) => sum + (parseFloat(e.daySalary) || 0), 0);
        
        const totalAdvanceAmount = unsettledAdvances.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);
        
        const netAmount = Math.max(0, totalGrossAmount - totalAdvanceAmount);

        return { 
            entries: filteredEntries, 
            totalGrossAmount: totalGrossAmount,
            advances: unsettledAdvances,
            netAmount: netAmount
        };
    }, [unpaidEntriesForPayment, unsettledAdvances, selectedEmployeeForPayment, paymentModalType]);

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
        setIsEditModalOpen(false); 
        setEditingEntry(null);
        if (alertType && alertMessage) {
             setAlert({ type: alertType, message: alertMessage });
        }
    };

    const handleClosePayAllModal = () => {
        setIsPayAllModalOpen(false);
        setSelectedEmployeeForPayment(null);
        setPaymentModalType('all');
        setUnpaidEntriesForPayment([]);
        setUnsettledAdvances([]); // ZEROWANIE ZALICZEK
    };

    const handleCloseAdvancePayModal = () => {
        setIsAdvancePayModalOpen(false);
        setSelectedEmployeeForAdvance(null);
    };

    const handlePayAllForMonth = useCallback(async (userId) => {
        setIsLoading(true);
        closeAlert();

        try {
            const headers = getAuthHeaders();
            // Endpoint do płacenia za miesiąc (i rozliczania zaliczek)
            const response = await fetch(`${BACKEND_URL}/api/work-entries/user/${userId}/pay-month-and-settle`, { 
                method: 'PATCH',
                headers: headers,
            });

            if (response.ok) {
                const result = await response.json();
                console.log(`✅ Zmiana statusu płatności na opłacone za miesiąc dla pracownika ${userId}:`, result);
                
                await fetchWorkEntries();
                handleClosePayAllModal();
                
                setAlert({
                    type: 'success',
                    message: `✅ Pomyślnie opłacono potrzebne wpisy z obecnego miesiąca`,
                });
            } else {
                const errorData = await parseApiError(response);
                console.error("❌ Błąd masowej płatności za miesiąc:", errorData);
                setAlert({
                    type: 'error',
                    message: `Błąd masowej płatności za miesiąc: ${errorData.message}`
                });
            }
        } catch (error) {
            console.error("❌ Błąd połączenia:", error);
            setAlert({
                type: 'error',
                message: 'Błąd połączenia z serwerem podczas płatności.'
            });
        } finally {
            setIsLoading(false);
        }
    }, [closeAlert, fetchWorkEntries, parseApiError]);

    // ZAKTUALIZOWANA FUNKCJA: Otwieranie Modalu Płatności - Pobieranie Zaliczek
    const handleOpenPayAllModal = useCallback((employeeId) => {
        const employee = employees.find(e => e.id === Number(employeeId));
        if (employee) {
            setSelectedEmployeeForPayment(employee);
            setPaymentModalType('all');
            setIsPayAllModalOpen(true);
            setSelectedEntry(null);
            fetchUnpaidEntriesForEmployee(employee.id);
            fetchUnsettledAdvances(employee.id); // POBIERZ ZALICZKI
        } else {
            setAlert({ type: 'error', message: 'Nie znaleziono pracownika.' });
        }
    }, [employees, fetchUnpaidEntriesForEmployee, fetchUnsettledAdvances]);

    // ZAKTUALIZOWANA FUNKCJA: Otwieranie Modalu Płatności za miesiąc - Pobieranie Zaliczek
    const handleOpenPayAllMonthModal = useCallback((employeeId) => {
        const employee = employees.find(e => e.id === Number(employeeId));
        if (employee) {
            setSelectedEmployeeForPayment(employee);
            setPaymentModalType('month');
            setIsPayAllModalOpen(true);
            setSelectedEntry(null);
            fetchUnpaidEntriesForEmployee(employee.id);
            fetchUnsettledAdvances(employee.id); // POBIERZ ZALICZKI
        } else {
            setAlert({ type: 'error', message: 'Nie znaleziono pracownika.' });
        }
    }, [employees, fetchUnpaidEntriesForEmployee, fetchUnsettledAdvances]);

    const handleConfirmPayment = () => {
        if (!selectedEmployeeForPayment) return;
        
        if (paymentModalType === 'month') {
            handlePayAllForMonth(selectedEmployeeForPayment.id);
        } else {
            handlePayAllForEmployee(selectedEmployeeForPayment.id);
        }
    };
    
    const handleOpenAdvancePayModal = useCallback((employeeId) => {
        const employee = employees.find(e => e.id === Number(employeeId));
        if (employee) {
            setSelectedEmployeeForAdvance(employee);
            setIsAdvancePayModalOpen(true);
            setSelectedEntry(null);
        } else {
            setAlert({ type: 'error', message: 'Nie znaleziono pracownika dla zaliczki.' });
        }
    }, [employees]);

    // ZAKTUALIZOWANA FUNKCJA: Potwierdzenie Wypłaty Zaliczki (API CALL) - DODANIE ODŚWIEŻANIA ZALICZEK
    const handleConfirmAdvancePayment = useCallback(async (userId, amount, description) => {
        setIsLoading(true);
        closeAlert();

        try {
            const headers = getAuthHeaders();
            const response = await fetch(`${BACKEND_URL}/api/advances`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ 
                    userId: userId, 
                    amount: amount, 
                    description: description,
                    advanceDate: new Date().toISOString().split('T')[0]
                }),
            });

            if (response.ok) {
                
                handleCloseAdvancePayModal();
                setAlert({
                    type: 'success',
                    message: `✅ Pomyślnie zapisano zaliczkę ${amount.toFixed(2)} zł dla pracownika.`,
                });
                // Odświeżamy listę zaliczek, aby była gotowa, jeśli użytkownik od razu otworzy modal płatności.
                fetchUnsettledAdvances(userId);
                
            } else {
                const errorData = await parseApiError(response);
                console.error("❌ Błąd zapisu zaliczki:", errorData);
                setAlert({
                    type: 'error',
                    message: `Błąd zapisu zaliczki: ${errorData.message}`
                });
            }
        } catch (error) {
            console.error("❌ Błąd połączenia:", error);
            setAlert({
                type: 'error',
                message: 'Błąd połączenia z serwerem podczas zapisu zaliczki.'
            });
        } finally {
            setIsLoading(false);
        }
    }, [closeAlert, parseApiError, fetchUnsettledAdvances]);


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
                    <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
                        <Calendar className="text-green-600 mr-3" size={40} />
                        Planowanie Pracy Zespołów
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Planowanie tygodniowe i przypisywanie zadań/godzin do pracowników 🗓️
                    </p>
                </header>

                {alert.message && <Alert type={alert.type} message={alert.message} onClose={closeAlert} />}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard icon={Calendar} count={stats.total} label="Wpisy w tygodniu" color="green" />
                    <StatCard icon={Clock} count={stats.unpaid} label="Nieopłacone w tygodniu" color="red" />
                    <StatCard icon={Users} count={stats.paid} label="Opłacone w tygodniu" color="purple" />
                    <StatCard 
                        icon={DollarSign} 
                        count={stats.totalSalaryWeek} 
                        label="Tygodniowe wynagrodzenie" 
                        color="indigo" 
                        isCurrency={true} 
                    />
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
                        onClose={() => handleCloseModal()}
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

                            <div className={`p-4 rounded-xl border mt-4 ${editingEntry.isPaid ? 'bg-emerald-50 border-emerald-300' : 'bg-amber-50 border-amber-300'}`}>
                                <div className="flex items-center justify-between">
                                    <div className="mt-1">
                                        <p className="text-xs font-medium text-gray-600 uppercase mb-1">Status płatności</p>
                                        <p className={`text-base font-bold ${editingEntry.isPaid ? 'text-emerald-700' : 'text-amber-700'}`}>
                                            {editingEntry.isPaid ? '✅ Zapłacono' : '🟡 Niezapłacono'}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setEditingEntry(prev => ({ ...prev, isPaid: !prev.isPaid }))}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                            editingEntry.isPaid 
                                                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                                                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                        }`}
                                    >
                                        {editingEntry.isPaid ? '❌ Oznacz jako niezapłacone' : '💵 Oznacz jako zapłacone'}
                                    </button>
                                </div>
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
                                    onClick={() => handleCloseModal()}
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
                    onEdit={handleOpenEditModal}
                    onDelete={handleDeleteEntry}
                    onTogglePaid={handleTogglePaid}
                    onOpenPayAllModal={handleOpenPayAllModal}
                    onOpenPayAllMonthModal={handleOpenPayAllMonthModal}
                    onOpenAdvancePayModal={handleOpenAdvancePayModal}
                />

                <PayConfirmationModal
                    isOpen={isPayAllModalOpen}
                    onClose={handleClosePayAllModal}
                    employee={selectedEmployeeForPayment}
                    entries={employeeEntriesForPayment.entries}
                    totalGrossAmount={employeeEntriesForPayment.totalGrossAmount}
                    advances={employeeEntriesForPayment.advances}
                    netAmount={employeeEntriesForPayment.netAmount}
                    paymentType={paymentModalType}
                    onConfirm={handleConfirmPayment}
                    isLoading={isLoading}
                />

                {/* KOMPONENT MODALU ZALICZKI */}
                <AdvancePayModal
                    isOpen={isAdvancePayModalOpen}
                    onClose={handleCloseAdvancePayModal}
                    employee={selectedEmployeeForAdvance}
                    onConfirm={handleConfirmAdvancePayment} 
                    isLoading={isLoading}
                />
            </div>
        </div>
    );
}