# SPEC: Refactor Módulo de Base de Conocimiento — PDFs sin IA + Catálogo de Productos
> Generado: 2026-06-23
> Proyecto: Skylab — BotFlow Console
> ID: —
> Handoff: Claude/Cowork → Antigravity

---

## 1. CONSTITUTION (Principios no negociables)

- Stack inmutable: Next.js 14 App Router, Supabase, TypeScript, Tailwind CSS, shadcn/ui
- El embedding vectorial sigue usando `gemini-embedding-001` vía `system_config` — no cambiar
- Las imágenes de catálogo se comprimen ANTES de subir (client-side) — nunca almacenar originales sin comprimir
- RLS activo en todas las tablas nuevas — `tenant_id` obligatorio en cada fila
- Los precios siempre se muestran en formato COP: `$149.000` (Intl.NumberFormat 'es-CO')
- El bot NO envía imágenes por defecto — solo cuando el usuario las solicita explícitamente
- No modificar `/api/ingest/route.ts` (web scraper) — ya funciona correctamente

---

## 2. SPECIFICATION (Qué se construye)

### Problema
El módulo de base de conocimiento tiene tres fallas críticas:
1. **PDFs**: el endpoint `/api/ingest/pdf` usa Gemini `generateContent` para OCR, bloqueado por cuota free tier. Necesita reemplazarse con extracción sin IA.
2. **Catálogos**: intenta pasar imágenes de productos por `/api/ingest/pdf`, que es arquitectónicamente incorrecto. Los catálogos son datos estructurados (nombre, precio, descripción, imagen), no documentos.
3. **UX**: precios sin formato COP, grid de catálogo no editable, imágenes sin compresión.

### Lo que se construye — 3 módulos

#### Módulo 1: PDF sin IA (Option A + B)
**Opción A — Client-side con pdf.js**: el navegador extrae el texto del PDF antes de enviarlo al servidor. Se envía texto plano al endpoint `/api/ingest` existente (type: 'text'). Costo: $0, sin cambios en servidor.

**Opción B — Fallback server-side con `pdf-parse`**: si el PDF no tiene capa de texto (imagen escaneada), el endpoint `/api/ingest/pdf/route.ts` usa la librería `pdf-parse` de Node.js en lugar de Gemini. Costo: $0, sin rebuild de imagen Docker por cambio de modelo.

Flujo combinado:
- El frontend intenta extracción con pdf.js
- Si retorna texto vacío o < 100 caracteres → envía el archivo al backend que usa `pdf-parse`
- El texto resultante se vectoriza con `gemini-embedding-001` (que sí funciona)

#### Módulo 2: Catálogo de Productos — CRUD completo con grid
Nueva tabla `catalog_items` en Supabase. Nuevo endpoint `/api/catalog`. UI con grid editable de productos.

**Campos por producto:**
- `nombre` (text) — nombre del producto o plan
- `precio` (numeric) — almacenado como número entero (COP sin decimales)
- `descripcion` (text) — descripción del producto
- `imagen_url` (text) — URL pública en Supabase Storage
- `embedding` (vector 768) — vectorización del texto combinado para RAG

**Flujo de carga:**
1. Usuario completa formulario: nombre + precio + descripción + imagen
2. Cliente comprime la imagen (máx 800×800px, JPEG 80%) antes de subir
3. POST `/api/catalog` → sube imagen a Supabase Storage → genera texto para embedding → vectoriza → guarda en `catalog_items`

**Grid editable:**
- Cards visuales: imagen, nombre, precio (formato COP), descripción truncada
- Botón editar → modal con formulario pre-poblado
- Botón eliminar → confirmación → delete en Supabase

**RAG del catálogo:**
- El texto vectorizado es: `"Producto: {nombre}. Precio: ${precio} COP. Descripción: {descripcion}"`
- El bot recupera productos relevantes por similitud semántica
- Bot hace preguntas de filtrado antes de mostrar catálogo completo (> 3 productos)
- Imágenes: el bot incluye la URL de imagen SOLO si el usuario la pide explícitamente

