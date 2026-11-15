# Documentación — Portal SGC Grupo Falpat SRL

Manual completo del portal de certificación ISO 9001:2026 de **Grupo Falpat SRL**
(Hormigones — plantas de **Campana** y **Luján**).

- **Producción:** https://cetificacion.vercel.app/
- **Repositorio:** https://github.com/ssaavedra1969-png/Cetificacion (privado)
- **Ramas:** `main` = producción · `desarrollo` = preview/trabajo
- **Última actualización:** 15 de noviembre de 2026

> Documentos relacionados: [`README.md`](./README.md) (resumen), [`INSTRUCCIONES.md`](./INSTRUCCIONES.md) (continuidad),
> [`DEPLOY_GUIDE.md`](./DEPLOY_GUIDE.md) (deploy y ramas).

---

## 1. Resumen

Portal interno que centraliza el Sistema de Gestión de la Calidad (SGC):

- **Inicio**: KPIs, filtros y agenda por planta.
- **Mapa SGC**: mapa de procesos, árbol documental y chips por proceso (clicable).
- **Plan de Trabajo**: Gantt **dinámico y editable** de la implementación.
- **Documentoteca**: catálogo completo de documentos con visor y acciones.
- **Administración**: CRUD de documentos y edición de temas (según rol).

## 2. Estado actual (datos)

| Métrica | Valor |
|---|---|
| Documentos en el catálogo | **450** |
| Categorías | **10** |
| Puntos de agenda (temas) | **28** |
| Tareas del Plan de Trabajo | **47** (22 semanas) |

Distribución por categoría:

| Categoría | Documentos |
|---|---:|
| Manual del SGC | 2 |
| Documentos de Calidad | 8 |
| Procedimientos Generales | 11 |
| Procedimientos Operativos | 7 |
| Instructivos de Trabajo | 15 |
| Formularios | 36 |
| Registros de Calidad | 336 |
| Documentos Externos | 5 |
| Soporte | 4 |
| Obsoletos | 26 |
| **Total** | **450** |

## 3. Stack y arquitectura

- **Next.js 16** (App Router, webpack), **React 19**, **TypeScript**.
- **Tailwind CSS v4** (tokens `gold` / `gold-dark` / `surface` / `ink`; clases `glass`; tema oscuro).
- **Font Awesome** (incluye `fa-brands` para el enlace a Drive).
- **Persistencia:** JSON en `data/` + binarios en `documentos/`, versionados en GitHub.
  - **Desarrollo:** filesystem local.
  - **Producción (Vercel):** API de GitHub (`Contents`, read/write).
- **Deploy:** Vercel (rama `main` = producción).

## 4. Páginas

| Ruta | Descripción |
|---|---|
| `/` | Inicio: hero, KPIs, filtros y agenda por planta. |
| `/mapa` | Mapa SGC: procesos, árbol documental por categoría, chips clicables, buscador. |
| `/plan` | Plan de Trabajo (Gantt dinámico + edición). |
| `/documentoteca` | Catálogo con buscador, filtros por categoría y acciones por documento. |
| `/documentos/[id]` | Visor de documento (PDF/imagen/Office) con descarga. |
| `/temas/[id]` | Detalle de un tema de la agenda. |
| `/administracion` | CRUD de documentos y edición de temas (requiere sesión). |
| `/login` | Inicio de sesión. |

**Acciones por documento** (`AccionesDocumento.tsx`): Ver · vista PDF · Editar · Eliminar (admin) · pasar a **Obsoletos**.

## 5. Plan de Trabajo (dinámico)

El Gantt **no es una foto fija**: se calcula a partir de las fechas de las tareas.

### 5.1 Derivación automática

- **Fin de tarea** = `inicio + semanas×7 − 3 días` (lunes → viernes). `semanas = 0` o *hito* ⇒ fin = inicio.
- **Bloques (grupos)**: `inicio` = mín. de sus tareas, `fin` = máx. de sus tareas.
- **Avance del bloque** = promedio de las tareas hijas.
- **Avance general** = promedio de los bloques.
- **Rango del Gantt** (semanas/meses): desde el **lunes** del inicio mínimo hasta el fin máximo.
- **Línea de "hoy"**, resaltado de **semana actual** y marca de **tareas atrasadas** (`fin < hoy` y estado ≠ Terminado).

