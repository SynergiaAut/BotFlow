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

    // Use the RPC to create the tenant cleanly safely bypassing RLS for insertion
    const { data: tenantId, error: rpcError } = await supabase
        .rpc("create_new_tenant", { company_name: companyName });

    if (rpcError || !tenantId) {
        console.error("Error creating tenant via RPC:", rpcError);
        return redirect("/onboarding?error=Error+al+crear+la+empresa");
    }

    revalidatePath("/dashboard", "layout");
    redirect("/dashboard");
}