#### Módulo 3: Formato COP en toda la UI del bot-builder
Reemplazar todos los valores numéricos de precio mostrados en el bot-builder por `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(precio)`.

### Fuera de alcance
- OCR de PDFs escaneados (imágenes) — `pdf-parse` y pdf.js no procesan imágenes; eso requiere billing de Gemini o Tesseract
- Catálogo con variantes de producto (tallas, colores) — siguiente iteración
- Envío proactivo de imágenes por el bot — el bot solo responde con imágenes cuando se le pide
- Integración con sistemas de inventario externos (Siigo, SAP) — fuera de alcance

---

## 3. CLARIFICATIONS (Decisiones tomadas)

**Decisión: Extracción PDF client-side primero (Opción A), server-side como fallback (Opción B)**
→ Razón: El 90% de los PDFs de clientes son generados digitalmente (Word, Canva, Google Docs) y tienen capa de texto extraíble sin OCR. pdf.js los maneja en el browser sin costo. El fallback con `pdf-parse` cubre el servidor para casos edge. Ninguno requiere Gemini generateContent.

**Decisión: Nueva tabla `catalog_items` separada de `knowledge_docs`**
→ Razón: Los productos del catálogo son datos estructurados (nombre, precio, imagen) que necesitan CRUD independiente. Mezclarlos con documentos de conocimiento complica el retrieval y la UI de gestión.

**Decisión: Compresión de imagen client-side con Canvas API**
→ Razón: Reduce el tamaño antes de la transmisión (no solo del almacenamiento). Una imagen de producto de 3MB se convierte en ~150KB. Usa `canvas.toBlob('image/jpeg', 0.8)` con max 800×800px de dimensión — sin dependencias extra.

**Decisión: Supabase Storage para imágenes (bucket `catalog-images`)**
→ Razón: Ya tienen Supabase. Storage incluido en el plan. URLs públicas directas, CDN integrado, RLS opcional por bucket.

**Decisión: El precio se almacena como `numeric` en la BD, se formatea en el frontend**
→ Razón: Almacenar `149000` como número permite hacer queries de rango (precio > X), ordenamiento y cálculos. El formato COP ($149.000) es solo presentación.

**Decisión: El bot filtra catálogo con preguntas antes de mostrar más de 3 productos**
→ Razón: Enviar 20 productos en un mensaje de WhatsApp/chat satura al usuario. El bot debe preguntar "¿Qué tipo de producto buscas?" o "¿Tienes un presupuesto en mente?" para reducir el conjunto antes de responder.

**Decisión: `pdf-parse` como dependencia npm nueva en el proyecto**
→ Razón: Es una librería madura (8M descargas/semana), sin dependencias pesadas, funciona en Node.js serverless. Se instala con `npm install pdf-parse @types/pdf-parse`.

---

## 4. PLAN (Arquitectura y enfoque)

### Stack específico
- PDF client-side: `pdfjs-dist` (ya disponible en npm, sin instalación adicional en servidor)
- PDF server-side fallback: `pdf-parse` (nueva dependencia npm)
- Imágenes: Canvas API nativa del browser (sin dependencias)
- Storage: `@supabase/storage-js` vía cliente Supabase existente
- UI grid: shadcn/ui `Card` + CSS Grid responsive

### Estructura de archivos a crear/modificar

