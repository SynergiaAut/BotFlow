'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CalendarSetupWizard from '@/components/calendar/CalendarSetupWizard';
import CalcomSetupForm from '@/components/calendar/CalcomSetupForm';
import { Calendar, Trash2, RefreshCw, Clock, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function CalendarSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [tenantId, setTenantId] = useState<string | null>(null);
    const [connection, setConnection] = useState<any>(null);
    const [providerType, setProviderType] = useState<'google' | 'calcom' | null>(null);
    const [showWizard, setShowWizard] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('No autenticado.');
                return;
            }

            const { data: roleData } = await supabase
                .from('user_roles')
                .select('tenant_id')
                .eq('user_id', user.id)
                .single();

            const tid = roleData?.tenant_id;
            if (!tid) {
                toast.error('Tenant no encontrado.');
                return;
            }
            setTenantId(tid);

            // Cargar conexión de calendario existente
            const { data: conn } = await supabase
                .from('calendar_connections')
                .select('*')
                .eq('tenant_id', tid)
                .maybeSingle();

            setConnection(conn);
            if (conn) {
                setProviderType(conn.provider);
            }
        } catch (e) {
            console.error('[FAST-ORDER-INV] Error al cargar la configuración de calendario:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnect = async () => {
        if (!tenantId) return;
        if (!confirm('¿Estás seguro de que deseas desconectar tu calendario? Esto desactivará el agendamiento del bot.')) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('calendar_connections')
                .delete()
                .eq('tenant_id', tenantId);

            if (error) throw error;

            toast.success('Calendario desconectado con éxito.');
            setConnection(null);
            setProviderType(null);
            setShowWizard(false);
        } catch (e) {
            console.error('[FAST-ORDER-INV] Error al desconectar el calendario:', e);
            toast.error('Error al desconectar el calendario.');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !tenantId) {
        return (
            <div className="flex items-center justify-center min-h-[400px] bg-[#070B12]">
                <RefreshCw className="w-8 h-8 animate-spin text-[#00B4DB]" />
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto bg-[#070B12] p-8 md:p-12 relative font-sans text-white min-h-screen">
            {/* Background elements - Orbital atmosphere */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00B4DB]/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-sky-500/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="max-w-4xl mx-auto space-y-10 relative z-10">
                {/* Header with Back Button */}
                <div className="border-b border-white/10 pb-8 space-y-4">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/settings" className="inline-flex items-center justify-center rounded-xl border border-white/10 w-10 h-10 hover:bg-white/5 bg-[#0B0F17] text-zinc-400 transition-all duration-300">
                            <ArrowLeft className="w-4 h-4 text-white" />
                        </Link>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#00B4DB]/10 border border-[#00B4DB]/20 rounded-full text-[#00B4DB] text-[10px] font-black uppercase tracking-widest">
                            <Calendar className="w-3 h-3" /> Agenda y Canales
                        </div>
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tighter">
                        Configuración de Calendario
                    </h1>
                    <p className="text-[#A6B3C4] font-medium max-w-xl leading-relaxed">
                        Vincula tu proveedor de agenda para permitir que el agente de IA reserve y valide tu disponibilidad en tiempo real.
                    </p>
                </div>

                {connection ? (
                    /* MOSTRAR DETALLE DE CONEXIÓN ACTIVA */
                    <Card className="border border-white/10 bg-[#0B0F17] rounded-[32px] p-8 hover:border-[#00B4DB]/20 transition-all duration-300">
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/5">
                            <div className="flex items-center gap-4">
                                <div className={"w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl " + (
                                    connection.provider === 'google' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'
                                )}>
                                    {connection.provider === 'google' ? 'G' : 'C'}
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-black text-white flex items-center gap-3">
                                        {connection.provider === 'google' ? 'Google Calendar' : 'Cal.com'}
                                        <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-xs px-2 py-0.5 rounded-full font-bold">
                                            Activo
                                        </Badge>
                                    </CardTitle>
                                    <CardDescription className="text-zinc-500">
                                        Conexión establecida el {new Date(connection.created_at).toLocaleDateString()}
                                    </CardDescription>
                                </div>
                            </div>
                            <Button 
                                variant="destructive" 
                                onClick={handleDisconnect} 
                                disabled={loading} 
                                className="h-10 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 text-xs font-black uppercase tracking-widest px-5 gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Desconectar
                            </Button>
                        </CardHeader>
                        <CardContent className="pt-8 space-y-6 text-sm text-zinc-400">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Identificador de Agenda</p>
                                    <p className="font-semibold font-mono text-white truncate text-base">
                                        {connection.provider === 'google' ? connection.google_calendar_id : connection.calcom_event_type_id}
                                    </p>
                                </div>
                                <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Zona Horaria</p>
                                    <p className="font-semibold text-white text-base">
                                        {connection.timezone || 'America/Bogota'}
                                    </p>
                                </div>
                            </div>

                            <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                                <div className="flex items-center gap-2 text-white font-bold text-base">
                                    <Clock className="w-5 h-5 text-amber-400" />
                                    Horario Laboral Disponible
                                </div>
                                <div className="space-y-1 text-zinc-400">
                                    <p>
                                        <span className="font-medium text-zinc-500">Días:</span> {connection.availability_days?.map((d: number) => {
                                            return ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][d - 1];
                                        }).join(', ')}
                                    </p>
                                    <p>
                                        <span className="font-medium text-zinc-500">Horario:</span> {connection.availability_start?.substring(0, 5)} - {connection.availability_end?.substring(0, 5)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : showWizard ? (
                    /* MOSTRAR EL WIZARD DE INSTALACIÓN */
                    <div className="space-y-6">
                        <Button 
                            variant="ghost" 
                            onClick={() => setShowWizard(false)} 
                            className="h-10 rounded-xl border border-white/10 text-zinc-400 hover:bg-white/5 text-xs font-black uppercase tracking-widest px-4 gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" /> Volver a Opciones
                        </Button>
                        {providerType === 'google' ? (
                            <CalendarSetupWizard 
                                tenantId={tenantId!} 
                                onComplete={init} 
                            />
                        ) : (
                            <CalcomSetupForm 
                                onSuccess={init} 
                            />
                        )}
                    </div>
                ) : (
                    /* MOSTRAR SELECCIÓN DE PROVEEDOR */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                        <Card className="border border-white/10 bg-[#0B0F17] rounded-[32px] p-8 hover:border-[#00B4DB]/30 transition-all duration-300 flex flex-col justify-between">
                            <CardHeader className="space-y-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-black text-2xl">
                                    G
                                </div>
                                <div className="space-y-1">
                                    <CardTitle className="text-xl font-black text-white tracking-tight">Google Calendar</CardTitle>
                                    <CardDescription className="text-zinc-500 text-xs leading-relaxed">
                                        Recomendado. Sincroniza directamente con tu cuenta personal o laboral de Gmail.
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <ul className="text-xs text-zinc-400 space-y-2 list-disc list-inside">
                                    <li>Asistente guiado paso a paso</li>
                                    <li>OAuth2 seguro integrado</li>
                                    <li>Selección de calendario secundario</li>
                                </ul>
                            </CardContent>
                            <CardFooter className="pt-6">
                                <Button 
                                    className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest"
                                    onClick={() => {
                                        setProviderType('google');
                                        setShowWizard(true);
                                    }}
                                >
                                    Iniciar Configuración
                                </Button>
                            </CardFooter>
                        </Card>

                        <Card className="border border-white/10 bg-[#0B0F17] rounded-[32px] p-8 hover:border-[#00B4DB]/30 transition-all duration-300 flex flex-col justify-between">
                            <CardHeader className="space-y-4">
                                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-black text-2xl">
                                    C
                                </div>
                                <div className="space-y-1">
                                    <CardTitle className="text-xl font-black text-white tracking-tight">Cal.com</CardTitle>
                                    <CardDescription className="text-zinc-500 text-xs leading-relaxed">
                                        Sincroniza tu cuenta de Cal.com utilizando tu API Key personal y Event Type.
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <ul className="text-xs text-zinc-400 space-y-2 list-disc list-inside">
                                    <li>Configuración rápida con API Key</li>
                                    <li>Soporte de Event Type específico</li>
                                    <li>Aislamiento de reservas directo</li>
                                </ul>
                            </CardContent>
                            <CardFooter className="pt-6">
                                <Button 
                                    className="w-full h-11 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black uppercase tracking-widest"
                                    onClick={() => {
                                        setProviderType('calcom');
                                        setShowWizard(true);
                                    }}
                                >
                                    Conectar Cal.com
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
