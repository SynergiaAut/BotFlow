# SPEC: Módulo de Agenda y Agendamiento Inteligente por Bot
> Generado: 2026-06-23
> Proyecto: Skylab — BotFlow Console
> ID: —
> Handoff: Claude/Cowork → Antigravity

---

## 1. CONSTITUTION (Principios no negociables)

- Stack inmutable: Next.js 14 App Router, Supabase, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- Las credenciales OAuth de Google (refresh_token) se almacenan SIEMPRE cifradas en Supabase — nunca en texto plano, nunca en el frontend
- RLS activo en todas las tablas nuevas — `tenant_id` obligatorio
- El bot NO crea citas sin confirmación explícita del usuario — siempre pregunta "¿Confirmas tu cita para el [fecha] a las [hora]?"
- Un tenant solo puede tener UNA conexión de calendario activa a la vez (Google Calendar O Cal.com, no ambas)
- Las credenciales de Google Cloud (client_id, client_secret) son de Synerg-IA — un solo proyecto OAuth para todos los tenants
- El protocolo de despliegue del SPEC anterior aplica aquí también: commit → pull en VPS → rebuild → restart

---

## 2. SPECIFICATION (Qué se construye)

### Problema
El bot de Skylab puede recomendar productos y servicios, pero no puede cerrar el ciclo convirtiendo el interés en una cita confirmada. Los tenants pierden leads calificados porque el agendamiento sigue siendo manual (el cliente llama o escribe por separado).

### Lo que se construye — 4 módulos

#### Módulo 1: Conexión de Calendario (Configuración del Tenant)
Pantalla en `Dashboard → Configuración → Calendario` con dos opciones:

**Opción A — Google Calendar (OAuth):**
Botón "Conectar con Google Calendar" que inicia el flujo OAuth2. Synerg-IA tiene un proyecto en Google Cloud con Calendar API habilitada. El tenant autoriza acceso a su calendario y el refresh_token se guarda cifrado en Supabase.

**Opción B — Cal.com (API Key):**
Campo de texto para pegar el API key de Cal.com + campo para el Event Type ID o slug. El tenant crea su cuenta en Cal.com externamente y pega sus credenciales aquí.

#### Módulo 2: Tutorial Autoasistido — Google Calendar
Wizard de 5 pasos dentro del dashboard para guiar al usuario sin cuenta de Google Calendar ni experiencia técnica:

- **Paso 1**: Explicación de qué permisos pide Skylab y por qué (solo lectura/escritura de eventos, nunca lectura de emails)
- **Paso 2**: Botón "Conectar con Google Calendar" → pantalla de consentimiento de Google
- **Paso 3**: Selección del calendario a usar (pueden tener varios: Personal, Trabajo, etc.)
- **Paso 4**: Configuración de disponibilidad — días y horas hábiles (ej: Lunes a Viernes, 8am–6pm)
- **Paso 5**: Confirmación con test de disponibilidad en vivo ("Encontramos X slots disponibles esta semana ✅")

#### Módulo 3: Agenda del Tenant en el Dashboard
Vista `Dashboard → Agenda` con todas las citas gestionadas por el bot:

- Vista de calendario mensual + lista
- Filtros: por bot, por estado (confirmada, cancelada, reprogramada), por fecha
- Card de cada cita: nombre del contacto, teléfono, fecha/hora, nombre del bot que la agendó, estado
- Acciones por cita: **Reprogramar** (cambia fecha/hora en el calendario del proveedor), **Cancelar** (elimina del calendario y notifica al cliente si hay número de WhatsApp)
- Badge de estado con color: 🟢 Confirmada, 🟡 Pendiente, 🔴 Cancelada, 🔵 Reprogramada

#### Módulo 4: Herramientas de Calendario para el Bot (Function Calling)
El motor de inferencia del bot recibe 3 herramientas nuevas que Gemini puede invocar:

