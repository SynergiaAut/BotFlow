"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createTenant(formData: FormData) {
    const companyName = formData.get("companyName") as string;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return redirect("/login");
    }

    // 1. Insert the new Tenant
    const { data: tenant, error: tenantError } = await supabase
        .from("tenants")
        .insert([{ name: companyName }])
        .select()
        .single();

    if (tenantError || !tenant) {
        console.error("Error creating tenant:", tenantError);
        return redirect("/onboarding?error=Error+al+crear+la+empresa");
    }

    // 2. Link the user to the tenant with role 'owner'
    const { error: roleError } = await supabase
        .from("user_roles")
        .insert([{
            user_id: user.id,
            tenant_id: tenant.id,
            role: "owner"
        }]);

    if (roleError) {
        console.error("Error creating user role:", roleError);
        // Ideally we'd rollback the tenant, but simpler MVP approach is just return error
        return redirect("/onboarding?error=Error+al+asignar+permisos");
    }

    revalidatePath("/dashboard", "layout");
    redirect("/dashboard");
}
