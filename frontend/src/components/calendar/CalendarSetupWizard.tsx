'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Calendar, ArrowRight, ArrowLeft, Loader2, CheckCircle, Shield, Key, Clock, Check } from 'lucide-react';

interface CalendarSetupWizardProps {
    onComplete?: () => void;
    tenantId: string;
    existingConnection?: any;
}

const DAYS_OF_WEEK = [
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' },
    { value: 7, label: 'Domingo' }
];

export default function CalendarSetupWizard({ onComplete, tenantId, existingConnection }: CalendarSetupWizardProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    
    // Step 3 state
    const [calendars, setCalendars] = useState<any[]>([]);
    const [selectedCalendarId, setSelectedCalendarId] = useState('primary');
    
    // Step 4 state
    const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
    const [startTime, setStartTime] = useState('08:00');
    const [endTime, setEndTime] = useState('18:00');
    const [timezone, setTimezone] = useState('America/Bogota');
    
    // Step 5 state
    const [testResults, setTestResults] = useState<any>(null);

    const supabase = createClient();

    // Cargar estado inicial si ya existe conexión
    useEffect(() => {
        if (existingConnection) {
            if (existingConnection.google_calendar_id) setSelectedCalendarId(existingConnection.google_calendar_id);
            if (existingConnection.availability_days) setSelectedDays(existingConnection.availability_days);
            if (existingConnection.availability_start) setStartTime(existingConnection.availability_start.substring(0, 5));
            if (existingConnection.availability_end) setEndTime(existingConnection.availability_end.substring(0, 5));
            if (existingConnection.timezone) setTimezone(existingConnection.timezone);
        }
    }, [existingConnection]);

    // Detectar éxito de OAuth en la URL para saltar al paso 3
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('success') === 'google') {
            setStep(3);
            fetchCalendars();
            // Limpiar los parámetros de la URL sin recargar
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }
    }, []);

    const fetchCalendars = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/calendar/google/calendars');
            if (!res.ok) throw new Error('Error al obtener calendarios');
            const data = await res.json();
            setCalendars(data.calendars || []);
        } catch (e) {
            console.error('[FAST-ORDER-INV] Error fetching google calendars:', e);
            toast.error('No se pudieron cargar tus calendarios de Google. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleConnect = () => {
        setLoading(true);
        // Redirigir al endpoint de autenticación de Google
        window.location.href = '/api/calendar/google/auth';
    };

    const saveCalendarSelection = async () => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('calendar_connections')
                .update({ google_calendar_id: selectedCalendarId })
                .eq('tenant_id', tenantId);

            if (error) throw error;
            toast.success('Calendario guardado correctamente.');
            setStep(4);
        } catch (e) {
            console.error('[FAST-ORDER-INV] Error saving calendar selection:', e);
            toast.error('Error al guardar la selección de calendario.');
        } finally {
            setLoading(false);
        }
    };

    const saveAvailabilitySettings = async () => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('calendar_connections')
                .update({
                    availability_days: selectedDays,
                    availability_start: `${startTime}:00`,
                    availability_end: `${endTime}:00`,
                    timezone
                })
                .eq('tenant_id', tenantId);

            if (error) throw error;
            toast.success('Configuración de disponibilidad guardada.');
            runAvailabilityTest();
        } catch (e) {
            console.error('[FAST-ORDER-INV] Error saving availability settings:', e);
            toast.error('Error al guardar la configuración de disponibilidad.');
        } finally {
            setLoading(false);
        }
    };

    const runAvailabilityTest = async () => {
        setLoading(true);
        setStep(5);
        try {
            // Testear disponibilidad de hoy a 3 días más
            const today = new Date().toISOString().split('T')[0];
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 4);
            const future = futureDate.toISOString().split('T')[0];

            const res = await fetch(`/api/calendar/availability?tenant_id=${tenantId}&date_from=${today}&date_to=${future}`);
            if (!res.ok) throw new Error('Error al ejecutar test de disponibilidad');
            const data = await res.json();
            
            const freeSlots = data.slots?.filter((s: any) => s.available) || [];
            setTestResults({
                success: true,
                totalSlots: freeSlots.length,
                slots: freeSlots.slice(0, 5)
            });
        } catch (e) {
            console.error('[FAST-ORDER-INV] Error running availability test:', e);
            setTestResults({ success: false });
        } finally {
            setLoading(false);
        }
    };

    const toggleDay = (day: number) => {
        if (selectedDays.includes(day)) {
            if (selectedDays.length > 1) {
                setSelectedDays(selectedDays.filter(d => d !== day));
            } else {
                toast.error('Debes seleccionar al menos un día.');
            }
        } else {
            setSelectedDays([...selectedDays, day].sort());
        }
    };

    const renderProgress = () => {
        return (
            <div className="flex items-center justify-between mb-8 px-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <React.Fragment key={i}>
                        <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                                step >= i 
                                    ? 'bg-amber-600 text-white' 
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                            }`}>
                                {step > i ? <Check className="w-4 h-4" /> : i}
                            </div>
                            <span className="text-xs mt-1 text-zinc-500 hidden sm:block">
                                {i === 1 && 'Introducción'}
                                {i === 2 && 'Conexión'}
                                {i === 3 && 'Calendario'}
                                {i === 4 && 'Horarios'}
                                {i === 5 && 'Test'}
                            </span>
                        </div>
                        {i < 5 && (
                            <div className={`flex-1 h-0.5 mx-2 transition-colors ${
                                step > i ? 'bg-amber-600' : 'bg-zinc-100 dark:bg-zinc-800'
                            }`} />
                        )}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    return (
        <Card className="w-full max-w-2xl mx-auto border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl">
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-900 pb-6">
                <CardTitle className="text-2xl font-extrabold text-zinc-900 dark:text-white">
                    Configuración de Google Calendar
                </CardTitle>
                <CardDescription>
                    Asistente guiado para sincronizar tu agenda con Skylab
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-8 min-h-[300px]">
                {renderProgress()}

                {/* PASO 1: INTRODUCCIÓN */}
                {step === 1 && (
                    <div className="space-y-6">
                        <div className="flex items-start gap-4 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800/50">
                            <Shield className="w-8 h-8 text-amber-600 shrink-0 mt-1" />
                            <div>
                                <h3 className="font-bold text-zinc-950 dark:text-white">Privacidad y Seguridad Garantizada</h3>
                                <p className="text-sm text-zinc-500 mt-1">
                                    Skylab solo solicitará permisos para leer y escribir eventos en tu calendario seleccionado. 
                                    <strong> Nunca</strong> leeremos tus correos, contactos o información personal ajena al agendamiento.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-bold text-zinc-950 dark:text-white">¿Qué podrá hacer el bot?</h4>
                            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    Consultar tus espacios ocupados para proponer horarios libres.
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    Bloquear citas automáticamente en tu calendario de Google al confirmarlas por WhatsApp.
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    Reprogramar o liberar espacios si cancelas una cita desde la consola.
                                </li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* PASO 2: CONEXIÓN */}
                {step === 2 && (
                    <div className="flex flex-col items-center justify-center py-6 text-center space-y-6">
                        <div className="p-4 bg-amber-500/10 text-amber-500 rounded-full">
                            <Key className="w-12 h-12" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-zinc-950 dark:text-white">Iniciar autorización</h3>
                            <p className="text-sm text-zinc-500 max-w-md">
                                Al hacer clic abajo, serás redirigido de forma segura a Google para autorizar a Skylab la vinculación con tu Calendar.
                            </p>
                        </div>
                        <Button 
                            onClick={handleGoogleConnect} 
                            disabled={loading}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-8 py-6 rounded-xl text-base shadow-lg hover:shadow-amber-600/20"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Conectando...
                                </>
                            ) : (
                                'Conectar con Google Calendar'
                            )}
                        </Button>
                    </div>
                )}

                {/* PASO 3: SELECCIÓN DE CALENDARIO */}
                {step === 3 && (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-base font-bold">Selecciona el Calendario a usar</Label>
                            <p className="text-sm text-zinc-500">
                                Es el calendario donde el bot buscará tus eventos ocupados y donde agendará las nuevas citas.
                            </p>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-10">
                                <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
                            </div>
                        ) : (
                            <div className="grid gap-3 max-h-[220px] overflow-y-auto pr-2">
                                {calendars.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-zinc-500 border border-zinc-100 rounded-lg">
                                        No encontramos calendarios. Intenta recargar.
                                    </div>
                                ) : (
                                    calendars.map((cal) => (
                                        <div 
                                            key={cal.id}
                                            onClick={() => setSelectedCalendarId(cal.id)}
                                            className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                                selectedCalendarId === cal.id 
                                                    ? 'border-amber-600 bg-amber-500/5' 
                                                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: cal.backgroundColor || '#fbbf24' }} />
                                                <div className="text-left">
                                                    <p className="font-semibold text-sm text-zinc-950 dark:text-white">{cal.summary}</p>
                                                    <p className="text-xs text-zinc-500">{cal.id === 'primary' ? 'Calendario Principal' : cal.id}</p>
                                                </div>
                                            </div>
                                            {selectedCalendarId === cal.id && (
                                                <div className="w-5 h-5 rounded-full bg-amber-600 flex items-center justify-center text-white">
                                                    <Check className="w-3.5 h-3.5" />
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                        
                        <div className="flex justify-end">
                            <Button size="sm" variant="outline" onClick={fetchCalendars} disabled={loading}>
                                Recargar Calendarios
                            </Button>
                        </div>
                    </div>
                )}

                {/* PASO 4: DISPONIBILIDAD */}
                {step === 4 && (
                    <div className="space-y-6">
                        <div className="space-y-1">
                            <h3 className="font-bold text-base text-zinc-950 dark:text-white">Horario de Disponibilidad</h3>
                            <p className="text-sm text-zinc-500">
                                Define los días y rango de horas en los que el bot ofrecerá citas a tus clientes.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">Días laborables</Label>
                                <div className="flex flex-wrap gap-2">
                                    {DAYS_OF_WEEK.map((d) => {
                                        const active = selectedDays.includes(d.value);
                                        return (
                                            <button
                                                key={d.value}
                                                type="button"
                                                onClick={() => toggleDay(d.value)}
                                                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                                                    active
                                                        ? 'bg-amber-600 text-white border-amber-600'
                                                        : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100'
                                                }`}
                                            >
                                                {d.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="startTime" className="text-sm font-semibold">Hora de inicio</Label>
                                    <Input
                                        id="startTime"
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="bg-zinc-50 dark:bg-zinc-900 focus:ring-amber-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="endTime" className="text-sm font-semibold">Hora de cierre</Label>
                                    <Input
                                        id="endTime"
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="bg-zinc-50 dark:bg-zinc-900 focus:ring-amber-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="timezone" className="text-sm font-semibold">Zona Horaria</Label>
                                <select
                                    id="timezone"
                                    value={timezone}
                                    onChange={(e) => setTimezone(e.target.value)}
                                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm focus:ring-amber-500 focus:border-amber-500"
                                >
                                    <option value="America/Bogota">Colombia (Bogotá) (UTC-5)</option>
                                    <option value="America/Mexico_City">México (CDMX) (UTC-6)</option>
                                    <option value="America/Santiago">Chile (Santiago) (UTC-4)</option>
                                    <option value="America/Lima">Perú (Lima) (UTC-5)</option>
                                    <option value="America/Caracas">Venezuela (Caracas) (UTC-4)</option>
                                    <option value="America/Argentina/Buenos_Aires">Argentina (Buenos Aires) (UTC-3)</option>
                                    <option value="America/New_York">Estados Unidos (New York) (UTC-5)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* PASO 5: TEST Y CONFIRMACIÓN */}
                {step === 5 && (
                    <div className="flex flex-col items-center justify-center text-center space-y-6">
                        {loading ? (
                            <>
                                <Loader2 className="w-12 h-12 animate-spin text-amber-600" />
                                <div className="space-y-1">
                                    <h3 className="font-bold text-zinc-950 dark:text-white">Ejecutando Test de Disponibilidad...</h3>
                                    <p className="text-sm text-zinc-500">Estamos verificando la conexión y horarios con Google APIs.</p>
                                </div>
                            </>
                        ) : testResults?.success ? (
                            <>
                                <div className="p-4 bg-green-500/10 text-green-500 rounded-full">
                                    <CheckCircle className="w-12 h-12" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-bold text-zinc-950 dark:text-white">¡Conexión Exitosa!</h3>
                                    <p className="text-sm text-zinc-500 max-w-md">
                                        Encontramos <strong>{testResults.totalSlots} slots disponibles</strong> esta semana en tu calendario seleccionado.
                                    </p>
                                </div>
                                
                                {testResults.slots.length > 0 && (
                                    <div className="w-full max-w-sm border border-zinc-100 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50 dark:bg-zinc-900/30">
                                        <p className="text-xs font-bold text-zinc-400 mb-2 uppercase text-left">Próximos slots detectados:</p>
                                        <div className="space-y-1 text-sm text-left font-mono">
                                            {testResults.slots.map((s: any, idx: number) => {
                                                const d = new Date(s.datetime);
                                                return (
                                                    <div key={idx} className="text-zinc-600 dark:text-zinc-400 flex justify-between">
                                                        <span>{d.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })}</span>
                                                        <span className="font-bold">{d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="p-4 bg-red-500/10 text-red-500 rounded-full">
                                    <CheckCircle className="w-12 h-12 rotate-45" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-bold text-zinc-950 dark:text-white">Error de Verificación</h3>
                                    <p className="text-sm text-zinc-500 max-w-md">
                                        No logramos establecer comunicación correcta o no hay slots disponibles. Revisa tus horarios de disponibilidad.
                                    </p>
                                </div>
                                <Button size="sm" variant="outline" onClick={runAvailabilityTest}>
                                    Reintentar Test
                                </Button>
                            </>
                        )}
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-between border-t border-zinc-100 dark:border-zinc-900 pt-6">
                <Button
                    variant="ghost"
                    onClick={() => setStep(step - 1)}
                    disabled={step === 1 || step === 5 || loading}
                    className="text-zinc-500 hover:text-zinc-950"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Atrás
                </Button>

                {step === 1 && (
                    <Button 
                        onClick={() => setStep(2)}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-medium"
                    >
                        Comenzar Asistente
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                )}

                {step === 3 && (
                    <Button 
                        onClick={saveCalendarSelection} 
                        disabled={loading}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-medium"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Siguiente'}
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                )}

                {step === 4 && (
                    <Button 
                        onClick={saveAvailabilitySettings} 
                        disabled={loading}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-medium"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Siguiente'}
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                )}

                {step === 5 && testResults?.success && (
                    <Button 
                        onClick={onComplete}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-8"
                    >
                        Finalizar Configuración
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
