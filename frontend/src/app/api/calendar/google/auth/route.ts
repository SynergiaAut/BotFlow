import { getOAuth2Client } from '@/utils/google-calendar';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function GET() {
    try {
        const oauth2Client = getOAuth2Client();
        const state = crypto.randomBytes(32).toString('hex');
        
        const cookieStore = await cookies();
        cookieStore.set('google_oauth_state', state, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 3600 // 1 hora de validez
        });

        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/calendar.events',
                'https://www.googleapis.com/auth/calendar.readonly'
            ],
            state,
            prompt: 'consent' // Fuerza a Google a devolver refresh_token siempre
        });

        return NextResponse.redirect(authUrl);
    } catch (error: any) {
        console.error('[FAST-ORDER-INV] Error al iniciar OAuth de Google Calendar:', error);
        return NextResponse.json({ error: 'No se pudo iniciar la conexión de calendario' }, { status: 500 });
    }
}
