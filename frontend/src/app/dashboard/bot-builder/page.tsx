'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';
import {
    Sparkles,
    Palette,
    Save,
    Smartphone,
    Bot,
    Zap,
    CheckCircle2,
    Cpu,
    Fingerprint,
    Layers,
    Dna,
    Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const TONES = [
    { id: 'paisa', name: 'Paisa (Cálido)', description: 'Amable, cercano, usa regionalismos.', flavor: '¡Qué nota saludarlo, mor! ¿En qué le ayudo pues?' },
    { id: 'friendly', name: 'Amigable', description: 'Cercano y entusiasta.', flavor: '¡Hola! Qué gusto saludarte hoy. ✨' },
    { id: 'formal', name: 'Formal', description: 'Profesional y ejecutivo.', flavor: 'Buen día. ¿Cómo puedo asistirle en su requerimiento?' },
    { id: 'expert', name: 'Experto', description: 'Técnico y altamente capacitado.', flavor: 'Procesando consulta... La solución optimizada es la siguiente.' },
];

export default function BotBuilderPage() {
    const [isSaving, setIsSaving] = useState(false);
    const [config, setConfig] = useState({
        name: 'Skylab Assistant',
        tone: 'paisa',
        emojis: 'high',
        prompt: 'Eres un asistente experto en...',
        avatarUrl: '',
        color_theme: '#4f46e5',
        human_level: 80,
        humanization_enabled: true,
        split_messages: true,
        words_per_minute: 60,
        max_chars_per_fragment: 180
    });

    const supabase = createClient();
    const [botId, setBotId] = useState<string | null>(null);

    useEffect(() => {
        const loadBotData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                const { data: roles } = await supabase
                    .from('user_roles')
                    .select('tenant_id')
                    .eq('user_id', user.id)
                    .maybeSingle()

                if (roles?.tenant_id) {
                    const { data: bot } = await supabase
                        .from('bots')
                        .select('*')
                        .eq('tenant_id', roles.tenant_id)
                        .maybeSingle()

                    if (bot) {
                        setBotId(bot.id);
                        setConfig({
                            name: bot.name || 'Skylab Assistant',
                            tone: bot.personality || 'friendly',
                            emojis: 'high',
                            prompt: bot.system_prompt || 'Eres un asistente...',
                            avatarUrl: bot.avatar_url || '',
                            color_theme: bot.color_theme || '#4f46e5',
                            human_level: 80,
                            humanization_enabled: bot.humanization_enabled ?? true,
                            split_messages: bot.split_messages ?? true,
                            words_per_minute: bot.words_per_minute || 60,
                            max_chars_per_fragment: bot.max_chars_per_fragment || 180
                        })
                    }
                }
            } catch (error) {
                console.error("Error loading bot config:", error);
            }
        };

        loadBotData();
    }, [supabase]);

    const handleSave = async () => {
        setIsSaving(true);
        if (!botId) {
            toast.error("No se detecta un Bot en tu cuenta.");
            setIsSaving(false);
            return;
        }

        try {
            const { error } = await supabase
                .from('bots')
                .update({
                    name: config.name,
                    personality: config.tone,
                    system_prompt: config.prompt,
                    color_theme: config.color_theme,
                    humanization_enabled: config.humanization_enabled,
                    split_messages: config.split_messages,
                    words_per_minute: config.words_per_minute,
                    max_chars_per_fragment: config.max_chars_per_fragment
                })
                .eq('id', botId);

            if (error) throw error;
            toast.success("Sincronización molecular completa.");
        } catch (error) {
            console.error("Error al guardar:", error);
            toast.error("Fallo en la sincronización.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-[#020617] relative">
            <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

            {/* Premium Header */}
            <header className="h-24 border-b border-slate-200 dark:border-white/5 bg-white/70 dark:bg-[#020617]/70 backdrop-blur-2xl flex items-center justify-between px-10 sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-900 dark:bg-white rounded-[20px] shadow-2xl flex items-center justify-center text-white dark:text-slate-900">
                        <Cpu className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Bot DNA Builder</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Módulo de Personalidad v4.0</p>
                    </div>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-6 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-600/20 gap-3 h-12 transition-all hover:scale-[1.02] active:scale-95"
                >
                    {isSaving ? 'Sincronizando...' : <><Save className="w-4 h-4" /> Guardar Cambios</>}
                </Button>
            </header>

            <main className="flex-1 overflow-y-auto w-full max-w-[1700px] mx-auto p-10 space-y-12">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                    <div className="xl:col-span-8 space-y-10">
                        {/* Core Identity Card */}
                        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[48px] p-10 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />

                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-500/20">
                                    <Fingerprint className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Identidad Primaria</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre del Asistente</Label>
                                    <Input
                                        value={config.name}
                                        onChange={(e) => setConfig({ ...config, name: e.target.value })}
                                        className="bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white-10 h-14 px-5 rounded-2xl focus:ring-indigo-500 text-lg font-bold"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Espectro de Color</Label>
                                    <div className="flex bg-slate-100 dark:bg-white/5 p-2 rounded-2xl border border-slate-200 dark:border-white/10 gap-3 h-14 items-center">
                                        {['#475569', '#6366f1', '#10b981', '#f59e0b', '#dc2626', '#d946ef'].map((color) => (
                                            <button
                                                key={color}
                                                onClick={() => setConfig({ ...config, color_theme: color })}
                                                className={`w-8 h-8 rounded-full border-2 transition-all ${config.color_theme === color ? 'border-white dark:border-white scale-110 shadow-lg ring-2 ring-indigo-500/50' : 'border-transparent scale-90 opacity-60 hover:opacity-100'}`}
                                                style={{ backgroundColor: color }}
                                                aria-label={`Color ${color}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Matriz de Comportamiento (System Prompt)</Label>
                                <Textarea
                                    value={config.prompt}
                                    onChange={(e) => setConfig({ ...config, prompt: e.target.value })}
                                    className="min-h-[220px] bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 p-6 rounded-3xl text-slate-700 dark:text-slate-300 font-medium resize-none text-base leading-relaxed"
                                    placeholder="Define la razón de ser de tu bot..."
                                />
                            </div>
                        </div>

                        {/* Tone & Frequency */}
                        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[48px] p-10 shadow-sm transition-all hover:shadow-2xl hover:shadow-indigo-500/5 group">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-emerald-600/10 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-500/20">
                                    <Dna className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Frecuencia Vocal</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {TONES.map((tone) => (
                                    <button
                                        key={tone.id}
                                        onClick={() => setConfig({ ...config, tone: tone.id })}
                                        className={`p-6 rounded-[32px] text-left transition-all duration-300 border ${config.tone === tone.id ? 'bg-indigo-600 text-white border-transparent shadow-xl shadow-indigo-600/20' : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5 hover:border-indigo-500/30 text-slate-600 dark:text-slate-400'}`}
                                    >
                                        <h4 className="font-black text-lg mb-1">{tone.name}</h4>
                                        <p className={`text-xs font-medium opacity-80 ${config.tone === tone.id ? 'text-white' : 'text-slate-500'}`}>{tone.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Humanization Engine Config */}
                        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[48px] p-10 shadow-sm transition-all hover:shadow-2xl hover:shadow-indigo-500/5 group">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-amber-600/10 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-500/20">
                                        <Layers className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Humanization Engine</h3>
                                </div>
                                <div className="flex items-center gap-3 bg-slate-100 dark:bg-white/5 p-2 rounded-2xl border border-slate-200 dark:border-white/10">
                                    <span className="text-[10px] font-black uppercase tracking-widest px-3">{config.humanization_enabled ? 'Activado' : 'Desactivado'}</span>
                                    <button 
                                        onClick={() => setConfig({ ...config, humanization_enabled: !config.humanization_enabled })}
                                        className={`w-12 h-6 rounded-full transition-all relative ${config.humanization_enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.humanization_enabled ? 'right-1' : 'left-1'}`} />
                                    </button>
                                </div>
                            </div>

                            <AnimatePresence>
                                {config.humanization_enabled && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-8 overflow-hidden"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fraccionamiento de Mensajes</Label>
                                                    <button 
                                                        onClick={() => setConfig({ ...config, split_messages: !config.split_messages })}
                                                        className={`text-[10px] font-black uppercase px-3 py-1 rounded-lg ${config.split_messages ? 'bg-indigo-600/10 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}
                                                    >
                                                        {config.split_messages ? 'On' : 'Off'}
                                                    </button>
                                                </div>
                                                <p className="text-[11px] text-slate-500 leading-relaxed">Divide respuestas largas en burbujas pequeñas para una apariencia más humana.</p>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Velocidad de Escritura (PPM)</Label>
                                                    <span className="text-sm font-black text-indigo-600">{config.words_per_minute}</span>
                                                </div>
                                                <input 
                                                    type="range" 
                                                    min="30" max="150" step="5"
                                                    value={config.words_per_minute}
                                                    onChange={(e) => setConfig({ ...config, words_per_minute: parseInt(e.target.value) })}
                                                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                                />
                                                <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase">
                                                    <span>Lento</span>
                                                    <span>Normal</span>
                                                    <span>Veloz</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 bg-amber-50 dark:bg-amber-500/5 rounded-3xl border border-amber-100 dark:border-amber-500/20">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Zap className="w-4 h-4 text-amber-500" />
                                                <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Configuración Avanzada</h4>
                                            </div>
                                            <div className="space-y-4">
                                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Máximo de Caracteres por Burbuja</Label>
                                                <div className="flex gap-4 items-center">
                                                    <input 
                                                        type="number" 
                                                        value={config.max_chars_per_fragment}
                                                        onChange={(e) => setConfig({ ...config, max_chars_per_fragment: parseInt(e.target.value) })}
                                                        className="w-24 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold"
                                                    />
                                                    <span className="text-[10px] text-slate-500 uppercase font-medium">Recomendado: 150-250 caracteres</span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Simulation Console */}
                    <div className="xl:col-span-4">
                        <div className="sticky top-32 space-y-8">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Smartphone className="w-4 h-4" /> Consola de Simulación
                                </h3>
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-white/10" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-white/10" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-white/10" />
                                </div>
                            </div>

                            <div className="relative w-full aspect-[4/5] bg-white dark:bg-slate-950 rounded-[50px] border-8 border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col group">
                                <div className="h-10 bg-slate-100/50 dark:bg-white/5 flex items-center justify-center pt-2">
                                    <div className="w-16 h-1 rounded-full bg-slate-300 dark:bg-white/20" />
                                </div>

                                <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white" style={{ backgroundColor: config.color_theme }}>
                                        <Bot className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{config.name}</div>
                                        <div className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">En línea</div>
                                    </div>
                                </div>

                                <div className="flex-1 p-6 space-y-4 overflow-hidden bg-slate-50/50 dark:bg-black/20">
                                    <div className="self-start max-w-[85%] bg-white dark:bg-white/10 p-4 rounded-2xl rounded-bl-none text-xs font-medium text-slate-600 dark:text-slate-300 shadow-sm border border-slate-100 dark:border-white/5">
                                        Hola! ¿Puedes explicarme qué haces? 👋
                                    </div>
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={config.tone}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-3"
                                        >
                                            <div className="max-w-[85%] p-4 rounded-2xl rounded-tr-none text-xs text-white shadow-lg ml-auto" style={{ backgroundColor: config.color_theme }}>
                                                <p className="font-bold mb-1 opacity-70 italic text-[9px]">Respuesta Protocolo {config.tone}</p>
                                                {TONES.find(t => t.id === config.tone)?.flavor} Soy tu asistente configurado para darte el mejor soporte posible. 🔥
                                            </div>
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                <div className="p-4 bg-white dark:bg-[#020617] mt-auto">
                                    <div className="h-12 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 px-4 flex items-center text-slate-400 text-xs">
                                        Escribe un mensaje...
                                    </div>
                                </div>
                            </div>

                            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 p-6 rounded-[32px] flex items-center gap-4">
                                <Activity className="w-6 h-6 text-emerald-500" />
                                <div>
                                    <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Estado Genético</h4>
                                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1">Sincronización optimizada al 100%.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
