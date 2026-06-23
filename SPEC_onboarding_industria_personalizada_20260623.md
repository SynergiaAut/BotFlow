# SPEC: Onboarding — Selección de Industria y Generación de Plantilla Personalizada
> Generado: 2026-06-23
> Proyecto: Skylab — BotFlow Console
> ID: —
> Handoff: Claude/Cowork → Antigravity

---

## 1. CONSTITUTION (Principios no negociables)

- Stack inmutable: Next.js 14 App Router, Supabase, TypeScript, Tailwind CSS, Framer Motion, shadcn/ui
- Los templates se leen siempre desde `public.bot_templates` en Supabase — nunca hardcodeados en el frontend
- La generación de plantilla personalizada usa el modelo leído desde `system_config` (key: `gemini_ocr_model`) — nunca hardcodeado
- El diseño visual del wizard de onboarding no debe romperse: mismos colores (`#070B12`, cyan `#00B4DB`), misma estructura de pasos, mismas animaciones Framer Motion
- RLS activo: todas las queries usan el cliente de usuario autenticado, nunca service role en el frontend
- No inventar nuevas tablas — usar `bot_templates` y `system_config` existentes

---

## 2. SPECIFICATION (Qué se construye)

### Problema
El wizard de onboarding actual tiene una lista fija de industrias hardcodeada o limitada. Los nuevos clientes que no encajan en las verticales predefinidas (ej: Software & IA, Consultoría, Educación, Legal) no pueden configurar un bot apropiado para su negocio desde el inicio.

### Lo que se construye

**1. Paso de selección de industria rediseñado en el wizard de onboarding**
El paso actual de "negocio" (Step 1 o Step 3 del wizard, verificar en código) se reemplaza o amplía para mostrar todas las filas de `bot_templates` como cards visuales seleccionables, más una card especial "Mi industria no está aquí 🛠️".

**2. Flujo "Industria Personalizada"**
Cuando el usuario selecciona la card personalizada:
- Aparece un campo de texto expandible: "Describe tu negocio en pocas palabras. ¿Qué vendes, a quién y cuál es tu principal objetivo?"
- Al continuar, se hace un POST a `/api/generate-template` con la descripción
- Gemini genera un `base_system_prompt` y un `vertical_name` provisional
- El resultado se muestra como preview editable antes de confirmar

**3. Endpoint `/api/generate-template`**
Nuevo route handler que recibe `{ businessDescription: string }` y devuelve `{ vertical_name, system_prompt }` generado por Gemini usando el modelo en `system_config.gemini_ocr_model`.

**4. Aplicación del template al primer bot**
Al finalizar el wizard, el template seleccionado (predefinido o personalizado) se aplica como `system_prompt` del primer bot creado para el tenant. Si el usuario eligió un template predefinido, también se guarda `template_id` en el bot para referencia futura.

### Fuera de alcance
- Edición de templates predefinidos por el usuario — solo lectura
- Crear nuevos templates globales desde la UI — eso se hace directo en Supabase
- Multiidioma — todo en español
- Guardar la descripción personalizada como nuevo template permanente en `bot_templates` — en esta iteración es efímero

---

## 3. CLARIFICATIONS (Decisiones tomadas)

**Decisión: Templates se cargan desde Supabase, no desde un array estático**
→ Razón: Ya hay 7 templates en `bot_templates`. Al agregar nuevos desde Supabase (sin código), el wizard los muestra automáticamente.

**Decisión: El modelo Gemini para generación de plantilla se lee desde `system_config`**
→ Razón: Ya existe el mecanismo de configuración dinámica de modelos. La key es `gemini_ocr_model` (valor actual: `gemini-2.0-flash`). Esto evita hardcodear y permite cambiar el modelo sin rebuild.

**Decisión: La card "Personalizada" es la última en el grid, visualmente diferenciada**
→ Razón: Las industrias conocidas tienen iconografía clara. La opción personalizada debe ser visible pero no prominente — es para el caso edge, no el flujo principal.

**Decisión: El sistema_prompt generado se muestra como preview editable**
→ Razón: Gemini puede no capturar exactamente el tono deseado. El usuario debe poder ajustarlo antes de confirmar. Un `<Textarea>` de shadcn/ui pre-poblado con la respuesta de Gemini es suficiente.