### 5.2 Edición (roles `admin` / `editor`)

Botón **“Editar plan”** → tabla con, por tarea: código, tarea, responsable, estado, % avance,
inicio, semanas, hito, observaciones. Permite **agregar/eliminar tareas y bloques**.
Al guardar:

- `PUT /api/plan` valida (ids únicos, fechas, avance 0–1, máximo 500 tareas) y **sanitiza**.
- Persiste en `data/plan.json` (filesystem en dev / GitHub en prod).
- El Gantt y los avances se recalculan solos.

El rol `lector` no puede editar.

### 5.3 Modelo `data/plan.json`

```jsonc
{
  "titulo": "PLAN DE TRABAJO — ...",
  "nota": "…",
  "fuente": "Plan_de_Trabajo_Falpat_Gantt.xlsx",
  "referencias": ["…"],
  "tareas": [
    {
      "id": "1",            // grupo: sin punto · tarea: "<grupo>.<n>"
      "codigo": "DC 02",
      "tarea": "Mapa de procesos",
      "responsable": "TSO (Enrique)",
      "inicio": "2026-11-16",   // YYYY-MM-DD
      "semanas": 2,             // grupo ⇒ null · hito ⇒ 0
      "estado": "En curso",     // Pendiente | En curso | Terminado | Bloqueado
      "avance": 0.5,            // 0..1
      "observaciones": "…",
      "esGrupo": false,
      "hito": false
    }
  ]
}
```

`fin`, `avanceGeneral`, `semanas[]` y `meses[]` **no se guardan**: se derivan (ver `src/lib/plan.ts`).

## 6. Documentoteca y categorías

Orden de categorías (hardcodeado en `src/app/documentoteca/page.tsx`, `ORDEN_CATEGORIAS`):

`Manual del SGC` · `Documentos de Calidad` · `Procedimientos Generales` ·
`Procedimientos Operativos` · `Instructivos de Trabajo` · `Formularios` ·
`Registros de Calidad` · `Documentos Externos` · `Soporte` · `Obsoletos`.

El **código** del documento se deriva del nombre (`MSGC 01`, `DC 02`, `PG 01`, `PO 03`,
`IT 04`, `FG 01-01`, `FO …`). Los `puntoId` están vacíos.

## 7. Modelo de datos

### `data/documentos.json` — **objeto** (no array)

```jsonc
{ "documentos": [ /* Documento */ ], "categorias": ["…"], "metadata": { … } }
```

`Documento`: `id, nombre, categoria, puntoId, planta, fecha, version, responsable,
descripcion, archivoUrl, ruta?, tipo`. `tipo` ∈ `pdf | word | excel | imagen | otro`.

### `data/agenda.json`

`{ "puntos": [ PuntoSGC ], "metadata": { … } }`. 28 puntos (`P001`…`P028`), todos `Completado`.

### `data/plan.json` — ver §5.3.

### `data/usuarios.json`

Usuarios con `rol` (`admin`/`editor`/`lector`), `plantas`, `salt` y `passwordHash` (`scrypt`).

## 8. APIs

| Ruta | Métodos | Descripción |
|---|---|---|
| `/api/agenda` | GET, POST | Agenda de temas (POST requiere sesión). |
| `/api/documentos` | GET, POST, PATCH, DELETE | Lista y CRUD multipart (escritura: editor/admin). |
| `/api/files` | GET | Sirve un documento por `?id=` o `?p=`, con `Range` y `download=1`. |
| `/api/files/sign` | POST | URL firmada temporal para el visor Office. |
| `/api/plan` | GET, PUT | Plan de Trabajo: lectura (cruda) y guardado (editor/admin). |
| `/api/auth/login` | POST | Login. |
| `/api/auth/logout` | POST | Logout. |
| `/api/auth/session` | GET | Usuario de la sesión. |

