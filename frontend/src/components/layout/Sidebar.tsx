"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard, MessageSquareText, Users, LogOut,
    FlaskConical, Database, Network, Sparkles, Palette, ChevronRight,
    Settings, Info, ChevronLeft, Calendar
} from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { signout } from "@/app/auth/actions"

interface SidebarProps {
    userEmail: string
    hasTenant: boolean
}

const routes = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
        color: "#00B4DB",
    },
    {
        label: "Bot Builder",
        icon: Sparkles,
        href: "/dashboard/bot-builder",
        color: "#00B4DB",
    },
    {
        label: "Configuración Inicial",
        icon: Palette,
        href: "/dashboard/onboarding",
        color: "#F59E0B",
    },
    {
        label: "Conversaciones",
        icon: MessageSquareText,
        href: "/dashboard/conversations",
        color: "#00B4DB",
    },
    {
        label: "Bot Tester",
        icon: FlaskConical,
        href: "/dashboard/bot-tester",
        color: "#A78BFA",
    },
    {
        label: "CRM",
        icon: Users,
        href: "/dashboard/crm",
        color: "#00B4DB",
    },
    {
        label: "Agenda",
        icon: Calendar,
        href: "/dashboard/agenda",
        color: "#10B981",
    },
    {
        label: "Base de Conocimiento",
        icon: Database,
        href: "/dashboard/knowledge",
        color: "#8B92A9",
    },
    {
        label: "Integraciones",
        icon: Network,
        href: "/dashboard/integrations",
        color: "#10B981",
    },
    {
        label: "Configuración",
        icon: Settings,
        href: "/dashboard/settings",
        color: "#00B4DB",
    },
    {
        label: "Acerca de",
        icon: Info,
        href: "/dashboard/about",
        color: "#00B4DB",
    },
]