1. **`check_availability`**: dado un rango de fechas, retorna los slots libres del calendario del tenant
2. **`create_appointment`**: crea una cita con nombre, teléfono, fecha/hora y descripción del servicio. Registra en `appointments` table + crea evento en Google Calendar o Cal.com
3. **`cancel_appointment`**: cancela una cita existente por ID. Actualiza `appointments` + elimina/cancela en el proveedor

### Fuera de alcance
- Pagos durante el agendamiento (depósitos, reservas con tarjeta) — siguiente iteración
- Sincronización bidireccional en tiempo real (webhooks de Google Calendar → Skylab) — siguiente iteración
- Recordatorios automáticos por WhatsApp 24h antes — siguiente iteración
- Múltiples calendarios por tenant (ej: un calendario por empleado) — siguiente iteración
- Outlook / Office 365 — no aplica en esta versión

---

## 3. CLARIFICATIONS (Decisiones tomadas)

**Decisión: Synerg-IA gestiona UN proyecto de Google Cloud para todos los tenants**
→ Razón: Cada tenant crear su propio proyecto OAuth es inviable para usuarios no técnicos. El modelo SaaS estándar (como Calendly, HubSpot) es que el proveedor tiene un OAuth app y cada usuario autoriza acceso a SU calendar. Requiere: client_id y client_secret en el .env del VPS, verificación de la app con Google (proceso de review).

**Decisión: refresh_token cifrado con AES-256 en Supabase**
→ Razón: El refresh_token de Google da acceso permanente al calendario hasta que el usuario lo revoque. Es un secreto de alto valor. Se cifra antes de guardar con una clave maestra en .env (`CALENDAR_ENCRYPTION_KEY`). Se descifra solo en el servidor al momento de usar.

**Decisión: Cal.com como opción B sin OAuth — solo API key**
→ Razón: Cal.com tiene OAuth pero requiere ser partner aprobado. Para el MVP, API key es suficiente y más rápido. El tenant crea su cuenta en cal.com/signup, crea un Event Type y pega el API key en Skylab.

**Decisión: Un solo proveedor activo por tenant**
→ Razón: Simplifica el bot — no necesita decidir a qué calendario consultar. Si el tenant ya tiene Google Calendar, úsalo. Si no, Cal.com. No ambos.

**Decisión: El bot confirma SIEMPRE antes de crear la cita**
→ Razón: Evitar citas fantasma por malentendidos. El flujo es: bot propone slot → usuario confirma → bot crea. Si el usuario no confirma explícitamente, no se crea.

**Decisión: Nueva tabla `appointments` en Supabase como fuente de verdad**
→ Razón: El calendario del proveedor (Google/Cal.com) puede ser desconectado. La tabla `appointments` guarda el historial permanente de citas gestionadas por el bot, independiente del proveedor.

**Decisión: El tutorial de Google Calendar es un wizard dentro del dashboard, no documentación externa**
→ Razón: Los clientes de Skylab son dueños de negocios no técnicos. Un link a docs de Google los perdería. El wizard guía paso a paso con imágenes y acciones concretas dentro de la misma pantalla.

**Decisión: Las herramientas de calendario se definen como Gemini Function Calling tools**
→ Razón: Gemini soporta function calling nativo. El motor de inferencia del bot ya usa `@google/generative-ai`. Las tools se pasan en el array `tools` del `generateContent`. Cuando Gemini decide llamar una tool, el backend la ejecuta y devuelve el resultado.

---

## 4. PLAN (Arquitectura y enfoque)

### Stack específico
- OAuth Google: `googleapis` npm package (`google-auth-library`, `@googleapis/calendar`)
- Cal.com: REST API v2 (`https://api.cal.com/v2/`) con fetch nativo
- Cifrado: `crypto` módulo nativo de Node.js (AES-256-GCM)
- UI: shadcn/ui `Calendar`, `Badge`, `Dialog`, `Steps` (wizard) + Framer Motion
- Function Calling: `@google/generative-ai` Tool definitions

