'use server';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function saveOnboardingAction(formData: any) {
    try {
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Timeout al guardar la configuración (10s)")), 10000)
        );

        const executionPromise = async () => {
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No sesión activa');

            // Use admin client (bypassing RLS) for writing to tenants and user_roles tables
            const adminSupabase = createAdminClient();

            const { data: roleData, error: roleError } = await adminSupabase
                .from('user_roles')
                .select('tenant_id')
                .eq('user_id', user.id)
                .maybeSingle();

            if (roleError) throw roleError;
            
            let tenantId;
            if (!roleData) {
                // Create new Tenant dynamically if user doesn't have one
                const { data: newTenant, error: insertTenantError } = await adminSupabase
                    .from('tenants')
                    .insert({
                        name: formData.businessName || 'Mi Empresa',
                        industry: formData.industry,
                        estimated_monthly_sales: parseInt(formData.monthlySales) || 0,
                        estimated_interactions: parseInt(formData.interactions) || 0,
                        subscription_plan: formData.suggestedPlan || 'starter',
                        subscription_status: 'active'
                    })
                    .select('id')
                    .single();

                if (insertTenantError) throw insertTenantError;
                if (!newTenant) throw new Error('No se pudo crear el Tenant');
                tenantId = newTenant.id;

                // Link user to new Tenant as owner
                const { error: insertRoleError } = await adminSupabase
                    .from('user_roles')
                    .insert({
                        user_id: user.id,
                        tenant_id: tenantId,
                        role: 'owner'
                    });

                if (insertRoleError) throw insertRoleError;
            } else {
                tenantId = roleData.tenant_id;
                
                // Update existing Tenant
                const { error: tenantError } = await adminSupabase
                    .from('tenants')
                    .update({
                        name: formData.businessName,
                        industry: formData.industry,
                        estimated_monthly_sales: parseInt(formData.monthlySales) || 0,
                        estimated_interactions: parseInt(formData.interactions) || 0,
                        subscription_plan: formData.suggestedPlan || 'starter'
                    })
                    .eq('id', tenantId);

                if (tenantError) throw tenantError;
            }

            // 2. Generate dynamic system prompt if templateId is provided, fallback to customSystemPrompt if set
            let systemPrompt = formData.customSystemPrompt || `Eres un asistente servicial para ${formData.businessName}.`;
            
            if (formData.templateId) {
                const { data: template } = await supabase
                    .from('bot_templates')
                    .select('base_system_prompt')
                    .eq('id', formData.templateId)
                    .single();
                    
                if (template) {
                    systemPrompt = `${template.base_system_prompt}

### INFORMACIÓN Y CONTEXTO DEL NEGOCIO:
- **Nombre de la Empresa**: ${formData.businessName}
`;
                    if (formData.answers && Object.keys(formData.answers).length > 0) {
                        systemPrompt += `\n### DIRECTRICES Y CONFIGURACIONES ESPECÍFICAS DEL NEGOCIO:\n`;
                        for (const [key, val] of Object.entries(formData.answers)) {
                            const label = key.replace(/_/g, ' ').toUpperCase();
                            systemPrompt += `- **${label}**: ${val}\n`;
                        }
                    }
                }
            }

            // 3. Update/Create Bot
            const { data: bots } = await supabase
                .from('bots')
                .select('id')
                .eq('tenant_id', tenantId)
                .limit(1);

            if (bots && bots.length > 0) {
                const { error: botError } = await supabase
                    .from('bots')
                    .update({
                        name: formData.botName,
                        tone_style: formData.tone,
                        use_emojis: formData.useEmojis || 'high',
                        specialized_industry: formData.industry,
                        system_prompt: systemPrompt,
                        template_id: formData.templateId || null
                    })
                    .eq('id', bots[0].id);
                if (botError) throw botError;
            } else {
                const { error: botError } = await supabase
                    .from('bots')
                    .insert({
                        tenant_id: tenantId,
                        name: formData.botName,
                        tone_style: formData.tone,
                        use_emojis: formData.useEmojis || 'high',
                        specialized_industry: formData.industry,
                        system_prompt: systemPrompt,
                        template_id: formData.templateId || null
                    });
                if (botError) throw botError;
            }

            return { success: true };
        };

        const result = await Promise.race([executionPromise(), timeoutPromise]);
        
        // Removed revalidatePath('/dashboard') logic which was blocking in edge cases.
        // We will do a router.refresh() on the client side if needed.
        
        return result;

    } catch (error: any) {
        console.error('Onboarding Error:', error);
        return { success: false, error: error.message || 'Error al guardar configuración' };
    }
}

export async function getTemplatesAction() {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('bot_templates')
            .select('*')
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        return { success: true, data };
    } catch (error: any) {
        console.error('Error fetching templates:', error);
        return { success: false, data: [] };
    }
}
