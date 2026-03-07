"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bot, LayoutDashboard, MessageSquareText, Users, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

interface SidebarProps {
    userEmail: string
}

export function Sidebar({ userEmail }: SidebarProps) {
    const pathname = usePathname()

    const routes = [
        {
            label: "Overview",
            icon: LayoutDashboard,
            href: "/dashboard",
            color: "text-sky-500",
        },
        {
            label: "Conversaciones",
            icon: MessageSquareText,
            href: "/dashboard/conversations",
            color: "text-emerald-500",
        },
        {
            label: "CRM Contactos",
            icon: Users,
            href: "/dashboard/crm",
            color: "text-violet-500",
        },
    ]

    return (
        <aside className="relative flex flex-col w-72 h-full bg-[#09090b] border-r border-white/[0.05] overflow-hidden">
            {/* Premium Gradient Background Glow */}
            <div className="absolute top-0 left-[-20%] w-[140%] h-[300px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

            {/* Brand Header */}
            <div className="flex items-center h-20 px-8 relative z-10">
                <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 mr-3 shadow-lg shadow-primary/20 overflow-hidden group">
                    <Bot className="w-5 h-5 text-primary relative z-10 transition-transform group-hover:scale-110" />
                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                    BotFlow
                </span>
            </div>

            {/* Navigation */}
            <div className="flex-1 py-6 px-4 space-y-2 relative z-10 overflow-y-auto">
                <div className="px-4 text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">
                    Módulos B2B
                </div>

                {routes.map((route) => {
                    const isActive = pathname === route.href

                    return (
                        <Link
                            key={route.href}
                            href={route.href}
                            className={cn(
                                "relative flex items-center px-4 py-3 text-sm font-medium transition-all rounded-xl group",
                                isActive ? "text-white" : "text-white/60 hover:text-white"
                            )}
                        >
                            {/* Active Background Animation */}
                            {isActive && (
                                <motion.div
                                    layoutId="sidebar-active"
                                    className="absolute inset-0 bg-white/10 rounded-xl border border-white/10"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}

                            {/* Hover Background (Falllback) */}
                            {!isActive && (
                                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity" />
                            )}

                            <route.icon className={cn("w-5 h-5 mr-3 relative z-10", route.color)} />
                            <span className="relative z-10">{route.label}</span>
                        </Link>
                    )
                })}
            </div>

            {/* User Profile Footer */}
            <div className="p-4 relative z-10 mt-auto">
                <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-4 backdrop-blur-md">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center text-sm font-bold shadow-inner">
                            {userEmail.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-semibold text-white truncate">{userEmail}</span>
                            <span className="text-xs text-emerald-400 font-medium tracking-wide">Owner</span>
                        </div>
                    </div>

                    <form action="/auth/signout" method="POST">
                        <Button
                            type="submit"
                            variant="ghost"
                            className="w-full justify-start text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors rounded-xl h-10"
                        >
                            <LogOut className="w-4 h-4 mr-3" />
                            Cerrar Sesión
                        </Button>
                    </form>
                </div>
            </div>
        </aside>
    )
}