### Variables de entorno nuevas en .env del VPS
```
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
GOOGLE_OAUTH_REDIRECT_URI=https://console.skylab.synergiaautomation.com/api/calendar/google/callback
CALENDAR_ENCRYPTION_KEY=...  # 32 bytes hex, generado con: openssl rand -hex 32
```

### Nuevas tablas en Supabase

```sql
-- Conexiones de calendario por tenant
CREATE TABLE public.calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'calcom')),
  -- Google Calendar
  google_refresh_token TEXT,        -- cifrado AES-256
  google_calendar_id TEXT,          -- 'primary' o ID específico
  -- Cal.com
  calcom_api_key TEXT,              -- cifrado AES-256
  calcom_event_type_id TEXT,
  -- Disponibilidad
  availability_days INTEGER[] DEFAULT '{1,2,3,4,5}',  -- 1=Lun, 7=Dom
  availability_start TIME DEFAULT '08:00',
  availability_end TIME DEFAULT '18:00',
  timezone TEXT DEFAULT 'America/Bogota',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'disconnected', 'error')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id)  -- un solo proveedor por tenant
);

-- Historial de citas gestionadas por el bot
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  bot_id UUID REFERENCES public.bots(id) ON DELETE SET NULL,
  -- Datos del contacto
  contact_name TEXT NOT NULL,
  contact_phone TEXT,
  contact_email TEXT,
  -- Cita
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  service_title TEXT,
  notes TEXT,
  -- Estado
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'rescheduled', 'pending')),
  -- Referencia al proveedor
  provider TEXT NOT NULL CHECK (provider IN ('google', 'calcom')),
  provider_event_id TEXT,           -- ID del evento en Google Calendar o Cal.com
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant isolation" ON public.calendar_connections FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1));

CREATE POLICY "tenant isolation" ON public.appointments FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1));
```

### Estructura de archivos

```
frontend/src/
├── app/
│   ├── api/
│   │   └── calendar/
│   │       ├── google/
│   │       │   ├── auth/route.ts          ← NUEVO: inicia OAuth, redirige a Google
│   │       │   └── callback/route.ts      ← NUEVO: recibe code, intercambia por tokens
│   │       ├── calcom/
│   │       │   └── connect/route.ts       ← NUEVO: valida y guarda API key de Cal.com
│   │       ├── availability/route.ts      ← NUEVO: retorna slots libres (usado por el bot)
│   │       └── appointments/
│   │           ├── route.ts               ← NUEVO: GET lista, POST crear cita
│   │           └── [id]/route.ts          ← NUEVO: PATCH reprogramar, DELETE cancelar
│   └── dashboard/
│       ├── agenda/
│       │   └── page.tsx                   ← NUEVO: vista de citas del tenant
│       └── settings/
│           └── calendar/
│               └── page.tsx               ← NUEVO: conexión + tutorial
├── components/
│   └── calendar/
│       ├── CalendarSetupWizard.tsx        ← NUEVO: tutorial 5 pasos Google Calendar
│       ├── CalcomSetupForm.tsx            ← NUEVO: formulario API key Cal.com
│       ├── AppointmentCard.tsx            ← NUEVO: card de cita individual
│       ├── AgendaView.tsx                 ← NUEVO: vista mensual + lista
│       └── AppointmentActions.tsx         ← NUEVO: modal reprogramar/cancelar
└── utils/
    ├── calendar-encrypt.ts                ← NUEVO: cifrado/descifrado AES-256
    ├── google-calendar.ts                 ← NUEVO: wrapper de Google Calendar API
    └── calcom-api.ts                      ← NUEVO: wrapper de Cal.com REST API
```

### Flujo del bot con Function Calling

