"use client"

import { useState, useEffect } from 'react'
import { useChat, Message } from 'ai/react'
import { Bot, Send, User, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getTestConversationMessages } from '@/app/actions/chat-actions'

interface BotChatProps {
    bots: any[]
}

export function BotChat({ bots }: BotChatProps) {
    const [selectedBotId, setSelectedBotId] = useState<string>(bots.length > 0 ? bots[0].id : '')

    const selectedBot = bots.find(b => b.id === selectedBotId)

    // Initialization of Vercel AI SDK useChat
    const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
        api: '/api/chat',
        body: {
            systemPrompt: selectedBot?.system_prompt || "Eres un asistente virtual útil y profesional.",
            botId: selectedBot?.id
        },
        onError: (error: Error) => {
            alert("Error: " + error.message)
        }
    })

    // Cargar historial de chat desde Supabase al cambiar de bot
    useEffect(() => {
        let mounted = true
        async function loadHistory() {
            if (!selectedBotId) return
            const { messages: history } = await getTestConversationMessages(selectedBotId)
            if (mounted && history) {
                // Casting preventivo para acoplar al formato exigido por useChat
                setMessages(history as Message[])
            }
        }

        loadHistory()
        return () => { mounted = false }
    }, [selectedBotId, setMessages])

    // Limpiar el historial local y cargar el nuevo al cambiar de bot
    const handleBotChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedBotId(e.target.value)
        setMessages([])
    }

    if (bots.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[500px] text-slate-500 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <Bot className="w-10 h-10 mb-4 text-slate-300" />
                <p className="font-medium text-lg">No hay bots configurados.</p>
                <p className="text-sm">Ve a Sembrar Datos B2B en el CRM para crear bots de prueba.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[600px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Test Environment Header */}
            <div className="h-16 border-b border-slate-100 bg-slate-50 flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 shadow-sm">
                        <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-slate-800">Bot Tester (Live)</h2>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-widest">Connected</span>
                        </div>
                    </div>
                </div>

                {/* Bot Selector */}
                <select
                    aria-label="Seleccionar Bot"
                    className="text-sm bg-white border border-slate-200 rounded-md py-1.5 px-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={selectedBotId}
                    onChange={handleBotChange}
                >
                    {bots.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                </select>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                        <Bot className="w-12 h-12 opacity-20" />
                        <p className="text-sm font-medium">Inicia una conversación para probar al Bot {selectedBot?.name}</p>
                        <div className="max-w-xs text-center text-xs opacity-70 mt-2 bg-slate-100 p-3 rounded-lg border border-slate-200">
                            <span className="font-bold">Prompt inyectado:</span>
                            <br />"{selectedBot?.system_prompt}"
                        </div>
                    </div>
                )}

                {messages.map((m: Message) => (
                    <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {m.role !== 'user' && (
                            <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center shrink-0">
                                <Bot className="w-4 h-4 text-indigo-600" />
                            </div>
                        )}
                        <div className={`px-4 py-3 rounded-2xl max-w-[80%] text-sm shadow-sm ${m.role === 'user'
                            ? 'bg-indigo-600 text-white rounded-tr-sm'
                            : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'
                            }`}>
                            <p className="whitespace-pre-wrap">{m.content}</p>
                        </div>
                        {m.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center shrink-0">
                                <User className="w-4 h-4 text-slate-600" />
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex gap-4 justify-start">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center shrink-0">
                            <Bot className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="px-5 py-4 rounded-2xl bg-white border border-slate-200 rounded-tl-sm shadow-sm flex items-center justify-center min-w-[80px]">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
                                <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
                                <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
                <form onSubmit={handleSubmit} className="flex gap-3">
                    <input
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-validators"
                        value={input}
                        placeholder="Escribe un mensaje para probar al bot..."
                        onChange={handleInputChange}
                        disabled={isLoading}
                    />
                    <Button
                        type="submit"
                        disabled={isLoading || !input?.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 shadow-sm"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </div>
        </div>
    )
}
