# Portal SGC – Grupo Falpat SRL

Portal interno de certificación y seguimiento del Sistema de Gestión de la Calidad (SGC), con agenda por planta (Campana / Luján) y documentoteca de PDF, Word, Excel e imágenes.

- **Producción:** https://cetificacion.vercel.app/
- **Repositorio:** https://github.com/ssaavedra1969-png/Cetificacion (privado, rama `main`)
- **Continuidad y estado actual:** ver [`INSTRUCCIONES.md`](./INSTRUCCIONES.md)

## Funcionalidades

- **Inicio**: hero compacto, KPIs, filtros y agenda por planta.
- **Agenda**: temas con estado, prioridad, responsable, fechas, notas e historial.
- **Documentoteca**: buscador, filtros y visor de documentos.
- **Administración**:
  - edición de temas,
  - CRUD de documentos (alta, edición, reemplazo de archivo, baja),
  - asociación de documentos a temas con sincronización del historial.
- **Login por usuario** con roles `admin`, `editor` y `lector`.
- **Sidebar** responsive con acceso a Inicio, Documentoteca y Administración.

## Stack

- **Next.js 16** (App Router, webpack), **React 19**, **TypeScript**.
- **Tailwind CSS v4**.
- **Persistencia en GitHub**: JSON en `data/` y binarios en `documentos/`.
- **Vercel** para el deploy.

## Arquitectura

### Datos

- `data/agenda.json`: temas SGC.
- `data/documentos.json`: catálogo de documentos.
- `data/usuarios.json`: usuarios, roles y hashes de contraseña.

En desarrollo, si GitHub no está configurado, los cambios se guardan en el filesystem local. En producción (`NODE_ENV=production`) se commitean al repositorio mediante la API de GitHub.

### Archivos

Los binarios se guardan en `documentos/` en la raíz del repositorio (no en `public/`, para evitar exposición estática). Se sirven mediante `/api/files`.

- Límite por archivo: **10 MB** (`MAX_UPLOAD_BYTES`). En Vercel el cuerpo de la función está limitado a ~4,5 MB.
- Formatos: PDF, Word, Excel, CSV e imágenes. SVG no permitido.
- Word/Excel usan el visor de Office con URL firmada temporal; si el visor no está disponible se ofrece descarga.

### Autenticación

- Sesión JWT firmada con `AUTH_SECRET` en cookie `sgc_session` (HttpOnly).
- Roles y plantas por usuario.
- Contraseñas con hash `scrypt`.
- `src/proxy.ts` protege `/administracion`, `/api/agenda` (escritura) y `/api/documentos` (escritura).

## Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `AUTH_SECRET` | Sí en producción | Secreto de firma, mínimo 16 caracteres. |
| `GITHUB_TOKEN` | Sí en producción | Token con permiso **Contents: Read and write**. |
| `GITHUB_REPO` | Sí en producción | Repositorio `usuario/repo`. |
| `GITHUB_BRANCH` | No | Rama de trabajo (por defecto `main`). |

Copiar `.env.local.example` a `.env.local` y completar los valores. **Nunca** commitear `.env.local`.

## APIs

| Ruta | Métodos | Descripción |
|---|---|---|
| `/api/agenda` | GET, POST | Agenda de temas. |
| `/api/documentos` | GET, POST, PATCH, DELETE | Lista y CRUD multipart de documentos. |
| `/api/files` | GET | Sirve un documento por `id` o `p`, con `Range` y `download=1`. |
| `/api/files/sign` | POST | URL firmada temporal para el visor Office. |
| `/api/auth/login` | POST | Login. |
| `/api/auth/logout` | POST | Logout. |
| `/api/auth/session` | GET | Usuario de la sesión. |

## Desarrollo local

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`.

- Credenciales iniciales: `admin@falpat.com` / `falpat-admin-2026`.
- En Windows, `dev` y `build` usan `--webpack`; el warning de SWC es inofensivo.
- Sin `GITHUB_TOKEN` se usa almacenamiento local (`data/` y `documentos/`).

## Verificación

```bash
npm run lint
npx tsc --noEmit
npm run build
```

> Ejecutar `tsc` después de `next build` para evitar errores por `.next/types` regenerados.

## Deploy en Vercel

1. Importar el repositorio en Vercel.
2. Configurar `AUTH_SECRET`, `GITHUB_TOKEN`, `GITHUB_REPO` (y opcionalmente `GITHUB_BRANCH`).
3. Deploy. Verificar login, alta de un documento y apertura desde `/documentoteca`.

## Estructura

```
data/                  # agenda.json, documentos.json, usuarios.json
documentos/            # archivos subidos (repo, servidos por /api/files)
src/
  app/                 # páginas y API routes
  components/          # UI (Sidebar, AgendaTable, DocumentoManager, etc.)
  lib/                 # documentos, doc-files, github, files, session, users
  proxy.ts             # protección de rutas
```

---

**Grupo Falpat SRL** – Área de Certificación/SGC  
Planta de cemento | Campana | Luján
