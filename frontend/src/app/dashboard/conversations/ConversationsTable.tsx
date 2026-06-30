'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRouter } from 'next/navigation';
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MessageSquareText, Bot, ChevronRight } from 'lucide-react';
import { SeedDataButton } from "@/components/ui/seed-data-button";

export default function ConversationsTable({ conversations }: { conversations: any[] }) {
    const router = useRouter();

    return (
        <div className="bg-[#0B0F17] rounded-[40px] border border-white/10 shadow-2xl overflow-hidden group">
            <Table>
                <TableHeader className="bg-[#0B0F17] border-b border-white/10">
                    <TableRow className="border-none hover:bg-transparent">
                        <TableHead className="font-black text-[#7E8A9C] h-14 uppercase text-[10px] tracking-widest pl-8">Estado / ID</TableHead>
                        <TableHead className="font-black text-[#7E8A9C] h-14 uppercase text-[10px] tracking-widest">Cliente</TableHead>
                        <TableHead className="font-black text-[#7E8A9C] h-14 uppercase text-[10px] tracking-widest">IA Asignada</TableHead>
                        <TableHead className="font-black text-[#7E8A9C] h-14 uppercase text-[10px] tracking-widest">Vía</TableHead>
                        <TableHead className="font-black text-[#7E8A9C] h-14 uppercase text-[10px] tracking-widest text-right pr-8">Cronología</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {conversations.length === 0 ? (
                        <TableRow className="hover:bg-transparent border-none">
                            <TableCell colSpan={5} className="h-[400px] text-center">
                                <div className="flex flex-col items-center justify-center gap-6 animate-in fade-in duration-700">
                                    <div className="w-20 h-20 bg-[#0B0F17] border border-white/10 rounded-[32px] flex items-center justify-center">
                                        <MessageSquareText className="w-10 h-10 text-white/20" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xl font-black text-white tracking-tighter leading-none">Cero Intercepciones</p>
                                        <p className="text-xs text-[#7E8A9C] font-medium font-mono uppercase">Protocolo de escucha activo...</p>
                                    </div>
                                    <SeedDataButton className="bg-[#0B0F17] border-white/10 text-white rounded-2xl px-8 h-12" />
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        conversations.map((conv) => (
                            <TableRow
                                key={conv.id}
                                className="border-b border-white/5 hover:bg-white/5 transition-all group cursor-pointer h-24"
                                onClick={() => router.push(`/dashboard/conversations/${conv.id}`)}
                            >
                                <TableCell className="pl-8">
                                    <div className="flex flex-col gap-2">
                                        <Badge className={`capitalize inline-flex w-max font-black text-[9px] tracking-widest shadow-none px-3 py-1 border-none rounded-full ${conv.status === 'open' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-[#A6B3C4]'}`}>
                                            {conv.status === 'open' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse" />}
                                            {conv.status}
                                        </Badge>
                                        <span className="text-[9px] text-[#7E8A9C] font-black uppercase tracking-[0.2em] ml-1">#{conv.id.substring(0, 8)}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-4">
                                        <div className="w-11 h-11 rounded-2xl bg-[#0B0F17] border border-white/10 flex items-center justify-center text-white text-xs font-black">
                                            {(conv.contacts?.name || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-white tracking-tight group-hover:text-emerald-500 transition-colors">
                                                {conv.contacts?.name || 'Usuario Autónomo'}
                                            </span>
                                            <span className="text-[10px] text-[#7E8A9C] font-bold uppercase tracking-widest">
                                                {conv.contacts?.phone_number || conv.contacts?.email || 'Desconocido'}
                                            </span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 bg-[#00B4DB]/10 border border-[#00B4DB]/20 px-3 py-1.5 rounded-xl w-max">
                                        <Bot className="w-3.5 h-3.5 text-[#00B4DB]" />
                                        <span className="text-[10px] font-black text-[#00B4DB] uppercase tracking-widest">
                                            {conv.bots?.name || 'Core Engine'}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-white/20" />
                                        <span className="text-[10px] font-black capitalize text-[#A6B3C4] uppercase tracking-widest">
                                            {conv.channel}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right pr-8">
                                    <div className="flex items-center justify-end gap-4">
                                        <div className="flex flex-col items-end">
                                            <span className="text-white text-xs font-black">
                                                {new Date(conv.created_at).toLocaleDateString()}
                                            </span>
                                            <span className="text-[10px] text-[#7E8A9C] font-bold uppercase tracking-widest">
                                                {new Date(conv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