## 9. Persistencia y límites

- **Metadatos:** `data/{documentos,agenda,plan,usuarios}.json`.
- **Archivos:** `documentos/` en la raíz del repo (servidos por `/api/files`, no estáticos).
- **Escritura:** filesystem local (dev) / API de GitHub (prod).
- **Límite por archivo:** `MAX_UPLOAD_BYTES = 10 MB`; en Vercel el cuerpo de la función es ~**4,5 MB**.
  - Superan el límite en prod: `Foto Aerea.jpg` (7,30 MB), 2 informes NOYA `.docx` (4,46 / 4,35 MB) y una planilla `.xls` (3,65 MB).
- **Formatos:** PDF, Word, Excel, CSV e imágenes (SVG no permitido).
- **Rutas de archivos:** `normalizeDocumento` (`src/lib/documentos.ts`) fuerza
  `archivoUrl = /api/files?id=<id>`; `safeRelative` (`src/lib/doc-files.ts`) **antepone `documentos/`
  si falta**, de modo que las rutas importadas del SGC (sin prefijo) también se sirven.

## 10. Autenticación y roles

- Sesión **JWT** firmada con `AUTH_SECRET`, cookie `sgc_session` (HttpOnly).
- Roles: `admin` (todo) · `editor` (documentos de sus plantas) · `lector` (solo lectura).
- `src/proxy.ts` protege rutas y escrituras.

## 11. Estructura del repositorio

```
data/                     # documentos.json, agenda.json, plan.json, usuarios.json
documentos/               # binarios (repo; servidos por /api/files)
src/
  app/
    page.tsx              # Inicio
    mapa/page.tsx         # Mapa SGC
    plan/page.tsx         # Plan de Trabajo (Gantt)
    documentoteca/page.tsx
    documentos/[id]/page.tsx
    temas/[id]/page.tsx
    administracion/page.tsx
    login/page.tsx
    api/{agenda,documentos,files,files/sign,plan,auth/*}/route.ts
  components/             # Sidebar, RootShell, AgendaTable, DocumentoManager,
                          # AccionesDocumento, RepositorioPanel, DocumentoViewer,
                          # OfficePreview, PuntoModal, KPIs, Hero, …
  lib/
    documentos.ts         # servicio CRUD + roles + sync agenda
    doc-files.ts          # almacenamiento local/GitHub + safeRelative
    plan.ts               # tipos + derive (semanas/meses/fin/avance)
    plan-service.ts       # validación + permiso editor
    storage.ts            # lectura (remote→fs) de agenda/documentos/plan
    persist.ts            # escritura (fs + GitHub)
    github.ts / files.ts / signing.ts / session.ts / users.ts / auth.ts / urls.ts
  proxy.ts                # protección de rutas
importar_sgc.py           # importador del SGC (ver §12)
generar_pdfs_sgc.py       # generador de PDFs del SGC
```

## 12. Importación del SGC

`importar_sgc.py` copia el árbol `SGC/` al portal, preservando subcarpetas, y regenera
`data/documentos.json`. Mapeo carpeta → categoría:

| Carpeta SGC | Categoría |
|---|---|
| `00_Manual del SGC` | Manual del SGC |
| `01_Documentos de Calidad` | Documentos de Calidad |
| `02_Procedimientos Generales` | Procedimientos Generales |
| `03_Procedimientos Operativos` | Procedimientos Operativos |
| `04_Instructivos de Trabajo` | Instructivos de Trabajo |
| `05_Formularios` | Formularios |
| `06_Registros de Calidad` | Registros de Calidad |
| `07_Documentos Externos` | Documentos Externos |
| `08_Soporte` | Soporte |
| `99_Obsoletos` | Obsoletos |

- **Excluye** scripts/sistema/junk (`*.bat`, `*.ps1`, `*.html`, `*.url`, `*.ini`, `*.lnk`, `*.db`, `~$*`, `Thumbs.db`, …).
- Rutas base en el script (`BASE_SGC`, `BASE_PORTAL`) son absolutas: **ajustar** si se ejecuta en otra máquina.
- La carpeta `Manuales/` es un **respaldo original** y no se importa.

