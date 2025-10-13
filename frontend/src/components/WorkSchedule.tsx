import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar, Clock, Users, CheckCircle, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';

const BACKEND_URL = 'http://localhost:8091';
const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
});


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

    const sizeClasses = {
        small: 'max-w-md',
        medium: 'max-w-2xl',
        large: 'max-w-4xl',
        xlarge: 'max-w-6xl'
    };

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

const DailyWorkForm = ({ date, employees, sectors, tasks, onSave, onCancel, isLoading }) => {
    const [employeeEntries, setEmployeeEntries] = useState(() => 
        employees.map(emp => ({
            employeeId: emp.id, 
            employee: emp,
            hours: '',
            sectorId: '',
            taskIds: [],
            description: '',
            isApproved: true
        }))
    );

    const updateEmployee = (employeeId, field, value) => {
        setEmployeeEntries(prev => prev.map(entry => 
            entry.employeeId === employeeId 
                ? { ...entry, [field]: value }
                : entry
        ));
    };

    const toggleTask = (employeeId, taskId) => {
        setEmployeeEntries(prev => prev.map(entry => {
            if (entry.employeeId === employeeId) {
                const taskIds = entry.taskIds.includes(taskId)
                    ? entry.taskIds.filter(id => id !== taskId)
                    : [...entry.taskIds, taskId];
                return { ...entry, taskIds };
            }
            return entry;
        }));
    };

    const handleSubmit = () => {
        const validEntries = employeeEntries.filter(entry => entry.hours && parseFloat(entry.hours) > 0);
        
        if (validEntries.length === 0) {
            
            console.error('Podaj godziny pracy dla co najmniej jednego pracownika');
            onCancel('warning', 'Podaj godziny pracy dla co najmniej jednego pracownika');
            return;
        }

        onSave(validEntries);
    };

    const quickFillAll = (field, value) => {
        setEmployeeEntries(prev => prev.map(entry => ({ ...entry, [field]: value })));
    };

    return (
        <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-lg font-bold text-green-800">
                    📅 {new Date(date).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm font-bold text-blue-800 mb-3">⚡ Szybkie wypełnienie dla wszystkich:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                        <label className="text-xs text-gray-600 mb-1 block">Godziny</label>
                        <div className="flex gap-2">
                            {[4, 6, 8].map(h => (
                                <button
                                    key={h}
                                    onClick={() => quickFillAll('hours', h.toString())}
                                    className="flex-1 bg-white hover:bg-blue-100 border border-blue-300 rounded-lg py-2 text-sm font-bold transition-colors"
                                >
                                    {h}h
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-gray-600 mb-1 block">Sektor</label>
                        <select
                            onChange={(e) => quickFillAll('sectorId', e.target.value)}
                            className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm"
                        >
                            <option value="">Wybierz...</option>
                            {sectors.map(sector => (
                                <option key={sector.id} value={sector.id}>
                                    {sector.description}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Lista pracowników */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {employeeEntries.map(entry => (
                    <div key={entry.employeeId} className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-green-300 transition-colors">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                            {/* Imię i nazwisko */}
                            <div className="md:col-span-3">
                                <p className="font-bold text-gray-900">{entry.employee.name} {entry.employee.surname}</p>
                                {entry.employee.nickname && (
                                    <p className="text-xs text-gray-500 italic">"{entry.employee.nickname}"</p>
                                )}
                            </div>

                            {/* Godziny */}
                            <div className="md:col-span-2">
                                <label className="text-xs text-gray-500 mb-1 block">Godziny *</label>
                                <input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    max="24"
                                    value={entry.hours}
                                    onChange={(e) => updateEmployee(entry.employeeId, 'hours', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-lg font-bold"
                                    placeholder="8"
                                />
                            </div>

                            {/* Sektor */}
                            <div className="md:col-span-3">
                                <label className="text-xs text-gray-500 mb-1 block">Sektor</label>
                                <select
                                    value={entry.sectorId}
                                    onChange={(e) => updateEmployee(entry.employeeId, 'sectorId', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                >
                                    <option value="">Brak</option>
                                    {sectors.map(sector => (
                                        <option key={sector.id} value={sector.id}>
                                            {sector.description} ({sector.plantType})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Zadania */}
                            <div className="md:col-span-4">
                                <label className="text-xs text-gray-500 mb-1 block">Zadania</label>
                                <div className="flex flex-wrap gap-1">
                                    {tasks.map(task => (
                                        <button
                                            key={task.taskDefId}
                                            onClick={() => toggleTask(entry.employeeId, task.taskDefId)}
                                            className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                                                entry.taskIds.includes(task.taskDefId)
                                                    ? 'bg-green-600 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            {task.taskName}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Opis - opcjonalny, rozwijany */}
                        {entry.hours && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                                <input
                                    type="text"
                                    value={entry.description}
                                    onChange={(e) => updateEmployee(entry.employeeId, 'description', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                                    placeholder="Uwagi (opcjonalnie)..."
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Podsumowanie i przyciski */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-1">
                    Pracowników z godzinami: <span className="font-bold text-green-600">
                        {employeeEntries.filter(e => e.hours && parseFloat(e.hours) > 0).length} / {employees.length}
                    </span>
                </p>
                <p className="text-sm text-gray-600">
                    Suma godzin: <span className="font-bold text-blue-600">
                        {employeeEntries.reduce((sum, e) => sum + (parseFloat(e.hours) || 0), 0).toFixed(1)}h
                    </span>
                </p>
            </div>

            <div className="flex space-x-3 pt-2">
                <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center shadow-md"
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    ) : (
                        <CheckCircle className="mr-2" size={20} />
                    )}
                    Zapisz wpisy
                </button>
                <button
                    onClick={() => onCancel('info', 'Tworzenie wpisów anulowane.')}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-xl font-semibold transition-colors"
                    disabled={isLoading}
                >
                    Anuluj
                </button>
            </div>
        </div>
    );
};

const CalendarEvent = ({ entry, onClick, onQuickApprove }) => {
    const formatDuration = (duration) => {
        if (!duration) return '';
        const match = duration.match(/PT(\d+)H(\d+)?M?/);
        if (!match) return '';
        const hours = parseInt(match[1]) || 0;
        const minutes = parseInt(match[2]) || 0;
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    };

    const getEventColor = () => {
        if (entry.isApproved) return 'bg-green-100 border-green-400 text-green-800';
        return 'bg-amber-100 border-amber-400 text-amber-800';
    };

    return (
        <div
            onClick={onClick}
            className={`${getEventColor()} border-l-4 rounded-lg p-2 cursor-pointer hover:shadow-md transition-all text-xs`}
        >
            <div className="flex items-center justify-between mb-1">
                <span className="font-bold truncate text-xs">
                    {entry.user?.name} {entry.user?.surname?.[0]}.
                </span>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onQuickApprove(entry.entryId);
                    }}
                    className="p-1 hover:bg-white rounded transition-colors text-sm"
                >
                    {entry.isApproved ? '✅' : '⏳'}
                </button>
            </div>
            {entry.duration && (
                <div className="text-xs font-bold opacity-90">
                    ⏱️ {formatDuration(entry.duration)}
                </div>
            )}
            {entry.sector && (
                <div className="text-xs mt-1 truncate opacity-75">
                    📍 {entry.sector.description}
                </div>
            )}
        </div>
    );
};

const WeekCalendar = ({ workEntries, onAddClick, onEventClick, onQuickApprove, currentDate, onDateChange }) => {
    const getWeekDays = (date) => {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        
        const day = (start.getDay() + 6) % 7; 
        start.setDate(start.getDate() - day); 
        
        return Array.from({ length: 7 }, (_, i) => {
            const day = new Date(start);
            day.setDate(start.getDate() + i);
            return day;
        });
    };

    const weekDays = getWeekDays(currentDate);

    const getEntriesForDate = (date) => {
        const dateStr = date.toISOString().split('T')[0];
        return workEntries.filter(entry => {
            const entryDate = new Date(entry.startTime);
            const entryDateStr = entryDate.toISOString().split('T')[0];
            return entryDateStr === dateStr;
        });
    };

    const isToday = (date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const goToPreviousWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 7);
        onDateChange(newDate);
    };

    const goToNextWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 7);
        onDateChange(newDate);
    };

    const goToToday = () => {
        onDateChange(new Date());
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Header z nawigacją */}
            <div className="bg-gradient-to-r from-green-600 to-lime-600 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={goToPreviousWeek}
                            className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="text-white" size={20} />
                        </button>
                        <button
                            onClick={goToNextWeek}
                            className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                        >
                            <ChevronRight className="text-white" size={20} />
                        </button>
                        <button
                            onClick={goToToday}
                            className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors text-white font-medium text-sm"
                        >
                            Dzisiaj
                        </button>
                    </div>
                    <h3 className="text-xl font-bold text-white">
                        {weekDays[0].toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}
                    </h3>
                </div>
            </div>

            {/* Siatka kalendarza - widok dzienny */}
            <div className="grid grid-cols-7">
                {weekDays.map((day, idx) => {
                    const entries = getEntriesForDate(day);
                    const dateStr = day.toISOString().split('T')[0];
                    const totalHours = entries.reduce((sum, entry) => {
                        if (entry.duration) {
                            const match = entry.duration.match(/PT(\d+)H(\d+)?M?/);
                            if (match) {
                                const hours = parseInt(match[1]) || 0;
                                const minutes = parseInt(match[2]) || 0;
                                return sum + hours + minutes / 60;
                            }
                        }
                        return sum;
                    }, 0);
                    
                    return (
                        <div
                            key={idx}
                            className={`border-r border-b border-gray-200 min-h-64 ${
                                isToday(day) ? 'bg-green-50' : 'bg-white'
                            }`}
                        >
                            {/* Nagłówek dnia */}
                            <div className={`p-3 border-b border-gray-200 ${isToday(day) ? 'bg-green-100' : 'bg-gray-50'}`}>
                                <div className="text-xs text-gray-500 uppercase">
                                    {day.toLocaleDateString('pl-PL', { weekday: 'short' })}
                                </div>
                                <div className={`text-2xl font-bold ${isToday(day) ? 'text-green-600' : 'text-gray-800'}`}>
                                    {day.getDate()}
                                </div>
                                {totalHours > 0 && (
                                    <div className="text-xs font-medium text-blue-600 mt-1">
                                        {totalHours.toFixed(1)}h
                                    </div>
                                )}
                            </div>

                            {/* Lista wpisów lub przycisk dodawania */}
                            <div className="p-2">
                                {entries.length === 0 ? (
                                    <button
                                        onClick={() => onAddClick(dateStr, null)}
                                        className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all flex flex-col items-center justify-center group"
                                    >
                                        <Plus className="text-gray-400 group-hover:text-green-600 mb-2" size={32} />
                                        <span className="text-sm text-gray-500 group-hover:text-green-600 font-medium">
                                            Dodaj wpisy
                                        </span>
                                    </button>
                                ) : (
                                    <>
                                        <div className="space-y-1 mb-2">
                                            {entries.slice(0, 3).map(entry => (
                                                <CalendarEvent
                                                    key={entry.entryId}
                                                    entry={entry}
                                                    onClick={() => onEventClick(entry)}
                                                    onQuickApprove={onQuickApprove}
                                                />
                                            ))}
                                        </div>
                                        {entries.length > 3 && (
                                            <p className="text-xs text-gray-500 text-center mb-2">
                                                +{entries.length - 3} więcej
                                            </p>
                                        )}
                                        <button
                                            onClick={() => onAddClick(dateStr, null)}
                                            className="w-full py-2 border border-green-500 text-green-600 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium"
                                        >
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

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('pl-PL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDuration = (duration) => {
        if (!duration) return '-';
        const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        if (!match) return duration;
        const hours = match[1] ? parseInt(match[1]) : 0;
        const minutes = match[2] ? parseInt(match[2]) : 0;
        return `${hours}h ${minutes}m`;
    };

    return (
        <Modal isOpen={!!entry} onClose={onClose} title="Szczegóły wpisu" size="medium">
            <div className="space-y-4">
                <div className={`p-4 rounded-xl ${entry.isApproved ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">
                                {entry.user?.name} {entry.user?.surname}
                            </h3>
                            {entry.user?.nickname && (
                                <p className="text-sm text-gray-500 italic">"{entry.user.nickname}"</p>
                            )}
                        </div>
                        <div className={`text-3xl ${entry.isApproved ? 'text-green-600' : 'text-amber-600'}`}>
                            {entry.isApproved ? <CheckCircle size={40} /> : <Clock size={40} />}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="text-xs font-medium text-gray-500 uppercase mb-1">Rozpoczęcie</p>
                        <p className="text-sm font-bold text-gray-900">{formatDateTime(entry.startTime)}</p>
                    </div>
                    {entry.endTime && (
                        <div className="bg-gray-50 p-4 rounded-xl">
                            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Zakończenie</p>
                            <p className="text-sm font-bold text-gray-900">{formatDateTime(entry.endTime)}</p>
                        </div>
                    )}
                </div>

                {entry.duration && (
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                        <p className="text-xs font-medium text-blue-700 uppercase mb-1">Czas trwania</p>
                        <p className="text-lg font-bold text-blue-900">{formatDuration(entry.duration)}</p>
                    </div>
                )}

                {entry.sector && (
                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                        <p className="text-xs font-medium text-purple-700 uppercase mb-1">Sektor</p>
                        <p className="text-sm font-bold text-purple-900">
                            📍 {entry.sector.description} ({entry.sector.plantType})
                        </p>
                    </div>
                )}

                {entry.tasks && entry.tasks.length > 0 && (
                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Zadania:</p>
                        <div className="flex flex-wrap gap-2">
                            {entry.tasks.map(task => (
                                <span key={task.taskDefId} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                                    {task.taskName}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {entry.description && (
                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Opis:</p>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{entry.description}</p>
                    </div>
                )}

                <div className="flex space-x-2 pt-4 border-t border-gray-200">
                    <button
                        onClick={() => onToggleApproval(entry.entryId)}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                            entry.isApproved
                                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                    >
                        {entry.isApproved ? '↩️ Cofnij zatwierdzenie' : '✅ Zatwierdź'}
                    </button>
                    <button
                        onClick={() => onEdit(entry)}
                        className="flex-1 bg-blue-100 text-blue-700 hover:bg-blue-200 py-2 px-4 rounded-lg font-medium transition-colors"
                    >
                        <Edit2 className="inline mr-1" size={16} /> Edytuj
                    </button>
                    <button
                        onClick={() => {
                            if (confirm('Czy na pewno chcesz usunąć ten wpis?')) {
                                onDelete(entry.entryId);
                            }
                        }}
                        className="flex-1 bg-red-100 text-red-700 hover:bg-red-200 py-2 px-4 rounded-lg font-medium transition-colors"
                    >
                        <Trash2 className="inline mr-1" size={16} /> Usuń
                    </button>
                </div>
            </div>
        </Modal>
    );
};

const generateMockEntries = (currentDate, employees, sectors, tasks) => {
    const today = new Date(currentDate);
    const dateStr = (date, hours) => {
        const d = new Date(date);
        d.setHours(hours, 0, 0, 0);
        return d.toISOString();
    };

    const dayOfWeek = (today.getDay() + 6) % 7; 
    today.setDate(today.getDate() - dayOfWeek);

    const monday = new Date(today);
    const tuesday = new Date(monday); tuesday.setDate(monday.getDate() + 1);
    const wednesday = new Date(monday); wednesday.setDate(monday.getDate() + 2);

    if (employees.length === 0 || sectors.length === 0 || tasks.length === 0) return [];
    
    const emp1 = employees[0];
    const emp2 = employees[1] || employees[0]; 
    const emp3 = employees[2] || employees[0]; 
    const emp4 = employees[3] || employees[0]; 

    const sector1 = sectors[0];
    const sector2 = sectors[1] || sectors[0];
    const sector3 = sectors[2] || sectors[0];

    const task1 = tasks.find(t => t.taskDefId === 1);
    const task2 = tasks.find(t => t.taskDefId === 2);
    const task3 = tasks.find(t => t.taskDefId === 3);
    const task4 = tasks.find(t => t.taskDefId === 4);


    return [
        {
            entryId: 1,
            user: emp1, 
            sector: sector1, 
            tasks: [task1],
            startTime: dateStr(monday, 8),
            endTime: dateStr(monday, 16),
            duration: 'PT8H0M',
            description: 'Intensywne zbiory jabłek na północnej stronie',
            isApproved: true
        },
        {
            entryId: 4,
            user: emp2, 
            sector: sector1, 
            tasks: [task3],
            startTime: dateStr(monday, 10),
            endTime: dateStr(monday, 16),
            duration: 'PT6H0M',
            description: 'Kontrola systemu nawadniania sekcji 3',
            isApproved: false
        },
        {
            entryId: 2,
            user: emp3,
            sector: sector2, 
            tasks: [task2],
            startTime: dateStr(tuesday, 9),
            endTime: dateStr(tuesday, 13),
            duration: 'PT4H0M',
            description: 'Ręczne pielenie w szklarni B',
            isApproved: false
        },
        {
            entryId: 3,
            user: emp4,
            sector: sector3, 
            tasks: [task4],
            startTime: dateStr(wednesday, 10),
            endTime: dateStr(wednesday, 16),
            duration: 'PT6H0M',
            description: 'Sprawdzenie systemu kroplowego',
            isApproved: true
        },
    ].filter(entry => entry.user && entry.sector && entry.tasks.every(t => t));
};


export default function WorkEntryManagement() {
    const [workEntries, setWorkEntries] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [sectors, setSectors] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState(null); 
    const [bulkAssignDate, setBulkAssignDate] = useState(null); 
    const [isLoading, setIsLoading] = useState(false);
    const [alert, setAlert] = useState({ type: '', message: '' });

    const closeAlert = useCallback(() => setAlert({ type: '', message: '' }), []);


    const fetchData = useCallback((setter, endpoint, entityName) => async () => {
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
    }, [closeAlert]);


    const fetchEmployees = useCallback(() => {
        fetchData(setEmployees, '/api/users', 'pracowników');
    }, [fetchData]);

    const fetchSectors = useCallback(() => {
        fetchData(setSectors, '/api/sectors', 'sektorów');
    }, [fetchData]);

    const fetchTasks = useCallback(() => {
        const mockTasks = [
            { taskDefId: 1, taskName: 'Zbiory' },
            { taskDefId: 2, taskName: 'Pielenie' },
            { taskDefId: 3, taskName: 'Nawadnianie' },
            { taskDefId: 4, taskName: 'Opryski' },
        ];
        setTasks(mockTasks);
    }, []);
    
    const fetchWorkEntries = useCallback(async (currentDate, employees, sectors, tasks) => {
        if (employees.length === 0 || sectors.length === 0 || tasks.length === 0) {
            setWorkEntries([]);
            return;
        }
        setIsLoading(true);
        
        setTimeout(() => {
            const mockEntries = generateMockEntries(currentDate, employees, sectors, tasks);
            setWorkEntries(mockEntries);
            setIsLoading(false);
        }, 500);

    }, []);


    useEffect(() => {
        fetchEmployees();
        fetchSectors();
        fetchTasks();
    }, [fetchEmployees, fetchSectors, fetchTasks]);

    useEffect(() => {
        fetchWorkEntries(currentDate, employees, sectors, tasks);
    }, [currentDate, employees, sectors, tasks, fetchWorkEntries]); 

    const handleSaveBulkEntries = useCallback(async (entries) => {
        setIsLoading(true);
        closeAlert();

        const entriesToSend = entries.map(entry => {
            const date = new Date(bulkAssignDate);
            date.setHours(8, 0, 0, 0); 
            
            const start = date.toISOString();
            const end = new Date(date.getTime() + parseFloat(entry.hours) * 60 * 60 * 1000).toISOString();
            
            return {
                userId: entry.employeeId,
                sectorId: entry.sectorId,
                taskIds: entry.taskIds,
                startTime: start,
                endTime: end,
                description: entry.description,
                isApproved: entry.isApproved,
            };
        });

        console.log("Dane do wysłania do API:", entriesToSend);

        setTimeout(() => {
            setIsLoading(false);
            setIsModalOpen(false);
            setBulkAssignDate(null);
            setAlert({ type: 'success', message: `Zapisano ${entriesToSend.length} wpisów dla dnia ${new Date(bulkAssignDate).toLocaleDateString()}.` });
            fetchWorkEntries(currentDate, employees, sectors, tasks);
        }, 1000);

    }, [closeAlert, fetchWorkEntries, currentDate, employees, sectors, tasks, bulkAssignDate]);


    const handleDeleteEntry = useCallback(async (entryId) => {
        setIsLoading(true);
        setTimeout(() => {
            setWorkEntries(prev => prev.filter(e => e.entryId !== entryId));
            setSelectedEntry(null);
            setIsLoading(false);
            setAlert({ type: 'success', message: 'Wpis usunięty pomyślnie' });
        }, 500);
    }, []);

    const handleToggleApproval = useCallback(async (entryId) => {
        const entry = workEntries.find(e => e.entryId === entryId);
        if (!entry) return;

        setIsLoading(true);
        setTimeout(() => {
            setWorkEntries(prev => prev.map(e => e.entryId === entryId ? { ...e, isApproved: !e.isApproved } : e));
            setSelectedEntry(prev => prev && prev.entryId === entryId ? { ...prev, isApproved: !prev.isApproved } : prev);
            setIsLoading(false);
            setAlert({ type: 'success', message: entry.isApproved ? 'Cofnięto zatwierdzenie' : 'Wpis zatwierdzony' });
        }, 500);
    }, [workEntries]);


    const stats = useMemo(() => ({
        total: workEntries.length,
        approved: workEntries.filter(e => e.isApproved).length,
        pending: workEntries.filter(e => !e.isApproved).length,
        today: workEntries.filter(e => {
            const today = new Date().toDateString();
            return new Date(e.startTime).toDateString() === today;
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-lime-50 to-green-100 p-6 font-sans">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-2 flex items-center">
                        <Calendar className="text-green-600 mr-3" size={40} />
                        Planowanie Pracy Zespołów
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Planowanie tygodniowe i masowe przypisywanie zadań/godzin do pracowników 🗓️
                    </p>
                </header>

                {alert.message && <Alert type={alert.type} message={alert.message} onClose={closeAlert} />}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard icon={Calendar} count={stats.total} label="Wszystkie Plany" color="green" />
                    <StatCard icon={CheckCircle} count={stats.approved} label="Zatwierdzone" color="blue" />
                    <StatCard icon={Clock} count={stats.pending} label="Oczekujące" color="amber" />
                    <StatCard icon={Users} count={stats.today} label="Dzisiaj" color="purple" />
                </div>
                
                {(!isLoading && employees.length === 0) && (
                    <div className="text-center py-4 bg-white rounded-xl mb-4 border border-red-200">
                        <p className="text-red-500 text-sm font-medium">
                            🚨 **Brak Pracowników.** Upewnij się, że Twój backend Spring Boot działa i endpoint `/api/users` zwraca listę pracowników.
                        </p>
                    </div>
                )}
                {(!isLoading && sectors.length === 0) && (
                    <div className="text-center py-4 bg-white rounded-xl mb-4 border border-amber-200">
                        <p className="text-amber-600 text-sm font-medium">
                            ⚠️ **Brak Sektorów.** Upewnij się, że endpoint `/api/sectors` zwraca listę sektorów. Bez sektorów planowanie będzie ograniczone.
                        </p>
                    </div>
                )}
                
                {isLoading && (
                    <div className="text-center py-4 bg-white rounded-xl mb-4 border border-blue-200">
                        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                        <p className="text-gray-500 text-sm font-medium mt-2">
                             Ładowanie danych bazowych (pracownicy/sektory)... 🔄
                        </p>
                    </div>
                )}
                
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
                        tasks={tasks}
                        onSave={handleSaveBulkEntries}
                        onCancel={handleCloseModal}
                        isLoading={isLoading}
                    />
                </Modal>
                
                <EventDetailsModal
                    entry={selectedEntry}
                    onClose={() => handleCloseModal()}
                    onEdit={() => {
                         setAlert({type: 'warning', message: 'Edycja poszczególnych wpisów nie jest jeszcze zaimplementowana.'});
                         setSelectedEntry(null);
                    }}
                    onDelete={handleDeleteEntry}
                    onToggleApproval={handleToggleApproval}
                />
            </div>
        </div>
    );
}
