import { google } from 'googleapis';

const client_id = process.env.GOOGLE_OAUTH_CLIENT_ID;
const client_secret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const redirect_uri = process.env.GOOGLE_OAUTH_REDIRECT_URI;

/**
 * Obtiene el cliente OAuth2 configurado con las credenciales de Synerg-IA
 */
export function getOAuth2Client() {
    if (!client_id || !client_secret || !redirect_uri) {
        throw new Error('Google OAuth credentials are not defined in environment variables');
    }
    return new google.auth.OAuth2(client_id, client_secret, redirect_uri);
}

/**
 * Intercambia el código de autorización temporal por tokens persistentes de Google
 */
export async function getTokensFromCode(code: string) {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
}

/**
 * Obtiene el cliente de Google Calendar inicializado para un tenant específico
 */
export function getCalendarClient(refreshToken: string) {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({
        refresh_token: refreshToken
    });
    return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * Lista los calendarios del usuario (para el paso 3 del tutorial)
 */
export async function getCalendarList(refreshToken: string) {
    const calendar = getCalendarClient(refreshToken);
    const res = await calendar.calendarList.list();
    return res.data.items || [];
}

interface FreeSlotsConfig {
    calendarId: string;
    dateFrom: string; // YYYY-MM-DD
    dateTo: string;   // YYYY-MM-DD
    availabilityDays: number[]; // 1=Lun, 7=Dom
    availabilityStart: string; // HH:MM
    availabilityEnd: string;   // HH:MM
    timezone: string;
}

/**
 * Consulta la disponibilidad de Google Calendar y genera los slots libres
 */
export async function getFreeSlots(refreshToken: string, config: FreeSlotsConfig) {
    const calendar = getCalendarClient(refreshToken);
    const { calendarId, dateFrom, dateTo, availabilityDays, availabilityStart, availabilityEnd, timezone } = config;

    // Calcular desfase horario del timezone correspondiente
    const getOffsetString = (tz: string) => {
        if (tz === 'America/Bogota') return '-05:00';
        try {
            const date = new Date();
            const inv = new Date(date.toLocaleString('en-US', { timeZone: tz }));
            const diff = (inv.getTime() - date.getTime()) / 1000 / 60;
            const hours = Math.floor(Math.abs(diff) / 60);
            const minutes = Math.abs(diff) % 60;
            const sign = diff >= 0 ? '+' : '-';
            return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        } catch {
            return '-05:00';
        }
    };

    const offset = getOffsetString(timezone);
    const timeMin = `${dateFrom}T00:00:00${offset}`;
    const timeMax = `${dateTo}T23:59:59${offset}`;

    // 1. Consultar intervalos ocupados en Google Calendar
    const freeBusyRes = await calendar.freebusy.query({
        requestBody: {
            timeMin,
            timeMax,
            timeZone: timezone,
            items: [{ id: calendarId }]
        }
    });

    const busyIntervals = freeBusyRes.data.calendars?.[calendarId]?.busy || [];

    // 2. Generar slots potenciales de 30 minutos
    const slots: { datetime: string; available: boolean }[] = [];
    
    const startUtc = new Date(`${dateFrom}T00:00:00`);
    const endUtc = new Date(`${dateTo}T00:00:00`);
    
    for (let d = new Date(startUtc); d <= endUtc; d.setDate(d.getDate() + 1)) {
        // En JS: 0=Dom, 1=Lun, ..., 6=Sab
        // En BD: 1=Lun, ..., 7=Dom
        const jsDay = d.getDay();
        const apiDay = jsDay === 0 ? 7 : jsDay;
        
        if (!availabilityDays.includes(apiDay)) continue;

        const dateStr = d.toISOString().split('T')[0];
        const [startH, startM] = availabilityStart.split(':').map(Number);
        const [endH, endM] = availabilityEnd.split(':').map(Number);

        let currentH = startH;
        let currentM = startM;

        while (currentH < endH || (currentH === endH && currentM < endM)) {
            const hourStr = String(currentH).padStart(2, '0');
            const minStr = String(currentM).padStart(2, '0');
            const slotDateTimeStr = `${dateStr}T${hourStr}:${minStr}:00${offset}`;
            const slotStart = new Date(slotDateTimeStr);
            const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000);

            // Verificar si traslapa con algún intervalo ocupado
            const isBusy = busyIntervals.some(busy => {
                const busyStart = new Date(busy.start!);
                const busyEnd = new Date(busy.end!);
                return slotStart < busyEnd && slotEnd > busyStart;
            });

            const isPast = slotStart.getTime() < Date.now();

            slots.push({
                datetime: slotDateTimeStr,
                available: !isBusy && !isPast
            });

            currentM += 30;
            if (currentM >= 60) {
                currentH += 1;
                currentM -= 60;
            }
        }
    }

    return slots;
}

/**
 * Crea un evento en el Google Calendar seleccionado
 */
export async function createEvent(refreshToken: string, calendarId: string, eventData: {
    title: string;
    description?: string;
    startTime: string; // ISO con timezone
    durationMinutes?: number;
    contactPhone?: string;
    contactEmail?: string;
}) {
    const calendar = getCalendarClient(refreshToken);
    const { title, description, startTime, durationMinutes = 30, contactPhone, contactEmail } = eventData;

    const start = new Date(startTime);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

    const attendees = [];
    if (contactEmail) {
        attendees.push({ email: contactEmail });
    }

    const res = await calendar.events.insert({
        calendarId,
        requestBody: {
            summary: title,
            description: `${description || ''}\n\nContacto: ${contactPhone || 'N/A'}\nEmail: ${contactEmail || 'N/A'}`,
            start: {
                dateTime: start.toISOString(),
                timeZone: 'America/Bogota'
            },
            end: {
                dateTime: end.toISOString(),
                timeZone: 'America/Bogota'
            },
            attendees
        }
    });

    return res.data;
}

/**
 * Cancela/elimina un evento de Google Calendar
 */
export async function deleteEvent(refreshToken: string, calendarId: string, eventId: string) {
    const calendar = getCalendarClient(refreshToken);
    await calendar.events.delete({
        calendarId,
        eventId
    });
    return true;
}

/**
 * Actualiza la hora/duración de un evento existente en Google Calendar
 */
export async function patchEvent(refreshToken: string, calendarId: string, eventId: string, startTime: string, durationMinutes: number = 30) {
    const calendar = getCalendarClient(refreshToken);
    const start = new Date(startTime);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

    const res = await calendar.events.patch({
        calendarId,
        eventId,
        requestBody: {
            start: {
                dateTime: start.toISOString(),
                timeZone: 'America/Bogota'
            },
            end: {
                dateTime: end.toISOString(),
                timeZone: 'America/Bogota'
            }
        }
    });

    return res.data;
}