**Decisión: Si el usuario elige un template predefinido, se guarda `template_id` en el bot**
→ Razón: Permite en el futuro mostrar "basado en plantilla X" en la UI y facilita upgrades automáticos cuando se actualice el template base.

**Decisión: `/api/generate-template` requiere autenticación (usuario logueado)**
→ Razón: Previene abuso de la API de Gemini desde fuera del wizard. Reutiliza el patrón de los otros endpoints (`createClient()` + verificación de user).

**Decisión: No modificar la tabla `bot_templates` con entradas personalizadas por tenant**
→ Razón: `bot_templates` es una tabla global de plantillas maestras. Los prompts personalizados van directo al `system_prompt` del bot en la tabla `bots`, no en `bot_templates`.

---

## 4. PLAN (Arquitectura y enfoque)

### Stack específico
- Framework: Next.js 14 App Router (`"use client"` para el wizard, `route.ts` para el endpoint)
- Data fetching: Supabase `createClient()` (server) para el endpoint; Supabase browser client para el wizard
- IA: `@google/generative-ai` SDK — mismo patrón que `/api/ingest/pdf/route.ts`
- UI: shadcn/ui `Card`, `Textarea`, `Button`, `Badge` + Framer Motion para transición entre pasos

### Estructura de archivos a crear/modificar

```
frontend/src/app/
├── dashboard/
│   └── onboarding/
│       └── page.tsx          ← MODIFICAR: reemplazar selector de industria
└── api/
    └── generate-template/
        └── route.ts          ← NUEVO: genera system_prompt con Gemini
```

### Flujo de datos completo

```
Wizard Step "Industria" carga:
  → GET /api/bot-templates (o query directa desde cliente Supabase)
  → Renderiza grid de cards (7 predefinidas + 1 "Personalizada")

Usuario selecciona template predefinido:
  → Estado local: { templateId, systemPrompt, verticalName }
  → Continúa al siguiente paso

Usuario selecciona "Personalizada":
  → Muestra Textarea: "Describe tu negocio"
  → Al continuar: POST /api/generate-template { businessDescription }
  → Gemini devuelve { vertical_name, system_prompt }
  → Muestra preview editable del system_prompt
  → Usuario confirma o edita → estado local actualizado
  → Continúa al siguiente paso

Al finalizar wizard (saveOnboardingAction):
  → createTenant() → RPC create_new_tenant
  → Crear primer bot con system_prompt del estado
  → Si templateId existe → guardar en bot.template_id
  → Redirect /dashboard
```

### Implementación del endpoint `/api/generate-template/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(
  (process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY) as string
)

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { businessDescription } = await req.json()
    if (!businessDescription || businessDescription.length < 20) {
      return NextResponse.json({ error: 'Descripción muy corta' }, { status: 400 })
    }

    // Leer modelo desde system_config
    const { data: cfg } = await supabase
      .from('system_config').select('key, value').eq('key', 'gemini_ocr_model').single()
    const modelName = (cfg?.value as string) || 'gemini-2.0-flash'

    const model = genAI.getGenerativeModel({ model: modelName })

    const prompt = `Eres un experto en diseño de chatbots de atención al cliente.
Un usuario describió su negocio así: "${businessDescription}"

Genera un JSON con exactamente estos 2 campos:
{
  "vertical_name": "Nombre corto de la industria (máximo 4 palabras)",
  "system_prompt": "Prompt de sistema completo para un asistente virtual de este negocio. 
  Incluye: rol del asistente, tono, objetivo principal, 3-4 pautas de comportamiento, 
  y cómo manejar la conversión (lead o venta). Mínimo 200 palabras, en español."
}

Responde SOLO con el JSON válido, sin markdown ni texto adicional.`

    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()
    const parsed = JSON.parse(text)

    return NextResponse.json({
      vertical_name: parsed.vertical_name,
      system_prompt: parsed.system_prompt
    })
  } catch (error: any) {
    console.error('Generate Template Error:', error)
    return NextResponse.json({ error: 'Error generando plantilla', details: error.message }, { status: 500 })
  }
}
```

### Grid de cards del wizard (referencia visual)

```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  🍽️ Rest.   │ │ 💄 Salón    │ │ 🦷 Dental   │ │ 👕 Retail   │
│  Comidas    │ │ Belleza     │ │ Clínica     │ │  Ropa       │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ 🏋️ Gym     │ │ 💻 Tecno    │ │ 🤖 Software │ │ 🛠️ Persona- │
│  CrossFit   │ │  Gadgets    │ │ & IA / Auto │ │  lizada...  │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