## 13. Análisis de registros de calidad

En `analisis_registros/` (no versionado): conversión de los registros a **Parquet** y consultas
con **DuckDB**.

- `convertir_a_parquet.py` → `parquet/` (111 tablas, ~802 KB).
- `refinar_analisis.py` → `refinado/`, `consultas.sql`, `INFORME.md`, `registros.duckdb`.
- **Notas:** `pyarrow` no funciona en este Windows (bloqueo DLL) ⇒ usar DuckDB.
  La planta en `probetas` viene embebida en `Cliente` (`PLANTA: … (LUJAN)`); hay edades negativas y
  `Cumple f'c (28 d)` con `—`/`SI`/`NO`.

## 14. Deploy

Ver [`DEPLOY_GUIDE.md`](./DEPLOY_GUIDE.md). Resumen:

1. Trabajar en `desarrollo`, `git push origin desarrollo`.
2. `git merge-base --is-ancestor main desarrollo` → `git checkout main` → `git merge --ff-only desarrollo` → `git push origin main`.
3. `vercel --prod --confirm` (sube el working dir completo).
4. `git checkout desarrollo`.

## 15. Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `AUTH_SECRET` | Sí (prod) | Firma de sesión y URLs; mínimo 16 caracteres. |
| `GITHUB_TOKEN` | Sí (prod) | Token con **Contents: Read and write**. |
| `GITHUB_REPO` | Sí (prod) | `usuario/repo`. |
| `GITHUB_BRANCH` | No | Rama de trabajo (por defecto `main`). |
| `ADMIN_PASSWORD` | No | Contraseña inicial del administrador. |

Copiar `.env.local.example` → `.env.local`. **Nunca** commitear `.env.local`.

## 16. Verificación

```powershell
npm run lint
npm run build          # next build --webpack
npx tsc --noEmit       # correr DESPUÉS del build
```

> En este Windows el binario nativo de SWC falla; el warning
> `@next/swc-win32-x64-msvc ... no es una aplicación Win32 válida` es inofensivo.

## 17. Respaldo local (no versionado)

Estas carpetas quedan **solo en la máquina** (no se suben al repo por tamaño/privacidad):

| Carpeta | Tamaño | Contenido |
|---|---|---|
| `Manuales/` | ~70,7 MB | Original migrado (respaldo). |
| `SGC/` | ~73,0 MB | Documentación SGC editable (fuente). |
| `analisis_registros/` | ~30,6 MB | Salidas del análisis (Parquet/DuckDB). |

## 18. Historial de cambios

| Commit | Descripción |
|---|---|
| `6c03826` | `data/documentos.json` como objeto; categorías nuevas. |
| `d027b91` | Página Mapa SGC + reimport sin scripts/sistema. |
| `ada0528` | Acciones por documento, enlace a Drive, home/mapa clicables, Manual del SGC. |
| `de25910` | Fix: rutas importadas sin prefijo `documentos/` (arregla 400 en `/api/files`). |
| `456cefb` | Página Plan de Trabajo (Gantt) + API y nav. |
| `e021d32` | Plan de Trabajo dinámico (edición en portal + persistencia + derivados). |

## 19. Pendientes / próximos pasos

1. Estrategia para archivos **> 4,5 MB** (comprimir/WebP, recomprimir docx, LFS o S3/R2/Drive).
2. Corregir detalles del análisis de registros:
   `probetas_resumen_mensual` (`strftime` con `%` literal), `temperatura_agua_limpio` (unpivot) y
   `fix_ref.py` (typo `cumpl` vs `cumple`).
3. Revisar/cambiar la contraseña inicial de administrador.
4. Evaluar auto-refresco de la agenda.
5. Confirmar si se desea versionar o respaldar aparte `Manuales/`, `SGC/` y `analisis_registros/`.

---

**Grupo Falpat SRL** – Área de Certificación/SGC
Planta de cemento · Campana · Luján
https://hormigon.grupofalpat.com.ar/ · +54 11 3197-2072 · IG @grupofalpat
