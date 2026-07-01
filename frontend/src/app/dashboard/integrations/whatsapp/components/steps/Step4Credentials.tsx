'use client'

import React, { useState } from 'react'
import { Key, Phone, Clipboard, Check, HelpCircle, Server, Info, ShieldCheck, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step4CredentialsProps {
    verifyToken: string // Proviene de env variable
    initialAccessToken?: string
    initialPhoneNumberId?: string
    initialWabaId?: string
    onSubmit: (accessToken: string, phoneNumberId: string, wabaId?: string) => Promise<{ success: boolean; error?: string }>
    onBack: () => void
    isLoading: boolean
}

export function Step4Credentials({
    verifyToken,
    initialAccessToken = '',
    initialPhoneNumberId = '',
    initialWabaId = '',
    onSubmit,
    onBack,
    isLoading: parentIsLoading
}: Step4CredentialsProps) {
    const [accessToken, setAccessToken] = useState(initialAccessToken)
    const [phoneNumberId, setPhoneNumberId] = useState(initialPhoneNumberId)
    const [wabaId, setWabaId] = useState(initialWabaId)
    const [errors, setErrors] = useState<Partial<Record<'accessToken' | 'phoneNumberId', string>>>({})
    const [copiedField, setCopiedField] = useState<string | null>(null)
    const [localIsLoading, setLocalIsLoading] = useState(false)
    const [setupError, setSetupError] = useState<string | null>(null)

    const webhookUrl = 'https://console.skylab.synergiaautomation.com/api/webhooks/whatsapp'

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text)
        setCopiedField(field)
        setTimeout(() => setCopiedField(null), 2000)
    }

    const validate = () => {
        const newErrors: Partial<Record<'accessToken' | 'phoneNumberId', string>> = {}
        if (!accessToken.trim()) newErrors.accessToken = 'El Token de Acceso es obligatorio.'
        if (!phoneNumberId.trim()) newErrors.phoneNumberId = 'El Phone Number ID es obligatorio.'
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSetupError(null)
        
        if (!validate()) return

        setLocalIsLoading(true)
        try {
            const res = await onSubmit(accessToken, phoneNumberId, wabaId)
            if (!res.success && res.error) {
                setSetupError(res.error)
            }
        } catch (err: any) {
            setSetupError(err?.message || 'Error inesperado al conectar.')
        } finally {
            setLocalIsLoading(false)
        }
    }

    const isLoading = parentIsLoading || localIsLoading

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center space-y-2 mb-6">
                <h2 className="text-2xl font-bold text-white tracking-tight">
                    Credenciales y Configuración de Webhook
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                    Ingresa las credenciales de Meta Graph API y configura el webhook en tu cuenta de Meta Business.
                </p>
            </div>

            {/* Paso 1: Configurar Webhook en Meta */}
            <div className="bg-slate-950/40 p-6 rounded-2xl border border-slate-900 space-y-4">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <Server className="w-4 h-4 text-primary" />
                    Paso 1: Configura el Webhook en Meta Developer Console
                </h3>

                <p className="text-xs text-slate-400 leading-relaxed">
                    Dirígete a tu App en <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Meta Developers</a> &gt; WhatsApp &gt; Configuración de API y asocia la siguiente URL y Token de verificación:
                </p>

                <div className="space-y-3 pt-2">
                    {/* URL del webhook */}
                    <div className="space-y-1.5">
                        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                            URL de devolución de llamada (Callback URL)
                        </span>
                        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1 px-3">
                            <span className="text-xs text-slate-300 font-mono flex-grow overflow-x-auto whitespace-nowrap scrollbar-none py-1">
                                {webhookUrl}
                            </span>
                            <button
                                type="button"
                                onClick={() => handleCopy(webhookUrl, 'webhookUrl')}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
                            >
                                {copiedField === 'webhookUrl' ? (
                                    <Check className="w-4 h-4 text-emerald-400" />
                                ) : (
                                    <Clipboard className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Token de verificacion */}
                    <div className="space-y-1.5">
                        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                            Token de verificación (Verify Token)
                        </span>
                        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1 px-3">
                            <span className="text-xs text-slate-300 font-mono flex-grow overflow-x-auto whitespace-nowrap scrollbar-none py-1">
                                {verifyToken || 'Cargando verify token...'}
                            </span>
                            <button
                                type="button"
                                disabled={!verifyToken}
                                onClick={() => handleCopy(verifyToken, 'verifyToken')}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0 disabled:opacity-30"
                            >
                                {copiedField === 'verifyToken' ? (
                                    <Check className="w-4 h-4 text-emerald-400" />
                                ) : (
                                    <Clipboard className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 bg-primary/5 border border-primary/10 p-3.5 rounded-xl mt-2 text-xs text-slate-300">
                    <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                        En la sección de <strong>Campos del Webhook</strong>, es indispensable suscribirse al menos al evento <code className="text-primary font-mono font-semibold">messages</code> y, si deseas gestionar transferencias a humanos, al evento <code className="text-primary font-mono font-semibold">messaging_handovers</code>.
                    </div>
                </div>
            </div>

            {/* Paso 2: Ingresar credenciales */}
            <div className="bg-slate-950/40 p-6 rounded-2xl border border-slate-900 space-y-4">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <Key className="w-4 h-4 text-primary" />
                    Paso 2: Ingresa las credenciales obtenidas en Meta
                </h3>

                <div className="space-y-4">
                    {/* Token de acceso */}
                    <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-slate-300 gap-2">
                            <Key className="w-4 h-4 text-primary" />
                            Token de Acceso Permanente (System User Access Token) *
                        </label>
                        <input
                            type="password"
                            value={accessToken}
                            onChange={(e) => {
                                setAccessToken(e.target.value)
                                if (errors.accessToken) setErrors(prev => ({ ...prev, accessToken: undefined }))
                            }}
                            placeholder="EAIaIQobChMI..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/80 transition-all text-sm font-mono"
                        />
                        {errors.accessToken && <p className="text-xs text-red-400">{errors.accessToken}</p>}
                        <p className="text-slate-500 text-xs leading-relaxed">
                            Asegúrate de generar este token mediante un <strong>Usuario del Sistema</strong> en Meta Business Manager con alcance ilimitado (nunca caduca). El Token temporal de desarrollador vence en 24 horas.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Phone Number ID */}
                        <div className="space-y-2">
                            <label className="flex items-center text-sm font-medium text-slate-300 gap-2">
                                <Phone className="w-4 h-4 text-primary" />
                                Phone Number ID *
                            </label>
                            <input
                                type="text"
                                value={phoneNumberId}
                                onChange={(e) => {
                                    setPhoneNumberId(e.target.value)
                                    if (errors.phoneNumberId) setErrors(prev => ({ ...prev, phoneNumberId: undefined }))
                                }}
                                placeholder="Ej: 104847291048293"
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/80 transition-all text-sm font-mono"
                            />
                            {errors.phoneNumberId && <p className="text-xs text-red-400">{errors.phoneNumberId}</p>}
                        </div>

                        {/* WABA ID */}
                        <div className="space-y-2">
                            <label className="flex items-center text-sm font-medium text-slate-300 gap-2">
                                <HelpCircle className="w-4 h-4 text-primary" />
                                WhatsApp Business Account ID <span className="text-slate-500 font-normal">(Opcional)</span>
                            </label>
                            <input
                                type="text"
                                value={wabaId}
                                onChange={(e) => setWabaId(e.target.value)}
                                placeholder="Ej: 294729381048291"
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/80 transition-all text-sm font-mono"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Panel de errores de Meta */}
            {setupError && (
                <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl text-xs text-red-400 leading-relaxed flex gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <strong>Error de validación con Meta:</strong> {setupError}
                    </div>
                </div>
            )}

            {/* Acciones de navegacion */}
            <div className="flex justify-between items-center pt-4">
                <button
                    type="button"
                    onClick={onBack}
                    disabled={isLoading}
                    className="px-6 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition-colors text-sm font-semibold disabled:opacity-50"
                >
                    Atrás
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 transition-all text-sm font-semibold shadow-md flex items-center justify-center gap-2 min-w-[160px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                            <span>Validando...</span>
                        </>
                    ) : (
                        <>
                            <ShieldCheck className="w-4 h-4" />
                            <span>Verificar y Conectar</span>
                        </>
                    )}
                </button>
            </div>
        </form>
    )
}
