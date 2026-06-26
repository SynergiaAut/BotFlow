import React from 'react';
import AgendaView from '@/components/calendar/AgendaView';
import { Calendar } from 'lucide-react';

export default function AgendaPage() {
    return (
        <div className="flex-1 overflow-y-auto bg-[#070B12] p-8 md:p-12 relative font-sans text-white min-h-screen">
            {/* Background elements - Orbital atmosphere */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00B4DB]/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-sky-500/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="max-w-6xl mx-auto space-y-10 relative z-10">
                {/* Header */}
                <div className="border-b border-white/10 pb-8 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#10B981]/10 border border-[#10B981]/20 rounded-full text-[#10B981] text-[10px] font-black uppercase tracking-widest">
                        <Calendar className="w-3 h-3 animate-pulse" /> Agenda Comercial
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tighter">
                        Agenda de Citas
                    </h1>
                    <p className="text-[#A6B3C4] font-medium max-w-xl leading-relaxed">
                        Visualiza, reprograma y administra todas las reuniones y citas comerciales agendadas automáticamente por tus agentes de IA.
                    </p>
                </div>
                
                <AgendaView />
            </div>
        </div>
    );
}