La card "Personalizada" usa borde punteado cyan, icono `Wand2` de lucide-react, fondo ligeramente diferente para distinguirse.

---

## 5. TASKS (Lista de implementación priorizada)

- [ ] **T1: Leer el código actual del wizard de onboarding**
  Abrir `frontend/src/app/dashboard/onboarding/page.tsx` y entender: cuántos steps hay, cómo se maneja el estado entre steps, dónde está el selector de industria actual, cómo se llama `saveOnboardingAction` al final.
  *Resultado esperado: mapa claro del estado actual del wizard antes de modificar.*

- [ ] **T2: Crear `/api/generate-template/route.ts`**
  Implementar el endpoint según el plan. Verificar que `system_config` sea accesible con el cliente de usuario autenticado (RLS). Probar con curl o desde Postman con un Bearer token válido.
  *Resultado esperado: endpoint devuelve `{ vertical_name, system_prompt }` para cualquier descripción de negocio.*

- [ ] **T3: Modificar el paso de industria en el wizard**
  Reemplazar el selector actual por un grid de cards cargadas desde `bot_templates` vía Supabase. Agregar la card "Personalizada" al final. Cuando se selecciona "Personalizada": mostrar Textarea + llamar al endpoint T2 + mostrar preview editable del resultado.
  *Resultado esperado: el usuario puede seleccionar cualquiera de los 7 templates O describir su negocio y obtener un prompt generado por IA.*

- [ ] **T4: Conectar template seleccionado al flujo de creación del bot**
  Al llamar `saveOnboardingAction` al finalizar el wizard, incluir el `system_prompt` y `template_id` (si aplica) para que el primer bot del tenant se cree con esa configuración. Verificar que la tabla `bots` tenga columna `template_id` (si no existe, agregar con migration).
  *Resultado esperado: al terminar el onboarding, el bot creado tiene el system_prompt correcto según la industria elegida.*

- [ ] **T5: Prueba end-to-end**
  Flujo A: registrar usuario nuevo → wizard → seleccionar "Software & IA" → finalizar → verificar bot en dashboard con system_prompt correcto.
  Flujo B: registrar usuario nuevo → wizard → seleccionar "Personalizada" → describir negocio → confirmar prompt generado → finalizar → verificar bot.
  *Resultado esperado: ambos flujos completan sin errores, el bot refleja la industria elegida.*

---

## 6. CONTEXTO PARA ANTIGRAVITY

### Keywords para buscar en el KM
- onboarding wizard tenant bot-builder
- bot_templates vertical_name system_prompt
- saveOnboardingAction createTenant RPC
- generate template gemini system_config
- next.js app router server actions supabase

### Archivos relevantes en el repositorio

```
frontend/src/app/dashboard/onboarding/page.tsx        — wizard actual (leer primero)
frontend/src/app/dashboard/onboarding/actions.ts      — saveOnboardingAction + createTenant
frontend/src/app/api/ingest/pdf/route.ts              — patrón de referencia para el nuevo endpoint (Gemini + system_config)
frontend/src/utils/supabase/server.ts                 — createClient() para Route Handlers
frontend/src/utils/supabase/client.ts                 — createBrowserClient() para el wizard ("use client")
```

### Estado de la base de datos (ya configurado — no tocar)
- `bot_templates`: 7 filas (6 originales + "Software & IA / Automatización" agregada el 2026-06-23)
- `system_config`: clave `gemini_ocr_model` = `gemini-2.0-flash`
- `system_config`: clave `gemini_embedding_model` = `gemini-embedding-001`

### Próximo paso recomendado
Ejecutar T1 primero — leer `onboarding/page.tsx` para mapear el estado del wizard antes de modificar nada.
