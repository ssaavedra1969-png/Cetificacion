# Instrucciones de continuidad — Portal SGC FALPAT

**Fecha:** 5 de noviembre de 2026  
**Repositorio:** https://github.com/ssaavedra1969-png/Cetificacion (rama `main`)  
**Carpeta local de referencia:** `C:\AI\Antigravity\FALPAT srl\Certificacion`

Este documento resume lo realizado y los pasos para continuar desde otra máquina.

---

## 1. Estado actual (qué quedó funcionando)

- **Dashboard con solapas Luján / Campana**: contadores y KPIs por planta.
- **Temas compartidos**: si un tema pertenece a ambas plantas, aparece en las dos solapas con la etiqueta `Compartido`.
- **Popup de detalle** (`PuntoModal`): se abre al hacer clic en el título del tema o en **Ver detalle**. Tiene solapas internas **Resumen / Documentos / Historial / Anexar**.
- **Visor de documento** (`DocumentoModal`): se abre al hacer clic en un documento; permite **Abrir** en pestaña nueva y **Descargar**.
- **Rutas**:
  - `/` dashboard
  - `/documentoteca`
  - `/temas/[id]` ficha completa del tema
  - `/documentos/[id]` visor a pantalla completa
  - `/administracion` (requiere login)
  - `/login`
- **APIs**:
  - `/api/agenda`, `/api/documentos`, `/api/session`, `/api/login`
  - `/api/files` → stream de archivos del share (soporta `Range`, `?download=1`, valida traversal y extensión)
  - `/api/anexar` → registra un documento por ruta del share o URL `http(s)`
  - `/api/upload` → flujo legacy de subida a GitHub (se mantiene por compatibilidad)
- **Branding**: header con **Sistema de Gestión de la Calidad (Certificación)** y, debajo centrado, **Quality Management System**. Se quitaron las siglas “SGC” de los textos visibles. El título de la pestaña es “Sistema de Gestión de la Calidad – Grupo Falpat SRL”.
- **Páginas de error**: `error.tsx`, `global-error.tsx`, `not-found.tsx`.
- **Build de producción verificado** con `npm run build` (webpack).
- **TypeScript** limpio (`npx tsc --noEmit`).

> En este Windows, Turbopack no funciona porque falta el binario nativo de SWC. Por eso los scripts usan `--webpack`. El warning de `@next/swc-win32-x64-msvc` es inofensivo: Next cae a WASM.

---

## 2. Requisitos en la otra máquina

- **Node.js 20+** (recomendado 22 LTS) y npm.
- **Git**.
- Acceso de red al share SMB (solo si se van a servir documentos reales).
- Windows, macOS o Linux. Los comandos de abajo son equivalentes.

---

## 3. Puesta en marcha

```powershell
git clone https://github.com/ssaavedra1969-png/Cetificacion.git
cd Cetificacion
npm install
Copy-Item .env.local.example .env.local
# Editar .env.local con los valores reales (ver sección 4)
npm run dev
```

Abrir `http://localhost:3000`.

- `npm run dev` ejecuta `next dev --webpack`.
- Si en la otra máquina Turbopack funciona bien, se puede probar `npx next dev` sin `--webpack`.

---

## 4. Variables de entorno (`.env.local`)

| Variable | Obligatoria | Ejemplo | Descripción |
|---|---|---|---|
| `SGC_SHARE_ROOT` | Sí, para documentos reales | `\\SRV-FALPAT\SGC` | Carpeta UNC del share. Si no se define, se usa `./compartido` como fallback. |
| `ADMIN_PASSWORD` | Recomendada | `falpat-admin-2026` | Contraseña de `/administracion`. Si no se define, el código usa el valor por defecto. |
| `GITHUB_TOKEN` | No | `ghp_...` | Solo para el flujo legacy `/api/upload`. |
| `GITHUB_REPO` | No | `ssaavedra1969-png/Cetificacion` | Solo para el flujo legacy. |

- `.env.local` **no** se sube al repositorio.
- `.env.local.example` sí se versiona como plantilla.
- Nunca commitear tokens ni contraseñas reales.

---

## 5. Cómo cargar y ver documentos

1. Entrar a `/administracion` e iniciar sesión (o desde el modal: **Anexar → Iniciar sesión**).
2. Abrir un tema y ir a la solapa **Anexar**.
3. Ingresar:
   - ruta relativa al share: `P001\certificado.pdf`
   - ruta UNC completa: `\\SRV-FALPAT\SGC\P001\certificado.pdf`
   - o una URL `https://...`
