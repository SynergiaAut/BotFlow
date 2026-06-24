/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Plus, Bot, Sparkles, UploadCloud, Link as LinkIcon, FileText, Database, X, ShoppingBag, ImageIcon, Loader2, Globe, Tag, ShieldCheck, TrendingUp, Cpu, Zap, Command, Trash2, Clock, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { getKnowledgeStats } from '@/app/actions/knowledge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { extractTextFromPdf } from '@/utils/pdf-extractor'
import CatalogGrid from '@/components/knowledge/CatalogGrid'

type TabValue = 'text' | 'web' | 'pdf' | 'catalog';

export default function KnowledgeBasePage() {
    const [activeTab, setActiveTab] = useState<TabValue>('text')
    const [selectedBot, setSelectedBot] = useState<string>('all')
    const [stats, setStats] = useState({ textDocs: 0, webDocs: 0, products: 0, totalVectors: 0 })
    const [showSecurityBanner, setShowSecurityBanner] = useState<boolean>(true)

    useEffect(() => {
        const stored = localStorage.getItem('skylab_security_banner_dismissed')
        if (stored === 'true') {
            setShowSecurityBanner(false)
        }
    }, [])

    const dismissBanner = () => {
        setShowSecurityBanner(false)
        localStorage.setItem('skylab_security_banner_dismissed', 'true')
    }

    const fetchStats = useCallback(async () => {
        const res = await getKnowledgeStats(selectedBot)
        if (res.success) {
            setStats({
                textDocs: res.textDocs || 0,
                webDocs: res.webDocs || 0,
                products: res.products || 0,
                totalVectors: res.totalVectors || 0
            })
        }
    }, [selectedBot])

    useEffect(() => {
        fetchStats()
    }, [fetchStats])

    return (
        <div className="flex-1 overflow-y-auto bg-background p-8 md:p-12 relative">
            {/* Background elements - Orbital atmosphere */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00B4DB]/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-sky-500/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto space-y-12 relative z-10">
                {/* Header Section - Modern Skylab Style */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 border-b border-white/10 pb-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#00B4DB]/10 border border-[#00B4DB]/20 rounded-full text-[#00B4DB] text-[10px] font-black uppercase tracking-widest">
                            <Database className="w-3 h-3 animate-pulse" /> Bóveda de Conocimiento
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter font-display">
                            Cerebro de Datos
                        </h1>
                        <p className="text-[#A6B3C4] font-medium max-w-xl leading-relaxed">
                            Alimenta a tu asistente con información clave del negocio desde archivos PDF, sitios web o textos estructurados.
                        </p>
                    </div>
                    <div className="flex items-center gap-4 w-full lg:w-auto">
                        <select
                            aria-label="Seleccionar Bot"
                            title="Seleccionar Bot"
                            className="h-11 bg-[#0B0F17] border border-white/10 rounded-xl px-4 text-[12px] font-bold uppercase tracking-widest text-[#A6B3C4] hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-[#00B4DB]/20 transition-all cursor-pointer"
                            value={selectedBot}
                            onChange={(e) => setSelectedBot(e.target.value)}
                        >
                            <option value="all">Global</option>
                            <option value="current">Bot Activo</option>
                        </select>
                        <Button className="bg-[#00B4DB] hover:bg-[#26C7EA] text-white rounded-xl px-5 font-bold text-[13px] h-11 shadow-sm transition-all focus:ring-4 focus:ring-[#00B4DB]/20">
                            <Sparkles className="w-4 h-4 mr-2" /> Re-Entrenar
                        </Button>
                    </div>
                </div>

                {showSecurityBanner && (
                    <div className="bg-gradient-to-r from-blue-950/20 via-indigo-950/15 to-transparent border border-blue-500/20 rounded-[28px] p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start justify-between relative overflow-hidden group shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-500 mx-2">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none" />
                        <div className="absolute bottom-0 left-1/3 w-24 h-24 bg-indigo-500/5 blur-[40px] rounded-full pointer-events-none" />
                        
                        <div className="flex gap-5 items-start relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-[#00B4DB]/10 border border-[#00B4DB]/20 flex items-center justify-center text-[#00B4DB] shrink-0 shadow-lg shadow-[#00B4DB]/5 group-hover:scale-105 transition-transform duration-500">
                                <ShieldCheck className="w-6 h-6 animate-pulse" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                                    Seguridad & Confidencialidad del Cerebro IA
                                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Aislado con RLS</span>
                                </h3>
                                <p className="text-sm font-medium text-slate-300 max-w-3xl leading-relaxed">
                                    Toda la información que subas se procesa y encapsula de forma privada e independiente por cada negocio (Tenant) de acuerdo con el <strong>Artículo 4 de la Constitución de Synerg-IA</strong>.
                                </p>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-[#A6B3C4] font-medium pt-2">
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#00B4DB] shrink-0" />
                                        <span><strong>Procesamiento Seguro:</strong> Usamos APIs dedicadas de Gemini. Tus datos no entrenan modelos públicos.</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#00B4DB] shrink-0" />
                                        <span><strong>Buenas Prácticas:</strong> Sube guías, catálogos y FAQs. Evita contraseñas o tokens sensibles.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        
                        <button 
                            onClick={dismissBanner}
                            className="p-2 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10 text-slate-500 hover:text-white transition-all self-start relative z-10 cursor-pointer"
                            title="Cerrar aviso"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}

            <div className="space-y-6 relative z-10">

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    {/* Left Column: Form Section */}
                    <div className="xl:col-span-7 space-y-6">
                        {/* Tab Selector Capsule */}
                        <div className="bg-[#0B0F17] p-1.5 rounded-[20px] border border-white/10 shadow-sm flex gap-1 mx-2">
                            <TabButton active={activeTab === 'text'} onClick={() => setActiveTab('text')} icon={<FileText className="w-4 h-4" />} label="Texto Puro" />
                            <TabButton active={activeTab === 'web'} onClick={() => setActiveTab('web')} icon={<Globe className="w-4 h-4" />} label="Web Scraper" />
                            <TabButton active={activeTab === 'pdf'} onClick={() => setActiveTab('pdf')} icon={<UploadCloud className="w-4 h-4" />} label="Archivos PDF" />
                            <TabButton active={activeTab === 'catalog'} onClick={() => setActiveTab('catalog')} icon={<ShoppingBag className="w-4 h-4" />} label="Catálogos" />
                        </div>

                        {/* Active Form Surface */}
                        <div className="bg-[#0B0F17] border border-white/10 rounded-[24px] p-6 lg:p-8 shadow-sm transition-all relative overflow-hidden group">

                            {activeTab === 'text' && <TextIngestForm selectedBot={selectedBot} onRefresh={fetchStats} />}
                            {activeTab === 'web' && <WebScraperForm selectedBot={selectedBot} onRefresh={fetchStats} />}
                            {activeTab === 'pdf' && <PdfUploadForm selectedBot={selectedBot} onRefresh={fetchStats} />}
                            {activeTab === 'catalog' && <CatalogGrid botId={selectedBot} onRefresh={fetchStats} />}
                        </div>
                    </div>

                    {/* Right Column: Intelligence Stats */}
                    <div className="xl:col-span-5 flex flex-col gap-6">
                        <div className="bg-[#0a0a0a] rounded-[24px] p-6 lg:p-8 text-white relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-[#00B4DB]/10 blur-[60px] rounded-full pointer-events-none" />

                            <h3 className="text-[12px] font-bold text-blue-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                                <Zap className="w-4 h-4" /> Diagnóstico Vectorial
                            </h3>

                            <div className="space-y-6 relative z-10">
                                <MetricItem label="Documentos Base" value={stats.textDocs.toString()} icon={<FileText className="w-5 h-5 text-blue-400" />} color="blue" />
                                <MetricItem label="Páginas Scraped" value={stats.webDocs.toString()} icon={<Globe className="w-5 h-5 text-emerald-400" />} color="emerald" />
                                <MetricItem label="Productos Visuales" value={stats.products.toString()} icon={<ShoppingBag className="w-5 h-5 text-amber-400" />} color="amber" />
                                <div className="pt-6 border-t border-white/10">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[11px] font-bold text-[#7E8A9C] uppercase tracking-widest leading-none mb-1">Carga total</p>
                                            <h4 className="text-4xl font-extrabold text-blue-400 tracking-tighter">{stats.totalVectors} <span className="text-xs text-[#A6B3C4] font-bold uppercase ml-1">Vectores</span></h4>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity Mini-Card */}
                        <div className="bg-[#0B0F17] border border-white/10 rounded-[24px] p-6 shadow-sm relative overflow-hidden group min-h-[250px] flex flex-col">
                            
                            <h3 className="text-[12px] font-bold text-[#7E8A9C] uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-[#7E8A9C]" /> Kernel Activity
                            </h3>
                            
                            {stats.totalVectors === 0 ? (
                                <div className="flex flex-col items-center justify-center flex-1 opacity-40 gap-4">
                                    <Database className="w-10 h-10 text-[#7E8A9C]" />
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-center text-[#A6B3C4]">Sin Datos Recientes<br/>Registra conocimiento</p>
                                </div>
                            ) : (
                                <div className="space-y-1 relative z-10">
                                    <ActivityRow label="Reglas de Negocio" type="RAG Source" time="Hace 2 min" />
                                    <ActivityRow label="Guia_2026.pdf" type="Vision Set" time="Hace 15 min" />
                                    <ActivityRow label="Web: synergia.ia" type="Web Scrape" time="Hace 1 h" />
                                </div>
                            )}

                            <div className="mt-8 p-5 bg-[#0B0F17]/[0.05] rounded-[16px] border border-blue-100 group-hover:bg-blue-100/50 transition-colors cursor-pointer">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-[11px] font-bold text-blue-700 uppercase tracking-widest">Optimización</h4>
                                    <ChevronRight className="w-4 h-4 text-blue-400" />
                                </div>
                                <p className="text-[13px] font-semibold text-blue-900 leading-tight">Fragmentación recomendada para mejorar el recall.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </div>
    )
}

function TabButton({ active, icon, label, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-6 rounded-[16px] transition-all duration-300 ${active
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-transparent text-[#A6B3C4] hover:text-white hover:bg-[#0B0F17]'
                }`}
        >
            <span className={active ? 'scale-110' : 'opacity-80'}>{icon}</span>
            <span className="text-[12px] font-bold tracking-wide">{label}</span>
        </button>
    )
}

const MetricItem = ({ label, value, icon, color }: any) => {
    const tones: any = {
        blue: "text-blue-400 bg-[#00B4DB]/10 border-[#00B4DB]/20",
        emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    }
    return (
        <div className="group relative bg-[#0B0F17] border border-white/10 p-5 rounded-[20px] flex items-center justify-between transition-all hover:bg-white/10 hover:-translate-y-1 overflow-hidden">
            <div className="space-y-1">
                <p className="text-[11px] font-bold text-[#7E8A9C] uppercase tracking-widest">{label}</p>
                <h3 className="text-3xl font-extrabold text-white tracking-tight">{value}</h3>
            </div>
            <div className={cn("w-12 h-12 rounded-[14px] flex items-center justify-center border transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3", tones[color || 'blue'])}>
                {icon}
            </div>
        </div>
    )
}

function ActivityRow({ label, time, type }: any) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-white/10 last:border-0 group cursor-pointer hover:bg-[#0B0F17] px-3 rounded-xl transition-colors">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-[12px] bg-[#0B0F17] border border-white/10 flex items-center justify-center text-[#A6B3C4] group-hover:bg-[#0B0F17]/[0.05] group-hover:text-[#00B4DB] transition-colors">
                    <Clock className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-white group-hover:text-[#00B4DB] transition-colors truncate max-w-[150px]">{label}</span>
                    <span className="text-[11px] font-semibold text-[#A6B3C4]">{type || 'Kernel'}</span>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-[#7E8A9C] uppercase tracking-widest">{time}</span>
            </div>
        </div>
    )
}

function TextIngestForm({ selectedBot, onRefresh }: any) {
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(false)

    const handleIngest = async () => {
        if (!title.trim() || !content.trim()) return toast.error('Completar campos.')
        setLoading(true)
        try {
            const res = await fetch('/api/ingest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, content, type: 'text', botId: selectedBot }) })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            toast.success(`Capturado: ${data.chunksProcessed} vectores creados.`)
            setTitle(''); setContent(''); if (onRefresh) onRefresh()
        } catch (err: any) { toast.error(err.message) } finally { setLoading(false) }
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="space-y-2">
                <label className="text-[12px] font-bold text-[#A6B3C4] ml-1">Título de Referencia</label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Protocolo de Entregas 2026" className="bg-[#0B0F17] border-white/10 h-11 rounded-xl px-4 text-sm font-semibold focus-visible:ring-[#00B4DB]/20 focus-visible:border-[#00B4DB]/70/20 focus-visible:border-[#00B4DB] transition-all" />
            </div>
            <div className="space-y-2">
                <label className="text-[12px] font-bold text-[#A6B3C4] ml-1">Conocimiento Puro</label>
                <textarea value={content} onChange={e => setContent(e.target.value)} rows={6} placeholder="Pega aquí el muro de texto para el entrenamiento..." className="w-full bg-[#0B0F17] border border-white/10 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#00B4DB]/20 focus:border-[#00B4DB] transition-all resize-none shadow-sm" />
            </div>
            <Button onClick={handleIngest} disabled={loading} className="w-full bg-[#00B4DB] hover:bg-[#26C7EA] text-white h-11 rounded-xl font-bold text-[13px] tracking-wide shadow-sm transition-all focus:ring-4 focus:ring-[#00B4DB]/20 active:scale-95">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                {loading ? 'Sincronizando...' : 'Inyectar Conocimiento'}
            </Button>
        </div>
    )
}

function WebScraperForm({ selectedBot, onRefresh }: any) {
    const [url, setUrl] = useState('')
    const [loading, setLoading] = useState(false)

    const handleScrape = async () => {
        if (!url.startsWith('http')) return toast.error('URL Inválida')
        setLoading(true)
        try {
            const res = await fetch('/api/ingest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: url, content: url, type: 'web', botId: selectedBot }) })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            toast.success(`URL Analizada. ${data.chunksProcessed} vectores.`)
            setUrl(''); if (onRefresh) onRefresh()
        } catch (err: any) { toast.error(err.message) } finally { setLoading(false) }
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="p-8 lg:p-12 border-2 border-dashed border-white/10 rounded-[24px] bg-[#0B0F17] flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-[#0B0F17] rounded-[16px] shadow-sm flex items-center justify-center border border-white/10 mb-6">
                    <Globe className={`w-8 h-8 ${loading ? 'animate-spin text-[#00B4DB]' : 'text-[#00B4DB]'}`} />
                </div>
                <h3 className="text-xl font-extrabold text-white tracking-tight mb-4">Rasterizador de Dominios</h3>
                <div className="flex w-full max-w-md gap-2">
                    <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://tuempresa.com" className="flex-1 bg-[#0B0F17] border-white/10 h-11 rounded-xl px-4 font-semibold shadow-sm focus-visible:ring-[#00B4DB]/20 focus-visible:border-[#00B4DB]/70/20 focus-visible:border-[#00B4DB]" />
                    <Button onClick={handleScrape} disabled={loading} className="bg-[#00B4DB] hover:bg-[#26C7EA] text-white rounded-xl px-6 h-11 font-bold shadow-sm active:scale-95 transition-all">
                        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <span className="flex items-center gap-2">Explorar <ChevronRight className="w-4 h-4" /></span>}
                    </Button>
                </div>
                <p className="text-[11px] font-bold text-[#A6B3C4] tracking-wide mt-4">Protocolo de Limpieza HTML Activado</p>
            </div>
        </div>
    )
}

function PdfUploadForm({ selectedBot, onRefresh }: any) {
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleUpload = async () => {
        if (!file) return
        setLoading(true)
        try {
            toast('Intentando extraer texto localmente...')
            const extractedText = await extractTextFromPdf(file)
            
            if (extractedText && extractedText.length >= 100) {
                toast('Texto extraído con éxito localmente. Sincronizando...')
                const res = await fetch('/api/ingest', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: file.name,
                        content: extractedText,
                        type: 'text',
                        botId: selectedBot
                    })
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data.error || 'Error al guardar el texto del PDF')
                toast.success(`PDF Sincronizado localmente. ${data.chunksProcessed} vectores creados.`)
            } else {
                toast('Procesando PDF en el servidor...')
                const formData = new FormData()
                formData.append('file', file)
                formData.append('botId', selectedBot)
                
                const res = await fetch('/api/ingest/pdf', {
                    method: 'POST',
                    body: formData
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data.error || 'Error en servidor al procesar el PDF')
                toast.success(`PDF Sincronizado en el servidor. ${data.chunksProcessed} vectores creados.`)
            }
            setFile(null)
            if (onRefresh) onRefresh()
        } catch (err: any) {
            console.error('[PDF-UPLOAD] Error:', err)
            toast.error(err.message || 'Error al procesar el archivo PDF')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={e => e.target.files && setFile(e.target.files[0])} />
            <div onClick={() => !loading && fileInputRef.current?.click()} className={`p-8 lg:p-12 border-2 border-dashed rounded-[24px] cursor-pointer transition-all flex flex-col items-center ${file ? 'border-[#00B4DB] bg-[#0B0F17]/[0.05]/50' : 'border-slate-300 bg-[#0B0F17] hover:border-blue-400'}`}>
                <div className="w-16 h-16 bg-[#0B0F17] rounded-[16px] flex items-center justify-center mb-6 shadow-sm border border-white/10">
                    {loading ? <Loader2 className="w-8 h-8 animate-spin text-[#00B4DB]" /> : <FileText className={`w-8 h-8 ${file ? 'text-[#00B4DB]' : 'text-[#7E8A9C]'}`} />}
                </div>
                <h3 className="text-xl font-extrabold text-white tracking-tight">{file ? file.name : 'Subir Documento (PDF)'}</h3>
                {file && !loading && (
                    <Button onClick={e => { e.stopPropagation(); handleUpload() }} className="mt-6 w-full lg:w-max bg-[#00B4DB] hover:bg-[#26C7EA] text-white px-8 h-11 rounded-xl font-bold text-[13px] shadow-sm transform active:scale-95 transition-all">
                        Iniciar Mapeo
                    </Button>
                )}
            </div>
        </div>
    )
}


