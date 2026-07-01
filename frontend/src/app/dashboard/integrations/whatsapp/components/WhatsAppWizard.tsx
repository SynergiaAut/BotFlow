'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Step1Scenario } from './steps/Step1Scenario'
import { Step2BusinessInfo } from './steps/Step2BusinessInfo'
import { Step3NumberSetup } from './steps/Step3NumberSetup'
import { Step4Credentials } from './steps/Step4Credentials'
import { saveWizardProgress, validateCredentials, resetWizardSetup } from '../actions'
import { toast } from 'sonner'
import { CheckCircle2, RotateCcw, AlertTriangle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface WhatsAppWizardProps {
    initialConfig: {
        whatsapp_setup_step?: number
        scenario?: 'A' | 'B' | 'C' | 'D' | null
        number_type?: 'new' | 'existing'
        business_info?: any
        phone_number_id?: string
        waba_id?: string
        access_token_hint?: string
    }
    verifyToken: string
}

export function WhatsAppWizard({ initialConfig, verifyToken }: WhatsAppWizardProps) {
    const [step, setStep] = useState<number>(initialConfig.whatsapp_setup_step || 1)
    const [scenario, setScenario] = useState<'A' | 'B' | 'C' | 'D' | null>(initialConfig.scenario || null)
    const [businessInfo, setBusinessInfo] = useState<any>(initialConfig.business_info || null)
    const [numberType, setNumberType] = useState<'new' | 'existing'>(initialConfig.number_type || 'new')
    
    const [isLoading, setIsLoading] = useState(false)
    const [showResetConfirm, setShowResetConfirm] = useState(false)
    const [completedData, setCompletedData] = useState<{ phone: string; name: string } | null>(null)

    const handleSelectScenario = async (selected: 'A' | 'B' | 'C' | 'D') => {
        setIsLoading(true)
        try {
            setScenario(selected)
            // Si el escenario cambia y estabamos en un paso superior, reiniciar numberType o conservar
            let nextNumberType = numberType
            if (selected === 'A') {
                nextNumberType = 'new'
                setNumberType('new')
            }
            
            const res = await saveWizardProgress(2, {
                scenario: selected,
                number_type: nextNumberType
            })

            if (res.success) {
                setStep(2)
            } else {
                toast.error(res.error || 'Error al guardar escenario.')
            }
        } catch (err) {
            toast.error('Error de red al guardar escenario.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleBusinessInfoSubmit = async (data: any) => {
        setIsLoading(true)
        try {
            setBusinessInfo(data)
            const res = await saveWizardProgress(3, {
                business_info: data
            })

            if (res.success) {
                setStep(3)
            } else {
                toast.error(res.error || 'Error al guardar datos comerciales.')
            }
        } catch (err) {
            toast.error('Error de red al guardar datos comerciales.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleNumberSetupSubmit = async (selectedNumberType: 'new' | 'existing') => {
        setIsLoading(true)
        try {
            setNumberType(selectedNumberType)
            const res = await saveWizardProgress(4, {
                number_type: selectedNumberType
            })

            if (res.success) {
                setStep(4)
            } else {
                toast.error(res.error || 'Error al guardar selección de número.')
            }
        } catch (err) {
            toast.error('Error de red al guardar selección de número.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleCredentialsSubmit = async (accessToken: string, phoneNumberId: string, wabaId?: string) => {
        // La validacion la hace la accion
        const res = await validateCredentials(accessToken, phoneNumberId, wabaId)
        if (res.success) {
            setCompletedData({
                phone: res.display_phone_number || phoneNumberId,
                name: res.verified_name || 'WhatsApp Business'
            })
            toast.success('¡WhatsApp conectado correctamente!')
            return { success: true }
        } else {
            return { success: false, error: res.error }
        }
    }

    const handleReset = async () => {
        setIsLoading(true)
        try {
            const res = await resetWizardSetup()
            if (res.success) {
                setStep(1)
                setScenario(null)
                setBusinessInfo(null)
                setNumberType('new')
                setCompletedData(null)
                setShowResetConfirm(false)
                toast.success('Configuración reiniciada.')
            } else {
                toast.error(res.error || 'Error al reiniciar configuración.')
            }
        } catch (err) {
            toast.error('Error de red al reiniciar.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleBack = () => {
        if (step > 1) {
            const prevStep = step - 1
            setStep(prevStep)
            // Guardamos localmente el paso anterior en la DB también para mantener consistencia si recarga
            saveWizardProgress(prevStep, {})
        }
    }

    // Calcular barra de progreso
    const stepsCount = 4
    const percent = Math.min((step / stepsCount) * 100, 100)

    // Si ya completó la conexión, mostrar pantalla de éxito
    if (completedData) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md mx-auto bg-slate-950/40 border border-slate-900 rounded-3xl p-8 text-center space-y-6 shadow-2xl"
            >
                <div className="flex justify-center">
                    <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-12 h-12" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white">¡Conexión Exitosa!</h2>
                    <p className="text-sm text-slate-400">
                        Tu bot de WhatsApp ya está conectado y listo para procesar mensajes de tus clientes.
                    </p>
                </div>

                <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 text-left space-y-2 text-xs">
                    <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Nombre verificado:</span>
                        <span className="text-slate-200 font-bold">{completedData.name}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Número:</span>
                        <span className="text-slate-200 font-bold">{completedData.phone}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Estado:</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            Activo
                        </span>
                    </div>
                </div>

                <div className="pt-2">
                    <Link
                        href="/dashboard/integrations"
                        className="block w-full py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 transition-all text-sm font-semibold shadow-lg"
                    >
                        Volver a Integraciones
                    </Link>
                </div>
            </motion.div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header del Wizard */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-6">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/integrations"
                        className="p-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-white">Configuración Asistida de WhatsApp</h1>
                        <p className="text-xs text-slate-500">Paso {step} de {stepsCount} • Conecta tu canal oficial en Meta</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setShowResetConfirm(true)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-red-500/30 hover:bg-red-500/5 text-slate-400 hover:text-red-400 transition-all text-xs font-semibold"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reiniciar
                    </button>
                </div>
            </div>

            {/* Barra de progreso */}
            <div className="max-w-4xl mx-auto space-y-2">
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div
                        className="bg-primary h-full transition-all duration-500 ease-out"
                        style={{ width: `${percent}%` }}
                    />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">
                    <span className={cn(step >= 1 ? "text-primary" : "")}>1. Escenario</span>
                    <span className={cn(step >= 2 ? "text-primary" : "")}>2. Negocio</span>
                    <span className={cn(step >= 3 ? "text-primary" : "")}>3. Línea</span>
                    <span className={cn(step >= 4 ? "text-primary" : "")}>4. Credenciales</span>
                </div>
            </div>

            {/* Modal de confirmacion de reinicio */}
            {showResetConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
                        <div className="flex items-center gap-3 text-red-400 font-bold text-base">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                            ¿Reiniciar configuración?
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Esta acción borrará todo el progreso del wizard, incluyendo el escenario seleccionado y los datos comerciales. Tendrás que empezar desde el paso 1.
                        </p>
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowResetConfirm(false)}
                                className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white transition-colors text-xs font-semibold"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors text-xs font-semibold shadow-lg"
                            >
                                Sí, reiniciar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Renderizado dinamico de los pasos con transiciones */}
            <div className="pt-2">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                        {step === 1 && (
                            <Step1Scenario
                                selectedScenario={scenario}
                                onSelectScenario={handleSelectScenario}
                            />
                        )}
                        {step === 2 && (
                            <Step2BusinessInfo
                                initialData={businessInfo}
                                onSubmit={handleBusinessInfoSubmit}
                                onBack={handleBack}
                                isLoading={isLoading}
                            />
                        )}
                        {step === 3 && (
                            <Step3NumberSetup
                                scenario={scenario || 'A'}
                                initialNumberType={numberType}
                                onSubmit={handleNumberSetupSubmit}
                                onBack={handleBack}
                                isLoading={isLoading}
                            />
                        )}
                        {step === 4 && (
                            <Step4Credentials
                                verifyToken={verifyToken}
                                initialAccessToken={initialConfig.access_token_hint ? '' : ''}
                                initialPhoneNumberId={initialConfig.phone_number_id || ''}
                                initialWabaId={initialConfig.waba_id || ''}
                                onSubmit={handleCredentialsSubmit}
                                onBack={handleBack}
                                isLoading={isLoading}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}
