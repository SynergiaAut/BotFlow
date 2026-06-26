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
            <div className="flex items-center justify-center min-h-[400px]">
                <RefreshCw className="w-8 h-8 animate-spin text-amber-600" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 max-w-4xl px-4 space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/settings" className="inline-flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 w-10 h-10 hover:bg-zinc-50 dark:hover:bg-zinc-900 bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400">
                    <ArrowLeft className="w-4 h-4" />
                </Link>
                <div>
                    <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white">Agenda y Calendario</h1>
                    <p className="text-sm text-zinc-500">
                        Vincula tu calendario externo para permitir agendamientos automáticos mediante IA.
                    </p>
                </div>
            </div>

            {connection ? (
                /* MOSTRAR ESTADO CONECTADO */
                <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-lg ${
                                connection.provider === 'google' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'
                            }`}>
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold flex items-center gap-2">
                                    {connection.provider === 'google' ? 'Google Calendar' : 'Cal.com'}
                                    <Badge className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-0.5">
                                        Activo
                                    </Badge>
                                </CardTitle>
                                <CardDescription>
                                    Conexión establecida el {new Date(connection.created_at).toLocaleDateString()}
                                </CardDescription>
                            </div>
                        </div>
                        <Button variant="destructive" onClick={handleDisconnect} disabled={loading} size="sm" className="font-medium">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Desconectar
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4 text-sm text-zinc-600 dark:text-zinc-400">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800/50 space-y-1">
                                <p className="text-xs text-zinc-400 font-bold uppercase">Identificador de Agenda</p>
                                <p className="font-semibold font-mono text-zinc-950 dark:text-white truncate">
                                    {connection.provider === 'google' ? connection.google_calendar_id : connection.calcom_event_type_id}
                                </p>
                            </div>
                            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800/50 space-y-1">
                                <p className="text-xs text-zinc-400 font-bold uppercase">Zona Horaria</p>
                                <p className="font-semibold text-zinc-950 dark:text-white">
                                    {connection.timezone || 'America/Bogota'}
                                </p>
                            </div>
                        </div>

                        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800/50 space-y-2">
                            <div className="flex items-center gap-2 text-zinc-950 dark:text-white font-semibold">
                                <Clock className="w-4 h-4 text-amber-500" />
                                Horario Laboral Disponible
                            </div>
                            <p className="text-zinc-600 dark:text-zinc-400">
                                Días: {connection.availability_days?.map((d: number) => {
                                    return ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][d - 1];
                                }).join(', ')}
                            </p>
                            <p className="text-zinc-600 dark:text-zinc-400">
                                Horario: {connection.availability_start?.substring(0, 5)} - {connection.availability_end?.substring(0, 5)}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ) : showWizard ? (
                /* MOSTRAR EL WIZARD DE INSTALACIÓN */
                <div>
                    <Button variant="ghost" onClick={() => setShowWizard(false)} className="mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver a Opciones
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
                    <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-md hover:shadow-lg transition-all flex flex-col justify-between">
                        <CardHeader>
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xl mb-2">
                                G
                            </div>
                            <CardTitle className="text-lg font-bold">Google Calendar</CardTitle>
                            <CardDescription>
                                Recomendado. Sincroniza directamente con tu cuenta personal o laboral de Gmail.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="text-xs text-zinc-500 space-y-1 list-disc list-inside">
                                <li>Asistente guiado paso a paso</li>
                                <li>OAuth2 integrado</li>
                                <li>Selección de calendario secundario</li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button 
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                                onClick={() => {
                                    setProviderType('google');
                                    setShowWizard(true);
                                }}
                            >
                                Iniciar Configuración
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-md hover:shadow-lg transition-all flex flex-col justify-between">
                        <CardHeader>
                            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xl mb-2">
                                C
                            </div>
                            <CardTitle className="text-lg font-bold">Cal.com</CardTitle>
                            <CardDescription>
                                Sincroniza tu cuenta de Cal.com utilizando tu API Key personal.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="text-xs text-zinc-500 space-y-1 list-disc list-inside">
                                <li>Configuración rápida con API Key</li>
                                <li>Soporte de Event Type específico</li>
                                <li>Aislamiento directo</li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button 
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium"
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
    );
}
