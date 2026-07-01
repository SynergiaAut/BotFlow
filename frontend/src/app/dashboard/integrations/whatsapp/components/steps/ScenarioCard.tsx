'use client'

import React from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ScenarioCardProps {
    id: 'A' | 'B' | 'C' | 'D'
    title: string
    description: string
    icon: LucideIcon
    selected: boolean
    onClick: () => void
}

export function ScenarioCard({
    id,
    title,
    description,
    icon: Icon,
    selected,
    onClick
}: ScenarioCardProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "relative flex flex-col items-start p-6 text-left rounded-2xl border transition-all duration-300 w-full group overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40",
                selected
                    ? "bg-slate-900/40 border-primary/80 shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)] ring-1 ring-primary/40"
                    : "bg-slate-900/10 border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900/25 hover:shadow-lg"
            )}
        >
            {/* Background glowing gradient when selected */}
            {selected && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
            )}

            {/* Scenario Badge */}
            <div className={cn(
                "absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors duration-300",
                selected 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200"
            )}>
                {id}
            </div>

            {/* Icon Wrapper */}
            <div className={cn(
                "p-3 rounded-xl mb-4 transition-all duration-300",
                selected
                    ? "bg-primary/20 text-primary scale-110"
                    : "bg-slate-800/60 text-slate-400 group-hover:bg-slate-800 group-hover:text-slate-300"
            )}>
                <Icon className="w-6 h-6" />
            </div>

            {/* Text details */}
            <h3 className={cn(
                "font-semibold text-base mb-2 transition-colors duration-300",
                selected ? "text-white" : "text-slate-200 group-hover:text-white"
            )}>
                {title}
            </h3>
            
            <p className={cn(
                "text-sm leading-relaxed transition-colors duration-300",
                selected ? "text-slate-300" : "text-slate-400 group-hover:text-slate-300"
            )}>
                {description}
            </p>
        </button>
    )
}