```
frontend/src/
├── app/
│   ├── api/
│   │   ├── ingest/
│   │   │   └── pdf/
│   │   │       └── route.ts          ← MODIFICAR: reemplazar Gemini OCR con pdf-parse
│   │   └── catalog/
│   │       └── route.ts              ← NUEVO: CRUD de productos del catálogo
│   └── dashboard/
│       └── [bot-builder]/
│           └── knowledge/
│               └── page.tsx (o similar) ← MODIFICAR: tabs PDF + Catálogo
├── components/
│   └── knowledge/
│       ├── PdfUploader.tsx            ← MODIFICAR: agregar extracción client-side con pdf.js
│       ├── CatalogGrid.tsx            ← NUEVO: grid editable de productos
│       ├── CatalogItemCard.tsx        ← NUEVO: card individual con edit/delete
│       └── CatalogItemForm.tsx        ← NUEVO: formulario add/edit con compresión de imagen
└── utils/
    ├── pdf-extractor.ts               ← NUEVO: helper client-side para extracción con pdf.js
    ├── image-compressor.ts            ← NUEVO: helper Canvas API para comprimir imágenes
    └── format-cop.ts                  ← NUEVO: helper Intl.NumberFormat COP
```

### Migration de Supabase — tabla `catalog_items`

```sql
CREATE TABLE public.catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  bot_id UUID REFERENCES public.bots(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  precio NUMERIC(12, 0) NOT NULL DEFAULT 0,
  descripcion TEXT,
  imagen_url TEXT,
  embedding VECTOR(768),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant isolation" ON public.catalog_items
  FOR ALL USING (
    tenant_id = (
      SELECT tenant_id FROM public.user_roles
      WHERE user_id = auth.uid() LIMIT 1
    )
  );
```

### Flujo de datos — PDF refactorizado

```
Usuario sube PDF en el browser
  → PdfUploader.tsx carga pdf.js
  → pdf.js extrae texto de todas las páginas
  → Si texto >= 100 caracteres:
      → POST /api/ingest { type: 'text', content: textoExtraido, title: fileName }
      → El endpoint existente vectoriza con gemini-embedding-001 ✅
  → Si texto < 100 caracteres (PDF escaneado):
      → POST /api/ingest/pdf (FormData con el archivo)
      → route.ts usa pdf-parse como último intento
      → Si también falla → retorna error claro: "Este PDF es una imagen escaneada. Cópialo como texto y usa la pestaña Texto Puro."
```

### Flujo de datos — Catálogo

```
Usuario abre pestaña "Catálogos"
  → GET /api/catalog?botId=X → lista catalog_items → renderiza CatalogGrid

Usuario agrega producto:
  → CatalogItemForm: nombre + precio + descripcion + imagen
  → image-compressor.ts: canvas resize → max 800×800, JPEG 80%
  → POST /api/catalog { nombre, precio, descripcion, imageBlob }
  → route.ts:
      → sube imagen a Supabase Storage (bucket: catalog-images)
      → genera texto: "Producto: X. Precio: $Y COP. Descripción: Z"
      → embedContent(texto) → vector 768d
      → INSERT catalog_items { ...datos, imagen_url, embedding }
  → CatalogGrid se actualiza con el nuevo item

Usuario edita producto:
  → Click editar → CatalogItemForm pre-poblado
  → PATCH /api/catalog/[id] → UPDATE catalog_items

Usuario elimina producto:
  → Click eliminar → confirmación
  → DELETE /api/catalog/[id] → DELETE catalog_items + eliminar imagen de Storage
```

### Helper: image-compressor.ts

```typescript
export async function compressImage(file: File, maxDim = 800, quality = 0.8): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(maxDim / img.width, maxDim / img.height, 1)
      const canvas = document.createElement('canvas')
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', quality)
    }
    img.src = URL.createObjectURL(file)
  })
}
```

### Helper: format-cop.ts

```typescript
export function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value)
}
// formatCOP(149000) → "$149.000"
```

---

## 5. TASKS (Lista de implementación priorizada)

- [ ] **T1: Migration — crear tabla `catalog_items` en Supabase**
  Ejecutar la migration SQL del plan. Verificar que RLS funcione: un usuario autenticado solo ve sus propios items. Crear el bucket `catalog-images` en Supabase Storage con acceso público de lectura.
  *Resultado esperado: tabla creada con RLS, bucket creado, verificado con Supabase dashboard.*

