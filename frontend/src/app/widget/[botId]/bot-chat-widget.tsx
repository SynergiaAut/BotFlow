"use client"

import { useState, useEffect, useRef } from 'react'
import { useChat, Message } from 'ai/react'
import { Bot, Send, User, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Generador de UUID para visitantes anónimos
function getOrCreateSessionId() {
    if (typeof window === 'undefined') return 'guest_session';
    let sid = localStorage.getItem('skylab_session_id');
    if (!sid) {
        sid = 'guest_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('skylab_session_id', sid);
    }
    return sid;
}

const DelayedBubble = ({ text, isFirst, onVisible, onImageClick }: { text: string, isFirst: boolean, onVisible?: () => void, onImageClick?: (url: string) => void }) => {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const t = setTimeout(() => {
            setVisible(true);
            if (onVisible) setTimeout(onVisible, 50);
        }, 300);
        return () => clearTimeout(t);
    }, [onVisible]);

    if (!visible) return null;

    const renderContent = () => {
        const regex = /(!\[.*?\]\(.*?\))/g;
        const parts = text.split(regex);

        return parts.map((part, index) => {
            const imageMatch = part.match(/^!\[(.*?)\]\((.*?)\)$/);
            if (imageMatch) {
                return (
                    <div key={index} onClick={() => onImageClick && onImageClick(imageMatch[2])} className="mt-3 mb-1 bg-slate-50/50 rounded-xl overflow-hidden border border-slate-100 flex items-center justify-center p-2 cursor-pointer group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imageMatch[2]} alt={imageMatch[1] || 'Bot Image'} className="max-w-full h-auto max-h-[200px] object-contain rounded-lg group-hover:scale-[1.02] transition-all duration-300" loading="lazy" />
                    </div>
                );
            } else if (part.trim() !== '') {
                return <span key={index} className="whitespace-pre-wrap leading-relaxed block">{part}</span>;
            }
            return null;
        });
    };

    return (
        <div className="flex gap-3 justify-start w-full animate-in fade-in slide-in-from-bottom-2 duration-300 px-4">
            <div className="max-w-[85%] flex flex-col gap-1 bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-tl-sm shadow-sm px-4 py-3 text-sm">
                {renderContent()}
            </div>
        </div>
    )
}

const CognitiveTypingBubble = ({ onVisible }: { onVisible?: () => void }) => {
    const [phase, setPhase] = useState<'typing' | 'paused' | 'retyping'>('typing')

    useEffect(() => {
        const t1 = setTimeout(() => setPhase('paused'), 1500)
        const t2 = setTimeout(() => {
            setPhase('retyping')
            if (onVisible) setTimeout(onVisible, 50)
        }, 2200)
        return () => { clearTimeout(t1); clearTimeout(t2); }
    }, [onVisible])

    if (phase === 'paused') return <div className="h-12" />

    return (
        <div className="flex gap-4 justify-start animate-in fade-in duration-200 px-4">
            <div className="px-5 py-4 shadow-sm flex items-center justify-center min-w-[80px] bg-white border border-slate-200 rounded-2xl rounded-tl-sm">
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
                </div>
            </div>
        </div>
    )
}

