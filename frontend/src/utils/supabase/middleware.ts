import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function updateSession(request: NextRequest) {
    // Configuro la respuesta que voy a emitir
    let supabaseResponse = NextResponse.next({
        request,
    })

    // Creo el cliente de Supabase
    const supabase = await createClient()

    // IMPORTANT: Avoid writing any logic between createServerClient and supabase.auth.getUser()
    // Se obtiene el usuario para forzar refresco del token
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register')

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


    // IMPORTANTE: Retornar siempre `supabaseResponse` para propagar los Set-Cookie
    return supabaseResponse
}
