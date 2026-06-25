/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { Message, useChat } from 'ai/react'
import type { StaticImageData } from 'next/image'
import {
    ArrowLeft,
    Bot,
    Camera,
    CheckCheck,
    Image as ImageIcon,
    Info,
    Loader2,
    Menu,
    Mic,
    MoreVertical,
    Paperclip,
    Phone,
    Plus,
    Search,
    Send,
    ShieldCheck,
    Smile,
    Trash2,
    Video,
    X,
    Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getTestConversationMessages, resetTestConversation } from '@/app/actions/chat-actions'
import instagramIcon from '../../../Iconos/instagram.png'
import messengerIcon from '../../../Iconos/mensajero.png'
import telegramIcon from '../../../Iconos/telegrama.png'
import webIcon from '../../../Iconos/web.png'
import whatsappIcon from '../../../Iconos/whatsapp.png'

type Platform = 'web' | 'whatsapp' | 'instagram' | 'telegram' | 'messenger'

type PlatformConfig = {
    id: Platform
    label: string
    status: string
    accent: string
    icon: StaticImageData
    activeClass: string
    headerClass: string
    screenClass: string
    shellClass: string
    receivedBubble: string
    sentBubble: string
    composerClass: string
    placeholder: string
}

const platforms: Record<Platform, PlatformConfig> = {
    web: {
        id: 'web',
        label: 'Web chat',
        status: 'Widget embebido',
        accent: '#00B4DB',
        icon: webIcon,
        activeClass: 'bg-[#00B4DB] text-white',
        headerClass: 'bg-white border-slate-200',
        screenClass: 'bg-white',
        shellClass: 'bg-white border-slate-200',
        receivedBubble: 'bg-slate-100 text-slate-950 rounded-2xl rounded-tl-md px-4 py-3 text-sm',
        sentBubble: 'bg-slate-950 text-white rounded-2xl rounded-tr-md px-4 py-3 text-sm',
        composerClass: 'bg-white border-slate-200',
        placeholder: 'Escribe desde la web...',
    },
    whatsapp: {
        id: 'whatsapp',
        label: 'WhatsApp',
        status: 'Cuenta de empresa',
        accent: '#25D366',
        icon: whatsappIcon,
        activeClass: 'bg-[#25D366] text-[#06130c]',
        headerClass: 'bg-[#111b21] border-[#2a3942]',
        screenClass: 'bg-[#0b141a]',
        shellClass: 'bg-[#111b21] border-[#2a3942]',
        receivedBubble: 'bg-[#202c33] text-[#e9edef] rounded-[9px] rounded-tl-sm px-2 py-1.5 text-[10.5px] shadow',
        sentBubble: 'bg-[#075e45] text-[#e9edef] rounded-[9px] rounded-tr-sm px-2 py-1.5 text-[10.5px] shadow',
        composerClass: 'bg-[#111b21] border-[#2a3942]',
        placeholder: 'Mensaje',
    },
    instagram: {
        id: 'instagram',
        label: 'Instagram DM',
        status: 'Activo ahora',
        accent: '#d62976',
        icon: instagramIcon,
        activeClass: 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white',
        headerClass: 'bg-black border-[#262626]',
        screenClass: 'bg-black',
        shellClass: 'bg-black border-[#262626]',
        receivedBubble: 'bg-[#262626] text-white rounded-[15px] px-2.5 py-1.5 text-[10.5px] font-semibold',
        sentBubble: 'bg-gradient-to-br from-[#405de6] via-[#833ab4] to-[#e1306c] text-white rounded-[15px] px-2.5 py-1.5 text-[10.5px] font-semibold',
        composerClass: 'bg-black border-[#262626]',
        placeholder: 'Enviar mensaje...',
    },
    telegram: {
        id: 'telegram',
        label: 'Telegram',
        status: 'bot',
        accent: '#229ED9',
        icon: telegramIcon,
        activeClass: 'bg-[#229ED9] text-white',
        headerClass: 'bg-[#1f2924] border-[#2f3b35]',
        screenClass: 'bg-[#101512]',
        shellClass: 'bg-[#17212b] border-[#253341]',
        receivedBubble: 'bg-[#222725] text-[#f5f5f5] rounded-[8px] rounded-tl-sm px-2 py-1.5 text-[10.5px]',
        sentBubble: 'bg-[#6ea38c] text-white rounded-[8px] rounded-tr-sm px-2 py-1.5 text-[10.5px]',
        composerClass: 'bg-[#17212b] border-[#253341]',
        placeholder: 'Mensaje',
    },
    messenger: {
        id: 'messenger',
        label: 'Messenger',
        status: 'Responde al instante',
        accent: '#0A7CFF',
        icon: messengerIcon,
        activeClass: 'bg-[#0A7CFF] text-white',
        headerClass: 'bg-black border-[#262626]',
        screenClass: 'bg-black',
        shellClass: 'bg-black border-[#262626]',
        receivedBubble: 'bg-[#303030] text-white rounded-[15px] rounded-tl-sm px-2.5 py-1.5 text-[10.5px]',
        sentBubble: 'bg-[#0A7CFF] text-white rounded-[15px] rounded-tr-sm px-2.5 py-1.5 text-[10.5px]',
        composerClass: 'bg-black border-[#262626]',
        placeholder: 'Mensaje',
    },
}

