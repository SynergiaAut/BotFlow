'use client';

import React, { useState, useEffect } from 'react';
import AppointmentCard from './AppointmentCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Search, RefreshCw, Filter, CheckCircle2, XCircle, RefreshCcw, CalendarDays } from 'lucide-react';

export default function AgendaView() {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filtros y búsquedas
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    
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

    // Filtrado de citas
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

    return (
        <div className="space-y-6">
            {/* Tarjetas de Métricas de Agenda */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950/40">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 rounded-xl">
                            <CalendarDays className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase">Total Citas</p>
                            <p className="text-xl font-black text-zinc-950 dark:text-white">{stats.total}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950/40">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2.5 bg-green-500/10 text-green-500 rounded-xl">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase">Confirmadas</p>
                            <p className="text-xl font-black text-green-600">{stats.confirmed}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950/40">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl">
                            <RefreshCcw className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase">Reprogramadas</p>
                            <p className="text-xl font-black text-blue-600">{stats.rescheduled}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950/40">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2.5 bg-red-500/10 text-red-500 rounded-xl">
                            <XCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase">Canceladas</p>
                            <p className="text-xl font-black text-red-600">{stats.cancelled}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Barra de Filtros */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-zinc-50 dark:bg-zinc-900/30 p-4 rounded-2xl border border-zinc-100/50 dark:border-zinc-900/50">
                <div className="relative w-full sm:max-w-xs">
                    <Input
                        type="text"
                        placeholder="Buscar por cliente o servicio..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-white dark:bg-zinc-950 pl-9 border-zinc-200 focus:ring-amber-500"
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
                            className={`text-xs font-semibold rounded-xl px-3 py-1.5 h-auto ${
                                statusFilter === f.value 
                                    ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                                    : 'bg-white dark:bg-zinc-950 border-zinc-200 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50'
                            }`}
                        >
                            {f.label}
                        </Button>
                    ))}
                    
                    <Button variant="ghost" size="icon" onClick={fetchAppointments} disabled={loading} className="ml-2">
                        <RefreshCw className={`w-4 h-4 text-zinc-500 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Listado de Citas */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
                    <RefreshCw className="w-8 h-8 animate-spin text-amber-600" />
                    <p className="text-sm text-zinc-500 font-semibold">Cargando agenda de citas...</p>
                </div>
            ) : filteredAppointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 bg-zinc-50/50 dark:bg-zinc-900/10 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                    <Calendar className="w-10 h-10 text-zinc-300" />
                    <div className="space-y-1">
                        <h4 className="font-bold text-zinc-900 dark:text-white">Sin citas encontradas</h4>
                        <p className="text-xs text-zinc-500 max-w-xs">
                            No hay registros que coincidan con la búsqueda o el filtro seleccionado en este momento.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredAppointments.map((app) => (
                        <AppointmentCard 
                            key={app.id} 
                            appointment={app} 
                            onUpdate={fetchAppointments} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