- [ ] **T2: Helpers de utilidad**
  Crear `utils/pdf-extractor.ts` (pdf.js client-side), `utils/image-compressor.ts` (Canvas API) y `utils/format-cop.ts` (Intl.NumberFormat). Estos son puros, sin efectos secundarios, fáciles de probar.
  *Resultado esperado: 3 funciones exportadas, probadas en console del browser.*

- [ ] **T3: Refactor `/api/ingest/pdf/route.ts` — reemplazar Gemini con pdf-parse**
  Instalar `pdf-parse`. Reemplazar el bloque de Gemini OCR por `pdfParse(buffer).then(data => data.text)`. Mantener el resto del flujo (embedding, inserción en knowledge_docs) igual.
  *Resultado esperado: subir un PDF de texto funciona sin Gemini generateContent. Aparece en knowledge_docs con status 'active'.*

- [ ] **T4: Refactor `PdfUploader.tsx` — extracción client-side primero**
  Antes de enviar el archivo al servidor, intentar extracción con pdf.js. Si texto >= 100 chars → usar `/api/ingest` (type: 'text'). Si no → enviar a `/api/ingest/pdf` (fallback con pdf-parse del T3).
  *Resultado esperado: PDFs de texto se procesan sin tocar el servidor de Gemini. PDFs escaneados muestran mensaje claro de error.*

- [ ] **T5: Crear endpoint `/api/catalog/route.ts`**
  GET (lista items del bot), POST (crea item: sube imagen + embedding + insert). Usar patrón de autenticación y tenant_id idéntico al de `/api/ingest`.
  *Resultado esperado: POST con FormData (nombre, precio, descripcion, imagen) retorna el item creado con imagen_url y id.*

- [ ] **T6: Crear endpoint `/api/catalog/[id]/route.ts`**
  PATCH (actualiza nombre, precio, descripcion, imagen opcional) y DELETE (elimina item + imagen de Storage).
  *Resultado esperado: editar y eliminar items funciona correctamente, Storage sincronizado.*

- [ ] **T7: Crear componentes de UI del catálogo**
  `CatalogItemForm.tsx` (formulario con compresión de imagen), `CatalogItemCard.tsx` (card con formato COP, botones edit/delete), `CatalogGrid.tsx` (grid 2-3 columnas responsive que carga desde GET /api/catalog).
  *Resultado esperado: grid muestra productos con imagen, nombre y precio en formato $149.000.*

- [ ] **T8: Integrar CatalogGrid en la pestaña "Catálogos" del bot-builder**
  Reemplazar la UI actual de la pestaña por `CatalogGrid` + botón "Agregar producto" que abre `CatalogItemForm`. Aplicar `formatCOP` a todos los precios visibles en el bot-builder.
  *Resultado esperado: el usuario puede agregar, ver, editar y eliminar productos. Precios en formato $149.000.*

- [ ] **T9: Prueba end-to-end**
  Flujo A (PDF texto): subir `Skylab_Informativo.pdf` → verificar extracción client-side → doc activo en knowledge_docs.
  Flujo B (Catálogo): agregar 3 productos con imagen → editar precio de uno → eliminar otro → verificar grid actualizado y Storage de Supabase.
  *Resultado esperado: ambos flujos sin errores, datos correctos en Supabase.*

---

## 6. CONTEXTO PARA ANTIGRAVITY

### Keywords para buscar en el KM
- knowledge base ingest pdf embedding
- supabase storage upload imagen
- bot-builder knowledge tabs
- catalog productos vectorización
- pdf-parse pdfjs extracción texto

### Archivos relevantes en el repositorio

