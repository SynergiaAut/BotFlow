'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { MessageSquareText, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getRecentConversationsAction } from '@/app/dashboard/crm/actions';

interface Conversation {
    id: string;
    channel: string;
    status: string;
    created_at: string;
    contacts?: { name?: string; avatar_url?: string | null } | null;
}

interface Props {
    initialConversations: Conversation[];
    tenantId: string;
}

export default function RecentActivityClient({ initialConversations, tenantId }: Props) {
    const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
    // useMemo para que el cliente no se recree en cada render y el canal realtime sea estable
    const supabase = useMemo(() => createClient(), []);

    const fetchRecent = async () => {
        if (!tenantId) return;
        const data = await getRecentConversationsAction(tenantId);
        if (data && data.length > 0) setConversations(data as any);
    };

    // Fetch inicial en el cliente solo si el SSR no trajo datos
    useEffect(() => {
        if (initialConversations.length === 0) fetchRecent();
    }, [tenantId]);

    useEffect(() => {
        if (!tenantId) return;

        const channel = supabase
            .channel(`recent-activity-${tenantId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'conversations',
                filter: `tenant_id=eq.${tenantId}`
            }, () => { fetchRecent(); })
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
            }, () => { fetchRecent(); })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [tenantId]);

    return (
        <div className="bg-[#0B0F17] rounded-[24px] border border-white/10 flex flex-col flex-1 min-h-[500px]">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Actividad Reciente
                    </h3>
                </div>
                <Link href="/dashboard/conversations">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 px-4 rounded-lg text-[13px] font-semibold text-[#00B4DB] hover:bg-[#0B0F17] transition-colors"
                    >
                        Ver Todo
                    </Button>
                </Link>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-2 custom-scrollbar">
                {conversations.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-40 gap-4">
                        <MessageSquareText className="w-10 h-10 text-[#7E8A9C]" />
                        <p className="text-xs font-bold text-[#A6B3C4] uppercase tracking-widest">Sin Actividad</p>
                    </div>
                ) : (
                    conversations.map((conv) => (
                        <Link key={conv.id} href={`/dashboard/conversations/${conv.id}`}>
                            <div className="p-4 hover:bg-white/5 border border-transparent hover:border-white/10 rounded-2xl transition-all flex items-center gap-4 group cursor-pointer">
                                <div className="w-10 h-10 rounded-full bg-[#0B0F17] border border-white/10 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                                    {conv.contacts?.avatar_url
                                        ? <img src={conv.contacts.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                                        : conv.contacts?.name?.charAt(0) || 'U'}
                                </div>
                                <div className="flex-1 truncate">
                                    <p className="text-[14px] font-bold text-white group-hover:text-[#00B4DB] transition-colors truncate">
                                        {conv.contacts?.name || 'Visitante Autónomo'}
                                    </p>
                                    <p className="text-[11px] text-[#A6B3C4] font-medium mt-0.5">
                                        {conv.channel === 'web' ? 'Chat Web' : conv.channel}
                                        <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[9px] font-black ${conv.status === 'open' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-[#7E8A9C]'}`}>
                                            {conv.status}
                                        </span>
                                    </p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-[#7E8A9C] group-hover:text-[#00B4DB] transition-colors flex-shrink-0" />
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