export function Sidebar({ userEmail, hasTenant }: SidebarProps) {
    const pathname = usePathname()
    const [isCollapsed, setIsCollapsed] = useState(false)

    useEffect(() => {
        const stored = localStorage.getItem('sidebar-collapsed')
        if (stored === 'true') {
            setIsCollapsed(true)
        }
    }, [])

    const handleToggleCollapse = (collapsed: boolean) => {
        setIsCollapsed(collapsed)
        localStorage.setItem('sidebar-collapsed', collapsed ? 'true' : 'false')
    }

    // Filtramos la ruta de configuración inicial si el usuario ya tiene un tenant configurado
    const filteredRoutes = routes.filter(route => {
        if (route.href === '/dashboard/onboarding') {
            return !hasTenant;
        }
        return true;
    })

    return (
        <motion.aside
            animate={{ width: isCollapsed ? 80 : 256 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="relative flex flex-col h-full font-sans select-none overflow-hidden"
            style={{
                background: '#0B0F17',
                borderRight: '1px solid rgba(0, 180, 219, 0.10)',
            }}
        >
            {/* Glow de fondo sutil en el header */}
            <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse at 50% 0%, rgba(0, 180, 219, 0.08) 0%, transparent 70%)',
                }} />

            {/* Header: Logo Skylab + Contraer */}
            <div className={cn(
                "flex items-center h-[76px] px-5 relative z-10 justify-between transition-all",
                isCollapsed && "justify-center px-0"
            )}
                style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}
            >
                {!isCollapsed ? (
                    <div className="flex items-center gap-2">
                        {/* Imagen Oficial Horizontal (Icono + Nombre) */}
                        <motion.div
                            animate={{ 
                                scale: [1, 1.05, 1],
                                filter: [
                                    "drop-shadow(0 0 2px rgba(0, 180, 219, 0.2))", 
                                    "drop-shadow(0 0 8px rgba(0, 180, 219, 0.5))", 
                                    "drop-shadow(0 0 2px rgba(0, 180, 219, 0.2))"
                                ]
                            }}
                            transition={{ 
                                duration: 4, 
                                repeat: Infinity, 
                                ease: "easeInOut" 
                            }}
                            className="relative flex-shrink-0"
                        >
                            <Image 
                                src="/brand/skylab-horizontal-transparent.png" 
                                alt="Skylab Human Bot" 
                                width={160} 
                                height={40} 
                                priority
                                className="object-contain animate-in fade-in duration-300"
                            />
                        </motion.div>
                    </div>
                ) : (
                    <div className="flex justify-center w-full">
                        {/* Imagen Oficial de Símbolo Solo (Agrandada a 66px para impacto visual) */}
                        <motion.div
                            animate={{ 
                                scale: [1, 1.05, 1],
                                filter: [
                                    "drop-shadow(0 0 2px rgba(0, 180, 219, 0.2))", 
                                    "drop-shadow(0 0 8px rgba(0, 180, 219, 0.5))", 
                                    "drop-shadow(0 0 2px rgba(0, 180, 219, 0.2))"
                                ]
                            }}
                            transition={{ 
                                duration: 4, 
                                repeat: Infinity, 
                                ease: "easeInOut" 
                            }}
                            className="relative cursor-pointer animate-in fade-in duration-300"
                            onClick={() => handleToggleCollapse(false)}
                        >
                            <Image 
                                src="/brand/skylab-symbol-transparent.png" 
                                alt="Skylab Symbol" 
                                width={66} 
                                height={66} 
                                priority
                                className="object-contain"
                            />
                        </motion.div>
                    </div>
                )}

                {!isCollapsed && (
                    <button
                        onClick={() => handleToggleCollapse(true)}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
                        title="Contraer barra lateral"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                )}

                {isCollapsed && (
                    <button
                        onClick={() => handleToggleCollapse(false)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        title="Expandir barra lateral"
                    />
                )}
            </div>

            {/* Navegación */}
            <div className="flex-1 py-5 relative z-10 overflow-y-auto">
                {!isCollapsed && (
                    <div className="px-5 text-[10px] font-black tracking-[0.18em] uppercase mb-3"
                        style={{ color: '#4A5168' }}>
                        Herramientas
                    </div>
                )}

                <div className="px-3 space-y-1">
                    {filteredRoutes.map((route) => {
                        const isActive = pathname === route.href

                        return (
                            <Link
                                key={route.href}
                                href={route.href}
                                title={isCollapsed ? route.label : undefined}
                                className={cn(
                                    "relative flex items-center px-3.5 py-2.5 text-[13.5px] font-semibold transition-all rounded-xl group",
                                    isCollapsed ? "justify-center" : "justify-between",
                                    isActive
                                        ? "text-white"
                                        : "hover:text-white"
                                )}
                                style={isActive ? {
                                    background: 'rgba(0, 180, 219, 0.10)',
                                    color: '#F5F7F9',
                                } : {
                                    color: '#8B92A9',
                                }}
                            >
                                {/* Indicador activo izquierdo */}
                                {isActive && (
                                    <motion.div
                                        layoutId="active-pill"
                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                                        style={{ background: '#00B4DB' }}
                                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                    />
                                )}

                                <div className="flex items-center">
                                    <route.icon
                                        className={cn(
                                            "w-[18px] h-[18px] flex-shrink-0 transition-colors",
                                            !isCollapsed && "mr-3"
                                        )}
                                        style={{ color: isActive ? route.color : '#4A5168' }}
                                    />
                                    {!isCollapsed && <span>{route.label}</span>}
                                </div>

                                {isActive && !isCollapsed && (
                                    <ChevronRight className="w-3.5 h-3.5 opacity-40 animate-in slide-in-from-left-1" style={{ color: '#00B4DB' }} />
                                )}
                            </Link>
                        )
                    })}
                </div>
            </div>

            {/* Footer: Usuario + firma Synerg-IA */}
            <div className="p-4 relative z-10"
                style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>

                {/* Tarjeta de usuario */}
                <div className={cn(
                    "rounded-xl p-3.5 mb-3 flex flex-col transition-all",
                    isCollapsed ? "items-center p-2 mb-2" : "items-stretch"
                )}
                    style={{
                        background: 'rgba(0, 180, 219, 0.04)',
                        border: '1px solid rgba(0, 180, 219, 0.10)',
                    }}>
                    
                    {isCollapsed ? (
                        <div className="flex flex-col items-center gap-2">
                            {/* Avatar con inicial */}
                            <div className="w-11 h-11 rounded-full flex items-center justify-center text-base font-black flex-shrink-0"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(0, 180, 219, 0.2), rgba(255, 255, 255, 0.08))',
                                    border: '1px solid rgba(0, 180, 219, 0.25)',
                                    color: '#00B4DB',
                                }}
                                title={userEmail}
                            >
                                {userEmail.charAt(0).toUpperCase()}
                            </div>
                            
                            <form action={signout} className="w-full flex justify-center">
                                <button
                                    type="submit"
                                    title="Cerrar Sesión"
                                    className="p-2 hover:bg-white/5 text-[#8B92A9] hover:text-red-400 rounded-lg transition-all"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-3 mb-3">
                                {/* Avatar con inicial */}
                                <div className="w-11 h-11 rounded-full flex items-center justify-center text-base font-black flex-shrink-0"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(0, 180, 219, 0.2), rgba(255, 255, 255, 0.08))',
                                        border: '1px solid rgba(0, 180, 219, 0.25)',
                                        color: '#00B4DB',
                                    }}>
                                    {userEmail.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[13px] font-bold truncate" style={{ color: '#F5F7F9' }}>
                                        {userEmail}
                                    </span>
                                    <span className="text-[11px] font-medium" style={{ color: '#4A5168' }}>
                                        Administrador
                                    </span>
                                </div>
                            </div>

                            <form action={signout} className="w-full">
                                <Button
                                    type="submit"
                                    variant="ghost"
                                    className="w-full h-9 justify-center font-bold text-[12px] rounded-lg transition-all"
                                    style={{
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        color: '#8B92A9',
                                    }}
                                >
                                    <LogOut className="w-3.5 h-3.5 mr-2" />
                                    Cerrar Sesión
                                </Button>
                            </form>
                        </>
                    )}
                </div>

                {/* Firma: Skylab by Synerg-IA */}
                <div className="flex items-center justify-center gap-2.5 pt-2 border-t border-white/[0.04] mt-2">
                    <Image 
                        src="/brand/synergia-symbol-transparent.png" 
                        alt="Synerg-IA Automation" 
                        width={28} 
                        height={28} 
                        className="opacity-70 object-contain hover:opacity-100 transition-all duration-300 cursor-pointer"
                    />
                    {!isCollapsed && (
                        <span className="text-[10px] font-medium tracking-wide"
                            style={{ color: '#7E8A9C' }}>
                            Skylab by{' '}
                            <span style={{ color: '#00B4DB' }} className="font-bold">Synerg-IA</span>
                        </span>
                    )}
                </div>
            </div>
        </motion.aside>
    )
}
