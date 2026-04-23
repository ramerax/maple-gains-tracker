# MapleClaude – Instrucciones para Claude

## ⛔ REGLA CRÍTICA — Seguridad de datos en DB

**NUNCA ejecutar operaciones destructivas en Supabase sin autorización explícita del usuario.**

Esto incluye: `DELETE`, `TRUNCATE`, `DROP`, cualquier migración que borre datos existentes, o código que ejecute esas operaciones automáticamente.

Antes de cualquier operación destructiva en DB:
1. Mostrar exactamente qué datos se van a afectar
2. Preguntar: "¿Confirmas que quieres borrar/modificar esto?"
3. Esperar respuesta afirmativa explícita
4. Recién entonces ejecutar

**Aplica aunque el usuario haya dado permisos automáticos generales.** Las operaciones destructivas en DB son siempre excepción.

## Flujo de trabajo con Git

**Nunca hacer push directo a `master`.**

Para cada nueva feature o fix:
1. Crear rama: `git checkout -b feature/nombre-descriptivo` o `fix/nombre`
2. Hacer commits en esa rama
3. Push: `git push -u origin feature/nombre-descriptivo`
4. Abrir PR hacia `master` con `gh pr create`
5. Mergear cuando esté aprobado

## Convenciones de commits

Seguir conventional commits:
- `feat:` nueva funcionalidad
- `fix:` corrección de bug
- `chore:` tareas de mantenimiento
- `feat(v1.x.0):` para releases con versión

## Deploy

- **Producción**: Vercel auto-deploya al mergear a `master`
- **Preview**: Vercel genera preview URL por cada PR automáticamente

## Variables de entorno

Las credenciales van en `.env` (nunca commitear) y en Vercel dashboard:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Preview / verificación

- Servidor web local: `npm run web` → puerto 8081
- Usar **Chrome** para todo lo que sea web

## Herramientas de Chrome — limitaciones conocidas

El tool `mcp__Claude_in_Chrome__computer` (screenshot/click) y `javascript_tool` están **rotos** por un bug interno de la extensión "Claude in Chrome" (usa `chrome.scripting.executeScript()` hacia una URL `chrome-extension://` ajena). No tiene arreglo desde código.

**Tools que SÍ funcionan:**
- `navigate` ✅
- `get_page_text` ✅ — para leer contenido de la página
- `read_page` ✅ — para inspeccionar DOM / accesibilidad
- `find` ✅ — para encontrar elementos

**Flujo de auditoría visual:**
Usar `mcp__Claude_Preview__preview_start` + `preview_screenshot` en lugar del computer tool.
El servidor de assets está en `.claude/launch.json` como **"Assets Preview"** (puerto 8090).

## Assets / Favicon

- Favicon fuente: `assets/favicon.svg` (SVG editable)
- Favicon producción: `assets/favicon.png` (PNG 64x64, generado con sharp)
- **Expo NO acepta SVG** como favicon — siempre usar PNG
- Para regenerar el PNG: `node scripts/generate-favicon.js`
- Tamaños generados: 16, 32, 48, 64, 180, 192px en `assets/`
