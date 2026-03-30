# MapleClaude – Instrucciones para Claude

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
