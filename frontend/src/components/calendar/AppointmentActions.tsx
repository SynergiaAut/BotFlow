'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Calendar as CalendarIcon, Clock, X } from 'lucide-react';

interface AppointmentActionsProps {
    appointmentId: string;
    currentScheduledAt: string;
    onUpdate: () => void;
}

export default function AppointmentActions({ appointmentId, currentScheduledAt, onUpdate }: AppointmentActionsProps) {
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Reschedule form state
    const [newDate, setNewDate] = useState(currentScheduledAt.split('T')[0]);
    const [newTime, setNewTime] = useState(currentScheduledAt.split('T')[1]?.substring(0, 5) || '10:00');

    const handleCancel = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/calendar/appointments/${appointmentId}`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'No se pudo cancelar la cita');
            }

            toast.success('La cita ha sido cancelada exitosamente.');
            setShowCancelModal(false);
            onUpdate();
        } catch (error: any) {
            console.error('[FAST-ORDER-INV] Error cancelling appointment:', error);
            toast.error(error.message || 'Error al cancelar la cita.');
        } finally {
            setLoading(false);
        }
    };

    const handleReschedule = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Reconstruir scheduled_at con timezone offset de Colombia (-05:00)
            const scheduledAt = `${newDate}T${newTime}:00-05:00`;

            const res = await fetch(`/api/calendar/appointments/${appointmentId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    scheduled_at: scheduledAt,
                    duration_minutes: 30
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'No se pudo reprogramar la cita');
            }

            toast.success('La cita ha sido reprogramada exitosamente.');
            setShowRescheduleModal(false);
            onUpdate();
        } catch (error: any) {
            console.error('[FAST-ORDER-INV] Error rescheduling appointment:', error);
            toast.error(error.message || 'Error al reprogramar la cita.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex gap-2">
            <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowRescheduleModal(true)}
                className="text-xs font-semibold bg-[#111722]/50 hover:bg-[#111722]/80 border-white/10 text-white hover:text-white transition-all rounded-xl"
            >
                Reprogramar
            </Button>
            <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setShowCancelModal(true)}
                className="text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:text-red-300 transition-all rounded-xl"
            >
                Cancelar
            </Button>

            {/* MODAL DE CANCELACIÓN */}
            {showCancelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-[#0B0F17] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-white">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white">Cancelar Cita</h3>
                            <button onClick={() => setShowCancelModal(false)} className="text-zinc-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-sm text-zinc-400">
                            ¿Estás seguro de que deseas cancelar esta cita? Esta acción liberará el espacio en tu calendario de Google/Cal.com y enviará una actualización al cliente.
                        </p>
                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="ghost" onClick={() => setShowCancelModal(false)} disabled={loading} className="hover:bg-white/5 text-zinc-400 hover:text-white rounded-xl">
                                Volver
                            </Button>
                            <Button variant="destructive" onClick={handleCancel} disabled={loading} className="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:text-red-300 rounded-xl px-4">
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Cancelando...
                                    </>
                                ) : (
                                    'Confirmar Cancelación'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE REPROGRAMACIÓN */}
            {showRescheduleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <form onSubmit={handleReschedule} className="bg-[#0B0F17] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-white">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white">Reprogramar Cita</h3>
                            <button type="button" onClick={() => setShowRescheduleModal(false)} className="text-zinc-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <Label htmlFor="rescheduleDate" className="text-xs font-bold text-zinc-400 uppercase">Nueva Fecha</Label>
                                <div className="relative">
                                    <Input
                                        id="rescheduleDate"
                                        type="date"
                                        value={newDate}
                                        onChange={(e) => setNewDate(e.target.value)}
                                        className="bg-[#111722]/50 text-white border-white/10 pl-10 rounded-xl focus-visible:ring-1 focus-visible:ring-[#00B4DB]/50 focus-visible:border-[#00B4DB]/50"
                                        required
                                    />
                                    <CalendarIcon className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="rescheduleTime" className="text-xs font-bold text-zinc-400 uppercase">Nueva Hora</Label>
                                <div className="relative">
                                    <Input
                                        id="rescheduleTime"
                                        type="time"
                                        value={newTime}
                                        onChange={(e) => setNewTime(e.target.value)}
                                        className="bg-[#111722]/50 text-white border-white/10 pl-10 rounded-xl focus-visible:ring-1 focus-visible:ring-[#00B4DB]/50 focus-visible:border-[#00B4DB]/50"
                                        required
                                    />
                                    <Clock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                            <Button type="button" variant="ghost" onClick={() => setShowRescheduleModal(false)} disabled={loading} className="hover:bg-white/5 text-zinc-400 hover:text-white rounded-xl">
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={loading} className="bg-[#00B4DB] hover:bg-[#00B4DB]/90 text-[#070B12] font-semibold rounded-xl px-4">
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    'Reprogramar Cita'
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
