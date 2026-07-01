import React from 'react'
import { getWhatsAppWizardProgress } from '../actions'
import { WhatsAppWizard } from '../components/WhatsAppWizard'
import { redirect } from 'next/navigation'

export const metadata = {
    title: 'Configuración Asistida de WhatsApp - Skylab',
    description: 'Conecta tu línea comercial de WhatsApp a Skylab utilizando la API de Cloud de Meta'
}

export default async function WhatsAppSetupPage() {
    const progressRes = await getWhatsAppWizardProgress()
    
    if (!progressRes.success) {
        // En caso de error severo de auth, redirigir a integraciones
        redirect('/dashboard/integrations')
    }

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || ''
    const initialConfig = progressRes.config || {}

    return (
        <main className="container mx-auto px-4 py-8 max-w-4xl min-h-[80vh] flex flex-col justify-center">
            <WhatsAppWizard 
                initialConfig={initialConfig} 
                verifyToken={verifyToken} 
            />
        </main>
    )
}
