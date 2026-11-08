# Instrucciones de continuidad — Portal SGC FALPAT

**Actualizado:** 8 de noviembre de 2026  
**Repositorio:** https://github.com/ssaavedra1969-png/Cetificacion (rama `main`)  
**Sitio:** https://cetificacion.vercel.app/  
**Carpeta local:** `C:\AI\Antigravity\FALPAT srl\Certificacion`

---

## 1. Estado actual

- **Layout con sidebar** (Inicio / Documentoteca / Administración). En móvil se abre como drawer.
- **Portada simplificada**: hero compacto, KPIs + filtros a la izquierda y agenda a la derecha.
- **Temas por planta** (Luján / Campana) con contadores, filtros, tabla/tarjetas y modal de detalle.
- **Documentoteca** con tipos PDF, Word, Excel e imagen.
- **CRUD completo de documentos** desde `/administracion#documentos`:
  - alta con archivo,
  - edición de metadatos y reemplazo opcional del archivo,
  - baja con borrado del archivo,
  - asociación a un tema (sincroniza `documentosIds` y el historial del punto).
- **Autenticación por usuario** con roles `admin`, `editor`, `lector` y sesión JWT en cookie `sgc_session`.
- **Persistencia**: JSON en `data/` y archivos en `documentos/`, ambos en el repositorio de GitHub en producción. En desarrollo, sin `GITHUB_TOKEN`, se guardan en el filesystem local.
- **Build y TypeScript verificados** (`npm run build` con webpack, `npx tsc --noEmit`).

> En este Windows el binario nativo de SWC falla; los scripts usan `--webpack`. El warning `@next/swc-win32-x64-msvc ... no es una aplicación Win32 válida` es inofensivo (Next cae a WASM).

---

## 2. Requisitos

- Node.js 20+ (recomendado 22 LTS) y npm.
- Git.
- En producción: repositorio de GitHub y un token con permiso **Contents: Read and write**.

---

## 3. Puesta en marcha

```powershell
git clone https://github.com/ssaavedra1969-png/Cetificacion.git
cd Cetificacion
npm install
Copy-Item .env.local.example .env.local
# Editar .env.local (ver sección 4)
npm run dev
```

Abrir `http://localhost:3000` (o el puerto que indique Next).

- `npm run dev` ejecuta `next dev --webpack`.
- Credenciales iniciales: `admin@falpat.com` / `falpat-admin-2026`. Cambiarlas en producción.

---

## 4. Variables de entorno (`.env.local`)

| Variable | Obligatoria | Ejemplo | Descripción |
|---|---|---|---|
| `AUTH_SECRET` | Sí en producción | cadena aleatoria de 48+ bytes | Firma la sesión y los enlaces temporales de archivos. Mínimo 16 caracteres. |
| `GITHUB_TOKEN` | Sí en producción | `github_pat_...` | Token con **Contents: Read and write** sobre el repo. |
| `GITHUB_REPO` | Sí en producción | `ssaavedra1969-png/Cetificacion` | Repositorio `usuario/repo`. |
| `GITHUB_BRANCH` | No | `main` | Rama de trabajo. Por defecto `main`. |

Sin `GITHUB_TOKEN`/`GITHUB_REPO` la app funciona en local y guarda en `data/` y `documentos/`.  
En Vercel ambas son obligatorias para que los cambios persistan.

---

## 5. Roles y permisos

- `admin`: puede todo, en todas las plantas.
- `editor`: solo puede modificar documentos de sus plantas (o de planta `General`).
- `lector`: solo lectura.

Los usuarios se administran en `data/usuarios.json`. Las contraseñas se guardan con hash `scrypt` y salt.

---

## 6. Flujo de documentos

1. Entrar a `/administracion` e iniciar sesión.
2. Ir al sector **Documentos**.
3. **Nuevo documento**: completar metadatos, elegir tema (opcional) y archivo.
4. **Editar**: cambiar metadatos y, si se desea, seleccionar un archivo nuevo (reemplaza al anterior).
5. **Eliminar**: borra el registro, el archivo y su vínculo con el tema.

Límites y formatos:

- Tamaño máximo: **4 MB** por archivo (límite de Vercel Hobby).
- Extensiones: `pdf`, `doc`, `docx`, `xls`, `xlsx`, `csv`, `png`, `jpg`, `jpeg`, `webp`, `gif`.
- SVG no está permitido por seguridad.
- Word/Excel se abren con el visor de Office; en `localhost` o si el visor falla, se ofrece descarga.

