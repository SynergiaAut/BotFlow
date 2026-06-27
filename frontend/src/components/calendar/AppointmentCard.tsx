'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppointmentActions from './AppointmentActions';
import { Calendar, Phone, Mail, Clock, MessageSquare } from 'lucide-react';

interface Appointment {
    id: string;
    contact_name: string;
    contact_phone?: string;
    contact_email?: string;
    scheduled_at: string;
    duration_minutes: number;
    service_title: string;
    notes?: string;
    status: 'confirmed' | 'cancelled' | 'rescheduled' | 'pending';
    provider: 'google' | 'calcom';
}

interface AppointmentCardProps {
    appointment: Appointment;
    onUpdate: () => void;
}

export default function AppointmentCard({ appointment, onUpdate }: AppointmentCardProps) {
    const {
        id,
        contact_name,
        contact_phone,
        contact_email,
        scheduled_at,
        duration_minutes,
        service_title,
        notes,
        status,
        provider
    } = appointment;

    const date = new Date(scheduled_at);
    
    // Formateadores
    const formattedDate = date.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
    
    const formattedTime = date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    });

    const statusConfig = {
        confirmed: { label: 'Confirmada', color: 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border-green-500/30' },
        cancelled: { label: 'Cancelada', color: 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/30' },
        rescheduled: { label: 'Reprogramada', color: 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-blue-500/30' },
        pending: { label: 'Pendiente', color: 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border-amber-500/30' }
    }[status] || { label: status, color: 'bg-zinc-800 text-zinc-300' };

    return (
        <Card className="border border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950/40 hover:border-zinc-200 dark:hover:border-zinc-800 transition-all shadow-sm">
            <CardContent className="p-6 space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                        <h4 className="font-extrabold text-lg text-zinc-950 dark:text-white leading-tight">
                            {service_title}
                        </h4>
                        <p className="text-sm font-semibold text-amber-600">
                            Cliente: {contact_name}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                        <Badge variant="outline" className={`${statusConfig.color} font-bold px-2.5 py-0.5 rounded-full border`}>
                            {statusConfig.label}
                        </Badge>
                        <span className="text-[10px] text-zinc-400 capitalize">
                            Vía {provider === 'google' ? 'Google' : 'Cal.com'}
                        </span>
                    </div>
                </div>

                {/* Detalles de Cita */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-zinc-500 dark:text-zinc-400 border-t border-zinc-50 dark:border-zinc-900 pt-3">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-zinc-400 shrink-0" />
                        <span className="capitalize">{formattedDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
                        <span>{formattedTime} ({duration_minutes} min)</span>
                    </div>
                </div>

                {/* Detalles del Lead */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-900/30 p-3 rounded-xl border border-zinc-100/50 dark:border-zinc-900/50">
                    <div className="flex items-center gap-2 truncate">
                        <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span>{contact_phone || 'Teléfono no registrado'}</span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span>{contact_email || 'Correo no registrado'}</span>
                    </div>
                </div>

                {/* Notas */}
                {notes && (
                    <div className="flex gap-2 text-xs text-zinc-500 border-t border-zinc-50 dark:border-zinc-900 pt-3">
                        <MessageSquare className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                        <p className="italic">"{notes}"</p>
                    </div>
                )}

                {/* Acciones */}
                {status !== 'cancelled' && (
                    <div className="flex justify-end border-t border-zinc-50 dark:border-zinc-900 pt-3">
                        <AppointmentActions 
                            appointmentId={id} 
                            currentScheduledAt={scheduled_at} 
                            onUpdate={onUpdate} 
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
