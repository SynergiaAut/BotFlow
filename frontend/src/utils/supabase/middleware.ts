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

    const isAuthRoute = request.nextUrl.pathname.startsWith('/login')
    const isOnboardingRoute = request.nextUrl.pathname.startsWith('/onboarding')

    if (!user && !isAuthRoute && request.nextUrl.pathname !== '/') {
        // Si no está logueado y trata de entrar a un lugar protegido (ejs: /dashboard) lo mando al login
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Si ya esta logueado y trato de ir a login de nuevo, lo mando de regreso a dashboard
    if (user && isAuthRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    // Comprobar Tenant si va al dashboard o está logueado en rutas protegidas
    if (user && !isAuthRoute && request.nextUrl.pathname !== '/') {
        // Validar si tiene una empresa asignada en user_roles
        const { data: roles, error: rolesError } = await supabase
            .from('user_roles')
            .select('tenant_id')
            .eq('user_id', user.id)
            .limit(1)

        const hasTenant = roles && roles.length > 0;

        console.log("MIDDLEWARE DEBUG ->", {
            path: request.nextUrl.pathname,
            userId: user.id,
            hasTenant,
            rolesCount: roles?.length,
            rolesData: roles,
            rolesError
        });

        // Si no tiene tenant Y NO está en onboarding, forzar redirección a Onboarding
        if (!hasTenant && !isOnboardingRoute) {
            const url = request.nextUrl.clone()
            url.pathname = '/onboarding'
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
