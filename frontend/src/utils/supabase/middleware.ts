import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set({ name, value, ...options })
                    )
                },
            },
        }
    )

    // IMPORTANT: Avoid writing any logic between createServerClient and supabase.auth.getUser()
    // Se obtiene el usuario para forzar refresco del token
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register')
    const isOnboardingRoute = request.nextUrl.pathname.startsWith('/dashboard/onboarding')

    if (!user && !isAuthRoute && request.nextUrl.pathname !== '/') {
        // Si no está logueado y trata de entrar a un lugar protegido (ejs: /dashboard) lo mando al login
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    const isSuperAdminRoute = request.nextUrl.pathname.startsWith('/super-admin')

    // Si ya esta logueado y trato de ir a login de nuevo
    if (user && isAuthRoute) {
        // Debemos saber rápido si es Super Admin para mandarlo al Command Center en su lugar
        const { data: sa } = await supabase.from('super_admins').select('user_id').eq('user_id', user.id).single()

        const url = request.nextUrl.clone()
        url.pathname = sa ? '/super-admin' : '/dashboard'
        return NextResponse.redirect(url)
    }

    // Comprobar Tenant si va al dashboard o está logueado en rutas protegidas
    if (user && !isAuthRoute && request.nextUrl.pathname !== '/') {

        // Verificamos de forma paralela si el usuario es super admin o si tiene tenant normal
        const [rolesRes, superAdminRes] = await Promise.all([
            supabase.from('user_roles').select('tenant_id').eq('user_id', user.id).limit(1),
            supabase.from('super_admins').select('user_id').eq('user_id', user.id).single()
        ]);

        const hasTenant = rolesRes.data && rolesRes.data.length > 0;
        const isSuperAdmin = !!superAdminRes.data;

        // Si intenta entrar a Super Admin Mode y NO es Super Admin
        if (isSuperAdminRoute && !isSuperAdmin) {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard' // Regresamos a dashboard general
            return NextResponse.redirect(url)
        }

        // --- Logica de Super Admin ---
        // Si el usuario es Super Admin, no debe ser redirigido a onboarding ni al dashboard normal forzosamente
        // si se encuentra en su propia zona /super-admin.
        if (isSuperAdmin) {
            // Permitimos que el Super Admin entre a dashboard o onboarding si así lo desea explícitamente.
            // Solo redirigimos si NO está en ninguna de esas rutas y tampoco en las de admin.
            return supabaseResponse
        }

        // --- Lógica de Usuario Normal ---
        // Si no es super admin, no tiene tenant Y NO está en onboarding, forzar redirección a Onboarding
        if (!hasTenant && !isOnboardingRoute && !isSuperAdminRoute) {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard/onboarding'
            return NextResponse.redirect(url)
        }

        // Si sí tiene tenant, y está intentando ir a onboarding otra vez, regresarlo al dashboard
        if (hasTenant && isOnboardingRoute) {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }
    }

    // IMPORTANTE: Retornar siempre `supabaseResponse` para propagar los Set-Cookie
    return supabaseResponse
}
