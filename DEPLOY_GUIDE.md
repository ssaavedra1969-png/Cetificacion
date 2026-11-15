# Portal SGC – Grupo Falpat SRL

**Repositorio:** https://github.com/ssaavedra1969-png/Cetificacion  
**Sitio:** https://cetificacion.vercel.app/

> Para el estado actual del proyecto, roles y flujo de documentos, ver [`INSTRUCCIONES.md`](./INSTRUCCIONES.md) y [`README.md`](./README.md).

---

## Deploy en Vercel

### Paso 1: Importar el repositorio

1. Ingresar a https://vercel.com.
2. **New Project** → importar `ssaavedra1969-png/Cetificacion`.
3. Vercel detecta Next.js automáticamente.

### Paso 2: Variables de entorno

En **Settings → Environment Variables**:

| Variable | Ejemplo | Descripción |
|---|---|---|
| `AUTH_SECRET` | cadena aleatoria de 48+ bytes | Firma de sesión y URLs de archivo. Mínimo 16 caracteres. |
| `GITHUB_TOKEN` | `github_pat_...` | Token con **Contents: Read and write** sobre el repo. |
| `GITHUB_REPO` | `ssaavedra1969-png/Cetificacion` | Repositorio `usuario/repo`. |
| `GITHUB_BRANCH` | `main` | Opcional. Rama de trabajo. |

Generar `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Paso 3: Deploy

1. **Deploy**. Vercel ejecuta `npm install` y `npm run build`.
2. La app queda disponible en la URL del proyecto.

### Paso 4: Verificar

1. Abrir `/login` e ingresar con el usuario administrador.
2. Ir a `/administracion#documentos` y cargar un documento de prueba.
3. Verificar que el archivo aparece en `documentos/` del repositorio y que el JSON se actualizó.
4. Abrir el documento desde `/documentoteca`.

---

## Ramas y despliegue a producción

Este proyecto usa **dos ramas** y es la causa más frecuente de confusión al publicar.

| Rama | Rol en Vercel | Contenido |
|---|---|---|
| `main` | **Producción** (`https://cetificacion.vercel.app/`) | Versión pública. Vercel solo despliega a producción desde acá. |
| `desarrollo` | **Preview** | Rama de trabajo. Cada push genera un *Preview Deployment*, NO actualiza el sitio público. |

### Síntoma

> Se suben cambios a `desarrollo`, el push termina OK, pero la página pública **sigue mostrando la información anterior**.

Ocurre porque Vercel tiene configurada la *Production Branch* = `main`. La rama `desarrollo` solo produce previews; el sitio público no se toca.

### Solución (promover `desarrollo` a producción)

Desde la raíz del repositorio:

```powershell
# 1. Verificar que el avance sea directo (sin conflictos)
git merge-base --is-ancestor main desarrollo; if ($?) { "FAST-FORWARD OK" }

# 2. Llevar main al nivel de desarrollo
git checkout main
git merge --ff-only desarrollo

# 3. Publicar main en GitHub (dispara el deploy de producción)
git push origin main

# 4. Forzar el deploy a producción en Vercel (opcional pero recomendado)
vercel --prod --confirm

# 5. Volver a la rama de trabajo
git checkout desarrollo
```

Salida esperada del paso 4:

```
▲ Production  https://cetificacion-<hash>-<usuario>.vercel.app
▲ Aliased     https://cetificacion.vercel.app
✓ Ready in 1m
```

### Alternativa desde el panel de Vercel

1. Ir a https://vercel.com/ssaavedra1969-png/cetificacion → **Deployments**.
2. Ubicar el deployment de `desarrollo`.
3. Menú **⋯ → Promote to Production**.

O bien, en **Settings → Git → Production Branch**, cambiar de `main` a `desarrollo` para que cada push a esa rama publique directo (no recomendado si se quiere mantener `main` como rama estable).

### Verificar que quedó bien

```powershell
# Debe coincidir con la cantidad de documentos importados (hoy: 450)
$j = Get-Content -Raw "data\documentos.json" | ConvertFrom-Json; $j.documentos.Count
```

Luego abrir https://cetificacion.vercel.app/ y confirmar que aparece el catálogo nuevo.

### Notas

- Si `git merge --ff-only` falla, hay divergencia entre ramas: resolver con un merge normal (`git merge desarrollo`) antes de publicar.
- `main` **no** se debe tocar con `git checkout main` + edición directa: todo el trabajo va en `desarrollo` y se promueve a `main` al publicar.
- Los archivos >4,5 MB no se sirven por la función serverless de Vercel (ver límite en la sección *Persistencia*).

---

## Persistencia

- **Metadatos:** `data/agenda.json`, `data/documentos.json`, `data/plan.json`, `data/usuarios.json`.
- **Archivos:** `documentos/` en la raíz del repositorio.
- **Escritura:** API de GitHub (`Contents`), tanto para JSON como para binarios.
- **Límite:** 10 MB por archivo (`MAX_UPLOAD_BYTES`); en Vercel el cuerpo de la función está limitado a ~4,5 MB.

En desarrollo, sin `GITHUB_TOKEN`, los datos se guardan localmente en el filesystem.

---

## Notas

- La carpeta `documentos/` debe existir en el repositorio (incluye un `.gitkeep`).
- No commitear `.env.local` ni tokens.
- Cambiar la contraseña inicial de `admin@falpat.com` antes de usar en producción.
- El token de GitHub debería limitarse al repositorio del portal y al permiso **Contents: Read and write**.
