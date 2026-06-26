"use client"

import Link from 'next/link'
import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Settings, Key, ShieldAlert, Bell, Globe, ArrowRight, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
    return (
        <div className="flex-1 overflow-y-auto bg-[#070B12] p-8 md:p-12 relative font-sans">
            {/* Background elements - Orbital atmosphere */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00B4DB]/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-sky-500/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="max-w-4xl mx-auto space-y-10 relative z-10">
                {/* Header */}
                <div className="border-b border-white/10 pb-8 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#00B4DB]/10 border border-[#00B4DB]/20 rounded-full text-[#00B4DB] text-[10px] font-black uppercase tracking-widest">
                        <Sparkles className="w-3 h-3 animate-pulse" /> Panel de Control
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tighter">
                        Configuración de Plataforma
                    </h1>
                    <p className="text-[#A6B3C4] font-medium max-w-xl leading-relaxed">
                        Administra las opciones globales de tu espacio de trabajo, llaves de seguridad y preferencias de notificaciones.
                    </p>
                </div>

                {/* Settings Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Security & API Keys */}
                    <div className="bg-[#0B0F17] border border-white/10 rounded-[32px] p-8 space-y-6 hover:border-[#00B4DB]/30 transition-all duration-300">
                        <div className="w-12 h-12 rounded-2xl bg-[#00B4DB]/10 flex items-center justify-center">
                            <Key className="w-6 h-6 text-[#00B4DB]" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-white tracking-tight">API Keys & Tokens</h3>
                            <p className="text-xs text-[#A6B3C4] leading-relaxed">
                                Administra tus llaves de integración y tokens de autenticación para conectar sistemas externos (CRM, ERP).
                            </p>
                        </div>
                        <Button className="h-10 rounded-xl bg-[#00B4DB] hover:bg-[#26C7EA] text-white text-xs font-black uppercase tracking-widest px-5 gap-2">
                            Gestionar Llaves <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Calendar & Agenda Settings */}
                    <div className="bg-[#0B0F17] border border-white/10 rounded-[32px] p-8 space-y-6 hover:border-[#00B4DB]/30 transition-all duration-300">
                        <div className="w-12 h-12 rounded-2xl bg-sky-500/10 flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-sky-400" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-white tracking-tight">Agenda & Calendario</h3>
                            <p className="text-xs text-[#A6B3C4] leading-relaxed">
                                Conecta y gestiona tu calendario (Google Calendar o Cal.com) para permitir agendamientos automáticos con tus bots.
                            </p>
                        </div>
                        <Link href="/dashboard/settings/calendar">
                            <Button className="h-10 rounded-xl bg-[#00B4DB] hover:bg-[#26C7EA] text-white text-xs font-black uppercase tracking-widest px-5 gap-2 w-full md:w-auto">
                                Configurar Calendario <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    </div>

                    {/* Notifications */}
                    <div className="bg-[#0B0F17] border border-white/10 rounded-[32px] p-8 space-y-6 hover:border-[#00B4DB]/30 transition-all duration-300">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                            <Bell className="w-6 h-6 text-amber-400" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-white tracking-tight">Preferencias de Alertas</h3>
                            <p className="text-xs text-[#A6B3C4] leading-relaxed">
                                Configura alertas de inactividad de bots, límites de cuota mensuales de WhatsApp y notificaciones de sistema.
                            </p>
                        </div>
                        <Button variant="outline" className="h-10 rounded-xl border-white/10 text-[#A6B3C4] hover:bg-white/5 text-xs font-black uppercase tracking-widest px-5">
                            Configurar
                        </Button>
                    </div>

                    {/* Regional & System */}
                    <div className="bg-[#0B0F17] border border-white/10 rounded-[32px] p-8 space-y-6 hover:border-[#00B4DB]/30 transition-all duration-300">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                            <Globe className="w-6 h-6 text-purple-400" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-white tracking-tight">Idioma & Región</h3>
                            <p className="text-xs text-[#A6B3C4] leading-relaxed">
                                Modifica la zona horaria del espacio de trabajo y el idioma predeterminado de los reportes del dashboard.
                            </p>
                        </div>
                        <Button variant="outline" className="h-10 rounded-xl border-white/10 text-[#A6B3C4] hover:bg-white/5 text-xs font-black uppercase tracking-widest px-5">
                            Modificar
                        </Button>
                    </div>

                    {/* Safety Vault */}
                    <div className="bg-[#0B0F17] border border-white/10 rounded-[32px] p-8 space-y-6 hover:border-[#00B4DB]/30 transition-all duration-300">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                            <ShieldAlert className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-white tracking-tight">Seguridad & RLS</h3>
                            <p className="text-xs text-[#A6B3C4] leading-relaxed">
                                Monitorea las políticas de aislamiento de bases de datos por tenant (RLS) y auditoría activa de encriptación.
                            </p>
                        </div>
                        <Button variant="outline" className="h-10 rounded-xl border-white/10 text-[#A6B3C4] hover:bg-white/5 text-xs font-black uppercase tracking-widest px-5">
                            Ver Auditoría
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
