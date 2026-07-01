'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { encryptSecret, maskSecret } from '@/lib/integration-vault'
import { revalidatePath } from 'next/cache'

const GRAPH_API_VERSION = process.env.META_GRAPH_API_VERSION || 'v23.0'

function normalizeId(value: string) {
    return value.trim().replace(/\s+/g, '')
}

async function getCurrentTenant() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('No autorizado')

    const { data: roleData } = await supabase
        .from('user_roles')
        .select('tenant_id')
        .eq('user_id', user.id)
        .maybeSingle()

    if (!roleData?.tenant_id) throw new Error('Usuario sin tenant activo')

    return { supabase, tenantId: roleData.tenant_id }
}

async function getOrCreateFirstBot(supabase: any, tenantId: string) {
    let { data: bot } = await supabase
        .from('bots')
        .select('id')
        .eq('tenant_id', tenantId)
        .limit(1)
        .maybeSingle()

    if (!bot) {
        const { data: newBot } = await supabase
            .from('bots')
            .insert({
                tenant_id: tenantId,
                name: 'Bot Principal',
                system_prompt: 'Eres un asistente servicial.'
            })
            .select('id')
            .maybeSingle()
        bot = newBot
    }

    if (!bot?.id) throw new Error('No se pudo identificar o crear un bot valido')
    return bot
}

function mapMetaError(error: any) {
    const code = error?.code
    const message = error?.message || 'Meta rechazo la solicitud.'

    if (code === 190) return 'El token de acceso no es valido o expiro. Genera un token nuevo desde Meta Business.'
    if (code === 10 || code === 200) return 'El token no tiene permisos suficientes. Revisa que tenga whatsapp_business_messaging y whatsapp_business_management.'
    if (code === 100) return 'El Phone Number ID no existe o no pertenece a ese token.'

    return message
}

/**
 * Obtiene el progreso actual del Wizard de WhatsApp
 */
export async function getWhatsAppWizardProgress() {
    try {
        const { supabase, tenantId } = await getCurrentTenant()

        const { data: integration, error } = await supabase
            .from('bot_integrations')
            .select('id, bot_id, config, is_active')
            .eq('tenant_id', tenantId)
            .eq('channel', 'whatsapp')
            .maybeSingle()

        if (error) throw error

        if (!integration) {
            return {
                success: true,
                exists: false,
                config: {
                    whatsapp_setup_step: 1,
                    scenario: null,
                    number_type: 'new',
                    business_info: null
                },
                is_active: false
            }
        }

        return {
            success: true,
            exists: true,
            id: integration.id,
            botId: integration.bot_id,
            config: integration.config || {},
            is_active: integration.is_active
        }
    } catch (error: any) {
        console.error('[FAST-ORDER-INV] Error en getWhatsAppWizardProgress:', error)
        return { success: false, error: error.message || 'Error al obtener progreso' }
    }
}

/**
 * Guarda el progreso de un paso del Wizard en bot_integrations.config
 */
export async function saveWizardProgress(step: number, configDelta: any) {
    try {
        const { supabase, tenantId } = await getCurrentTenant()
        const bot = await getOrCreateFirstBot(supabase, tenantId)

        // Buscar integración existente
        const { data: existing } = await supabase
            .from('bot_integrations')
            .select('id, config, is_active')
            .eq('tenant_id', tenantId)
            .eq('channel', 'whatsapp')
            .maybeSingle()

        const currentConfig = existing?.config ? (existing.config as any) : {}
        
        // Fusionar config anterior con la nueva y actualizar el paso
        const updatedConfig = {
            ...currentConfig,
            ...configDelta,
            whatsapp_setup_step: step
        }

        const { error: upsertError } = await supabase
            .from('bot_integrations')
            .upsert({
                tenant_id: tenantId,
                bot_id: bot.id,
                channel: 'whatsapp',
                config: updatedConfig,
                is_active: existing ? existing.is_active : false
            }, { onConflict: 'bot_id,channel' })

        if (upsertError) throw upsertError

        revalidatePath('/dashboard/integrations')
        revalidatePath('/dashboard/integrations/whatsapp/setup')

        return { success: true }
    } catch (error: any) {
        console.error('[FAST-ORDER-INV] Error en saveWizardProgress:', error)
        return { success: false, error: error.message || 'Error al guardar progreso' }
    }
}

