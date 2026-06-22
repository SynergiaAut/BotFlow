# SPEC: Flujo de Registro y Confirmación de Email
> Generado: 2026-06-21
> Proyecto: Skylab — BotFlow Console
> ID: —
> Handoff: Claude/Cowork → Antigravity

---

## 1. CONSTITUTION (Principios no negociables)

- Stack inmutable: Next.js 14 App Router, Supabase Auth, TypeScript, Tailwind CSS, Framer Motion, shadcn/ui
- Toda autenticación pasa por Supabase Auth — nunca gestión manual de sesiones o JWT propios
- RLS activo en todas las tablas — el tenant_id del usuario determina qué datos puede ver
- El diseño visual debe ser idéntico al de `/login/page.tsx`: fondo `#070B12`, cyan `#00B4DB`, tipografía Space Grotesk, glassmorphism cards
- No inventar nuevas Server Actions — reutilizar las existentes en `auth/actions.ts` y `auth/tenant-actions.ts`
- Los secretos solo en variables de entorno (`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

---

## 2. SPECIFICATION (Qué se construye)

### Problema
La consola de Skylab (`console.skylab.synergiaautomation.com`) tiene login funcional pero no tiene página de registro. Nuevos clientes no pueden crear su cuenta sin intervención manual en Supabase. El backend está 100% listo — solo falta la UI.

### Lo que se construye
3 artefactos exactos — nada más:

1. **`/app/register/page.tsx`** — Formulario de registro (email + contraseña + confirmación de contraseña). Al enviar llama al `signup()` action existente en `auth/actions.ts`. Muestra mensaje de éxito "Revisa tu correo para confirmar tu cuenta".

2. **`/app/auth/callback/route.ts`** — Ruta de API que Supabase llama al confirmar el email (PKCE code exchange). Intercambia el `code` por sesión y redirige a `/dashboard/onboarding` si el usuario no tiene tenant, o a `/dashboard` si ya tiene.

3. **Edición pequeña en `/app/login/page.tsx`** — Agregar un link "¿No tienes cuenta? Crear cuenta →" que apunte a `/register`. Va debajo del botón "Entrar al dashboard" o en el footer del card de login.

### Fuera de alcance
- SSO / OAuth (Google, GitHub) — ya hay botón placeholder, no implementar
- Recuperación de contraseña — ya hay link placeholder, no implementar en esta iteración
- Plan de pago / billing durante el registro — el onboarding wizard ya sugiere el plan pero no cobra
- Registro por invitación — no aplica en esta versión

---

## 3. CLARIFICATIONS (Decisiones tomadas)

**Decisión: Reutilizar `signup()` de `auth/actions.ts` sin modificarla**
→ Razón: Ya está implementada, envía email de confirmación con `emailRedirectTo: NEXT_PUBLIC_SITE_URL/auth/callback` y redirige a `/login?message=Revisa+tu+correo`. No tocar.

**Decisión: `/auth/callback` redirige a `/dashboard/onboarding`**
→ Razón: El wizard de onboarding completo ya existe en `/dashboard/onboarding/page.tsx` (4 pasos: negocio, escala, identidad del bot, plan). Es donde el usuario configura su tenant después de confirmar el email.

**Decisión: El registro NO crea el tenant — eso lo hace el onboarding wizard**
→ Razón: `createTenant()` en `auth/tenant-actions.ts` se llama desde el wizard (vía `saveOnboardingAction` en `dashboard/onboarding/actions.ts`). El flujo correcto es: registro → confirmación email → onboarding wizard → tenant creado → dashboard.

**Decisión: Diseño visual espeja `/login/page.tsx` exactamente**
→ Razón: Consistencia de marca. Mismos componentes (Input de shadcn/ui, Button, Image de Next.js), mismos colores, mismo grid de 2 columnas (izquierda: branding, derecha: form), mismas animaciones de Framer Motion.

**Decisión: Validación de contraseña solo en cliente (mínimo 8 caracteres, confirmación coincide)**
→ Razón: Supabase rechaza contraseñas débiles en el servidor de todas formas. No es necesario validación compleja en esta iteración.

---

## 4. PLAN (Arquitectura y enfoque)

### Stack específico
- Framework: Next.js 14 App Router (`"use client"` para register page, `route.ts` para callback)
- Auth: `@supabase/ssr` — `createClient()` de `@/utils/supabase/server` en el callback
- UI: shadcn/ui `Input`, `Button` + Framer Motion para animaciones de entrada
- Imágenes: `next/image` con los mismos assets de `/brand/` que usa login

### Estructura de archivos a crear/modificar

```
frontend/src/app/
├── register/
│   └── page.tsx          ← NUEVO: formulario de registro
├── auth/
│   ├── actions.ts        ← EXISTENTE: no modificar
│   ├── tenant-actions.ts ← EXISTENTE: no modificar
│   └── callback/
│       └── route.ts      ← NUEVO: PKCE code exchange
└── login/
    └── page.tsx          ← MODIFICAR: agregar link a /register
```

### Flujo de datos completo

```
Usuario → /register
  → form submit → signup() [auth/actions.ts]
  → Supabase crea usuario, manda email
  → redirect /login?message=Revisa+tu+correo

Usuario → click link en email
  → GET /auth/callback?code=XYZ
  → route.ts intercambia code por sesión (supabase.auth.exchangeCodeForSession)
  → si usuario sin tenant → redirect /dashboard/onboarding
  → si usuario con tenant → redirect /dashboard

Usuario → /dashboard/onboarding
  → wizard 4 pasos (ya existe)
  → saveOnboardingAction() → createTenant() → RPC create_new_tenant
  → redirect /dashboard
```

### Implementación del callback (`/auth/callback/route.ts`)

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Verificar si el usuario ya tiene tenant
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: tenant } = await supabase
          .from('tenant_users')
          .select('tenant_id')
          .eq('user_id', user.id)
          .single()
        
        return NextResponse.redirect(
          tenant ? `${origin}/dashboard` : `${origin}/dashboard/onboarding`
        )
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?message=Error+al+confirmar+email`)
}
```

*Nota: el nombre de la tabla `tenant_users` puede ser diferente — verificar en Supabase antes de implementar.*

---

## 5. TASKS (Lista de implementación priorizada)

- [ ] **T1: Verificar nombre real de tabla que relaciona users con tenants**
  Abrir Supabase → Table Editor → buscar tabla que tenga columna `user_id` y `tenant_id`. Puede llamarse `tenant_users`, `user_tenant`, `profiles`, o similar. Anotar el nombre exacto para usarlo en el callback y en el registro.
  *Resultado esperado: nombre confirmado de la tabla.*

- [ ] **T2: Crear `/app/auth/callback/route.ts`**
  Implementar el GET handler según el plan de arriba, usando el nombre real de la tabla obtenido en T1.
  *Resultado esperado: al hacer clic en el link del email de confirmación de Supabase, el usuario llega a `/dashboard/onboarding`.*

- [ ] **T3: Crear `/app/register/page.tsx`**
  Formulario de registro con email, contraseña y confirmación de contraseña. Diseño espejo de `/login/page.tsx`: mismo grid 2 columnas, mismos colores y animaciones. Llama al `signup()` action existente. Muestra estado de loading y mensajes de error desde `searchParams.message`.
  *Resultado esperado: usuario puede registrarse con email/contraseña y recibe email de confirmación.*

- [ ] **T4: Editar `/app/login/page.tsx` — agregar link a /register**
  Dentro del card de login, debajo del botón "Entrar al dashboard" (o encima del bloque de "Demo guiada / Acceso SSO"), añadir:
  `¿No tienes cuenta? <Link href="/register">Crear cuenta →</Link>`
  Estilo: texto pequeño (`text-xs`), color `text-[#00B4DB]`, `hover:opacity-80`.
  *Resultado esperado: link visible que lleva a la página de registro.*

- [ ] **T5: Prueba end-to-end del flujo completo**
  Crear cuenta nueva con email real → revisar que llega el email → hacer clic → llegar a `/dashboard/onboarding` → completar wizard → llegar a `/dashboard`.
  *Resultado esperado: flujo sin errores, nuevo tenant creado en Supabase.*

---

## 6. CONTEXTO PARA ANTIGRAVITY

### Keywords para buscar en el KM
- supabase auth pkce callback
- signup createTenant RPC
- onboarding wizard tenant
- skylab console login
- next.js app router server actions

### Archivos relevantes en el repositorio

```
frontend/src/app/auth/actions.ts         — signup() y login() ya implementados
frontend/src/app/auth/tenant-actions.ts  — createTenant() vía RPC create_new_tenant
frontend/src/app/login/page.tsx          — diseño de referencia visual (copiar exactamente)
frontend/src/app/dashboard/onboarding/   — wizard completo, destino post-registro
frontend/src/utils/supabase/server.ts    — createClient() para Server Components y Route Handlers
```

### Próximo paso recomendado
Ejecutar T1 primero (verificar nombre de tabla en Supabase) para no hardcodear un nombre incorrecto en el callback, luego implementar T2 y T3 en paralelo.
