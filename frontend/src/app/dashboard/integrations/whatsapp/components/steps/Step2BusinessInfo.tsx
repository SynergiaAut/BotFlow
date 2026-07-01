'use client'

import React, { useState } from 'react'
import { Briefcase, MapPin, Globe, Award, Clock, Languages, MessageSquare } from 'lucide-react'

interface WhatsAppBusinessInfo {
    legal_name: string
    country: string
    industry: string
    website_or_social: string
    tax_id?: string
    business_hours: string
    primary_language: string
    estimated_monthly_conversations: string
}

interface Step2BusinessInfoProps {
    initialData: Partial<WhatsAppBusinessInfo> | null
    onSubmit: (data: WhatsAppBusinessInfo) => void
    onBack: () => void
    isLoading: boolean
}

export function Step2BusinessInfo({
    initialData,
    onSubmit,
    onBack,
    isLoading
}: Step2BusinessInfoProps) {
    const [formData, setFormData] = useState<WhatsAppBusinessInfo>({
        legal_name: initialData?.legal_name || '',
        country: initialData?.country || 'CO',
        industry: initialData?.industry || '',
        website_or_social: initialData?.website_or_social || '',
        tax_id: initialData?.tax_id || '',
        business_hours: initialData?.business_hours || 'Lun-Vie 8am-6pm',
        primary_language: initialData?.primary_language || 'es',
        estimated_monthly_conversations: initialData?.estimated_monthly_conversations || '100-500'
    })

    const [errors, setErrors] = useState<Partial<Record<keyof WhatsAppBusinessInfo, string>>>({})

    const countries = [
        { code: 'CO', name: 'Colombia' },
        { code: 'MX', name: 'México' },
        { code: 'CL', name: 'Chile' },
        { code: 'PE', name: 'Perú' },
        { code: 'ES', name: 'España' },
        { code: 'US', name: 'Estados Unidos' },
        { code: 'OTHER', name: 'Otro' }
    ]

    const industries = [
        { value: 'retail', label: 'Retail / E-commerce' },
        { value: 'health', label: 'Servicios Médicos / Salud' },
        { value: 'education', label: 'Educación' },
        { value: 'finance', label: 'Finanzas / Seguros' },
        { value: 'food', label: 'Alimentos y Bebidas' },
        { value: 'software', label: 'Software / SaaS' },
        { value: 'automotive', label: 'Automotriz' },
        { value: 'tourism', label: 'Turismo y Viajes' },
        { value: 'other', label: 'Otro' }
    ]

    const languages = [
        { code: 'es', name: 'Español' },
        { code: 'en', name: 'Inglés' },
        { code: 'pt', name: 'Portugués' },
        { code: 'other', name: 'Otro' }
    ]

    const conversationRanges = [
        { value: '<100', label: 'Menos de 100 conversaciones' },
        { value: '100-500', label: '100 a 500 conversaciones' },
        { value: '500-2000', label: '500 a 2,000 conversaciones' },
        { value: '>2000', label: 'Más de 2,000 conversaciones' }
    ]

    const validate = () => {
        const newErrors: Partial<Record<keyof WhatsAppBusinessInfo, string>> = {}
        if (!formData.legal_name.trim()) newErrors.legal_name = 'El nombre legal es obligatorio.'
        if (!formData.country) newErrors.country = 'El país es obligatorio.'
        if (!formData.industry) newErrors.industry = 'La industria es obligatoria.'
        if (!formData.website_or_social.trim()) newErrors.website_or_social = 'El sitio web o red social es obligatorio.'
        if (!formData.business_hours.trim()) newErrors.business_hours = 'El horario de atención es obligatorio.'
        if (!formData.primary_language) newErrors.primary_language = 'El idioma es obligatorio.'
        if (!formData.estimated_monthly_conversations) newErrors.estimated_monthly_conversations = 'El volumen estimado es obligatorio.'

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (errors[name as keyof WhatsAppBusinessInfo]) {
            setErrors(prev => ({ ...prev, [name]: undefined }))
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (validate()) {
            onSubmit(formData)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center space-y-2 mb-6">
                <h2 className="text-2xl font-bold text-white tracking-tight">
                    Información comercial de tu negocio
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                    Meta requiere verificar estos datos para aprobar el uso de la API de WhatsApp Cloud en tu negocio.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/40 p-6 rounded-2xl border border-slate-900">
                {/* Nombre Legal */}
                <div className="space-y-2 md:col-span-2">
                    <label className="flex items-center text-sm font-medium text-slate-300 gap-2">
                        <Briefcase className="w-4 h-4 text-primary" />
                        Nombre Legal de la Empresa *
                    </label>
                    <input
                        type="text"
                        name="legal_name"
                        value={formData.legal_name}
                        onChange={handleChange}
                        placeholder="Ej: Synerg-IA Automation S.A.S."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/80 transition-all text-sm"
                    />
                    {errors.legal_name && <p className="text-xs text-red-400">{errors.legal_name}</p>}
                </div>

                {/* Sitio Web o Red Social */}
                <div className="space-y-2 md:col-span-2">
                    <label className="flex items-center text-sm font-medium text-slate-300 gap-2">
                        <Globe className="w-4 h-4 text-primary" />
                        Sitio Web o Red Social Principal *
                    </label>
                    <input
                        type="text"
                        name="website_or_social"
                        value={formData.website_or_social}
                        onChange={handleChange}
                        placeholder="Ej: https://synergiaautomation.com o facebook.com/mi_negocio"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/80 transition-all text-sm"
                    />
                    {errors.website_or_social && <p className="text-xs text-red-400">{errors.website_or_social}</p>}
                    <p className="text-slate-500 text-xs leading-relaxed">
                        Meta exige una página web pública o página de Facebook/Instagram activa para validar el negocio.
                    </p>
                </div>

                {/* País */}
                <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-slate-300 gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        País de Operación *
                    </label>
                    <select
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/80 transition-all text-sm"
                    >
                        {countries.map(c => (
                            <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                    </select>
                    {errors.country && <p className="text-xs text-red-400">{errors.country}</p>}
                </div>

                {/* Industria */}
                <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-slate-300 gap-2">
                        <Briefcase className="w-4 h-4 text-primary" />
                        Industria / Categoría *
                    </label>
                    <select
                        name="industry"
                        value={formData.industry}
                        onChange={handleChange}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/80 transition-all text-sm"
                    >
                        <option value="" disabled>Selecciona industria</option>
                        {industries.map(i => (
                            <option key={i.value} value={i.value}>{i.label}</option>
                        ))}
                    </select>
                    {errors.industry && <p className="text-xs text-red-400">{errors.industry}</p>}
                </div>

                {/* RUT / NIT (Opcional) */}
                <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-slate-300 gap-2">
                        <Award className="w-4 h-4 text-primary" />
                        NIT / RUT / Tax ID <span className="text-slate-500 font-normal">(Opcional)</span>
                    </label>
                    <input
                        type="text"
                        name="tax_id"
                        value={formData.tax_id}
                        onChange={handleChange}
                        placeholder="Ej: 901.234.567-8"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/80 transition-all text-sm"
                    />
                </div>

                {/* Idioma Principal */}
                <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-slate-300 gap-2">
                        <Languages className="w-4 h-4 text-primary" />
                        Idioma Principal del Canal *
                    </label>
                    <select
                        name="primary_language"
                        value={formData.primary_language}
                        onChange={handleChange}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/80 transition-all text-sm"
                    >
                        {languages.map(l => (
                            <option key={l.code} value={l.code}>{l.name}</option>
                        ))}
                    </select>
                    {errors.primary_language && <p className="text-xs text-red-400">{errors.primary_language}</p>}
                </div>

                {/* Horario de Atención */}
                <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-slate-300 gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        Horario de Atención del Bot *
                    </label>
                    <input
                        type="text"
                        name="business_hours"
                        value={formData.business_hours}
                        onChange={handleChange}
                        placeholder="Ej: Lun-Vie 8am-6pm o 24/7"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/80 transition-all text-sm"
                    />
                    {errors.business_hours && <p className="text-xs text-red-400">{errors.business_hours}</p>}
                </div>

                {/* Volumen de Conversaciones */}
                <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-slate-300 gap-2">
                        <MessageSquare className="w-4 h-4 text-primary" />
                        Volumen Mensual Estimado *
                    </label>
                    <select
                        name="estimated_monthly_conversations"
                        value={formData.estimated_monthly_conversations}
                        onChange={handleChange}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/80 transition-all text-sm"
                    >
                        {conversationRanges.map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                    </select>
                    {errors.estimated_monthly_conversations && <p className="text-xs text-red-400">{errors.estimated_monthly_conversations}</p>}
                </div>
            </div>

            {/* Acciones de navegacion */}
            <div className="flex justify-between items-center pt-4">
                <button
                    type="button"
                    onClick={onBack}
                    className="px-6 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition-colors text-sm font-semibold"
                >
                    Atrás
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 transition-all text-sm font-semibold shadow-md flex items-center justify-center min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    ) : (
                        'Siguiente'
                    )}
                </button>
            </div>
        </form>
    )
}
