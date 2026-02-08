import { useState, useEffect, useMemo, useCallback } from 'react';
import { Clock, DollarSign, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, X, Loader2 } from 'lucide-react';
import { WORK_TYPE_OPTIONS, getWorkTypeLabel, getWorkTypeIcon } from './WorkEntryManagementHooks';

export const Modal = ({ isOpen, onClose, title, children, size = 'large' }: any) => {
    if (!isOpen) return null;
    const sizeClasses: any = { small: 'max-w-md', medium: 'max-w-2xl', large: 'max-w-4xl', xlarge: 'max-w-6xl' };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className={`bg-white rounded-2xl shadow-2xl ${sizeClasses[size]} w-full max-h-[90vh] overflow-y-auto`}>
                <div className="sticky top-0 bg-gradient-to-r from-green-50 to-lime-50 border-b border-green-200 px-6 py-4 rounded-t-2xl z-10 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                        <Clock className="mr-2 text-green-600" size={24} />{title}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-green-100 rounded-xl transition-colors">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
};

export const StatCard = ({ icon: Icon, count, label, color, isCurrency = false }: any) => {
    const colorMap: any = {
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

export const DailyWorkForm = ({ date, employees, sectors, onSave, onCancel, isLoading }: any) => {
    const [entries, setEntries] = useState(() => employees.map((emp: any) => ({
        employeeId: emp.id, 
        employee: emp, 
        hours: '', 
        kilogramsPicked: '', 
        sectorId: '', 
        workType: '', 
        description: '',
        isPaidHourly: emp.workDetails?.isPaidHourly !== false
    })));

    const updateEntry = useCallback((id: number, field: string, value: any) => {
        setEntries((p: any) => p.map((e: any) => e.employeeId === id ? { ...e, [field]: value } : e));
    }, []);

    const quickFillAll = (field: string, value: any) => {
        setEntries((p: any) => p.map((e: any) => ({ ...e, [field]: value })));
    };

    const handleSubmit = () => {
        const valid = entries.filter((e: any) => {
            const hasHours = e.hours && parseFloat(e.hours) > 0;
            return e.employee.workDetails?.isPaidHourly ? hasHours : hasHours && e.kilogramsPicked && parseFloat(e.kilogramsPicked) > 0;
        });
        if (valid.length === 0) { 
            onCancel('warning', 'Podaj wymagane dane dla co najmniej jednego pracownika'); 
            return; 
        }
        onSave(valid);
    };

    const totalHours = useMemo(() => entries.reduce((sum: number, e: any) => sum + (parseFloat(e.hours) || 0), 0), [entries]);
    const totalKilograms = useMemo(() => entries.reduce((sum: number, e: any) => sum + (parseFloat(e.kilogramsPicked) || 0), 0), [entries]);
    const filledCount = useMemo(() => entries.filter((e: any) => e.employee.workDetails?.isPaidHourly ? e.hours && parseFloat(e.hours) > 0 : e.kilogramsPicked && parseFloat(e.kilogramsPicked) > 0).length, [entries]);

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
                                <button key={h} onClick={() => quickFillAll('hours', h.toString())} className="flex-1 bg-white hover:bg-blue-100 border border-blue-300 rounded-lg py-2 text-sm font-bold transition-colors">{h}h</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-gray-600 mb-1 block">Sektor</label>
                        <select onChange={(e) => quickFillAll('sectorId', e.target.value)} className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm">
                            <option value="">Wybierz...</option>
                            {sectors.map((s: any) => <option key={s.id} value={s.id}>{s.description}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-xs text-gray-600 mb-1 block">Typ pracy</label>
                        <select onChange={(e) => quickFillAll('workType', e.target.value)} className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm">
                            <option value="">Wybierz...</option>
                            {WORK_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {employees.map((emp: any) => {
                    const entry = entries.find((e: any) => e.employeeId === emp.id);
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
                                        <input type="number" step="0.5" min="0" max="24" value={entry.hours} onChange={(e) => updateEntry(entry.employeeId, 'hours', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-lg font-bold" placeholder="8" />
                                    </div>
                                ) : (
                                    <>
                                        <div className="md:col-span-1">
                                            <label className="text-xs text-gray-500 mb-1 block">Godziny *</label>
                                            <input type="number" step="0.5" min="0" max="24" value={entry.hours} onChange={(e) => updateEntry(entry.employeeId, 'hours', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-lg font-bold" placeholder="8" />
                                        </div>
                                        <div className="md:col-span-1">
                                            <label className="text-xs text-gray-500 mb-1 block">Kilogramy *</label>
                                            <input type="number" step="0.1" min="0" value={entry.kilogramsPicked} onChange={(e) => updateEntry(entry.employeeId, 'kilogramsPicked', e.target.value)} className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-lg font-bold" placeholder="50" />
                                        </div>
                                    </>
                                )}
                                <div className="md:col-span-3">
                                    <label className="text-xs text-gray-500 mb-1 block">Sektor</label>
                                    <select value={entry.sectorId} onChange={(e) => updateEntry(entry.employeeId, 'sectorId', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                                        <option value="">Brak</option>
                                        {sectors.map((s: any) => <option key={s.id} value={s.id}>{s.description} ({s.plantType})</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-4">
                                    <label className="text-xs text-gray-500 mb-1 block">Typ pracy</label>
                                    <select value={entry.workType} onChange={(e) => updateEntry(entry.employeeId, 'workType', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                                        <option value="">Brak</option>
                                        {WORK_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            {(entry.hours || entry.kilogramsPicked) && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    <input type="text" value={entry.description} onChange={(e) => updateEntry(entry.employeeId, 'description', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 text-sm" placeholder="Uwagi (opcjonalnie)..." />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-1">Pracowników z danymi: <span className="font-bold text-green-600">{filledCount} / {employees.length}</span></p>
                <p className="text-sm text-gray-600 mb-1">Suma godzin: <span className="font-bold text-blue-600">{totalHours.toFixed(1)}h</span></p>
                {totalKilograms > 0 && <p className="text-sm text-gray-600">Suma kilogramów: <span className="font-bold text-orange-600">{totalKilograms.toFixed(1)} kg</span></p>}
            </div>
            
            <div className="flex space-x-3 pt-2">
                <button onClick={handleSubmit} disabled={isLoading} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center shadow-md">
                    {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> : <DollarSign className="mr-2" size={20} />} Zapisz wpisy
                </button>
                <button onClick={() => onCancel()} disabled={isLoading} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-xl font-semibold transition-colors">
                    Anuluj
                </button>
            </div>
        </div>
    );
};

export const CalendarEvent = ({ entry, onClick, onTogglePaid }: any) => {
    const paidClass = entry.isPaid ? 'bg-emerald-100 border-emerald-400 text-emerald-800' : 'bg-amber-100 border-amber-400 text-amber-800';
    return (
        <div onClick={onClick} className={`${paidClass} border-l-4 rounded-lg p-2 cursor-pointer hover:shadow-md transition-all text-xs mb-1`}>
            <div className="flex items-center justify-between">
                <span className="font-bold truncate text-xs">{entry.user?.name} {entry.user?.surname?.[0]}.</span>
                <div className="flex items-center space-x-1">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onTogglePaid(entry.entryId); }} 
                        className={`p-1 rounded transition-colors text-sm ${entry.isPaid ? 'text-amber-700 hover:bg-amber-200' : 'text-emerald-700 hover:bg-emerald-200'}`} 
                        title={entry.isPaid ? 'Anuluj płatność' : 'Oznacz jako opłacone'}
                    >
                        {entry.isPaid ? '❌' : '💵'}
                    </button>
                </div>
            </div>
            <div className="flex items-center space-x-2">
                {entry.duration > 0 && <div className="text-xs font-bold opacity-90 text-black">⏱️ {entry.duration}h</div>}
                {entry.kilogramsPicked > 0 && <div className="text-xs font-bold opacity-90 text-orange-600">⚖️ {entry.kilogramsPicked} kg</div>}
                {entry.daySalary !== undefined && entry.daySalary !== null && <div className="text-xs font-medium text-orange-900 opacity-90 flex items-center">💰 {parseFloat(entry.daySalary).toFixed(0)} zł</div>}
            </div>
            {entry.workType && <div className="text-xs mt-1 opacity-75">{getWorkTypeIcon(entry.workType)}</div>}
            {entry.sector && <div className="text-xs mt-1 truncate opacity-75">📍 {entry.sector.description}</div>}
        </div>
    );
};

export const WeekCalendar = ({ workEntries, onAddClick, onEventClick, onTogglePaid, currentDate, onDateChange }: any) => {
    const getWeekDays = useCallback((date: Date) => {
        const start = new Date(date); start.setHours(0, 0, 0, 0);
        const day = (start.getDay() + 6) % 7; start.setDate(start.getDate() - day);
        return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
    }, []);
    
    const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate, getWeekDays]);
    const formatDateToLocal = (date: Date) => { const year = date.getFullYear(); const month = String(date.getMonth() + 1).padStart(2, '0'); const day = String(date.getDate()).padStart(2, '0'); return `${year}-${month}-${day}`; };
    const getEntriesForDate = useCallback((date: Date) => { const dateStr = formatDateToLocal(date); return workEntries.filter((entry: any) => formatDateToLocal(new Date(entry.workDate)) === dateStr); }, [workEntries]);
    const isToday = useCallback((date: Date) => date.toDateString() === new Date().toDateString(), []);
    const navigate = (days: number) => { const newDate = new Date(currentDate); newDate.setDate(newDate.getDate() + days); onDateChange(newDate); };

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-lime-600 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <button onClick={() => navigate(-7)} className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"><ChevronLeft className="text-white" size={20} /></button>
                        <button onClick={() => navigate(7)} className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"><ChevronRight className="text-white" size={20} /></button>
                        <button onClick={() => onDateChange(new Date())} className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors text-white font-medium text-sm">Dzisiaj</button>
                    </div>
                    <h3 className="text-xl font-bold text-white">{weekDays[0].toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}</h3>
                </div>
            </div>
            <div className="grid grid-cols-7">
                {weekDays.map((day, idx) => {
                    const entries = getEntriesForDate(day);
                    const totalHours = entries.reduce((sum: number, e: any) => sum + (e.duration || 0), 0);
                    const totalSalary = entries.reduce((sum: number, e: any) => sum + (parseFloat(e.daySalary) || 0), 0);
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
                                    <button onClick={() => onAddClick(dateStr)} className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all flex flex-col items-center justify-center group">
                                        <Plus className="text-gray-400 group-hover:text-green-600 mb-2" size={32} /><span className="text-sm text-gray-500 group-hover:text-green-600 font-medium">Dodaj wpisy</span>
                                    </button>
                                ) : (
                                    <>
                                        <div className="space-y-1 mb-2 max-h-96 overflow-y-auto pr-1">
                                            {entries.map((e: any) => <CalendarEvent key={e.entryId} entry={e} onClick={() => onEventClick(e)} onTogglePaid={onTogglePaid} />)}
                                        </div>
                                        <button onClick={() => onAddClick(dateStr)} className="w-full py-2 border border-green-500 text-green-600 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium">+ Dodaj więcej</button>
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

export const AdvancePayModal = ({ isOpen, onClose, employee, onConfirm, isLoading }: any) => {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    
    useEffect(() => { if (!isOpen) { setAmount(''); setDescription(''); } }, [isOpen]);
    
    if (!isOpen || !employee) return null;
    
    const handleSubmit = () => {
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) { alert('Podaj prawidłową kwotę zaliczki większą od 0.'); return; }
        onConfirm(employee.id, amountNum, description);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Wypłata zaliczki dla: ${employee.name} ${employee.surname}`} size="medium">
            <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-300 rounded-xl p-4">
                    <h3 className="text-base font-medium text-blue-800 flex items-center mb-2"><DollarSign className="mr-2 text-blue-600" size={20} /> Wypłata zaliczki</h3>
                    <p className="text-sm text-blue-700">Wypłać pracownikowi część należności jako zaliczkę. Kwota ta zostanie odliczona od kolejnej wypłaty.</p>
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Kwota zaliczki (zł) *</label>
                    <input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="np. 500.00" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-lg font-bold" />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Opis (opcjonalnie)</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="np. Zaliczka na poczet wypłaty tygodniowej..." rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                </div>
                <div className="mt-6 flex space-x-3">
                    <button onClick={handleSubmit} disabled={isLoading || !amount || parseFloat(amount) <= 0} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center shadow-md">
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <DollarSign className="mr-2" size={20} />}
                        {isLoading ? 'Przetwarzanie...' : 'Potwierdź wypłatę zaliczki'}
                    </button>
                    <button onClick={onClose} disabled={isLoading} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-xl font-semibold transition-colors">
                        Anuluj
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export const EventDetailsModal = ({ entry, onClose, onEdit, onDelete, onTogglePaid, onOpenPayAllModal, onOpenPayAllMonthModal, onOpenAdvancePayModal }: any) => {
    if (!entry) return null;
    return (
        <Modal isOpen={!!entry} onClose={onClose} title={`Szczegóły wpisu dla: ${entry.user?.name} ${entry.user?.surname}`} size="medium">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    {entry.duration !== undefined && entry.duration !== null && <div className="bg-blue-50 p-4 rounded-xl border border-blue-200"><p className="text-xs font-medium text-blue-700 uppercase mb-1">Czas trwania</p><p className="text-lg font-bold text-blue-900">{entry.duration}h</p></div>}
                    {entry.kilogramsPicked > 0 && <div className="bg-orange-50 p-4 rounded-xl border border-orange-200"><p className="text-xs font-medium text-orange-700 uppercase mb-1">Zebrane kilogramy</p><p className="text-lg font-bold text-orange-900">{entry.kilogramsPicked} kg</p></div>}
                    {entry.daySalary > 0 && <div className="bg-red-50 p-4 rounded-xl border border-red-200"><p className="text-xs font-medium text-red-700 uppercase mb-1">Wynagrodzenie dzienne</p><p className="text-lg font-bold text-red-900">{parseFloat(entry.daySalary).toFixed(2)} zł</p></div>}
                </div>
                {entry.sector && <div className="bg-purple-50 p-4 rounded-xl border border-purple-200"><p className="text-xs font-medium text-purple-700 uppercase mb-1">Sektor</p><p className="text-sm font-bold text-purple-900">📍 {entry.sector.description} ({entry.sector.plantType})</p></div>}
                {entry.workType && <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200"><p className="text-xs font-medium text-indigo-700 uppercase mb-1">Typ pracy</p><p className="text-sm font-bold text-indigo-900">{getWorkTypeLabel(entry.workType)}</p></div>}
                {entry.description && <div><p className="text-sm font-medium text-gray-700 mb-2">Opis:</p><p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{entry.description}</p></div>}
                
                <div className="flex space-x-2 pt-4 border-t border-gray-200">
                    <button onClick={() => onEdit(entry)} className="flex-1 bg-blue-100 text-blue-700 hover:bg-blue-200 py-2 px-4 rounded-lg font-medium transition-colors"><Edit2 className="inline mr-1" size={16} /> Edytuj</button>
                    <button onClick={() => confirm('Czy na pewno chcesz usunąć ten wpis?') && onDelete(entry.entryId)} className="flex-1 bg-red-100 text-red-700 hover:bg-red-200 py-2 px-4 rounded-lg font-medium transition-colors"><Trash2 className="inline mr-1" size={16} /> Usuń</button>
                </div>
                
                <div className={`p-4 rounded-xl border ${entry.isPaid ? 'bg-emerald-50 border-emerald-300' : 'bg-amber-50 border-amber-300'}`}>
                    <div className="flex items-center justify-between">
                        <div className="mt-1">
                            <p className="text-xs font-medium text-gray-600 uppercase mb-1">Status płatności</p>
                            <p className={`text-base font-bold ${entry.isPaid ? 'text-emerald-700' : 'text-amber-700'}`}>{entry.isPaid ? '✅ Zapłacono' : '🟡 Niezapłacono'}</p>
                        </div>
                        <div className="flex space-x-2">
                            <button onClick={() => onTogglePaid(entry.entryId)} className={`px-4 py-2 rounded-lg font-medium transition-colors ${entry.isPaid ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}>{entry.isPaid ? '❌ Oznacz jako niezapłacone' : '💵 Oznacz jako zapłacone'}</button>
                        </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                        <p className="text-xs font-medium text-gray-500 uppercase">Szybkie płatności dla pracownika:</p>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => onOpenPayAllModal(entry.user?.id)} className="w-full py-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg text-sm font-medium transition-colors">Zapłać za wszystko (zaległe)</button>
                            <button onClick={() => onOpenPayAllMonthModal(entry.user?.id)} className="w-full py-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg text-sm font-medium transition-colors">Zapłać za miesiąc</button>
                        </div>
                        <button onClick={() => onOpenAdvancePayModal(entry.user?.id)} className="w-full py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"><DollarSign size={16} className="mr-2" /> Wypłać część (zaliczka)</button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export const PayConfirmationModal = ({ isOpen, onClose, employee, entries, totalGrossAmount, advances, netAmount, paymentType, onConfirm, isLoading }: any) => {
    if (!isOpen || !employee || entries.length === 0) return null;
    const isMonthPayment = paymentType === 'month';
    const totalAdvanceAmount = advances.reduce((sum: number, a: any) => sum + (parseFloat(a.amount) || 0), 0);
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isMonthPayment ? `Potwierdź płatność za cały miesiąc dla: ${employee.name} ${employee.surname}` : `Potwierdź płatność za wszystkie zaległe wpisy dla: ${employee.name} ${employee.surname}`} size="medium">
            <div className="space-y-4">
                <div className="bg-red-50 border border-red-300 rounded-xl p-4"><p className="text-sm font-medium text-red-700 mb-2">⚠️ WAŻNE: Upewnij się, że płatność została faktycznie wykonana.</p></div>
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-4">
                    <h3 className="text-base font-medium text-amber-800 flex items-center mb-2"><DollarSign className="mr-2" size={20} /> Podsumowanie Płatności</h3>
                    <p className="text-sm text-amber-700">{isMonthPayment ? `Ta operacja oznaczy wszystkie: ${entries.length} nieopłacone wpisy z bieżącego miesiąca jako opłacone.` : `Ta operacja oznaczy wszystkie: ${entries.length} nieopłacone wpisy do dzisiaj jako opłacone.`}</p>
                    <div className="mt-3 flex justify-between items-center"><span className="text-sm text-amber-800 font-medium">Łączne wynagrodzenie: </span><span className="text-lg font-extrabold text-amber-800">{totalGrossAmount.toFixed(2)} zł</span></div>
                    {totalAdvanceAmount > 0 && <div className="mt-1 flex justify-between items-center border-t border-amber-300 pt-2"><span className="text-sm text-red-700 font-medium">Odliczone zaliczki:</span><span className="text-lg font-extrabold text-red-700">-{totalAdvanceAmount.toFixed(2)} zł</span></div>}
                    <div className="mt-3 flex justify-between items-center border-t border-amber-300 pt-2"><span className="text-lg text-green-700 font-bold">Kwota do zapłaty:</span><span className="text-2xl font-extrabold text-green-700">{netAmount.toFixed(2)} zł</span></div>
                </div>
                {advances.length > 0 && (
                    <div className="max-h-40 overflow-y-auto space-y-2 p-2 border border-blue-200 rounded-xl bg-blue-50">
                        <p className="text-sm font-medium text-blue-700 flex items-center"><DollarSign size={16} className="mr-1" /> Nieuregulowane zaliczki:</p>
                        {advances.map((advance: any) => (
                            <div key={advance.id} className="flex justify-between items-center text-xs p-2 bg-blue-100 rounded-lg border-l-4 border-blue-400"><span>{new Date(advance.createdAt).toLocaleDateString()} - {advance.description || 'Brak opisu'}</span><span className="font-bold text-red-700">-{parseFloat(advance.amount).toFixed(2)} zł</span></div>
                        ))}
                    </div>
                )}
                <div className="max-h-60 overflow-y-auto space-y-2 p-2 border border-gray-200 rounded-xl bg-white">
                    <p className="text-sm font-medium text-gray-700">{isMonthPayment ? 'Lista wpisów z bieżącego miesiąca:' : 'Lista wszystkich zaległych wpisów:'}</p>
                    {entries.map((entry: any) => <div key={entry.entryId} className="flex justify-between items-center text-xs p-2 bg-gray-50 rounded-lg border-l-4 border-amber-400"><span>{new Date(entry.workDate).toLocaleDateString()} - {entry.duration}h</span><span className="font-bold text-amber-700">{parseFloat(entry.daySalary).toFixed(2)} zł</span></div>)}
                </div>
                <div className="mt-6 flex space-x-3">
                    <button onClick={onConfirm} disabled={isLoading || entries.length === 0} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center shadow-md">{isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <DollarSign className="mr-2" size={20} />}{isLoading ? 'Przetwarzanie...' : isMonthPayment ? 'Potwierdź zapłatę za miesiąc' : 'Potwierdź zapłatę za wszystko'}</button>
                    <button onClick={onClose} disabled={isLoading} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-xl font-semibold transition-colors">Anuluj</button>
                </div>
            </div>
        </Modal>
    );
};