```
frontend/src/app/api/ingest/pdf/route.ts     — modificar: reemplazar Gemini OCR con pdf-parse
frontend/src/app/api/ingest/route.ts         — referencia: patrón de autenticación + embedding (NO modificar)
frontend/src/app/api/catalog/               — crear desde cero
frontend/src/utils/supabase/server.ts        — createClient() para Route Handlers
```

### Estado de la BD (ya configurado — no tocar)
- `system_config.gemini_embedding_model` = `gemini-embedding-001` — sigue siendo el modelo de embedding
- `system_config.gemini_ocr_model` = `gemini-2.0-flash` — ya no se usa en el nuevo flujo PDF
- `knowledge_docs` + `knowledge_chunks` — sin cambios, los PDFs siguen cayendo aquí
- `catalog_items` — NUEVA tabla (T1 debe crearla)

### Bucket de Storage a crear
- Nombre: `catalog-images`
- Acceso: público (read) para que el bot pueda enviar URLs directas en el chat
- RLS de escritura: solo usuarios autenticados de ese tenant

### Próximo paso recomendado
Ejecutar T1 primero — crear la migration de `catalog_items` y el bucket de Storage, luego continuar con T2 y T3 en paralelo.

---

## 7. PROTOCOLO DE DESPLIEGUE (OBLIGATORIO)

### Principio: no romper lo que funciona
Antes de modificar cualquier archivo existente, Antigravity debe:
1. Leer el archivo completo antes de editarlo
2. Hacer el cambio más quirúrgico posible — no reescribir archivos completos
3. Verificar que el archivo modificado compila (`tsc --noEmit`) antes de commitear

### Flujo de trabajo por tarea

**Al terminar cada tarea (T1–T9):**

1. **Commit a GitHub** con mensaje descriptivo:
   ```bash
   git add -A
   git commit -m "feat(knowledge): [descripción corta de lo que se hizo]"
   git push origin main
   ```

2. **Indicarle al usuario los pasos exactos para actualizar el VPS.** Antigravity debe imprimir literalmente este bloque al final de cada tarea completada:

```
═══════════════════════════════════════════════
 PASOS PARA ACTUALIZAR EL VPS (hazlo tú manualmente)
═══════════════════════════════════════════════
1. Conéctate al VPS:
   ssh root@5.161.81.120

2. Ve al directorio del proyecto:
   cd /opt/skylab/frontend

3. Descarga los cambios de GitHub:
   git pull origin main

4. Reconstruye la imagen Docker:
   source .env && docker build \
     --build-arg NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
     --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
     --build-arg NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
     -t skylab-console .

5. Reinicia el contenedor:
   docker stop skylab-app && docker rm skylab-app
   docker run -d --name skylab-app -p 3003:3000 \
     --env-file .env skylab-console

6. Verifica que arrancó:
   docker logs skylab-app --tail 20
═══════════════════════════════════════════════
```

**Nota**: Si la tarea solo agrega archivos nuevos (no modifica existentes), indicar que el rebuild es necesario de todas formas ya que Next.js compila en build time.

### Tareas que NO requieren rebuild (solo reinicio)
- Cambios en variables de entorno del `.env` en el VPS
- Cambios directos en Supabase (migraciones SQL, datos, Storage)

### Tareas que SÍ requieren rebuild completo
- Cualquier cambio en archivos `.ts` o `.tsx`
- Instalación de nuevas dependencias npm (`pdf-parse`, `pdfjs-dist`)
- Cuando se instalen nuevas dependencias, indicar también:
  ```bash
  # Verificar que el package.json fue actualizado antes del build
  cat /opt/skylab/frontend/package.json | grep "pdf-parse\|pdfjs"
  ```

### Señales de alerta — si ocurre alguna, detener y reportar
- El build falla con errores TypeScript → NO continuar, corregir primero
- `docker logs` muestra errores al arrancar → NO reportar tarea como completa
- Cualquier endpoint existente retorna 500 después del deploy → rollback con `git revert` y reportar