---

## 7. APIs

| Ruta | Método | Descripción |
|---|---|---|
| `/api/agenda` | GET / POST | Lee o guarda la agenda (POST requiere sesión). |
| `/api/documentos` | GET | Lista normalizada (`archivoUrl` → `/api/files?id=...`). |
| `/api/documentos` | POST | Alta multipart (requiere rol editor/admin). |
| `/api/documentos` | PATCH | Edición multipart por `id` (archivo opcional). |
| `/api/documentos` | DELETE | Baja por `?id=` (borra archivo y vínculos). |
| `/api/files` | GET | Sirve `?id=` o `?p=`, soporta `Range` y `download=1`. Token opcional. |
| `/api/files/sign` | POST | Devuelve URL absoluta firmada (10 min) para el visor Office. Requiere sesión. |
| `/api/auth/login` | POST | Login por email/contraseña. |
| `/api/auth/logout` | POST | Cierra sesión. |
| `/api/auth/session` | GET | Devuelve el usuario de la sesión. |

---

## 8. Estructura relevante

```
src/
  app/
    page.tsx                     # Dashboard
    documentoteca/page.tsx
    administracion/page.tsx      # Temas + DocumentoManager
    login/page.tsx
    temas/[id]/page.tsx
    documentos/[id]/page.tsx
    api/
      agenda/route.ts
      documentos/route.ts        # CRUD multipart
      files/route.ts             # stream local/GitHub + Range
      files/sign/route.ts        # URL firmada para Office
      auth/{login,logout,session}/route.ts
  components/
    Sidebar.tsx / RootShell.tsx
    AgendaTable.tsx / PuntoModal.tsx
    DocumentoManager.tsx         # UI CRUD de documentos
    DocumentoModal.tsx / DocumentoViewer.tsx
    useDocumentoEmbed.ts         # PDF/imagen/Office + firma
    Hero.tsx / KPIs.tsx
  lib/
    documentos.ts                # servicio CRUD + roles + sync agenda
    doc-files.ts                 # almacenamiento local/GitHub
    github.ts                    # API GitHub (JSON y binarios)
    files.ts                     # extensiones, MIME, tipo, tamaño
    signing.ts                   # tokens HMAC de archivos
    session.ts / users.ts / auth.ts / storage.ts / persist.ts
  proxy.ts                       # protección de rutas
data/
  agenda.json
  documentos.json
  usuarios.json
documentos/                      # archivos subidos (repo, no public/)
```

---

## 9. Verificaciones realizadas

- `npx tsc --noEmit` → OK.
- `npm run build` → OK (webpack).
- `npx eslint` sobre archivos tocados → sin errores.
- Flujo probado en local:
  - login `200`,
  - `POST /api/documentos` `201` con archivo PDF,
  - `GET /api/files?id=...` `200` con `application/pdf`,
  - `Range` → `206`,
  - `POST /api/files/sign` autenticado `200`; sin sesión `401`,
  - `PATCH` con reemplazo de archivo `200` (borra el archivo anterior),
  - `DELETE` `200` (borra archivo y registro).
- Datos y archivos de prueba eliminados al terminar.

---

## 10. Pendientes y próximos pasos

1. **Configurar `.env.local` / Vercel** con `AUTH_SECRET`, `GITHUB_TOKEN` y `GITHUB_REPO`.
2. **Cambiar la contraseña inicial** de `admin@falpat.com` y revisar `data/usuarios.json`.
3. **Commitear la carpeta `documentos/`** (vacía con `.gitkeep`) para que GitHub pueda crear archivos.
4. Verificar el visor Office en producción (Vercel) con un `.docx` y un `.xlsx` reales.
5. Evaluar auto-refresco de la agenda (hoy muestras “Actualizado al abrir”).
6. Revisar que el token de GitHub tenga solo los permisos necesarios.

---

## 11. Comandos útiles

```powershell
npx tsc --noEmit
npm run lint
npm run build
npm run dev
```

- `npm run build` usa `--webpack` en este Windows.
- Si se corre `tsc` en paralelo con `next build`, pueden aparecer errores por `.next/types`; correr `tsc` después del build.

---

## 12. Git

- **Remote:** `https://github.com/ssaavedra1969-png/Cetificacion`
- **Rama:** `main`
- Antes de empezar: `git pull origin main`.
- No se versionan `node_modules/`, `.next/` ni `.env.local`.
