/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { StaticImageData } from 'next/image'
import Image from 'next/image'
import {
    AlertTriangle,
    MessageCircle,
    Send,
    Instagram as InstagramIcon,
    Sparkles,
    CheckCircle2,
    ChevronRight,
    X,
    QrCode,
    Bot,
    Loader2,
    Globe,
    Zap,
    Lock,
    Shield,
    Activity,
    Code,
    Copy,
    ExternalLink,
    FileCheck2,
    KeyRound,
    Smartphone
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { connectTelegramAction, connectWhatsAppAction, getTenantBotsAction } from '@/app/actions/integrations'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { getWhatsAppWizardProgress } from './whatsapp/actions'
import instagramIcon from '../../../../Iconos/instagram.png'
import metaIcon from '../../../../Iconos/logo meta.png'
import telegramIcon from '../../../../Iconos/telegrama.png'
import webIcon from '../../../../Iconos/web.png'
import whatsappIcon from '../../../../Iconos/whatsapp.png'

type ChannelId = 'whatsapp' | 'telegram' | 'messenger' | 'instagram' | 'web_widget' | null

interface ChannelConfig {
    id: NonNullable<ChannelId>
    name: string
    description: string
    icon: any
    brandIcon?: any
    color: string
    bgColor: string
    status: 'connected' | 'disconnected' | 'coming_soon'
}

const CHANNELS: ChannelConfig[] = [
    {
        id: 'whatsapp',
        name: 'WhatsApp Business',
        description: 'Conecta tu API oficial de Meta para flujo masivo.',
        icon: MessageCircle,
        brandIcon: whatsappIcon,
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-500/10',
        status: 'disconnected'
    },
    {
        id: 'telegram',
        name: 'Telegram Bot',
        description: 'Sincronización instantánea vía API de BotFather.',
        icon: Send,
        brandIcon: telegramIcon,
        color: 'text-sky-500',
        bgColor: 'bg-sky-500/10',
        status: 'disconnected'
    },
    {
        id: 'web_widget',
        name: 'Web Chat SDK',
        description: 'Incrusta tu bot en cualquier sitio web con una línea.',
        icon: Code,
        brandIcon: webIcon,
        color: 'text-[#00B4DB]',
        bgColor: 'bg-[#00B4DB]/10',
        status: 'connected'
    },
    {
        id: 'instagram',
        name: 'Instagram DM',
        description: 'Gestión inteligente de menciones y mensajes directos.',
        icon: InstagramIcon,
        brandIcon: instagramIcon,
        color: 'text-fuchsia-500',
        bgColor: 'bg-fuchsia-500/10',
        status: 'coming_soon'
    }
]

const WHATSAPP_GUARDS = [
    {
        title: 'API oficial de Meta',
        detail: 'Sin QR, extensiones ni conectores que simulan un telefono.'
    },
    {
        title: 'Token cifrado',
        detail: 'La llave se prueba con Meta y se guarda en la boveda del servidor.'
    },
    {
        title: 'Ventana de 24 horas',
        detail: 'Skylab bloquea respuestas libres cuando Meta exige plantilla aprobada.'
    },
    {
        title: 'Webhook firmado',
        detail: 'Cada evento entrante se valida con la firma de Meta antes de procesarse.'
    }
]

const WHATSAPP_READINESS = [
    'Numero exclusivo para el bot',
    'Meta Business verificado o en proceso',
    'Phone Number ID y WABA ID disponibles',
    'Token de Usuario del Sistema',
    'Dominio publico con HTTPS'
]

// Componente del Simulador de Consola Meta (Tutorial Dinámico)
const MetaConsoleSimulator = ({ step }: { step: number }) => {
    return (
        <div className="w-full bg-[#111318] rounded-3xl border border-white/10 shadow-2xl overflow-hidden font-sans text-xs text-[#d1d5db] animate-in fade-in duration-300">
            {/* Window control bar */}
            <div className="px-4 py-3 bg-[#080a0f] border-b border-white/5 flex items-center justify-between">
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                </div>
                <div className="flex-1 max-w-[200px] md:max-w-xs mx-4 bg-[#030406] py-1 px-3 rounded-lg text-[9px] text-center text-slate-500 font-mono truncate select-none">
                    {step === 4 ? 'https://business.facebook.com/settings/system-users' : 'https://developers.facebook.com/apps/whatsapp/api-setup'}
                </div>
                <div className="w-8" />
            </div>

            {/* Simulated Workspace */}
            <div className="grid grid-cols-[110px_1fr] h-[250px] bg-[#070b12]">
                {/* Meta Sidebar */}
                <div className="bg-[#0b0f17] p-2.5 border-r border-white/5 flex flex-col gap-3 font-medium select-none text-[10px]">
                    {step === 4 ? (
                        <>
                            <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest px-1">Negocio</div>
                            <div className="flex flex-col gap-1">
                                <div className="px-2 py-1 rounded bg-white/5 text-white flex items-center gap-1.5 font-bold">
                                    <span>Usuarios</span>
                                </div>
                                <div className="px-4 py-1 text-emerald-400 font-bold border-l-2 border-emerald-500">
                                    Sistema
                                </div>
                                <div className="px-2 py-1 text-slate-500">Cuentas</div>
                                <div className="px-2 py-1 text-slate-500">Orígenes</div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest px-1">WhatsApp</div>
                            <div className="flex flex-col gap-1">
                                <div className={cn(
                                    "px-2 py-1 rounded flex items-center gap-1.5 transition-colors font-bold",
                                    step === 2 ? "bg-[#00B4DB]/10 text-[#00B4DB]" : "text-slate-500"
                                )}>
                                    <span>API Setup</span>
                                </div>
                                <div className={cn(
                                    "px-2 py-1 rounded flex items-center gap-1.5 transition-colors font-bold",
                                    step === 3 ? "bg-[#00B4DB]/10 text-[#00B4DB]" : "text-slate-500"
                                )}>
                                    <span>Configuración</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Main panel simulation */}
                <div className="p-4 overflow-y-auto space-y-4">
                    {step === 2 && (
                        <div className="space-y-4">
                            <div>
                                <h5 className="font-bold text-white text-xs">Configuración de la API</h5>
                                <p className="text-[9px] text-slate-500 mt-0.5">Paso 1: Copiar credenciales.</p>
                            </div>
                            
                            <div className="space-y-2.5">
                                {/* Phone Number ID Box */}
                                <div className="relative p-2.5 bg-[#0b0f17] border border-[#00B4DB]/30 rounded-xl">
                                    <div className="flex justify-between items-center text-[9px]">
                                        <span className="font-bold text-slate-300">Phone Number ID</span>
                                        <span className="px-1.5 py-0.5 bg-[#00B4DB]/20 text-[#00B4DB] text-[8px] font-black rounded uppercase">Copiar</span>
                                    </div>
                                    <div className="mt-1 font-mono text-[10px] text-emerald-400">102948571029384</div>
                                    {/* Pulse Guide pointer */}
                                    <div className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00B4DB] opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00B4DB]"></span>
                                    </div>
                                </div>

                                {/* WABA ID Box */}
                                <div className="relative p-2.5 bg-[#0b0f17] border border-[#00B4DB]/30 rounded-xl">
                                    <div className="flex justify-between items-center text-[9px]">
                                        <span className="font-bold text-slate-300">WABA ID</span>
                                        <span className="px-1.5 py-0.5 bg-[#00B4DB]/20 text-[#00B4DB] text-[8px] font-black rounded uppercase">Copiar</span>
                                    </div>
                                    <div className="mt-1 font-mono text-[10px] text-emerald-400">847592019485712</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <div>
                                <h5 className="font-bold text-white text-xs">Configuración</h5>
                                <p className="text-[9px] text-slate-500 mt-0.5">Asocia el webhook y activa la suscripción.</p>
                            </div>

                            <div className="space-y-2.5">
                                <div className="p-2 bg-[#0b0f17] border border-white/5 rounded-xl space-y-0.5">
                                    <div className="text-[8px] text-slate-500 uppercase tracking-wider">Callback URL</div>
                                    <div className="font-mono text-[9px] text-[#A6B3C4] truncate">https://tudominio.com/api/webhooks/whatsapp</div>
                                </div>

                                {/* Webhook Field Table Mock */}
                                <div className="p-2.5 bg-[#0b0f17] border border-emerald-500/30 rounded-xl relative">
                                    <div className="flex justify-between items-center text-[9px] pb-1.5 border-b border-white/5">
                                        <span className="font-bold text-white">Campo Webhook</span>
                                        <span className="font-bold text-white">Estado</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[9px] pt-1.5">
                                        <span className="font-mono text-emerald-400">messages</span>
                                        <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[8px] font-black rounded uppercase flex items-center gap-1">
                                            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                            Suscrito
                                        </span>
                                    </div>
                                    <div className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-4">
                            <div>
                                <h5 className="font-bold text-white text-xs">Generación de Token</h5>
                                <p className="text-[9px] text-slate-500 mt-0.5">Habilita los accesos de mensajería permanentes.</p>
                            </div>

                            <div className="space-y-2.5">
                                <div className="p-2.5 bg-[#0b0f17] border border-emerald-500/30 rounded-xl relative space-y-1.5">
                                    <div className="text-[9px] font-bold text-slate-300">Permisos del token:</div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 text-[9px]">
                                            <div className="w-3 h-3 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[8px]">✓</div>
                                            <span className="font-mono text-emerald-300">whatsapp_business_messaging</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[9px]">
                                            <div className="w-3 h-3 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[8px]">✓</div>
                                            <span className="font-mono text-emerald-300">whatsapp_business_management</span>
                                        </div>
                                    </div>
                                    <div className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                                    </div>
                                </div>

                                <div className="flex justify-center">
                                    <button type="button" className="px-3 py-1 bg-[#00B4DB] text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg hover:bg-[#26C7EA] transition-all">
                                        Generar Token
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function IntegrationsPage() {
    const router = useRouter()
    const [selectedChannel, setSelectedChannel] = useState<ChannelId>(null)
    const [wizardStep, setWizardStep] = useState(1)
    const [token, setToken] = useState('')
    const [whatsappToken, setWhatsappToken] = useState('')
    const [phoneNumberId, setPhoneNumberId] = useState('')
    const [wabaId, setWabaId] = useState('')
    const [selectedBotId, setSelectedBotId] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [bots, setBots] = useState<{ id: string, name: string }[]>([])
    const [whatsappSetup, setWhatsappSetup] = useState<{ active: boolean; step: number; exists: boolean; phone?: string; name?: string }>({
        active: false,
        step: 1,
        exists: false
    })

    useEffect(() => {
        const fetchBots = async () => {
            const res = await getTenantBotsAction();
            if (res.success && res.bots) {
                setBots(res.bots);
                if (res.bots[0]?.id) setSelectedBotId(res.bots[0].id)
            }
        };
        const fetchWhatsAppStatus = async () => {
            const res = await getWhatsAppWizardProgress()
            if (res.success) {
                setWhatsappSetup({
                    active: res.is_active || false,
                    step: (res.config as any)?.whatsapp_setup_step || 1,
                    exists: res.exists || false,
                    phone: (res.config as any)?.display_phone_number || undefined,
                    name: (res.config as any)?.verified_name || undefined
                })
            }
        }
        fetchBots();
        fetchWhatsAppStatus();
    }, []);

    const handleConnectTelegram = async () => {
        if (!token) {
            toast.error("Por favor ingresa un token válido");
            return;
        }
        setIsLoading(true);
        try {
            const result = await connectTelegramAction(token);
            if (result.success) {
                toast.success(result.message);
                resetWizard();
            } else {
                toast.error(result.error || "Error al conectar");
            }
        } catch {
            toast.error("Error de red");
        } finally {
            setIsLoading(false);
        }
    }

    const resetWizard = () => {
        setSelectedChannel(null)
        setWizardStep(1)
        setToken('')
        setWhatsappToken('')
        setPhoneNumberId('')
        setWabaId('')
    }

    const handleConnectWhatsApp = async () => {
        if (!whatsappToken.trim() || !phoneNumberId.trim() || !wabaId.trim()) {
            toast.error('Completa los tres datos de Meta antes de validar.')
            return
        }

        setIsLoading(true)
        try {
            const result = await connectWhatsAppAction({
                accessToken: whatsappToken,
                phoneNumberId,
                wabaId,
                botId: selectedBotId || undefined
            })

            if (result.success) {
                toast.success(result.message)
                resetWizard()
            } else {
                toast.error(result.error || 'Meta no pudo validar la conexion.')
            }
        } catch {
            toast.error('No se pudo conectar con Meta.')
        } finally {
            setIsLoading(false)
        }
    }

    const totalWizardSteps = selectedChannel === 'whatsapp' ? 4 : 3
    const canContinueWhatsApp = selectedChannel !== 'whatsapp' || wizardStep < 4 || Boolean(whatsappToken.trim() && phoneNumberId.trim() && wabaId.trim())

    return (
        <div className="flex-1 overflow-y-auto bg-background p-8 md:p-12 relative">

            {/* Background elements - Orbital atmosphere */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00B4DB]/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-sky-500/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto space-y-12 relative z-10">
                {/* Header Section - Modern Skylab Style */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 border-b border-white/10  pb-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#00B4DB]/10 border border-[#00B4DB]/20 rounded-full text-[#00B4DB] dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                            <Sparkles className="w-3 h-3 animate-pulse" /> Ecosistema de Conexión
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white dark:text-white tracking-tighter font-display">
                            Hub Integrado
                        </h1>
                        <p className="text-[#A6B3C4] dark:text-[#7E8A9C] font-medium max-w-xl leading-relaxed">
                            Sincroniza tus canales de comunicación y potencia tu alcance con nuestra infraestructura omnicanal blindada.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 bg-[#0B0F17] dark:bg-[#0B0F17] p-2 rounded-2xl border border-white/10 dark:border-white/10 shadow-sm">
                        <div className="flex flex-col items-center px-4 border-r border-white/10 ">
                            <span className="text-[9px] font-black text-[#7E8A9C] uppercase tracking-widest">Estado API</span>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-sm font-black text-white dark:text-white">Operativo</span>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            className="h-12 px-5 rounded-xl font-bold text-[#A6B3C4] dark:text-[#7E8A9C] hover:bg-[#0B0F17] dark:hover:bg-[#0B0F17] gap-2"
                        >
                            <Activity className="w-4 h-4" /> Log de Sistema
                        </Button>
                    </div>
                </div>

                {/* WhatsApp Safety Banner */}
                <div className="group relative overflow-hidden rounded-[32px] border border-emerald-500/20 bg-[#07130F] shadow-2xl">
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(37,211,102,0.16),transparent_42%),radial-gradient(circle_at_80%_20%,rgba(0,180,219,0.20),transparent_34%)]" />
                    <div className="absolute top-0 right-0 h-[600px] w-[600px] -translate-y-1/2 translate-x-1/2 rounded-full bg-emerald-400/10 blur-[100px]" />

                    <div className="relative z-10 grid gap-8 p-8 md:p-10 xl:grid-cols-[1fr_420px]">
                        <div className="min-w-0 space-y-6">
                            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-300">
                                {whatsappIcon ? (
                                    <Image src={whatsappIcon} alt="WhatsApp" className="h-3.5 w-3.5 object-contain" />
                                ) : (
                                    <Shield className="h-3.5 w-3.5" />
                                )}
                                Meta WhatsApp primero
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-4">
                                    {whatsappIcon && (
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center p-1.5 border border-emerald-500/20 shadow-md">
                                            <Image src={whatsappIcon} alt="WhatsApp" className="w-full h-full object-contain" />
                                        </div>
                                    )}
                                    <h2 className="max-w-3xl text-3xl font-black leading-tight tracking-tight text-white md:text-4xl">
                                        Conecta WhatsApp sin exponer el número del cliente.
                                    </h2>
                                </div>
                                <p className="max-w-2xl text-base font-medium leading-relaxed text-[#A6B3C4]">
                                    El asistente guía cada paso, valida las credenciales con Meta y bloquea configuraciones que puedan causar fallos, reintentos o mensajes fuera de política.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Button 
                                    onClick={() => router.push('/dashboard/integrations/whatsapp/setup')} 
                                    className="h-12 rounded-xl bg-emerald-500 px-5 text-xs font-black uppercase tracking-widest text-[#05110A] hover:bg-emerald-400"
                                >
                                    {whatsappSetup.active 
                                        ? 'Ver Configuración' 
                                        : whatsappSetup.exists 
                                            ? 'Retomar Configuración' 
                                            : 'Configurar WhatsApp'}
                                </Button>
                                <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/" target="_blank" rel="noreferrer" className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/10 px-5 text-xs font-black uppercase tracking-widest text-white hover:bg-white/5">
                                    Docs oficiales <ExternalLink className="h-4 w-4" />
                                </a>
                            </div>
                        </div>

                        <div className="rounded-[24px] border border-white/10 bg-black/25 p-5">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">Checklist previo</p>
                                    <h3 className="mt-1 text-xl font-black text-white">Listo para Meta</h3>
                                </div>
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                                    <FileCheck2 className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                {WHATSAPP_READINESS.map((item) => (
                                    <div key={item} className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-2.5">
                                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
                                        <span className="text-xs font-bold text-[#C9D5E3]">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {WHATSAPP_GUARDS.map((guard, index) => {
                        const icons = [Shield, KeyRound, Smartphone, AlertTriangle]
                        const GuardIcon = icons[index] || Shield
                        return (
                            <div key={guard.title} className="rounded-2xl border border-white/10 bg-[#0B0F17] p-5">
                                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                                    <GuardIcon className="h-5 w-5" />
                                </div>
                                <h3 className="text-sm font-black text-white">{guard.title}</h3>
                                <p className="mt-2 text-xs font-medium leading-relaxed text-[#A6B3C4]">{guard.detail}</p>
                            </div>
                        )
                    })}
                </div>

                {/* Channels Grid - Elevated aesthetics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
                    {CHANNELS.map((channel) => (
                        <motion.div
                            key={channel.id}
                            whileHover={{ y: -8, scale: 1.02 }}
                            onClick={() => {
                                if (channel.id === 'whatsapp') {
                                    router.push('/dashboard/integrations/whatsapp/setup')
                                } else if (channel.status !== 'coming_soon') {
                                    setSelectedChannel(channel.id)
                                }
                            }}
                            className={`group bg-[#0B0F17] dark:bg-[#0B0F17] border border-white/10 dark:border-white/10 rounded-[40px] p-8 shadow-sm flex flex-col relative overflow-hidden transition-all duration-500 ${channel.status === 'coming_soon' ? 'opacity-60 cursor-not-allowed grayscale' : 'cursor-pointer hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-[#00B4DB]/30'}`}
                        >
                            {/* Card Glow Effect */}
                            <div className={`absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-[80px] pointer-events-none rounded-full ${channel.bgColor}`} />

                            <div className="flex items-start justify-between mb-10">
                                <div className={`w-16 h-16 rounded-[24px] ${channel.bgColor} flex items-center justify-center overflow-hidden transition-all group-hover:rotate-12 group-hover:scale-110 duration-700 shadow-lg`}>
                                    {channel.brandIcon ? (
                                        <Image src={channel.brandIcon} alt={channel.name} className="w-10 h-10 object-contain" />
                                    ) : (
                                        <channel.icon className="w-8 h-8 text-white" />
                                    )}
                                </div>
                                {channel.id === 'whatsapp' ? (
                                    whatsappSetup.active ? (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                            Activo
                                        </div>
                                    ) : whatsappSetup.exists ? (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-amber-500/20 animate-pulse">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                            En Progreso
                                        </div>
                                    ) : (
                                        <div className="px-3 py-1.5 bg-[#0B0F17] dark:bg-[#0B0F17] text-[#7E8A9C] text-[9px] font-black uppercase tracking-widest rounded-full italic opacity-60">Inactivo</div>
                                    )
                                ) : channel.status === 'connected' ? (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                        Activo
                                    </div>
                                ) : channel.status === 'coming_soon' ? (
                                    <div className="px-3 py-1.5 bg-[#0B0F17] dark:bg-[#0B0F17] text-[#A6B3C4] text-[9px] font-black uppercase tracking-widest rounded-full">Pronto</div>
                                ) : (
                                    <div className="px-3 py-1.5 bg-[#0B0F17] dark:bg-[#0B0F17] text-[#7E8A9C] text-[9px] font-black uppercase tracking-widest rounded-full italic opacity-60">Inactivo</div>
                                )}
                            </div>

                            <div className="space-y-3 flex-1">
                                <h3 className="text-xl font-black text-white dark:text-white tracking-tight">{channel.name}</h3>
                                <p className="text-xs text-[#A6B3C4] dark:text-[#7E8A9C] font-medium leading-relaxed group-hover:text-[#A6B3C4] dark:group-hover:text-slate-300">
                                    {channel.description}
                                </p>
                            </div>

                            <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/10  group-hover:border-[#00B4DB]/30 transition-colors">
                                <div className="flex -space-x-2">
                                    <div className="w-8 h-8 rounded-full bg-[#0B0F17] dark:bg-white/10 border-2 border-white dark:border-slate-800 flex items-center justify-center">
                                        <Bot className="w-4 h-4 text-[#00B4DB]" />
                                    </div>
                                    <div className={`w-8 h-8 rounded-full ${channel.bgColor} border-2 border-white dark:border-slate-800 flex items-center justify-center overflow-hidden`}>
                                        {channel.brandIcon ? (
                                            <Image src={channel.brandIcon} alt={channel.name} className="w-5 h-5 object-contain" />
                                        ) : (
                                            <channel.icon className={`w-4 h-4 ${channel.color}`} />
                                        )}
                                    </div>
                                </div>
                                <div className={`w-10 h-10 rounded-2xl bg-[#0B0F17] dark:bg-[#0B0F17] flex items-center justify-center transition-all group-hover:${channel.bgColor}`}>
                                    <ChevronRight className={`w-5 h-5 text-[#7E8A9C] group-hover:${channel.color}`} />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Footer Insight Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Security Card */}
                    <div className="bg-[#0B0F17] rounded-[48px] p-10 md:p-12 border border-white/10  shadow-sm group overflow-hidden relative">
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] pointer-events-none" />
                        <div className="flex flex-col md:flex-row gap-10 items-center">
                            <div className="w-24 h-24 bg-emerald-500/10 rounded-[32px] flex items-center justify-center relative shadow-inner">
                                <Shield className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-white dark:border-[#0f172a]">
                                    <CheckCircle2 className="w-3 h-3 text-white" />
                                </div>
                            </div>
                            <div className="flex-1 space-y-4 text-center md:text-left">
                                <h3 className="text-2xl font-black text-white dark:text-white tracking-tighter">Bóveda de Seguridad Molecular</h3>
                                <p className="text-[#A6B3C4] dark:text-[#7E8A9C] text-sm font-medium leading-relaxed">
                                    Tus credenciales y tokens de acceso son transformados en hashes irreversibles bajo el estándar <strong className="text-white dark:text-white">AES-256 GCM</strong>.
                                </p>
                                <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                                    <div className="flex items-center gap-2 px-3 py-1 bg-[#0B0F17] dark:bg-[#0B0F17] rounded-lg border border-white/10 ">
                                        <Lock className="w-3 h-3 text-emerald-500" />
                                        <span className="text-[10px] font-black text-[#A6B3C4] uppercase tracking-widest">TLS 1.3 Active</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-[#0B0F17] dark:bg-[#0B0F17] rounded-lg border border-white/10 ">
                                        <Globe className="w-3 h-3 text-[#00B4DB]" />
                                        <span className="text-[10px] font-black text-[#A6B3C4] uppercase tracking-widest">Global IP Isolation</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Developer Card */}
                    <div className="bg-[#00B4DB] dark:bg-indigo-900 rounded-[48px] p-10 md:p-12 shadow-xl shadow-[#00B4DB]/20 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[100px] rounded-full" />
                        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center h-full">
                            <div className="flex-1 space-y-6 text-center md:text-left">
                                <div className="inline-flex h-8 items-center px-4 bg-white/10 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-full border border-white/20">Zona Dev</div>
                                <h3 className="text-2xl font-black text-white tracking-tighter">SDK & Webhooks</h3>
                                <p className="text-indigo-100 text-sm font-medium leading-relaxed opacity-80">
                                    Potencia tu bot integrándolo con tu propio CRM, sistema de inventarios o bases de datos externas vía nuestra API REST.
                                </p>
                                <Button variant="outline" className="bg-transparent border-white/20 text-white hover:bg-white/10 h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-xs">
                                    Generar API KEY
                                </Button>
                            </div>
                            <div className="w-40 h-40 bg-[#0B0F17] rounded-full border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
                                <Code className="w-20 h-20 text-white/20 group-hover:text-white/40 transition-colors" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Smart Wizard Modal - Cinematic Refinement */}
            <AnimatePresence>
                {selectedChannel && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" onClick={resetWizard}>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 40 }}
                            onClick={(e) => e.stopPropagation()}
                            className={`relative w-full ${selectedChannel === 'whatsapp' ? 'max-w-5xl' : 'max-w-2xl'} bg-[#0B0F17] dark:bg-slate-900 rounded-[40px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col border border-white/10`}
                        >
                            {/* Modal Header */}
                            <div className="px-12 py-10 border-b border-white/10  flex items-center justify-between bg-[#0B0F17] dark:bg-[#0B0F17] backdrop-blur-md">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-[24px] bg-[#070B12] border border-white/10 flex items-center justify-center overflow-hidden">
                                        {selectedChannel === 'whatsapp' && whatsappIcon ? (
                                            <Image src={whatsappIcon} alt="WhatsApp" className="w-10 h-10 object-contain" />
                                        ) : selectedChannel === 'telegram' && telegramIcon ? (
                                            <Image src={telegramIcon} alt="Telegram" className="w-10 h-10 object-contain" />
                                        ) : selectedChannel === 'web_widget' && webIcon ? (
                                            <Image src={webIcon} alt="Web Chat" className="w-10 h-10 object-contain" />
                                        ) : selectedChannel === 'instagram' && instagramIcon ? (
                                            <Image src={instagramIcon} alt="Instagram" className="w-10 h-10 object-contain" />
                                        ) : (
                                            <Bot className="w-8 h-8 text-[#00B4DB]" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-2xl text-white dark:text-white tracking-tighter">
                                            {selectedChannel === 'telegram' ? 'Enlace Telegram' :
                                                selectedChannel === 'web_widget' ? 'Despliegue Web' :
                                                    selectedChannel === 'whatsapp' ? 'Meta WhatsApp' : 'Sincronizador'}
                                        </h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <div className="flex gap-1">
                                                {Array.from({ length: totalWizardSteps }, (_, index) => index + 1).map(i => (
                                                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= wizardStep ? 'bg-[#00B4DB]' : 'bg-slate-300 dark:bg-white/10'}`} />
                                                ))}
                                            </div>
                                            <span className="text-[10px] text-[#7E8A9C] font-bold uppercase tracking-widest">Fase {wizardStep} de {totalWizardSteps}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={resetWizard}
                                    title="Cerrar"
                                    className="w-14 h-14 flex items-center justify-center bg-slate-200/50 dark:bg-[#0B0F17] hover:bg-slate-200 dark:hover:bg-white/10 text-[#A6B3C4] rounded-[24px] transition-all"
                                >
                                    <X className="w-7 h-7" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-y-auto p-12 flex flex-col md:flex-row gap-12 min-h-[420px]">
                                {selectedChannel === 'telegram' && (
                                    <div className="flex-1 flex flex-col justify-center">
                                        <AnimatePresence mode="wait">
                                            {wizardStep === 1 && (
                                                <motion.div
                                                    key="t1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                                    className="space-y-8"
                                                >
                                                    <div className="inline-flex h-8 items-center px-4 bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-sky-100 dark:border-sky-500/20">Localización</div>
                                                    <h4 className="text-4xl font-black text-white dark:text-white tracking-tighter leading-none">Busca al Guardián</h4>
                                                    <p className="text-[#A6B3C4] dark:text-[#7E8A9C] text-lg font-medium leading-relaxed">
                                                        Abre Telegram y localiza a <strong className="text-white dark:text-white">@BotFather</strong>. Él es el responsable de emitir las llaves de acceso para la red.
                                                    </p>
                                                    <div className="p-8 bg-[#0B0F17] dark:bg-[#0B0F17] rounded-[32px] border border-white/10  flex items-center gap-8 group">
                                                        <div className="w-16 h-16 bg-[#0B0F17] dark:bg-white/10 rounded-[20px] shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                                            <Send className="w-8 h-8 text-sky-500" />
                                                        </div>
                                                        <p className="text-[#A6B3C4] dark:text-slate-300 font-bold">Haz clic en el botón <span className="text-sky-600 dark:text-sky-400">INICIAR</span> para abrir el canal de comunicación.</p>
                                                    </div>
                                                </motion.div>
                                            )}

                                            {wizardStep === 2 && (
                                                <motion.div
                                                    key="t2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                                    className="space-y-8"
                                                >
                                                    <div className="inline-flex h-8 items-center px-4 bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-sky-100 dark:border-sky-500/20">Gestación</div>
                                                    <h4 className="text-4xl font-black text-white dark:text-white tracking-tighter leading-none">Define el Avatar</h4>
                                                    <p className="text-[#A6B3C4] dark:text-[#7E8A9C] text-lg font-medium leading-relaxed">
                                                        Envía <code className="bg-[#0B0F17] dark:bg-white/10 px-2 py-1 rounded text-sky-600 font-bold">/newbot</code> y completa el ritual:
                                                    </p>
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-5 p-6 bg-[#0B0F17] dark:bg-[#0B0F17] border border-white/10 dark:border-white/10 rounded-3xl shadow-sm">
                                                            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400 font-black">1</div>
                                                            <p className="font-bold text-white dark:text-slate-200 italic font-display">Nombra a tu representante.</p>
                                                        </div>
                                                        <div className="flex items-center gap-5 p-6 bg-[#0B0F17] dark:bg-[#0B0F17] border border-white/10 dark:border-white/10 rounded-3xl shadow-sm">
                                                            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400 font-black">2</div>
                                                            <p className="font-bold text-white dark:text-slate-200">Elige un username único (Ej: MiTiendaBot).</p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}

                                            {wizardStep === 3 && (
                                                <motion.div
                                                    key="t3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                                    className="space-y-8"
                                                >
                                                    <div className="inline-flex h-8 items-center px-4 bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-sky-100 dark:border-sky-500/20">Fusión</div>
                                                    <h4 className="text-4xl font-black text-white dark:text-white tracking-tighter leading-none">Sincronizar Token</h4>
                                                    <p className="text-[#A6B3C4] dark:text-[#7E8A9C] text-lg font-medium">Introduce la llave generada para completar la integración atómica.</p>
                                                    <div className="space-y-4">
                                                        <label className="text-[10px] font-black text-[#7E8A9C] dark:text-[#A6B3C4] uppercase tracking-[0.4em] px-2">HTTP API TOKEN</label>
                                                        <input
                                                            autoFocus type="text" value={token} onChange={(e) => setToken(e.target.value)}
                                                            placeholder="0000000000:AAHH..."
                                                            className="w-full h-24 bg-[#0B0F17] dark:bg-[#0B0F17] border-2 border-white/10 dark:border-white/10 rounded-[32px] px-8 text-2xl font-mono focus:outline-none focus:border-[#00B4DB]/30 focus:ring-8 focus-visible:ring-[#00B4DB]/20 focus-visible:border-[#00B4DB]/70/10 transition-all text-white dark:text-white"
                                                        />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}

                                {selectedChannel === 'whatsapp' && (
                                    <div className="flex-1 flex flex-col">
                                        <AnimatePresence mode="wait">
                                            {wizardStep === 1 && (
                                                <motion.div
                                                    key="w1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                                    className="space-y-6"
                                                >
                                                    <div className="inline-flex h-8 items-center px-4 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20">Fase 1: Preparación</div>
                                                    <h4 className="text-4xl font-black text-white tracking-tighter leading-none">Requisitos del Número</h4>
                                                    <p className="text-[#A6B3C4] text-base leading-relaxed">
                                                        Meta requiere un número exclusivo para conectarse a la API Cloud. Sigue estas instrucciones para evitar bloqueos:
                                                    </p>
                                                    <div className="space-y-3">
                                                        <div className="flex items-start gap-4 rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-4">
                                                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                                                            <div>
                                                                <h5 className="text-sm font-black text-white">Número de Teléfono Limpio</h5>
                                                                <p className="text-xs text-[#A6B3C4] mt-1 leading-relaxed">El número no debe estar registrado en la aplicación móvil de WhatsApp (Personal o Business). Debe ser dedicado únicamente al bot.</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-4 rounded-2xl border border-amber-500/15 bg-amber-500/5 p-4">
                                                            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                                                            <div>
                                                                <h5 className="text-sm font-black text-white">¿Cómo liberar un número activo?</h5>
                                                                <p className="text-xs text-[#A6B3C4] mt-1 leading-relaxed">Si usas el número actualmente en tu teléfono, debes entrar a WhatsApp -&gt; Ajustes -&gt; Cuenta -&gt; Eliminar mi cuenta. Esto liberará el número para Meta en segundos.</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                                                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#00B4DB]" />
                                                            <div>
                                                                <h5 className="text-sm font-black text-white">Recepción de código OTP</h5>
                                                                <p className="text-xs text-[#A6B3C4] mt-1 leading-relaxed">Asegúrate de poder recibir un mensaje de texto (SMS) o una llamada de voz en este número durante el proceso de verificación final.</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}

                                            {wizardStep === 2 && (
                                                <motion.div
                                                    key="w2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                                    className="space-y-6"
                                                >
                                                    <div className="inline-flex h-8 items-center px-4 bg-[#00B4DB]/10 text-[#00B4DB] text-[10px] font-black uppercase tracking-widest rounded-full border border-[#00B4DB]/20">Fase 2: Meta Developers</div>
                                                    <h4 className="text-4xl font-black text-white tracking-tighter leading-none">Crea tu App y obtén tus IDs</h4>
                                                    <p className="text-[#A6B3C4] text-base leading-relaxed">
                                                        Inicia sesión en <a href="https://developers.facebook.com/" target="_blank" rel="noreferrer" className="text-[#00B4DB] hover:underline font-bold inline-flex items-center gap-1">developers.facebook.com <ExternalLink className="w-3.5 h-3.5" /></a> y sigue estos pasos:
                                                    </p>
                                                    <div className="space-y-3 max-h-[260px] overflow-y-auto pr-2">
                                                        {[
                                                            {
                                                                title: "Crear una App de tipo Negocios",
                                                                desc: "Haz clic en 'Mis Apps' -> 'Crear App'. Elige tipo 'Otros' -> 'Negocios' (Business). Ponle un nombre y asóciala a tu Meta Business Manager."
                                                            },
                                                            {
                                                                title: "Agregar el Producto WhatsApp",
                                                                desc: "En el panel de control de tu nueva app, busca 'WhatsApp' en la sección de productos y haz clic en 'Configurar'."
                                                            },
                                                            {
                                                                title: "Ir a Configuración de la API",
                                                                desc: "En el menú izquierdo de WhatsApp, haz clic en 'Configuración de la API'."
                                                            },
                                                            {
                                                                title: "Copia el Phone Number ID",
                                                                desc: "Es un identificador único de 15 dígitos. ¡Atención! No es el número telefónico, es el ID de teléfono de Meta."
                                                            },
                                                            {
                                                                title: "Copia el WABA ID",
                                                                desc: "Es el 'ID de cuenta de WhatsApp Business'. Lo encuentras en esa misma pantalla en el paso 1."
                                                            }
                                                        ].map((step, index) => (
                                                            <div key={index} className="flex gap-4 rounded-2xl border border-white/10 bg-[#070B12] p-4">
                                                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#00B4DB]/10 text-xs font-black text-[#00B4DB]">{index + 1}</div>
                                                                <div>
                                                                    <h5 className="text-xs font-black text-white">{step.title}</h5>
                                                                    <p className="text-[11px] text-[#A6B3C4] mt-0.5 leading-relaxed">{step.desc}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}

                                            {wizardStep === 3 && (
                                                <motion.div
                                                    key="w3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                                    className="space-y-6"
                                                >
                                                    <div className="inline-flex h-8 items-center px-4 bg-amber-500/10 text-amber-300 text-[10px] font-black uppercase tracking-widest rounded-full border border-amber-500/20">Fase 3: Webhook</div>
                                                    <h4 className="text-4xl font-black text-white tracking-tighter leading-none">Vincular Webhook en Meta</h4>
                                                    <p className="text-[#A6B3C4] text-base leading-relaxed">
                                                        Meta necesita saber a dónde enviar las respuestas del cliente. En el panel de tu App de Meta:
                                                    </p>
                                                    
                                                    <div className="space-y-4">
                                                        <div className="rounded-2xl border border-white/10 bg-slate-950 p-4">
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#7E8A9C]">Callback URL (URL de retorno)</p>
                                                                <button type="button" title="Copiar URL" onClick={() => {
                                                                    navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/whatsapp`)
                                                                    toast.success('URL copiada')
                                                                }} className="rounded-lg p-1.5 text-[#00B4DB] hover:bg-white/10 flex items-center gap-1.5 text-xs font-bold">
                                                                    <Copy className="h-3.5 w-3.5" /> Copiar
                                                                </button>
                                                            </div>
                                                            <div className="mt-2 rounded-xl bg-white/[0.04] px-4 py-2.5 font-mono text-xs text-[#C9D5E3] truncate">
                                                                {typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/whatsapp` : '/api/webhooks/whatsapp'}
                                                            </div>
                                                        </div>

                                                        <div className="rounded-2xl border border-white/10 bg-slate-950 p-4">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#7E8A9C]">Token de verificación (Verify Token)</p>
                                                                {process.env.NEXT_PUBLIC_WHATSAPP_VERIFY_TOKEN && (
                                                                    <button onClick={() => {
                                                                        navigator.clipboard.writeText(process.env.NEXT_PUBLIC_WHATSAPP_VERIFY_TOKEN || '')
                                                                    }} className="rounded-lg p-1.5 text-[#00B4DB] hover:bg-white/10 flex items-center gap-1.5 text-xs font-bold">
                                                                        <Copy className="h-3.5 w-3.5" /> Copiar
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <div className="mt-2 rounded-xl bg-white/[0.04] px-4 py-2.5 font-mono text-xs text-white truncate">
                                                                {process.env.NEXT_PUBLIC_WHATSAPP_VERIFY_TOKEN || <span className="text-[#7E8A9C] italic">Token no configurado — agrega NEXT_PUBLIC_WHATSAPP_VERIFY_TOKEN al .env</span>}
                                                            </div>
                                                        </div>

                                                        <div className="rounded-2xl border border-amber-500/15 bg-amber-500/5 p-4 text-xs leading-relaxed text-amber-100/90">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                                                                <span className="font-black">PASO CRÍTICO OBLIGATORIO</span>
                                                            </div>
                                                            <p>Una vez verificado el webhook, haz clic en **Administrar (Manage)** en los Webhooks de WhatsApp, busca el campo **`messages`** y haz clic en **Suscribirse**. Si no te suscribes, el bot jamás recibirá los chats.</p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}

                                            {wizardStep === 4 && (
                                                <motion.div
                                                    key="w4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                                    className="space-y-4"
                                                >
                                                    <div className="inline-flex h-8 items-center px-4 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20">Fase 4: Conexión</div>
                                                    <h4 className="text-4xl font-black text-white tracking-tighter leading-none">Genera el Token y Conecta</h4>
                                                    <p className="text-[#A6B3C4] text-xs leading-relaxed">
                                                        Ve a **Configuración del Negocio** en Meta Suite -&gt; **Usuarios del Sistema** (System Users). Crea un usuario Administrador, asígnale tu App y haz clic en **Generar Token** activando los permisos `whatsapp_business_messaging` y `whatsapp_business_management`.
                                                    </p>

                                                    <div className="grid gap-3">
                                                        <label className="space-y-1">
                                                            <span className="px-1 text-[9px] font-black uppercase tracking-[0.28em] text-[#7E8A9C]">Selecciona el Bot</span>
                                                            <select value={selectedBotId} onChange={(e) => setSelectedBotId(e.target.value)} className="h-10 w-full rounded-xl border border-white/10 bg-[#070B12] px-4 text-xs font-bold text-white outline-none focus:border-[#00B4DB]/60">
                                                                {bots.map(bot => <option key={bot.id} value={bot.id}>{bot.name.toUpperCase()}</option>)}
                                                            </select>
                                                        </label>
                                                        <label className="space-y-1">
                                                            <span className="px-1 text-[9px] font-black uppercase tracking-[0.28em] text-[#7E8A9C]">System User Access Token (Token de Acceso)</span>
                                                            <input type="password" value={whatsappToken} onChange={(e) => setWhatsappToken(e.target.value)} placeholder="EAAG..." className="h-10 w-full rounded-xl border border-white/10 bg-[#070B12] px-4 font-mono text-xs text-white outline-none focus:border-[#00B4DB]/60" />
                                                        </label>
                                                        <div className="grid gap-3 md:grid-cols-2">
                                                            <label className="space-y-1">
                                                                <span className="px-1 text-[9px] font-black uppercase tracking-[0.28em] text-[#7E8A9C]">Phone Number ID</span>
                                                                <input value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} placeholder="123456789012345" className="h-10 w-full rounded-xl border border-white/10 bg-[#070B12] px-4 font-mono text-xs text-white outline-none focus:border-[#00B4DB]/60" />
                                                            </label>
                                                            <label className="space-y-1">
                                                                <span className="px-1 text-[9px] font-black uppercase tracking-[0.28em] text-[#7E8A9C]">WABA ID</span>
                                                                <input value={wabaId} onChange={(e) => setWabaId(e.target.value)} placeholder="987654321098765" className="h-10 w-full rounded-xl border border-white/10 bg-[#070B12] px-4 font-mono text-xs text-white outline-none focus:border-[#00B4DB]/60" />
                                                            </label>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}

                                {selectedChannel === 'whatsapp' && (
                                    <div className="w-full md:w-[320px] lg:w-[380px] shrink-0">
                                        {wizardStep === 1 ? (
                                            <aside className="rounded-[28px] border border-white/10 bg-[#070B12] p-5 h-full">
                                                <div className="mb-5 flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                                                        <Shield className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">Protección</p>
                                                        <h4 className="text-sm font-black text-white">Activa durante todo el enlace</h4>
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    {WHATSAPP_GUARDS.map((guard) => (
                                                        <div key={guard.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                                                            <div className="mb-2 flex items-center gap-2">
                                                                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                                                                <p className="text-xs font-black text-white">{guard.title}</p>
                                                            </div>
                                                            <p className="text-[11px] font-medium leading-relaxed text-[#A6B3C4]">{guard.detail}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </aside>
                                        ) : (
                                            <div className="h-full flex flex-col justify-center">
                                                <div className="mb-3 text-[10px] font-black text-[#7E8A9C] uppercase tracking-[0.24em] text-center">Simulador de Consola Meta</div>
                                                <MetaConsoleSimulator step={wizardStep} />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {selectedChannel === 'web_widget' && (
                                    <div className="flex-1 flex flex-col space-y-10">
                                        <div className="inline-flex h-8 items-center px-4 bg-indigo-50 dark:bg-[#00B4DB]/10 text-[#00B4DB] dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-100 dark:border-[#00B4DB]/30 w-fit">Despliegue Web</div>
                                        <h4 className="text-4xl font-black text-white dark:text-white tracking-tighter leading-none">Incrustar Asistente</h4>
                                        <p className="text-[#A6B3C4] dark:text-[#7E8A9C] text-lg font-medium leading-relaxed">
                                            Copia este fragmento de código antes del cierre de la etiqueta <code className="text-[#00B4DB]">&lt;/body&gt;</code> de tu sitio web.
                                        </p>

                                        <div className="relative group">
                                            <div className="absolute top-4 right-4 flex gap-2">
                                                <Button size="icon" variant="ghost" className="bg-white/10 hover:bg-white/20 text-white rounded-xl" onClick={() => {
                                                    navigator.clipboard.writeText(`<script src="${window.location.host}/widget.js" async></script>`);
                                                    toast.success("Código copiado al portapapeles");
                                                }}>
                                                    <Copy className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            <div className="bg-slate-900 rounded-[32px] p-10 font-mono text-sm text-indigo-300 border border-white/10 shadow-2xl overflow-x-auto whitespace-pre">
                                                {`<!-- Script de BotFlow -->
<script 
  src="https://skylab.botflow.com/sdk.js" 
  data-bot-id="${bots[0]?.id || 'TEMP_ID'}" 
  async 
></script>`}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 p-6 bg-indigo-50 dark:bg-[#0B0F17] rounded-3xl border border-indigo-100 dark:border-white/10 italic text-sm text-[#A6B3C4] dark:text-[#7E8A9C]">
                                            <div className="w-10 h-10 bg-[#0B0F17] dark:bg-white/10 rounded-xl flex items-center justify-center shadow-sm">
                                                <ExternalLink className="w-5 h-5 text-[#00B4DB]" />
                                            </div>
                                            Puedes personalizar los colores del widget en el constructor de bots.
                                        </div>
                                    </div>
                                )}

                                {(selectedChannel !== 'telegram' && selectedChannel !== 'web_widget' && selectedChannel !== 'whatsapp') && (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
                                        <div className="w-32 h-32 bg-[#0B0F17] dark:bg-[#0B0F17] rounded-[40px] flex items-center justify-center relative shadow-inner">
                                            <QrCode className="w-20 h-20 text-slate-200 dark:text-white/10" strokeWidth={1} />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-14 h-14 bg-[#0B0F17] dark:bg-white/10 rounded-2xl shadow-2xl flex items-center justify-center">
                                                    <Loader2 className="w-7 h-7 text-[#00B4DB] animate-spin" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-3xl font-black text-white dark:text-white tracking-tighter">Preparando Instancia</h4>
                                            <p className="text-[#A6B3C4] dark:text-[#7E8A9C] font-medium max-w-sm">Estamos levantando un clúster dedicado para tu integración con {CHANNELS.find(c => c.id === selectedChannel)?.name}.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="px-12 py-10 border-t border-white/10  bg-[#0B0F17] dark:bg-[#0B0F17] backdrop-blur-md flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Shield className="w-5 h-5 text-emerald-500" />
                                    <span className="text-[10px] font-black text-[#7E8A9C] uppercase tracking-widest">Auditoría de Enlace Activa</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    {wizardStep > 1 && (selectedChannel === 'telegram' || selectedChannel === 'whatsapp') && (
                                        <Button
                                            variant="ghost" onClick={() => setWizardStep(s => s - 1)}
                                            className="font-black uppercase tracking-widest text-[10px] text-[#A6B3C4] h-12 px-8 rounded-2xl hover:bg-slate-200"
                                        >
                                            Regresar
                                        </Button>
                                    )}
                                    <Button
                                        disabled={isLoading || !canContinueWhatsApp}
                                        onClick={() => {
                                            if (selectedChannel === 'telegram') {
                                                if (wizardStep < 3) setWizardStep(s => s + 1)
                                                else handleConnectTelegram()
                                            } else if (selectedChannel === 'whatsapp') {
                                                if (wizardStep < 4) setWizardStep(s => s + 1)
                                                else handleConnectWhatsApp()
                                            } else {
                                                resetWizard();
                                            }
                                        }}
                                        className="h-16 px-12 bg-[#00B4DB] hover:bg-[#26C7EA] text-white rounded-[24px] font-black uppercase tracking-widest text-xs shadow-2xl shadow-indigo-600/30 gap-4 group transition-all"
                                    >
                                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                            <>
                                                {selectedChannel === 'telegram' && wizardStep < 3 ? 'Siguiente Fase' :
                                                    selectedChannel === 'whatsapp' && wizardStep < 4 ? 'Siguiente Fase' :
                                                        selectedChannel === 'whatsapp' ? 'Validar con Meta' : 'Finalizar Proceso'}
                                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