```
Usuario WhatsApp: "Quiero agendar una cita para mañana"

1. Bot inference recibe mensaje
2. generateContent con tools definidas:
   tools: [{
     functionDeclarations: [
       { name: "check_availability", description: "...", parameters: {...} },
       { name: "create_appointment", description: "...", parameters: {...} },
       { name: "cancel_appointment", description: "...", parameters: {...} }
     ]
   }]

3. Gemini decide llamar check_availability({ date_from: "2026-06-24", date_to: "2026-06-24" })

4. Backend ejecuta:
   → Busca calendar_connection del tenant
   → Descifra credenciales
   → Llama Google Calendar freeBusy API o Cal.com availability
   → Retorna slots: ["10:00", "11:30", "14:00", "16:30"]

5. Gemini recibe slots → responde:
   "Tengo disponibilidad mañana a las 10:00am, 11:30am, 2:00pm o 4:30pm. ¿Cuál prefieres?"

6. Usuario: "A las 10 está bien"

7. Gemini llama create_appointment({
     contact_name: "...", contact_phone: "+57...",
     scheduled_at: "2026-06-24T10:00:00-05:00",
     service_title: "Consulta inicial"
   })

8. Backend:
   → INSERT appointments { status: 'confirmed' }
   → Google Calendar: events.insert() / Cal.com: bookings.create()
   → Retorna { success: true, appointment_id: "uuid", event_id: "google_event_id" }

9. Gemini responde: "✅ ¡Listo! Tu cita está confirmada para mañana martes 24 de junio a las 10:00am..."
```

### Definición de Tools para Gemini

```typescript
const calendarTools = [{
  functionDeclarations: [
    {
      name: "check_availability",
      description: "Consulta los horarios disponibles para agendar una cita. Úsala cuando el usuario quiera saber cuándo puede agendar.",
      parameters: {
        type: "object",
        properties: {
          date_from: { type: "string", description: "Fecha inicio en formato YYYY-MM-DD" },
          date_to: { type: "string", description: "Fecha fin en formato YYYY-MM-DD" }
        },
        required: ["date_from", "date_to"]
      }
    },
    {
      name: "create_appointment",
      description: "Crea una cita confirmada por el usuario. SOLO llamar después de que el usuario haya confirmado explícitamente la fecha y hora.",
      parameters: {
        type: "object",
        properties: {
          contact_name: { type: "string" },
          contact_phone: { type: "string" },
          scheduled_at: { type: "string", description: "ISO 8601 con timezone. Ej: 2026-06-24T10:00:00-05:00" },
          duration_minutes: { type: "number", description: "Duración en minutos. Default: 30" },
          service_title: { type: "string", description: "Nombre del servicio o motivo de la cita" },
          notes: { type: "string", description: "Notas adicionales del cliente" }
        },
        required: ["contact_name", "scheduled_at", "service_title"]
      }
    },
    {
      name: "cancel_appointment",
      description: "Cancela una cita existente. SOLO si el usuario confirma que quiere cancelar.",
      parameters: {
        type: "object",
        properties: {
          appointment_id: { type: "string" },
          reason: { type: "string" }
        },
        required: ["appointment_id"]
      }
    }
  ]
}]
```

---

## 5. TASKS (Lista de implementación priorizada)

