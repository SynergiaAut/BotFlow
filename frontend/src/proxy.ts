import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

// Rutas públicas — no requieren autenticación
const PUBLIC_PREFIXES = [
    '/api/webhooks/',   // webhooks de Telegram, WhatsApp, etc.
    '/api/widget/',     // widget embebido en sitios externos
    '/api/health',      // health check
    '/privacidad',      // política de datos (accesible sin login)
]

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl

    if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
        return NextResponse.next()
    }

    return updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