4. Verificar:
   - `GET /api/files?p=P001%2Fcertificado.pdf` → `200`, `application/pdf`, `Accept-Ranges: bytes`.
   - `Range: bytes=0-9` → `206` con `Content-Range`.
   - `?download=1` → `Content-Disposition: attachment`.
   - Traversal (`../`) → `400`; archivo inexistente → `404`; extensión no permitida → `400`.

---

## 6. Estructura relevante

```
src/
  app/
    page.tsx                     # Dashboard con solapas Luján/Campana
    documentoteca/page.tsx
    administracion/page.tsx
    login/page.tsx
    temas/[id]/page.tsx          # Server Component + Suspense
    documentos/[id]/page.tsx     # Server Component + Suspense
    api/
      agenda/route.ts
      documentos/route.ts
      session/route.ts
      login/route.ts
      files/route.ts             # streaming del share + Range + download
      anexar/route.ts            # alta de documento por ruta/URL
      upload/route.ts            # legacy GitHub
  components/
    AgendaTable.tsx
    AgendaFilters.tsx
    PuntoModal.tsx               # popup de detalle
    DocumentoModal.tsx           # visor dentro del popup
    DocumentoViewer.tsx          # cliente de /documentos/[id]
    TemaDetalle.tsx
    TemaPageClient.tsx           # cliente de /temas/[id]
    KPIs.tsx / Hero.tsx
  lib/
    files.ts                     # getShareRoot, resolveSharedPath, MIME
    urls.ts                      # normalizeUrl, isImageUrl, downloadUrl
    storage.ts / persist.ts / auth.ts / github.ts
  types/models.ts
data/
  agenda.json                    # 10 temas
  documentos.json                # catálogo de documentos
```

---

## 7. Verificaciones realizadas

- `npx tsc --noEmit` → OK.
- `npm run build` → OK (webpack).
- Flujo end-to-end probado:
  - login `200`
  - `POST /api/anexar` `200`
  - `GET /api/files` `200` con `content-type` correcto
  - `Range` → `206` con `Content-Range`
  - traversal → `400`, inexistente → `404`, extensión inválida → `400`
  - `/temas/P001`, `/documentos/<id>` y `/documentoteca` → `200`
- Chrome headless: solapas, modal, tabs y estado sin sesión verificados.
- Los datos de prueba y el PDF temporal se eliminaron al terminar.

---

## 8. Pendientes y próximos pasos

1. **Configurar `SGC_SHARE_ROOT`** con la UNC real del servidor de la empresa. Es el dato que falta para leer los documentos reales.
2. **Distribución de temas compartidos**: la decisión actual es mostrarlos en ambas solapas con la etiqueta `Compartido`. Si se quiere separar más, evaluar:
   - mostrarlos solo en su planta principal, o
   - agregar una tercera solapa `Compartidos`.
3. **Lint preexistente** (no bloquea el build):
   - `src/app/api/upload/route.ts` → usos de `any`.
   - `src/lib/storage.ts` → usos de `any`.
   - `src/app/api/login/route.ts`, `error.tsx`, `global-error.tsx` → variables sin usar (warnings).
   - `src/app/login/page.tsx` → `window.location.href` (warning).
4. **Flujo legacy `/api/upload`** (GitHub): convive con `/api/anexar`. Decidir si se retira o se mantiene.
5. **Deploy en Vercel**: `/api/files` necesita acceso al share, que no existe en Vercel. Opciones:
   - ejecutar la app en un servidor on-prem con acceso al share,
   - montar almacenamiento cloud (S3 / Azure Blob) y adaptar `/api/files`,
   - o usar un proxy hacia el share.
6. **Autenticación**: hoy es una cookie simple (`sgc-auth`) con `ADMIN_PASSWORD`. Para producción, evaluar un proveedor de identidad.
7. Verificar que la cuenta que corre Node tenga permisos de lectura sobre el share.

---

## 9. Comandos útiles

```powershell
npx tsc --noEmit
npm run lint
npm run build
npm run dev
```

- En Windows, `npm run build` usa `--webpack`.
- Si aparece el warning de `@next/swc-win32-x64-msvc`, es inofensivo.
- En otra máquina con el binario nativo de SWC funcionando, se puede quitar `--webpack` de los scripts.

---

## 10. Git

- **Remote:** `https://github.com/ssaavedra1969-png/Cetificacion`
- **Rama:** `main`
- Antes de empezar en la otra máquina: `git pull origin main`.
- No se versionan `node_modules/`, `.next/` ni `.env.local`.