const quickReplies: Record<Platform, string[]> = {
    web: ['Ventas', 'Soporte', 'Agendar demo'],
    whatsapp: ['Catalogo', 'Horario', 'Soporte'],
    instagram: ['Ver perfil', 'Responder historia', 'Enviar producto'],
    telegram: ['/start', 'Menu', 'Ayuda'],
    messenger: ['Empezar', 'Ver opciones', 'Hablar con asesor'],
}

const platformNotes: Record<Platform, string> = {
    web: 'Sitio web realista con burbuja flotante, opcion de WhatsApp y chat web directo.',
    whatsapp: 'Proporcion movil, wallpaper oscuro, ticks y burbujas con escala cercana a WhatsApp.',
    instagram: 'DM oscuro con gradiente en mensajes enviados y barra inferior tipo Instagram.',
    telegram: 'Bot en modo oscuro con wallpaper, acciones de bot y burbujas compactas.',
    messenger: 'Chat negro con burbujas grises y azul Messenger, inspirado en la app movil.',
}

const now = () => new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })

function BotAvatar({ avatarUrl, botName, platform, size = 'md' }: { avatarUrl?: string, botName?: string, platform: Platform, size?: 'sm' | 'md' | 'lg' }) {
    const config = platforms[platform]
    const sizeClass = size === 'lg' ? 'h-20 w-20' : size === 'sm' ? 'h-6 w-6' : 'h-8 w-8'

    return (
        <div className={cn('relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border', sizeClass)} style={{ borderColor: `${config.accent}55`, backgroundColor: `${config.accent}22` }}>
            {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={botName || 'Bot'} className="h-full w-full object-cover" />
            ) : (
                <Bot className={cn(size === 'lg' ? 'h-9 w-9' : 'h-3.5 w-3.5')} style={{ color: config.accent }} />
            )}
            {platform !== 'web' && <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border border-black bg-emerald-400" />}
        </div>
    )
}

function ReadReceipt({ platform, isHistorical }: { platform: Platform, isHistorical?: boolean }) {
    const [read, setRead] = useState(Boolean(isHistorical))

    useEffect(() => {
        if (isHistorical) return
        const timer = setTimeout(() => setRead(true), 800)
        return () => clearTimeout(timer)
    }, [isHistorical])

    if (platform === 'instagram' || platform === 'messenger') return null

    return (
        <div className="flex items-center gap-1 text-[9px] text-white/45">
            <span>{now()}</span>
            <CheckCheck className={cn('h-3 w-3', read ? 'text-[#53bdeb]' : 'text-white/35')} />
        </div>
    )
}

function Wallpaper({ platform }: { platform: Platform }) {
    if (platform === 'whatsapp') {
        return (
            <div className="absolute inset-0 bg-[#061d19]">
                <div className="absolute inset-0 bg-[url('/whatsapp-wallpaper.jpg')] bg-cover bg-center opacity-95" />
                <div className="absolute inset-0 bg-[#03130f]/25" />
            </div>
        )
    }
    if (platform === 'telegram') {
        return (
            <div className="absolute inset-0 bg-[#07100d]">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.10)_1px,transparent_1px),radial-gradient(circle_at_22%_18%,rgba(255,255,255,0.09),transparent_13%),radial-gradient(circle_at_78%_64%,rgba(255,255,255,0.065),transparent_15%)] bg-[length:22px_22px,170px_170px,190px_190px] opacity-70" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,transparent_0_42px,rgba(255,255,255,0.05)_43px,transparent_45px)] bg-[length:120px_120px] opacity-45" />
            </div>
        )
    }
    if (platform === 'messenger' || platform === 'instagram') {
        return <div className="absolute inset-0 bg-black" />
    }
    return null
}