- [ ] **T1: Migration — tablas `calendar_connections` y `appointments`**
  Ejecutar el SQL del plan. Verificar RLS con Supabase dashboard. Agregar al .env del VPS: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`, `CALENDAR_ENCRYPTION_KEY`.
  *Resultado esperado: tablas creadas con RLS, variables de entorno documentadas para que el usuario las configure.*

- [ ] **T2: Utilidades — cifrado y wrappers de API**
  Crear `utils/calendar-encrypt.ts` (AES-256-GCM encrypt/decrypt), `utils/google-calendar.ts` (getAccessToken desde refresh_token, getFreeSlots, createEvent, deleteEvent) y `utils/calcom-api.ts` (getAvailability, createBooking, cancelBooking).
  *Resultado esperado: funciones puras testables que abstraen la complejidad de cada proveedor.*

- [ ] **T3: OAuth Google — endpoints de autenticación**
  Crear `/api/calendar/google/auth/route.ts` (genera URL de consentimiento con scopes `calendar.events` + `calendar.readonly`, guarda state en cookie) y `/api/calendar/google/callback/route.ts` (intercambia code por tokens, cifra refresh_token, guarda en `calendar_connections`, redirige a `/dashboard/settings/calendar?success=true`).
  *Resultado esperado: flujo completo OAuth funciona — el tenant hace clic, autoriza en Google, vuelve al dashboard con la conexión activa.*

- [ ] **T4: Conexión Cal.com — endpoint y formulario**
  Crear `/api/calendar/calcom/connect/route.ts` (valida el API key llamando a `GET /api/v2/me`, cifra y guarda si válido). Crear `CalcomSetupForm.tsx` con campo para API key + Event Type ID + botón "Conectar".
  *Resultado esperado: el tenant pega su API key de Cal.com, Skylab la valida y guarda.*

- [ ] **T5: Endpoint de disponibilidad `/api/calendar/availability`**
  GET con params `date_from`, `date_to`, `tenant_id`. Lee `calendar_connections`, descifra credenciales, llama al proveedor correspondiente, retorna array de slots disponibles `{ datetime: string, available: boolean }[]`. Este endpoint lo llama el backend del bot cuando Gemini invoca `check_availability`.
  *Resultado esperado: GET retorna slots reales del calendario del tenant para el rango de fechas dado.*

- [ ] **T6: Endpoints de citas `/api/calendar/appointments`**
  POST: crea cita en proveedor + INSERT en `appointments`. GET: lista citas del tenant con filtros (status, bot_id, fecha). PATCH `/[id]`: reprograma (update en proveedor + appointments). DELETE `/[id]`: cancela (delete en proveedor + update status).
  *Resultado esperado: CRUD completo de citas funcionando, sincronizado con el proveedor.*

- [ ] **T7: Integrar Function Calling en el motor de inferencia del bot**
  Leer el código actual del bot inference (el que llama a Gemini con el system_prompt). Agregar las 3 tool definitions cuando el tenant tiene un `calendar_connection` activo. Implementar el loop: si Gemini responde con `functionCall` → ejecutar el endpoint correspondiente → devolver resultado a Gemini → Gemini genera respuesta final.
  *Resultado esperado: en el bot tester, el bot puede consultar disponibilidad, crear y cancelar citas reales.*

- [ ] **T8: Wizard de configuración — Google Calendar (5 pasos)**
  Crear `CalendarSetupWizard.tsx` con los 5 pasos descritos en la especificación. Paso 3 (selección de calendario) llama `GET /api/calendar/google/calendars` para listar los calendarios del tenant. Paso 4 (disponibilidad) usa checkboxes de días + TimePicker de horas. Paso 5 llama `/api/calendar/availability` para verificar que hay slots disponibles.
  *Resultado esperado: un dueño de negocio sin conocimientos técnicos puede conectar su Google Calendar siguiendo el wizard.*

- [ ] **T9: Vista Agenda en el dashboard**
  Crear `dashboard/agenda/page.tsx` con `AgendaView.tsx`. Vista de lista (default) + vista de calendario mensual con shadcn/ui Calendar. Filtros por estado y bot. `AppointmentCard.tsx` con datos del contacto, servicio, fecha y botones de acción. Modal de reprogramación con DatePicker.
  *Resultado esperado: el tenant ve todas sus citas, puede reprogramar o cancelar desde el dashboard.*

- [ ] **T10: Prueba end-to-end**
  Flujo A (Google Calendar): conectar calendario del tenant → bot tester → "quiero una cita para mañana" → bot muestra slots → usuario confirma → verificar evento en Google Calendar + registro en `appointments`.
  Flujo B (Cal.com): conectar API key → mismo flujo → verificar booking en Cal.com dashboard.
  Flujo C (Dashboard): verificar que la cita aparece en Agenda, reprogramarla, verificar que se actualiza en el proveedor.
  *Resultado esperado: los 3 flujos sin errores, datos coherentes entre Skylab y el proveedor.*

---

## 6. CONTEXTO PARA ANTIGRAVITY

### Keywords para buscar en el KM
- google calendar oauth refresh token
- function calling gemini tool use
- bot inference system prompt
- supabase encrypt credentials
- cal.com api booking availability
- next.js oauth callback route

### Archivos relevantes en el repositorio

```
frontend/src/app/api/ingest/route.ts           — patrón de autenticación tenant (user_roles)
frontend/src/app/auth/callback/route.ts        — patrón de OAuth callback (PKCE, referencia)
frontend/src/utils/supabase/server.ts          — createClient() para Route Handlers
frontend/src/app/dashboard/onboarding/         — referencia de wizard multi-paso con Framer Motion
```

### Variables de entorno que el usuario debe agregar al VPS antes del T1

```bash
# En /opt/skylab/frontend/.env agregar:
GOOGLE_OAUTH_CLIENT_ID=         # de Google Cloud Console → Credenciales → OAuth 2.0
GOOGLE_OAUTH_CLIENT_SECRET=     # mismo lugar
GOOGLE_OAUTH_REDIRECT_URI=https://console.skylab.synergiaautomation.com/api/calendar/google/callback
CALENDAR_ENCRYPTION_KEY=        # generar con: openssl rand -hex 32
```

### Configuración previa en Google Cloud (el usuario debe hacer esto ANTES de T3)
1. Ir a [console.cloud.google.com](https://console.cloud.google.com) → proyecto `gen-lang-client-0271837827`
2. APIs y servicios → Habilitar → "Google Calendar API"
3. Credenciales → Crear credenciales → ID de cliente OAuth 2.0 → Aplicación web
4. Agregar URI de redireccionamiento: `https://console.skylab.synergiaautomation.com/api/calendar/google/callback`
5. Copiar client_id y client_secret al .env

