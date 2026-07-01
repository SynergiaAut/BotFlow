'use client'

import React from 'react'
import { PlusCircle, MessageSquare, Building2, Bot } from 'lucide-react'
import { ScenarioCard } from './ScenarioCard'

interface Step1ScenarioProps {
    selectedScenario: 'A' | 'B' | 'C' | 'D' | null
    onSelectScenario: (scenario: 'A' | 'B' | 'C' | 'D') => void
}

export function Step1Scenario({
    selectedScenario,
    onSelectScenario
}: Step1ScenarioProps) {
    const scenarios = [
        {
            id: 'A' as const,
            title: 'Configuración desde cero',
            description: 'Nunca he usado Facebook Business Manager ni tengo cuenta comercial de Meta.',
            icon: PlusCircle
        },
        {
            id: 'B' as const,
            title: 'Presencia informal o personal',
            description: 'Uso WhatsApp Business o personal en mi celular de forma manual para responder a clientes.',
            icon: MessageSquare
        },
        {
            id: 'C' as const,
            title: 'Empresa con Meta Business',
            description: 'Mi empresa ya tiene cuenta comercial verificada en Meta y quiero configurar un número nuevo.',
            icon: Building2
        },
        {
            id: 'D' as const,
            title: 'Migración de Bot Activo',
            description: 'Ya tengo un bot de WhatsApp funcionando con otro proveedor y quiero migrar el mismo número a Skylab.',
            icon: Bot
        }
    ]

    return (
        <div className="space-y-6">
            <div className="text-center max-w-xl mx-auto space-y-2">
                <h2 className="text-2xl font-bold text-white tracking-tight">
                    ¿Cuál es tu situación actual con WhatsApp?
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                    Selecciona el escenario que mejor describa a tu negocio. Esto nos ayudará a darte las instrucciones y tiempos correctos para conectar tu línea.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto pt-4">
                {scenarios.map((scenario) => (
                    <ScenarioCard
                        key={scenario.id}
                        id={scenario.id}
                        title={scenario.title}
                        description={scenario.description}
                        icon={scenario.icon}
                        selected={selectedScenario === scenario.id}
                        onClick={() => onSelectScenario(scenario.id)}
                    />
                ))}
            </div>
        </div>
    )
}