/**
 * Valida las credenciales con Meta Graph API, cifra el token y finaliza la configuracion
 */
export async function validateCredentials(accessToken: string, phoneNumberId: string, wabaId?: string) {
    try {
        const token = accessToken.trim()
        const normalizedPhoneNumberId = normalizeId(phoneNumberId)
        const normalizedWabaId = wabaId ? normalizeId(wabaId) : ''

        if (!token || !normalizedPhoneNumberId) {
            throw new Error('El Token y el Phone Number ID son obligatorios.')
        }

        const { supabase, tenantId } = await getCurrentTenant()
        const bot = await getOrCreateFirstBot(supabase, tenantId)

        // 1. Validar contra Meta Graph API
        const metaResponse = await fetch(
            `https://graph.facebook.com/${GRAPH_API_VERSION}/${normalizedPhoneNumberId}?fields=id,display_phone_number,verified_name,quality_rating,code_verification_status`,
            {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store'
            }
        )

        const metaData = await metaResponse.json()

        if (!metaResponse.ok) {
            throw new Error(mapMetaError(metaData?.error))
        }

        if (metaData.id !== normalizedPhoneNumberId) {
            throw new Error('Meta respondio con un Phone Number ID diferente. Revisa el dato ingresado.')
        }

        // 2. Obtener verify token de la plataforma
        const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN
        if (!verifyToken) {
            throw new Error('Falta configurar WHATSAPP_VERIFY_TOKEN en las variables de entorno del servidor.')
        }

        // 3. Cifrar token de acceso de manera segura
        const encryptedToken = encryptSecret(token)

        // 4. Buscar configuracion anterior para fusionar
        const { data: existing } = await supabase
            .from('bot_integrations')
            .select('id, config')
            .eq('tenant_id', tenantId)
            .eq('channel', 'whatsapp')
            .maybeSingle()

        const currentConfig = existing?.config ? (existing.config as any) : {}

        const finalConfig = {
            ...currentConfig,
            access_token_encrypted: encryptedToken,
            access_token_hint: maskSecret(token),
            phone_number_id: normalizedPhoneNumberId,
            waba_id: normalizedWabaId || currentConfig.waba_id || null,
            webhook_verify_token: verifyToken,
            display_phone_number: metaData.display_phone_number || null,
            verified_name: metaData.verified_name || null,
            quality_rating: metaData.quality_rating || 'UNKNOWN',
            code_verification_status: metaData.code_verification_status || 'UNKNOWN',
            graph_api_version: GRAPH_API_VERSION,
            last_verified_at: new Date().toISOString(),
            verified_at: new Date().toISOString(),
            whatsapp_setup_step: 4
        }

        const { error: upsertError } = await supabase
            .from('bot_integrations')
            .upsert({
                tenant_id: tenantId,
                bot_id: bot.id,
                channel: 'whatsapp',
                config: finalConfig,
                is_active: true // Activar la integracion
            }, { onConflict: 'bot_id,channel' })

        if (upsertError) throw upsertError

        revalidatePath('/dashboard/integrations')
        revalidatePath('/dashboard/integrations/whatsapp/setup')

        return {
            success: true,
            display_phone_number: metaData.display_phone_number,
            verified_name: metaData.verified_name
        }
    } catch (error: any) {
        console.error('[FAST-ORDER-INV] Error en validateCredentials:', error)
        return { success: false, error: error.message || 'Error al validar credenciales con Meta' }
    }
}

/**
 * Reinicia la configuracion de WhatsApp a su estado inicial
 */
export async function resetWizardSetup() {
    try {
        const { supabase, tenantId } = await getCurrentTenant()

        const { error } = await supabase
            .from('bot_integrations')
            .delete()
            .eq('tenant_id', tenantId)
            .eq('channel', 'whatsapp')

        if (error) throw error

        revalidatePath('/dashboard/integrations')
        revalidatePath('/dashboard/integrations/whatsapp/setup')

        return { success: true }
    } catch (error: any) {
        console.error('[FAST-ORDER-INV] Error en resetWizardSetup:', error)
        return { success: false, error: error.message || 'Error al reiniciar configuracion' }
    }
}
