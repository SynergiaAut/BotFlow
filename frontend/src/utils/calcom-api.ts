interface CalcomAvailabilityConfig {
    eventTypeId: string;
    dateFrom: string; // YYYY-MM-DD
    dateTo: string;   // YYYY-MM-DD
    timezone: string;
}

/**
 * Valida la API Key de Cal.com haciendo una consulta al endpoint /v2/me
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
    try {
        const res = await fetch('https://api.cal.com/v2/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'cal-api-version': '2024-08-13'
            }
        });
        return res.ok;
    } catch (e) {
        console.error('[FAST-ORDER-INV] Error al validar Cal.com API key:', e);
        return false;
    }
}

/**
 * Consulta la disponibilidad de Cal.com y devuelve los slots en formato estándar
 */
export async function getCalcomAvailability(apiKey: string, config: CalcomAvailabilityConfig) {
    const { eventTypeId, dateFrom, dateTo, timezone } = config;
    
    // Obtener offset para formatear la respuesta final
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

    // Formatear el rango de fechas en UTC para la consulta
    const startStr = new Date(`${dateFrom}T00:00:00Z`).toISOString();
    const endStr = new Date(`${dateTo}T23:59:59Z`).toISOString();

    const url = `https://api.cal.com/v2/slots?eventTypeId=${eventTypeId}&start=${startStr}&end=${endStr}`;
    
    const res = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'cal-api-version': '2024-08-13',
            'Content-Type': 'application/json'
        }
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Cal.com availability query failed: ${res.status} - ${errorText}`);
    }

    const resData = await res.json();
    const slotsData = resData.data?.slots || resData.data || [];
    
    // Mapear slots devueltos por Cal.com
    const slots: { datetime: string; available: boolean }[] = [];
    
    // Cal.com v2 slots puede ser un array directo o un mapa agrupado por fecha
    if (Array.isArray(slotsData)) {
        slotsData.forEach((s: any) => {
            if (s.start) {
                // Convertir a la hora local del timezone del tenant
                const utcDate = new Date(s.start);
                // Ajustar al timezone local restando/sumando la diferencia de minutos
                // Para mantener formato uniforme "YYYY-MM-DDTHH:MM:SS-05:00"
                const localISO = new Date(utcDate.getTime() + (utcDate.getTimezoneOffset() * 60000))
                    .toISOString()
                    .slice(0, 19);

                slots.push({
                    datetime: `${localISO}${offset}`,
                    available: true
                });
            }
        });
    } else if (typeof slotsData === 'object' && slotsData !== null) {
        // En caso de que venga agrupado por fechas: { "2026-06-25": [{ time: "..." }] }
        Object.keys(slotsData).forEach(date => {
            const daySlots = slotsData[date];
            if (Array.isArray(daySlots)) {
                daySlots.forEach((s: any) => {
                    const time = s.time || s.start;
                    if (time) {
                        const utcDate = new Date(time);
                        const localISO = new Date(utcDate.getTime() + (utcDate.getTimezoneOffset() * 60000))
                            .toISOString()
                            .slice(0, 19);

                        slots.push({
                            datetime: `${localISO}${offset}`,
                            available: true
                        });
                    }
                });
            }
        });
    }

    return slots;
}

/**
 * Crea una reserva en Cal.com
 */
export async function createCalcomBooking(apiKey: string, eventTypeId: string, bookingData: {
    name: string;
    email?: string;
    phone?: string;
    startTime: string; // ISO con timezone
    notes?: string;
}) {
    const { name, email, phone, startTime, notes } = bookingData;
    const startUtc = new Date(startTime).toISOString();

    const payload: any = {
        eventTypeId: parseInt(eventTypeId),
        start: startUtc,
        attendee: {
            name,
            email: email || 'lead@skylab.synergiaautomation.com',
            timeZone: 'America/Bogota'
        },
        description: notes || ''
    };

    if (phone) {
        payload.attendee.phoneNumber = phone;
    }

    const res = await fetch('https://api.cal.com/v2/bookings', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'cal-api-version': '2024-08-13',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Cal.com booking creation failed: ${res.status} - ${errorText}`);
    }

    const resData = await res.json();
    return resData.data || resData;
}

/**
 * Cancela una reserva en Cal.com
 */
export async function cancelCalcomBooking(apiKey: string, bookingUid: string, reason?: string) {
    const url = `https://api.cal.com/v2/bookings/${bookingUid}/cancel`;
    
    const payload: any = {};
    if (reason) {
        payload.cancellationReason = reason;
    }

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'cal-api-version': '2024-08-13',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Cal.com booking cancellation failed: ${res.status} - ${errorText}`);
    }

    return true;
}

/**
 * Reprograma una reserva existente en Cal.com
 */
export async function rescheduleCalcomBooking(apiKey: string, bookingUid: string, startTime: string) {
    const url = `https://api.cal.com/v2/bookings/${bookingUid}/reschedule`;
    const startUtc = new Date(startTime).toISOString();

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'cal-api-version': '2024-08-13',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            start: startUtc
        })
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Cal.com booking reschedule failed: ${res.status} - ${errorText}`);
    }

    const resData = await res.json();
    return resData.data || resData;
}

