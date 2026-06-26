import React from 'react';
import AgendaView from '@/components/calendar/AgendaView';

export default function AgendaPage() {
    return (
        <div className="container mx-auto py-8 max-w-6xl px-4 space-y-6">
            <div>
                <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white">Agenda de Citas</h1>
                <p className="text-sm text-zinc-500">
                    Historial y estado de todas las citas agendadas por tu asistente inteligente.
                </p>
            </div>
            
            <AgendaView />
        </div>
    );
}
