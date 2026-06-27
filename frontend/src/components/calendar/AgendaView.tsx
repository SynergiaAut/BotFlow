'use client';

import React, { useState, useEffect } from 'react';
import AppointmentCard from './AppointmentCard';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Calendar, 
    Search, 
    RefreshCw, 
    CheckCircle2, 
    XCircle, 
    RefreshCcw, 
    CalendarDays, 
    ChevronLeft, 
    ChevronRight,
    List,
    X
} from 'lucide-react';

export default function AgendaView() {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Configuración de Vistas
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
    
    // Filtros y búsquedas
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    
    // Estado del calendario mensual
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [showDayModal, setShowDayModal] = useState(false);

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/calendar/appointments');
            if (!res.ok) throw new Error('Failed to fetch appointments');
            const data = await res.json();
            setAppointments(data.appointments || []);
        } catch (e) {
            console.error('[FAST-ORDER-INV] Error fetching appointments:', e);
        } finally {
            setLoading(false);
        }
    };

    // Filtrado de citas (aplica a ambas vistas)
    const filteredAppointments = appointments.filter((app) => {
        const matchesSearch = app.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              app.service_title?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Métricas para la cabecera
    const stats = {
        total: appointments.length,
        confirmed: appointments.filter(a => a.status === 'confirmed').length,
        rescheduled: appointments.filter(a => a.status === 'rescheduled').length,
        cancelled: appointments.filter(a => a.status === 'cancelled').length
    };

    // --- Lógica de calendario mensual ---
    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleGoToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
    };

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        
        const firstDay = new Date(year, month, 1);
        let startDay = firstDay.getDay(); // 0=Dom, 1=Lun, ..., 6=Sab
        startDay = startDay === 0 ? 6 : startDay - 1; // Ajustar a 0=Lun, 6=Dom
        
        const totalDays = new Date(year, month + 1, 0).getDate();
        const prevTotalDays = new Date(year, month, 0).getDate();
        
        const cells = [];
        
        // Relleno del mes anterior
        for (let i = startDay - 1; i >= 0; i--) {
            cells.push({
                day: prevTotalDays - i,
                isCurrentMonth: false,
                date: new Date(year, month - 1, prevTotalDays - i)
            });
        }
        
        // Mes actual
        for (let i = 1; i <= totalDays; i++) {
            cells.push({
                day: i,
                isCurrentMonth: true,
                date: new Date(year, month, i)
            });
        }
        
        // Relleno del mes siguiente
        const remaining = cells.length % 7;
        if (remaining > 0) {
            const nextDays = 7 - remaining;
            for (let i = 1; i <= nextDays; i++) {
                cells.push({
                    day: i,
                    isCurrentMonth: false,
                    date: new Date(year, month + 1, i)
                });
            }
        }
        
        return cells;
    };

    const getCellAppointments = (cellDate: Date) => {
        return filteredAppointments.filter(app => {
            const appDate = new Date(app.scheduled_at);
            return appDate.getDate() === cellDate.getDate() &&
                   appDate.getMonth() === cellDate.getMonth() &&
                   appDate.getFullYear() === cellDate.getFullYear();
        });
    };

    const monthName = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    const calendarCells = getDaysInMonth(currentDate);

    // Citas del día seleccionado
    const selectedDayAppointments = filteredAppointments.filter(app => {
        const appDate = new Date(app.scheduled_at);
        return appDate.getDate() === selectedDate.getDate() &&
               appDate.getMonth() === selectedDate.getMonth() &&
               appDate.getFullYear() === selectedDate.getFullYear();
    });

    const formattedSelectedDay = selectedDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });

    return (
        <div className="space-y-6">
            {/* Cabecera de Métricas y Selector de Vista */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                {/* Métricas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto flex-1">
                    <Card className="border border-white/10 bg-[#0B0F17] hover:border-[#00B4DB]/20 transition-all duration-300">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2.5 bg-zinc-500/10 text-zinc-400 rounded-xl">
                                <CalendarDays className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase">Total Citas</p>
                                <p className="text-xl font-black text-white">{stats.total}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border border-white/10 bg-[#0B0F17] hover:border-[#00B4DB]/20 transition-all duration-300">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2.5 bg-green-500/10 text-green-400 rounded-xl">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase">Confirmadas</p>
                                <p className="text-xl font-black text-green-400">{stats.confirmed}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border border-white/10 bg-[#0B0F17] hover:border-[#00B4DB]/20 transition-all duration-300">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
                                <RefreshCcw className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase">Reprogramadas</p>
                                <p className="text-xl font-black text-blue-400">{stats.rescheduled}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border border-white/10 bg-[#0B0F17] hover:border-[#00B4DB]/20 transition-all duration-300">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2.5 bg-red-500/10 text-red-400 rounded-xl">
                                <XCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase">Canceladas</p>
                                <p className="text-xl font-black text-red-400">{stats.cancelled}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Selector de Vista */}
                <div className="bg-[#0B0F17]/90 border border-white/10 rounded-xl p-1 inline-flex gap-1 shrink-0 w-full md:w-auto justify-center md:justify-start">
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className={`text-xs font-semibold rounded-lg px-4 py-1.5 h-auto transition-all w-1/2 md:w-auto ${
                            viewMode === 'list' 
                                ? 'bg-[#00B4DB] text-[#070B12] hover:bg-[#00B4DB]/90 hover:text-[#070B12]' 
                                : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <List className="w-3.5 h-3.5 mr-1.5 inline" />
                        Lista
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setViewMode('calendar')}
                        className={`text-xs font-semibold rounded-lg px-4 py-1.5 h-auto transition-all w-1/2 md:w-auto ${
                            viewMode === 'calendar' 
                                ? 'bg-[#00B4DB] text-[#070B12] hover:bg-[#00B4DB]/90 hover:text-[#070B12]' 
                                : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Calendar className="w-3.5 h-3.5 mr-1.5 inline" />
                        Calendario
                    </Button>
                </div>
            </div>

            {/* Barra de Filtros */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#0B0F17]/90 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-lg">
                <div className="relative w-full sm:max-w-xs">
                    <Input
                        type="text"
                        placeholder="Buscar por cliente o servicio..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-[#111722]/50 text-white border-white/10 focus-visible:ring-1 focus-visible:ring-[#00B4DB]/50 focus-visible:border-[#00B4DB]/50 focus-visible:ring-offset-0 focus:outline-none focus:ring-0 pl-9 rounded-xl"
                    />
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5" />
                </div>

                <div className="flex flex-wrap gap-1.5 w-full sm:w-auto items-center">
                    <span className="text-xs font-bold text-zinc-400 uppercase mr-1 hidden md:block">Filtrar:</span>
                    {[
                        { value: 'all', label: 'Todas' },
                        { value: 'confirmed', label: 'Confirmadas' },
                        { value: 'rescheduled', label: 'Reprogramadas' },
                        { value: 'cancelled', label: 'Canceladas' }
                    ].map((f) => (
                        <Button
                            key={f.value}
                            variant={statusFilter === f.value ? 'default' : 'outline'}
                            onClick={() => setStatusFilter(f.value)}
                            size="sm"
                            className={`text-xs font-semibold rounded-xl px-3 py-1.5 h-auto transition-all duration-200 ${
                                statusFilter === f.value 
                                    ? 'bg-[#00B4DB] hover:bg-[#00B4DB]/90 text-[#070B12] hover:text-[#070B12] shadow-md shadow-[#00B4DB]/20 border-transparent' 
                                    : 'bg-[#111722]/40 hover:bg-[#111722]/80 border-white/5 text-zinc-400 hover:text-white'
                            }`}
                        >
                            {f.label}
                        </Button>
                    ))}
                    
                    <Button variant="ghost" size="icon" onClick={fetchAppointments} disabled={loading} className="ml-2 hover:bg-white/5">
                        <RefreshCw className={`w-4 h-4 text-zinc-400 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* CONTENIDO PRINCIPAL SEGÚN MODO DE VISTA */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
                    <RefreshCw className="w-8 h-8 animate-spin text-[#00B4DB]" />
                    <p className="text-sm text-zinc-400 font-semibold">Cargando agenda de citas...</p>
                </div>
            ) : viewMode === 'list' ? (
                // --- VISTA LISTA ---
                filteredAppointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 bg-[#0B0F17]/40 rounded-2xl border border-dashed border-white/10">
                        <Calendar className="w-10 h-10 text-zinc-500" />
                        <div className="space-y-1">
                            <h4 className="font-bold text-white">Sin citas encontradas</h4>
                            <p className="text-xs text-zinc-400 max-w-xs">
                                No hay registros que coincidan con la búsqueda o el filtro seleccionado en este momento.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                        {filteredAppointments.map((app) => (
                            <AppointmentCard 
                                key={app.id} 
                                appointment={app} 
                                onUpdate={fetchAppointments} 
                            />
                        ))}
                    </div>
                )
            ) : (
                // --- VISTA CALENDARIO MENSUAL ---
                <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Header Navegación Calendario */}
                    <div className="flex justify-between items-center bg-[#0B0F17]/90 border border-white/10 rounded-2xl p-4 shadow-md">
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handlePrevMonth} className="bg-[#111722]/50 hover:bg-[#111722]/80 border-white/10 text-white rounded-xl">
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleNextMonth} className="bg-[#111722]/50 hover:bg-[#111722]/80 border-white/10 text-white rounded-xl">
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleGoToday} className="text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl ml-2 font-semibold">
                                Hoy
                            </Button>
                        </div>
                        <h3 className="text-lg font-black text-white capitalize tracking-wide">
                            {monthName}
                        </h3>
                    </div>

                    {/* Grilla Calendario */}
                    <div className="bg-[#0B0F17]/90 border border-white/10 rounded-2xl p-4 shadow-xl space-y-2">
                        {/* Cabecera Días */}
                        <div className="grid grid-cols-7 gap-1.5">
                            {['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'].map((day) => (
                                <div key={day} className="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center py-2 bg-[#111722]/30 rounded-lg">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Celdas del Mes */}
                        <div className="grid grid-cols-7 gap-1.5">
                            {calendarCells.map((cell, idx) => {
                                const cellApps = getCellAppointments(cell.date);
                                const isSelected = selectedDate.getDate() === cell.date.getDate() &&
                                                   selectedDate.getMonth() === cell.date.getMonth() &&
                                                   selectedDate.getFullYear() === cell.date.getFullYear();
                                const isToday = new Date().getDate() === cell.date.getDate() &&
                                                new Date().getMonth() === cell.date.getMonth() &&
                                                new Date().getFullYear() === cell.date.getFullYear();

                                return (
                                    <div
                                        key={idx}
                                        onClick={() => {
                                            setSelectedDate(cell.date);
                                            if (cellApps.length > 0) {
                                                setShowDayModal(true);
                                            }
                                        }}
                                        className={`aspect-square min-h-[85px] p-2 flex flex-col justify-between rounded-xl transition-all duration-200 border cursor-pointer select-none ${
                                            !cell.isCurrentMonth
                                                ? 'bg-transparent border-transparent opacity-20 hover:opacity-40'
                                                : isSelected
                                                    ? 'bg-[#00B4DB]/15 border-[#00B4DB] shadow-lg shadow-[#00B4DB]/5'
                                                    : isToday
                                                        ? 'bg-[#00B4DB]/5 border-[#00B4DB]/40 hover:border-[#00B4DB]/60'
                                                        : 'bg-[#111722]/30 border-white/5 hover:bg-[#111722]/60 hover:border-white/15'
                                        }`}
                                    >
                                        {/* Número del día */}
                                        <div className="text-right">
                                            <span className={`text-xs font-black ${
                                                cell.isCurrentMonth
                                                    ? isToday 
                                                        ? 'text-[#00B4DB]' 
                                                        : 'text-white'
                                                    : 'text-zinc-500'
                                            }`}>
                                                {cell.day}
                                            </span>
                                        </div>

                                        {/* Previsualización Citas */}
                                        <div className="space-y-1 overflow-hidden mt-1 flex-1 flex flex-col justify-end">
                                            {cellApps.slice(0, 2).map((app) => {
                                                const appTime = new Date(app.scheduled_at).toLocaleTimeString('es-ES', { 
                                                    hour: '2-digit', 
                                                    minute: '2-digit' 
                                                });
                                                
                                                const badgeColor = {
                                                    confirmed: 'bg-green-500/10 text-green-400 border-green-500/20',
                                                    cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
                                                    rescheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                                                    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                }[app.status as string] || 'bg-zinc-800 text-zinc-300 border-zinc-700/50';

                                                return (
                                                    <div 
                                                        key={app.id} 
                                                        className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md border truncate leading-tight ${badgeColor}`}
                                                    >
                                                        {appTime} {app.contact_name}
                                                    </div>
                                                );
                                            })}
                                            {cellApps.length > 2 && (
                                                <div className="text-[8px] text-zinc-400 font-bold text-center leading-none pb-0.5">
                                                    + {cellApps.length - 2} más
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Detalle del día seleccionado debajo (Fallback por si cierran el modal) */}
                    <div className="space-y-4">
                        <div className="border-b border-white/10 pb-2">
                            <h4 className="text-sm font-black text-zinc-400 uppercase tracking-widest">
                                Citas para el <span className="text-[#00B4DB] lowercase">{formattedSelectedDay}</span>:
                            </h4>
                        </div>

                        {selectedDayAppointments.length === 0 ? (
                            <div className="py-8 text-center bg-[#0B0F17]/40 rounded-2xl border border-dashed border-white/5">
                                <p className="text-xs text-zinc-500 font-semibold">No hay citas programadas para este día.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                                {selectedDayAppointments.map((app) => (
                                    <AppointmentCard 
                                        key={app.id} 
                                        appointment={app} 
                                        onUpdate={fetchAppointments} 
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL OVERLAY CON DETALLES COMPLETOS DEL DÍA AL SELECCIONARLO */}
            {showDayModal && selectedDayAppointments.length > 0 && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#0B0F17] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-white">
                        {/* Header Modal */}
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <div className="space-y-1">
                                <h3 className="text-lg font-black text-white capitalize">
                                    Citas del {formattedSelectedDay}
                                </h3>
                                <p className="text-xs text-zinc-400">
                                    Tienes {selectedDayAppointments.length} {selectedDayAppointments.length === 1 ? 'cita programada' : 'citas programadas'} para este día.
                                </p>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => setShowDayModal(false)}
                                className="text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                        
                        {/* Listado de Tarjetas dentro del Modal */}
                        <div className="flex-1 overflow-y-auto space-y-4 pr-1 py-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {selectedDayAppointments.map((app) => (
                                    <AppointmentCard 
                                        key={app.id} 
                                        appointment={app} 
                                        onUpdate={() => {
                                            fetchAppointments();
                                            // Si después de actualizar ya no hay citas en el día, cerramos el modal
                                            const updatedApps = filteredAppointments.filter(a => {
                                                const d = new Date(a.scheduled_at);
                                                return d.getDate() === selectedDate.getDate() &&
                                                       d.getMonth() === selectedDate.getMonth() &&
                                                       d.getFullYear() === selectedDate.getFullYear() &&
                                                       a.id !== app.id; // Excluir la que se acaba de cancelar si no se ha refrescado aún
                                            });
                                            if (updatedApps.length === 0) {
                                                setShowDayModal(false);
                                            }
                                        }} 
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Footer Modal */}
                        <div className="flex justify-end pt-3 border-t border-white/10">
                            <Button 
                                onClick={() => setShowDayModal(false)}
                                className="bg-[#00B4DB] hover:bg-[#00B4DB]/90 text-[#070B12] font-semibold rounded-xl px-5 hover:text-[#070B12]"
                            >
                                Cerrar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