### Próximo paso recomendado
Ejecutar T1 primero — migration SQL + agregar variables de entorno al .env del VPS (sin estas vars, T3 y T7 no pueden implementarse).

---

## 7. PROTOCOLO DE DESPLIEGUE (obligatorio al terminar cada tarea)

### Paso 1 — Commit y push a GitHub

```bash
# Al terminar cada tarea (T1–T10):
git add -A
git commit -m "feat(calendar): [descripción breve de la tarea completada]"
git push origin main
```

**Convenciones de commit para este módulo:**
```
feat(calendar): migration tables calendar_connections + appointments       ← T1
feat(calendar): utils encrypt + google-calendar + calcom-api wrappers      ← T2
feat(calendar): google oauth auth + callback routes                         ← T3
feat(calendar): calcom api key connect route + CalcomSetupForm              ← T4
feat(calendar): availability endpoint                                       ← T5
feat(calendar): appointments CRUD endpoints                                 ← T6
feat(calendar): gemini function calling integration in bot inference        ← T7
feat(calendar): CalendarSetupWizard 5-step google tutorial                  ← T8
feat(calendar): agenda dashboard view + appointment cards                   ← T9
test(calendar): e2e google + calcom + dashboard flows                       ← T10
```

### Paso 2 — Actualización en el VPS (el usuario lo ejecuta manualmente)

Antigravity debe mostrar estos comandos exactos al usuario al terminar cada tarea que modifique archivos `.ts` / `.tsx` o agregue dependencias npm:

```bash
# 1. Conectarse al VPS
ssh root@[IP_DEL_VPS]

# 2. Ir al directorio del proyecto
cd /opt/skylab

# 3. Traer los cambios de GitHub
git pull origin main

# 4. Reconstruir la imagen Docker (solo si hay cambios en .ts/.tsx o package.json)
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
  -t skylab-app ./frontend

# 5. Reemplazar el contenedor en ejecución
docker stop skylab-app
docker rm skylab-app
docker run -d \
  --name skylab-app \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file /opt/skylab/frontend/.env \
  skylab-app

# 6. Verificar que arrancó correctamente
docker logs skylab-app --tail 30
```

