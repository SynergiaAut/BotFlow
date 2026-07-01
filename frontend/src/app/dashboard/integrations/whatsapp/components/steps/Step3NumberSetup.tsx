'use client'

import React, { useState } from 'react'
import { Sparkles, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step3NumberSetupProps {
    scenario: 'A' | 'B' | 'C' | 'D'
    initialNumberType: 'new' | 'existing'
    onSubmit: (numberType: 'new' | 'existing') => void
    onBack: () => void
    isLoading: boolean
}

export function Step3NumberSetup({
    scenario,
    initialNumberType,
    onSubmit,
    onBack,
    isLoading
}: Step3NumberSetupProps) {
    const [numberType, setNumberType] = useState<'new' | 'existing'>(
        scenario === 'A' ? 'new' : initialNumberType
    )

    // Detalle de los escenarios segun la Spec
    const scenarioTimelines = {
        A: { new: '3 a 5 días hábiles', existing: 'N/A' },
        B: { new: '1 a 2 días hábiles', existing: '3 a 7 días hábiles' },
        C: { new: '30 min a 2 horas', existing: '1 a 3 días hábiles' },
        D: { new: '30 min a 2 horas', existing: '2 a 5 días hábiles' }
    }

    const currentTimeline = scenarioTimelines[scenario]

    const handleNext = () => {
        onSubmit(numberType)
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center space-y-2 mb-6">
                <h2 className="text-2xl font-bold text-white tracking-tight">
                    ¿Qué número vas a conectar a Skylab?
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                    Recomendamos fuertemente usar una línea limpia y dedicada para tu bot comercial.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                {/* Opcion: Numero Nuevo (Recomendado) */}
                <button
                    type="button"
                    onClick={() => setNumberType('new')}
                    className={cn(
                        "relative flex flex-col items-start p-6 text-left rounded-2xl border transition-all duration-300 w-full group overflow-hidden cursor-pointer",
                        numberType === 'new'
                            ? "bg-slate-900/40 border-primary/80 shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)] ring-1 ring-primary/40"
                            : "bg-slate-900/10 border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900/25"
                    )}
                >
                    {/* Badge Recomendado */}
                    <div className="absolute top-4 right-4 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 border border-emerald-500/20">
                        <Sparkles className="w-3 h-3 animate-pulse" />
                        Recomendado
                    </div>

                    <div className="p-3 rounded-xl mb-4 bg-primary/20 text-primary">
                        <Sparkles className="w-6 h-6" />
                    </div>

                    <h3 className="font-semibold text-base mb-2 text-white">
                        Número Nuevo o Dedicado
                    </h3>

                    <p className="text-sm text-slate-400 leading-relaxed mb-4 flex-grow">
                        Una línea limpia sin historial previo. Es el método más seguro, rápido de configurar y no requiere interrumpir operaciones existentes.
                    </p>

                    <div className="mt-auto w-full pt-4 border-t border-slate-900 flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">Estimado de aprobación:</span>
                        <span className="text-emerald-400 font-bold">{currentTimeline.new}</span>
                    </div>
                </button>

                {/* Opcion: Numero Existente */}
                <button
                    type="button"
                    disabled={scenario === 'A'}
                    onClick={() => setNumberType('existing')}
                    className={cn(
                        "relative flex flex-col items-start p-6 text-left rounded-2xl border transition-all duration-300 w-full group overflow-hidden",
                        scenario === 'A' 
                            ? "opacity-40 cursor-not-allowed border-slate-900 bg-slate-950/20"
                            : numberType === 'existing'
                                ? "bg-slate-900/40 border-primary/80 shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)] ring-1 ring-primary/40 cursor-pointer"
                                : "bg-slate-900/10 border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900/25 cursor-pointer"
                    )}
                >
                    {scenario === 'A' && (
                        <div className="absolute top-4 right-4 bg-slate-900 text-slate-500 text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-800">
                            No Aplica
                        </div>
                    )}

                    <div className="p-3 rounded-xl mb-4 bg-slate-800/60 text-slate-400">
                        <AlertTriangle className="w-6 h-6" />
                    </div>

                    <h3 className="font-semibold text-base mb-2 text-white">
                        Número Existente / Actual
                    </h3>

                    <p className="text-sm text-slate-400 leading-relaxed mb-4 flex-grow">
                        Migrar la línea actual que ya usas para tus clientes. Requiere un proceso de desvinculación comercial en Meta para conectar a Skylab.
                    </p>

                    <div className="mt-auto w-full pt-4 border-t border-slate-900 flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">Estimado de aprobación:</span>
                        <span className={cn("font-bold", scenario === 'A' ? "text-slate-500" : "text-amber-400")}>
                            {currentTimeline.existing}
                        </span>
                    </div>
                </button>
            </div>

            {/* Advertencias contextuales cuando eligen Numero Existente */}
            {numberType === 'existing' && scenario !== 'A' && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 space-y-3 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-2.5 text-amber-400 font-semibold text-sm">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        Atención: Lee los requerimientos antes de continuar
                    </div>

                    <ul className="space-y-2 text-xs text-slate-400 leading-relaxed list-disc list-inside">
                        {scenario === 'B' && (
                            <>
                                <li>
                                    <strong className="text-slate-200">Pérdida de Historial Local</strong>: Al activar la API oficial en un número existente, Meta exige borrar la app WhatsApp (o Business) del teléfono. Perderás los chats locales y archivos del celular.
                                </li>
                                <li>
                                    <strong className="text-slate-200">Interrupción de Servicio</strong>: Durante la migración (de 3 a 7 días), el número no podrá enviar ni recibir mensajes de forma convencional.
                                </li>
                            </>
                        )}
                        {scenario === 'C' && (
                            <>
                                <li>
                                    <strong className="text-slate-200">Requiere eliminación previa</strong>: Debes dar de baja el número de cualquier dispositivo físico o app de negocios antes de registrar la API de Cloud en Meta.
                                </li>
                            </>
                        )}
                        {scenario === 'D' && (
                            <>
                                <li>
                                    <strong className="text-slate-200">Coordinación de Migración (WABA)</strong>: Debes solicitar la baja del bot actual a tu proveedor anterior o iniciar el proceso de migración de número de Meta Business (WABA). Esto puede demorar de 2 a 5 días hábiles.
                                </li>
                                <li>
                                    <strong className="text-slate-200">Webhook temporal</strong>: Asegúrate de apagar el webhook del proveedor anterior para evitar conflictos en la entrega de mensajes.
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            )}

            {/* Acciones de navegacion */}
            <div className="flex justify-between items-center pt-4">
                <button
                    type="button"
                    onClick={onBack}
                    className="px-6 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition-colors text-sm font-semibold"
                >
                    Atrás
                </button>
                <button
                    type="button"
                    onClick={handleNext}
                    disabled={isLoading}
                    className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 transition-all text-sm font-semibold shadow-md flex items-center justify-center min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    ) : (
                        'Siguiente'
                    )}
                </button>
            </div>
        </div>
    )
}