function Bubble({ message, platform, historicalIds, avatarUrl, botName, onImageClick, zoom = false }: {
    message: Message
    platform: Platform
    historicalIds: Set<string>
    avatarUrl?: string
    botName?: string
    onImageClick?: (url: string) => void
    zoom?: boolean
}) {
    const config = platforms[platform]
    const isUser = message.role === 'user'
    const bubbleClass = cn('min-w-0 max-w-full overflow-hidden', isUser ? config.sentBubble : config.receivedBubble, zoom && 'px-4 py-3 text-[15px]')

    const content = message.content.replace(/[*#]/g, '')
    const renderMessageContent = () => {
        const regex = /(!\[.*?\]\(.*?\))/g;
        const parts = content.split(regex);

        return parts.map((part, index) => {
            const imageMatch = part.match(/^!\[(.*?)\]\((.*?)\)$/);
            if (imageMatch) {
                return (
                    <button 
                        key={index} 
                        type="button" 
                        onClick={() => onImageClick?.(imageMatch[2])} 
                        className="mt-2 mb-1 block overflow-hidden rounded-xl border border-white/10 bg-black/20 p-1 text-left"
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imageMatch[2]} alt={imageMatch[1] || 'Imagen'} className="max-h-[240px] w-full rounded-lg object-contain" />
                    </button>
                );
            } else if (part.trim() !== '') {
                return (
                    <p key={index} className="min-w-0 whitespace-pre-wrap break-words leading-relaxed [overflow-wrap:anywhere] [word-break:break-word]">
                        {part}
                    </p>
                );
            }
            return null;
        });
    };

    return (
        <div className={cn('flex w-full gap-1.5', isUser ? 'justify-end' : 'justify-start')}>
            {!isUser && (platform === 'instagram' || platform === 'messenger' || platform === 'web') && (
                <BotAvatar avatarUrl={avatarUrl} botName={botName} platform={platform} size="sm" />
            )}
            <div className={cn('flex min-w-0 flex-col gap-0.5', zoom ? 'max-w-[88%]' : 'max-w-[82%]', isUser && 'items-end')}>
                <div className={bubbleClass}>
                    {renderMessageContent()}
                </div>
                {isUser && <ReadReceipt platform={platform} isHistorical={historicalIds.has(message.id)} />}
            </div>
        </div>
    )
}

function TypingBubble({ platform, avatarUrl, botName }: { platform: Platform, avatarUrl?: string, botName?: string }) {
    const config = platforms[platform]
    return (
        <div className="flex w-full justify-start gap-2">
            {(platform === 'instagram' || platform === 'messenger' || platform === 'web') && <BotAvatar avatarUrl={avatarUrl} botName={botName} platform={platform} size="sm" />}
            <div className={cn('flex min-w-[64px] items-center justify-center gap-1.5', config.receivedBubble)}>
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current opacity-50 [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current opacity-50 [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current opacity-50" />
            </div>
        </div>
    )
}

function EmptyState({ platform, avatarUrl, botName, zoom = false }: { platform: Platform, avatarUrl?: string, botName?: string, zoom?: boolean }) {
    if (zoom) {
        return <div className="flex min-h-[260px] items-center justify-center text-center text-sm font-semibold text-white/40">El acercamiento se actualiza cuando inicia la conversacion.</div>
    }

    if (platform === 'whatsapp') {
        return (
            <div className="mx-auto max-w-[280px] space-y-3 pt-4 text-center">
                <div className="rounded-lg bg-[#182229] px-3 py-2 text-[11px] leading-relaxed text-[#8696a0]">Los mensajes estan protegidos con cifrado de extremo a extremo.</div>
                <div className="rounded-xl border border-[#26343d] bg-[#111b21] p-5">
                    <BotAvatar avatarUrl={avatarUrl} botName={botName} platform={platform} size="lg" />
                    <h3 className="mt-3 text-base font-semibold text-[#e9edef]">{botName || 'Asesor Virtual'}</h3>
                    <p className="text-xs text-[#8696a0]">Cuenta de empresa</p>
                </div>
            </div>
        )
    }

    if (platform === 'messenger') {
        return (
            <div className="mx-auto mt-8 max-w-[280px] text-center">
                <BotAvatar avatarUrl={avatarUrl} botName={botName} platform={platform} size="lg" />
                <h3 className="mt-4 text-xl font-bold text-white">{botName || 'Asesor Virtual'}</h3>
                <p className="mt-1 text-xs text-[#9ca3af]">Pagina de Facebook · Negocio</p>
                <p className="text-xs text-[#9ca3af]">Normalmente responde al instante</p>
            </div>
        )
    }

    if (platform === 'instagram') {
        return (
            <div className="mx-auto mt-8 max-w-[280px] text-center">
                <BotAvatar avatarUrl={avatarUrl} botName={botName} platform={platform} size="lg" />
                <h3 className="mt-4 text-base font-semibold text-white">{botName || 'Asesor Virtual'}</h3>
                <p className="mt-1 text-xs text-[#8e8e8e]">Activo(a) ahora</p>
            </div>
        )
    }

    return (
        <div className="mx-auto mt-6 max-w-[280px] rounded-lg border border-white/10 bg-black/20 p-5 text-center">
            <BotAvatar avatarUrl={avatarUrl} botName={botName} platform={platform} size="lg" />
            <h3 className="mt-3 text-sm font-semibold text-white">Que puede hacer este bot?</h3>
            <p className="mt-2 text-[12px] leading-relaxed text-white/55">Este bot responde preguntas, guia procesos y usa comandos rapidos.</p>
        </div>
    )
}

function Stream({ platform, messages, historicalIds, isLoading, isTypingHuman, avatarUrl, botName, messagesEndRef, onImageClick, zoom = false }: {
    platform: Platform
    messages: Message[]
    historicalIds: Set<string>
    isLoading: boolean
    isTypingHuman: boolean
    avatarUrl?: string
    botName?: string
    messagesEndRef?: React.RefObject<HTMLDivElement | null>
    onImageClick?: (url: string) => void
    zoom?: boolean
}) {
    return (
        <div className={cn('relative z-10 space-y-2', zoom && 'space-y-3.5')}>
            {messages.length === 0 && <EmptyState platform={platform} avatarUrl={avatarUrl} botName={botName} zoom={zoom} />}
            {messages.map((message) => (
                <Bubble key={`${zoom ? 'z' : 'p'}-${message.id}`} message={message} platform={platform} historicalIds={historicalIds} avatarUrl={avatarUrl} botName={botName} onImageClick={onImageClick} zoom={zoom} />
            ))}
            {(isLoading || isTypingHuman) && <TypingBubble platform={platform} avatarUrl={avatarUrl} botName={botName} />}
            {messagesEndRef && <div ref={messagesEndRef} />}
        </div>
    )
}

function StatusBar({ platform }: { platform: Platform }) {
    return (
        <div className={cn('flex h-5 items-center justify-between px-3.5 text-[8.5px] font-bold', platform === 'whatsapp' ? 'text-[#e9edef]' : 'text-white')}>
            <span>{now()}</span>
            <div className="flex items-center gap-1">
                <span className="text-[8.5px]">5G</span>
                <span className="h-2 w-3.5 rounded-[3px] border border-current p-[1px]"><span className="block h-full w-2 rounded-[2px] bg-current" /></span>
            </div>
        </div>
    )
}

function MobileHeader({ platform, botName, avatarUrl }: { platform: Platform, botName?: string, avatarUrl?: string }) {
    const config = platforms[platform]
    return (
        <div className={cn('border-b', config.headerClass)}>
            <StatusBar platform={platform} />
            <div className="flex h-9 items-center justify-between px-2">
                <div className="flex min-w-0 items-center gap-1.5">
                    <ArrowLeft className="h-3.5 w-3.5 shrink-0 text-white" />
                    <BotAvatar avatarUrl={avatarUrl} botName={botName} platform={platform} size="sm" />
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <p className="truncate text-[10.5px] font-semibold text-white">{botName || (platform === 'instagram' ? 'Hugo Beltran' : 'Asesor Virtual')}</p>
                            {(platform === 'whatsapp' || platform === 'instagram') && <ShieldCheck className="h-2.5 w-2.5 shrink-0 text-sky-400" />}
                        </div>
                        <p className="truncate text-[8px] text-white/55">{config.status}</p>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 text-white">
                    {platform === 'instagram' && <><Phone className="h-3.5 w-3.5" /><Video className="h-3.5 w-3.5" /></>}
                    {platform === 'whatsapp' && <><Video className="h-3.5 w-3.5" /><Phone className="h-3.5 w-3.5" /><MoreVertical className="h-3.5 w-3.5" /></>}
                    {platform === 'telegram' && <><Search className="h-3.5 w-3.5" /><MoreVertical className="h-3.5 w-3.5" /></>}
                    {platform === 'messenger' && <><Phone className="h-3.5 w-3.5 text-[#0A7CFF]" /><Video className="h-3.5 w-3.5 text-[#0A7CFF]" /><Info className="h-3.5 w-3.5 text-[#0A7CFF]" /></>}
                </div>
            </div>
        </div>
    )
}

function Composer({ platform, input, isLoading, onChange, onSubmit }: {
    platform: Platform
    input: string
    isLoading: boolean
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
}) {
    const config = platforms[platform]
    return (
        <div className={cn('border-t px-2 py-2', config.composerClass)}>
            <div className="mb-1 flex gap-1.5 overflow-x-auto pb-1">
                {quickReplies[platform].map((reply) => <button key={reply} type="button" className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9.5px] font-semibold text-white/75">{reply}</button>)}
            </div>
            <form onSubmit={onSubmit} className="flex items-center gap-1.5">
                {platform === 'whatsapp' && <Smile className="h-4 w-4 shrink-0 text-[#8696a0]" />}
                {platform === 'instagram' && <Camera className="h-4 w-4 shrink-0 text-white" />}
                {platform === 'telegram' && <Menu className="h-4 w-4 shrink-0 text-[#8a9aae]" />}
                {platform === 'messenger' && <Plus className="h-4 w-4 shrink-0 text-[#0A7CFF]" />}
                <div className={cn('flex min-w-0 flex-1 items-center gap-1.5 rounded-full border px-2.5 py-1.5', platform === 'web' ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/[0.08]')}>
                    <input className={cn('min-w-0 flex-1 bg-transparent text-[11px] outline-none', platform === 'web' ? 'text-slate-950 placeholder:text-slate-400' : 'text-white placeholder:text-white/40')} value={input} placeholder={config.placeholder} onChange={onChange} disabled={isLoading} />
                    {(platform === 'whatsapp' || platform === 'telegram') && <Paperclip className="h-4 w-4 text-white/45" />}
                    {(platform === 'instagram' || platform === 'messenger') && <ImageIcon className="h-4 w-4 text-white/55" />}
                </div>
                <Button type="submit" aria-label="Enviar mensaje" title="Enviar mensaje" disabled={isLoading || !input?.trim()} className={cn('h-8 w-8 shrink-0 rounded-full p-0', platform === 'web' ? 'bg-[#00B4DB] hover:bg-[#26C7EA]' : '')}>
                    {input?.trim() ? <Send className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
            </form>
        </div>
    )
}

function WebPreview({ botName, avatarUrl, messages, historicalIds, input, isLoading, isTypingHuman, onChange, onSubmit, messagesEndRef, onImageClick, scrollRef }: {
    botName?: string
    avatarUrl?: string
    messages: Message[]
    historicalIds: Set<string>
    input: string
    isLoading: boolean
    isTypingHuman: boolean
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
    messagesEndRef: React.RefObject<HTMLDivElement | null>
    onImageClick?: (url: string) => void
    scrollRef?: React.RefObject<HTMLDivElement | null>
}) {
    const [open, setOpen] = useState(false)
    const [mode, setMode] = useState<'choice' | 'chat'>('choice')

    return (
        <div className="relative flex h-full min-h-[560px] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#f7f7f5] shadow-2xl">
            <div className="absolute left-0 right-0 top-0 z-10 flex h-11 items-center gap-3 border-b border-black/10 bg-[#3a1f28] px-4 text-white">
                <div className="flex gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" /><span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" /><span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" /></div>
                <div className="flex h-7 min-w-0 flex-1 items-center rounded-full bg-black/35 px-3 text-xs text-white/85">skylab-demo.com/servicios</div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col px-8 pb-8 pt-20 text-slate-950">
                <div className="mx-auto w-full max-w-5xl">
                    <h2 className="max-w-3xl text-4xl font-black leading-tight tracking-tight lg:text-5xl">Soluciones digitales con respuesta inmediata</h2>
                    <div className="mt-6 flex flex-wrap gap-3"><button type="button" className="rounded-full bg-slate-950 px-6 py-3 text-sm font-bold text-white">Servicios</button><button type="button" className="rounded-full border border-slate-300 px-6 py-3 text-sm font-bold">Soporte</button><button type="button" className="rounded-full border border-slate-300 px-6 py-3 text-sm font-bold">Contacto</button></div>
                    <div className="mt-10 grid gap-5 lg:grid-cols-2">
                        <div className="min-h-[300px] rounded-xl bg-[#dff2f1] p-8"><div className="mx-auto max-w-[360px] rounded-2xl bg-white p-6 shadow-xl"><div className="flex items-center justify-between rounded-full border border-slate-200 px-4 py-3 text-lg"><span>consulta-productos</span><Search className="h-5 w-5" /></div><div className="mt-6 space-y-3 text-lg"><p>consulta-productos<span className="font-black">.com</span></p><p className="text-slate-400">consulta-productos<span className="font-black">.shop</span></p><p className="text-slate-300">consulta-productos<span className="font-black">.store</span></p></div></div><h3 className="mt-12 text-3xl font-black">Atencion instantanea</h3><p className="mt-3 max-w-xl text-base leading-relaxed">El visitante abre el chat desde cualquier pagina y recibe respuesta del bot.</p></div>
                        <div className="min-h-[300px] rounded-xl bg-[#efeee9] p-8"><div className="h-28 w-full rounded-2xl bg-white/70 shadow-inner" /><h3 className="mt-20 text-3xl font-black">Widget integrado</h3><p className="mt-3 max-w-xl text-base leading-relaxed">Ideal para ventas, soporte, reservas y captura de datos.</p></div>
                    </div>
                </div>
            </div>

            {open && (
                <div className="absolute bottom-5 right-5 top-[86px] z-20 flex w-[min(430px,42%)] min-w-[360px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.25)]">
                    <div className="shrink-0 border-b border-slate-100 px-5 py-4">
                        <div className="flex items-start justify-between gap-4"><div><h3 className="text-lg font-black text-slate-950">Soporte</h3><p className="text-xs font-bold text-slate-500">Con tecnologia de Skylab</p></div><button type="button" onClick={() => setOpen(false)} className="text-slate-500"><X className="h-5 w-5" /></button></div>
                    </div>
                    <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.10),transparent_36%),#ffffff] px-5 py-5">
                        {mode === 'choice' && (
                            <div className="flex h-full flex-col justify-between">
                                <div className="pt-8"><p className="text-2xl font-medium text-slate-950">Hola!</p><p className="mt-3 text-3xl font-black leading-tight text-slate-950">Como prefieres contactar a <span className="text-[#8b5cf6]">{botName || 'nuestro equipo'}?</span></p></div>
                                <div className="space-y-3 pb-3">
                                    <a href="https://wa.me/" target="_blank" rel="noreferrer" className="flex w-full items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-left text-sm font-black text-emerald-700">
                                        Abrir WhatsApp
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={whatsappIcon.src} alt="" className="h-5 w-5 object-contain" />
                                    </a>
                                    <button type="button" onClick={() => setMode('chat')} className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-950 px-4 py-4 text-left text-sm font-black text-white">Escribir desde la web <Send className="h-5 w-5" /></button>
                                </div>
                            </div>
                        )}
                        {mode === 'chat' && messages.length === 0 && <div className="pt-8"><p className="text-2xl font-medium text-slate-950">Hola!</p><p className="mt-3 text-3xl font-black leading-tight text-slate-950">Puedo ayudarte con <span className="text-[#8b5cf6]">ventas, soporte o reservas.</span></p></div>}
                        {mode === 'chat' && <Stream platform="web" messages={messages} historicalIds={historicalIds} isLoading={isLoading} isTypingHuman={isTypingHuman} avatarUrl={avatarUrl} botName={botName} messagesEndRef={messagesEndRef} onImageClick={onImageClick} />}
                    </div>
                    {mode === 'chat' && <Composer platform="web" input={input} isLoading={isLoading} onChange={onChange} onSubmit={onSubmit} />}
                </div>
            )}

            <button type="button" onClick={() => { setOpen(true); setMode('choice') }} className={cn('absolute bottom-6 right-6 z-20 flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-950 shadow-2xl transition-all hover:scale-105', open && 'scale-0 opacity-0')}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={webIcon.src} alt="" className="h-8 w-8 object-contain" />
            </button>
        </div>
    )
}

interface BotChatProps {
    bots: any[]
}

export function BotChat({ bots }: BotChatProps) {
    const [selectedBotId, setSelectedBotId] = useState<string>(bots.length > 0 ? bots[0].id : '')
    const [historicalIds, setHistoricalIds] = useState<Set<string>>(new Set())
    const [isResetting, setIsResetting] = useState(false)
    const [fullscreenImage, setFullscreenImage] = useState<string | null>(null)
    const [platform, setPlatform] = useState<Platform>('web')
    const [isTypingHuman, setIsTypingHuman] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const phoneScrollRef = useRef<HTMLDivElement>(null)
    const zoomScrollRef = useRef<HTMLDivElement>(null)
    const webScrollRef = useRef<HTMLDivElement>(null)
    const syncSourceRef = useRef<'phone' | 'zoom' | null>(null)
    const selectedBot = bots.find(b => b.id === selectedBotId)
    const config = platforms[platform]

    const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
        api: '/api/chat',
        body: {
            systemPrompt: selectedBot?.system_prompt || 'Eres un asistente virtual util y profesional.',
            botId: selectedBot?.id
        },
        fetch: async (url, init) => {
            const res = await fetch(url, init)
            const contentType = res.headers.get('content-type')
            if (contentType?.includes('application/json')) {
                const data = await res.clone().json()
                if (data.fragments?.length) processFragments(data.fragments)
                else if (data.text) processFragments([{ text: data.text, delayMs: 100, typingMs: 500 }])
                return new Response(new ReadableStream({ start(controller) { controller.close() } }), { headers: { 'Content-Type': 'text/plain' } })
            }
            return res
        },
        onError: (error: Error) => alert('Error: ' + error.message)
    })

    const scrollElementToBottom = (element: HTMLDivElement | null, behavior: ScrollBehavior = 'smooth') => {
        if (!element) return
        element.scrollTo({ top: element.scrollHeight, behavior })
    }

    const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
        setTimeout(() => {
            scrollElementToBottom(phoneScrollRef.current, behavior)
            scrollElementToBottom(zoomScrollRef.current, behavior)
            scrollElementToBottom(webScrollRef.current, behavior)
            messagesEndRef.current?.scrollIntoView({ behavior })
        }, 50)
    }, [])

    const syncScroll = (sourceName: 'phone' | 'zoom', source: HTMLDivElement | null, target: HTMLDivElement | null) => {
        if (!source || !target || syncSourceRef.current) return

        const sourceMax = source.scrollHeight - source.clientHeight
        const targetMax = target.scrollHeight - target.clientHeight
        if (sourceMax <= 0 || targetMax <= 0) return

        syncSourceRef.current = sourceName
        const ratio = source.scrollTop / sourceMax
        target.scrollTop = ratio * targetMax

        window.requestAnimationFrame(() => {
            syncSourceRef.current = null
        })
    }

    const handlePhoneScroll = (event: React.UIEvent<HTMLDivElement>) => {
        if (syncSourceRef.current === 'zoom') return
        syncScroll('phone', event.currentTarget, zoomScrollRef.current)
    }

    const handleZoomScroll = (event: React.UIEvent<HTMLDivElement>) => {
        if (syncSourceRef.current === 'phone') return
        syncScroll('zoom', event.currentTarget, phoneScrollRef.current)
    }

    const processFragments = async (fragments: any[]) => {
        setIsTypingHuman(true)
        for (let i = 0; i < fragments.length; i++) {
            const fragment = fragments[i]
            scrollToBottom()
            await new Promise(r => setTimeout(r, fragment.delayMs))
            await new Promise(r => setTimeout(r, fragment.typingMs))
            setMessages((prev: Message[]) => [...prev, { id: `frag-${Date.now()}-${i}`, role: 'assistant', content: fragment.text } as Message])
            if (i === fragments.length - 1) setIsTypingHuman(false)
            scrollToBottom()
        }
    }

    useEffect(() => {
        scrollToBottom()
        // Keep this dependency list stable for React Fast Refresh in dev.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages, isTypingHuman, platform])

    useEffect(() => {
        let mounted = true
        async function loadHistory() {
            if (!selectedBotId) return
            const { messages: history } = await getTestConversationMessages(selectedBotId)
            if (mounted && history) {
                setHistoricalIds(new Set(history.map((m: any) => m.id)))
                setMessages(history as Message[])
            }
        }
        loadHistory()
        return () => { mounted = false }
    }, [selectedBotId, setMessages])

    const handleBotChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedBotId(e.target.value)
        setMessages([])
    }

    const handleResetConversation = async () => {
        if (!selectedBotId || isResetting) return
        if (!confirm('Estas seguro de que quieres borrar el historial de esta conversacion de prueba?')) return
        setIsResetting(true)
        try {
            const result = await resetTestConversation(selectedBotId)
            if (result.success) {
                setMessages([])
                setHistoricalIds(new Set())
            }
        } finally {
            setIsResetting(false)
        }
    }

    return (
        <div className="relative z-10 grid h-full min-h-[560px] grid-cols-1 overflow-hidden rounded-2xl border border-white/10 bg-[#070B12] shadow-2xl lg:grid-cols-[260px_1fr]">
            <aside className="flex min-h-0 flex-col border-b border-white/10 bg-[#0B0F17] p-4 lg:border-b-0 lg:border-r">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00B4DB] text-white shadow-lg shadow-[#00B4DB]/20"><Zap className="h-5 w-5" /></div><div><h2 className="text-sm font-bold text-white">Omni-Tester</h2><p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Live virtualizer</p></div></div>
                    <Button variant="ghost" size="icon" aria-label="Limpiar historial" title="Limpiar historial" className="h-8 w-8 text-[#7E8A9C] hover:text-red-400" onClick={handleResetConversation} disabled={isResetting || messages.length === 0}>{isResetting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}</Button>
                </div>
                <div className="mt-4 shrink-0"><label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-[#7E8A9C]">Bot activo</label><select aria-label="Seleccionar Bot" title="Seleccionar Bot" className="w-full rounded-lg border border-white/10 bg-[#111722] px-3 py-2 text-xs font-bold text-white outline-none" value={selectedBotId} onChange={handleBotChange}>{bots.length === 0 && <option value="">SIN BOTS</option>}{bots.map(b => <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>)}</select></div>
                <div className="mt-5 shrink-0 space-y-2"><p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#7E8A9C]">Simuladores</p>{(Object.values(platforms) as PlatformConfig[]).map((item) => {
                    return (
                        <button key={item.id} onClick={() => setPlatform(item.id)} type="button" className={cn('flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all', platform === item.id ? 'border-white/20 bg-white/[0.07] text-white' : 'border-white/5 bg-white/[0.02] text-[#A6B3C4] hover:border-white/10 hover:bg-white/[0.05] hover:text-white')}>
                            <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg border', platform === item.id ? 'border-white/15 bg-white text-slate-950 shadow-sm' : 'border-white/5 bg-white/[0.05] opacity-70')}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={item.icon.src} alt="" className="h-5 w-5 object-contain" />
                            </span>
                            <span className="min-w-0 flex-1"><span className="block text-[13px] font-bold">{item.label}</span><span className="block truncate text-[11px] text-current/55">{item.status}</span></span>
                        </button>
                    )
                })}</div>
                <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-3"><div className="mb-2 flex items-center gap-2 text-xs font-bold text-white"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: config.accent }} />Detalle del canal</div><p className="text-[11px] leading-relaxed text-[#A6B3C4]">{platformNotes[platform]}</p></div>
            </aside>

            <section className="flex min-h-0 min-w-0 flex-col bg-[radial-gradient(circle_at_top,rgba(0,180,219,0.10),transparent_34%),#070B12] p-3 lg:p-5">
                <div className="mb-3 flex shrink-0 flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#7E8A9C]">Preview inmersivo</p><h3 className="mt-0.5 text-xl font-black tracking-tight text-white">{config.label}</h3></div><div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-[#A6B3C4]"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />Probando como usuario final</div></div>
                <div className="flex min-h-0 flex-1 items-center justify-center">
                    {platform === 'web' ? (
                        <WebPreview botName={selectedBot?.name} avatarUrl={selectedBot?.avatar_url} messages={messages} historicalIds={historicalIds} input={input} isLoading={isLoading} isTypingHuman={isTypingHuman} onChange={handleInputChange} onSubmit={handleSubmit} messagesEndRef={messagesEndRef} onImageClick={setFullscreenImage} scrollRef={webScrollRef} />
                    ) : (
                        <div className="grid h-full min-h-0 w-full grid-cols-1 items-center gap-5 xl:grid-cols-[minmax(240px,310px)_minmax(560px,1fr)]">
                            <div className="flex h-full min-h-0 items-center justify-center">
                                <div className="relative h-[88%] max-h-[700px] min-h-[500px] aspect-[9/19.5] max-w-[310px] rounded-[36px] bg-[#050505] p-1.5 shadow-[0_30px_90px_rgba(0,0,0,0.55),inset_0_0_0_1px_rgba(255,255,255,0.10)]">
                                    <div className="pointer-events-none absolute -left-1 top-24 h-14 w-1 rounded-full bg-white/10" />
                                    <div className="pointer-events-none absolute -right-1 top-32 h-20 w-1 rounded-full bg-white/10" />
                                    <div className="pointer-events-none absolute inset-1 rounded-[36px] border border-white/10" />
                                    <div className={cn('relative flex h-full flex-col overflow-hidden rounded-[30px] border border-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]', config.shellClass)}>
                                        <div className="pointer-events-none absolute left-1/2 top-2 z-30 h-3.5 w-20 -translate-x-1/2 rounded-full bg-black/80 shadow-[0_1px_8px_rgba(255,255,255,0.10)]" />
                                        <MobileHeader platform={platform} botName={selectedBot?.name} avatarUrl={selectedBot?.avatar_url} />
                                        <div className={cn('relative min-h-0 flex-1 overflow-hidden', config.screenClass)}>
                                            <Wallpaper platform={platform} />
                                            <div ref={phoneScrollRef} onScroll={handlePhoneScroll} className="relative z-10 h-full overflow-y-auto px-1.5 py-1.5">
                                                <Stream platform={platform} messages={messages} historicalIds={historicalIds} isLoading={isLoading} isTypingHuman={isTypingHuman} avatarUrl={selectedBot?.avatar_url} botName={selectedBot?.name} messagesEndRef={messagesEndRef} onImageClick={setFullscreenImage} />
                                            </div>
                                        </div>
                                        <Composer platform={platform} input={input} isLoading={isLoading} onChange={handleInputChange} onSubmit={handleSubmit} />
                                        <div className="pointer-events-none absolute bottom-1.5 left-1/2 z-30 h-1 w-24 -translate-x-1/2 rounded-full bg-white/65" />
                                    </div>
                                </div>
                            </div>
                            <div className="hidden h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/35 shadow-2xl xl:flex">
                                <div className={cn('shrink-0 border-b px-5 py-4', config.headerClass)}><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/45">Acercamiento sincronizado</p><h4 className="mt-1 text-xl font-black text-white">{config.label}</h4></div><div className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/65">Lectura ampliada</div></div></div>
                                <div className={cn('relative min-h-0 flex-1 overflow-hidden', config.screenClass)}>
                                    <Wallpaper platform={platform} />
                                    <div ref={zoomScrollRef} onScroll={handleZoomScroll} className="relative z-10 h-full overflow-y-auto px-5 py-5">
                                        <Stream platform={platform} messages={messages} historicalIds={historicalIds} isLoading={isLoading} isTypingHuman={isTypingHuman} avatarUrl={selectedBot?.avatar_url} botName={selectedBot?.name} onImageClick={setFullscreenImage} zoom />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {fullscreenImage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-xl" onClick={() => setFullscreenImage(null)}>
                    <button aria-label="Cerrar imagen" title="Cerrar imagen" onClick={() => setFullscreenImage(null)} className="absolute right-6 top-6 rounded-full bg-white/10 p-3 text-white hover:bg-white/20">
                        <X className="h-6 w-6" />
                    </button>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={fullscreenImage} alt="Zoom" className="max-h-full max-w-full rounded-xl object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
                </div>
            )}
        </div>
    )
}