**Tareas que requieren rebuild (Pasos 4-5):**
- T2, T3, T4, T5, T6, T7, T8, T9 — cualquier cambio en `.ts` / `.tsx`

**Tareas que NO requieren rebuild:**
- T1 — solo migration SQL en Supabase (no toca código)
- Cambios únicamente en `.env` — solo Paso 5 (restart sin rebuild)

### Paso 3 — Verificación post-despliegue

Después de cada restart, confirmar con:
```bash
# El container está corriendo
docker ps | grep skylab-app

# No hay errores de arranque
docker logs skylab-app --tail 20

# La app responde
curl -I https://console.skylab.synergiaautomation.com
```

---

## 8. SEGURIDAD Y RESTRICCIONES (no romper lo que funciona)

### ⚠️ Archivos que NO se deben tocar

```
frontend/src/app/api/ingest/route.ts          ← URL ingestion — ya funcionando
frontend/src/app/api/ingest/pdf/route.ts      ← PDF ingestion — en progreso (SPEC knowledge base)
frontend/src/app/api/chat/route.ts            ← Motor de chat — crítico
frontend/src/middleware.ts                    ← Auth middleware — NO MODIFICAR
frontend/src/utils/supabase/                  ← Clients de Supabase — NO MODIFICAR
```

### ⚠️ Precauciones para T7 (Function Calling en el bot)

T7 es la tarea de mayor riesgo — modifica el motor de inferencia que ya funciona. Antigravity debe:

1. **Leer el archivo de inferencia completo antes de tocarlo** — entender el flujo actual
2. **Las tools de calendario son OPCIONALES**: solo se agregan al `generateContent` si el tenant tiene un `calendar_connection` activo con `status = 'active'`. Si no tiene calendario conectado, el bot funciona exactamente igual que antes.
3. **Nunca eliminar ni reemplazar el array `tools` existente** — agregar las tools de calendario como un spread adicional:
   ```typescript
   const tools = [
     ...existingTools,          // lo que ya existe
     ...(hasCalendar ? calendarTools : [])  // solo si tiene calendario
   ]
   ```
4. **Probar primero en un tenant de prueba** — no en Skybot (Synerg-IA) directamente
5. **Si algo falla en T7, el rollback es:** `git revert HEAD` + push + pull en VPS + rebuild

### ⚠️ Restricciones de RLS — obligatorio en T1

Después de crear las tablas, verificar en el Supabase Dashboard (Table Editor) que:
- Un usuario de tenant A NO puede ver los registros de tenant B
- Ejecutar esta query de verificación:
```sql
-- Debe retornar 0 filas para un user_id de otro tenant
SELECT * FROM calendar_connections 
WHERE tenant_id != (
  SELECT tenant_id FROM user_roles WHERE user_id = '[USER_ID_AJENO]' LIMIT 1
);
```

### ⚠️ Cifrado de credenciales — obligatorio en T2

- `CALENDAR_ENCRYPTION_KEY` debe generarse con `openssl rand -hex 32` — nunca un string manual
- El `google_refresh_token` y `calcom_api_key` se cifran ANTES del INSERT y se descifran solo en server-side Route Handlers
- Nunca retornar el token/key descifrado en una respuesta JSON al frontend
- En los logs de Docker, nunca imprimir el token ni la key (usar `console.error('Calendar auth error:', error.message)` sin incluir el token)

### ⚠️ Variables de entorno antes de T3

Si las variables de Google OAuth no están en el `.env` del VPS cuando se despliegue T3, el endpoint `/api/calendar/google/auth` lanzará un error 500 para todos los usuarios. Agregar las vars al `.env` **antes** del primer deploy de T3:
```
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=
CALENDAR_ENCRYPTION_KEY=
```