export default function BotChatWidget({ initialBot }: { initialBot: any }) {
    const [sessionId, setSessionId] = useState<string>('')
    const [fullscreenImage, setFullscreenImage] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setSessionId(getOrCreateSessionId())
    }, [])

    const [isTypingHuman, setIsTypingHuman] = useState(false)
    const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
        api: '/api/widget/chat',
        body: {
            botId: initialBot.id,
            sessionId: sessionId || 'guest_fallback'
        },
        onResponse: async (response) => {
            // Si la respuesta es JSON, es porque viene fragmentada (humanizada)
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                if (data.fragments && data.fragments.length > 0) {
                    processFragments(data.fragments);
                }
            }
        },
        onError: (error: Error) => {
            console.error("Chat Error:", error)
        }
    })

    const processFragments = async (fragments: any[]) => {
        setIsTypingHuman(true);
        
        for (let i = 0; i < fragments.length; i++) {
            const fragment = fragments[i];
            
            // 1. Simular delay inicial (reacción)
            await new Promise(r => setTimeout(r, fragment.delayMs));
            
            // 2. Simular tiempo de escritura (typing bubble visible)
            setIsTypingHuman(true);
            scrollToBottom();
            await new Promise(r => setTimeout(r, fragment.typingMs));
            
            // 3. Agregar el mensaje a la lista
            setIsTypingHuman(false);
            setMessages((prev: Message[]) => [
                ...prev,
                {
                    id: `frag-${Date.now()}-${i}`,
                    role: 'assistant',
                    content: fragment.text
                } as Message
            ]);
            scrollToBottom();
        }
    }

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isTypingHuman])

    // Welcome Message Inicial (Mock)
    const hasMessages = messages.length > 0;

    return (
        <div className="flex flex-col h-full bg-slate-50 relative">

            {/* Area de Mensajes */}
            <div className="flex-1 overflow-y-auto py-6 space-y-6">

                {/* Mensaje de Bienvenida Falso si no hay historial local */}
                {!hasMessages && initialBot.welcome_message && (
                    <DelayedBubble
                        text={initialBot.welcome_message}
                        isFirst={true}
                        onVisible={scrollToBottom}
                    />
                )}

                {messages.map((m: Message) => (
                    <div key={m.id} className={cn("flex flex-col gap-2 w-full", m.role === 'user' ? 'items-end' : 'items-start')}>
                        {m.role === 'user' ? (
                            <div className="flex gap-3 justify-end w-full animate-in slide-in-from-right-2 duration-300 px-4">
                                <div className="flex flex-col gap-1 items-end max-w-[85%]">
                                    <div
                                        className="px-4 py-2.5 flex items-center text-sm shadow-sm text-white rounded-2xl rounded-tr-sm"
                                        /* eslint-disable-next-line react-inline-style/no-inline-styles */
                                        style={{ backgroundColor: initialBot.color_theme || '#4f46e5' }}
                                    >
                                        <p className="whitespace-pre-wrap text-[14.2px] leading-snug">{m.content}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <DelayedBubble
                                text={m.content.replace(/[*#]/g, '')}
                                isFirst={true}
                                onVisible={scrollToBottom}
                                onImageClick={setFullscreenImage}
                            />
                        )}
                    </div>
                ))}

                {(isLoading || isTypingHuman) && (
                    <CognitiveTypingBubble onVisible={scrollToBottom} />
                )}

                <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* Input Footer */}
            <div className="p-4 bg-white border-t border-slate-100 z-20 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                <form onSubmit={handleSubmit} className="flex gap-2 relative">
                    <input
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-full pl-5 pr-12 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all text-slate-700"
                        value={input}
                        placeholder="Escribe un mensaje..."
                        onChange={handleInputChange}
                        disabled={isLoading}
                    />
                    <Button
                        type="submit"
                        aria-label="Enviar"
                        disabled={isLoading || !input?.trim()}
                        className="absolute right-1 top-1 bottom-1 w-10 h-10 rounded-full p-0 flex items-center justify-center transition-transform hover:scale-105"
                        /* eslint-disable-next-line react-inline-style/no-inline-styles */
                        style={{ backgroundColor: (!isLoading && input?.trim()) ? (initialBot.color_theme || '#4f46e5') : '#e2e8f0', color: (!isLoading && input?.trim()) ? 'white' : '#94a3b8' }}
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
                <div className="flex items-center justify-center mt-2 opacity-50">
                    <span className="text-[10px] font-bold tracking-widest uppercase flex items-center gap-1">
                        <Bot className="w-3 h-3" />
                        Powered by Skylab
                    </span>
                </div>
            </div>

            {/* Lightbox para imágenes */}
            {fullscreenImage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setFullscreenImage(null)}>
                    <button aria-label="Cerrar Imagen" onClick={() => setFullscreenImage(null)} className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                    <img src={fullscreenImage} alt="Zoom" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-500" onClick={(e) => e.stopPropagation()} />
                </div>
            )}
        </div>
    )
}
