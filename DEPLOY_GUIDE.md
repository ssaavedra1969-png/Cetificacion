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

## Persistencia

- **Metadatos:** `data/agenda.json`, `data/documentos.json`, `data/usuarios.json`.
- **Archivos:** `documentos/` en la raíz del repositorio.
- **Escritura:** API de GitHub (`Contents`), tanto para JSON como para binarios.
- **Límite:** 4 MB por archivo (Vercel Hobby).

En desarrollo, sin `GITHUB_TOKEN`, los datos se guardan localmente en el filesystem.

---

## Notas

- La carpeta `documentos/` debe existir en el repositorio (incluye un `.gitkeep`).
- No commitear `.env.local` ni tokens.
- Cambiar la contraseña inicial de `admin@falpat.com` antes de usar en producción.
- El token de GitHub debería limitarse al repositorio del portal y al permiso **Contents: Read and write**.
