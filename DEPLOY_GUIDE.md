# Portal SGC – Grupo Falpat SRL
## Repositorio: https://github.com/ssaavedra1969-png/Cetificacion.git

> **Nota (nov 2026):** para el estado actual y cómo continuar desde otra máquina, ver [`INSTRUCCIONES.md`](./INSTRUCCIONES.md). Este documento describe el deploy original en Vercel.

Estado actual: ✅ Código subido a GitHub con todos los archivos del proyecto.

---

## PRÓXIMOS PASOS PARA DEPLOY EN VERCEL (GRATIS)

### Paso 1: Importar repositorio en Vercel
1. Ir a https://vercel.com y crear cuenta gratuita
2. Hacer clic en "New Project"
3. Importar repositorio GitHub: `ssaavedra1969-png/Cetificacion`
4. Vercel detectará automáticamente Next.js

### Paso 2: Configurar variables de entorno en Vercel
En la configuración del proyecto (Settings > Environment Variables), agregar:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `GITHUB_TOKEN` | `ghp_TU_TOKEN_AQUI` | Token personal de GitHub con permisos `repo` (generar en: https://github.com/settings/tokens -> select repo scope) |
| `GITHUB_REPO` | `grupo-falpat/portal-sgc` | Repositorio donde se commitearán los PDFs y JSONs |
| `ADMIN_PASSWORD` | `falpat-admin-2026` | Contraseña para acceder al área de administración (cambiar por una segura) |

### Paso 3: Deploy
1. Hacer clic en "Deploy"
2. Vercel ejecutará `npm install` y `npm run build`
3. La aplicación estará disponible en una URL tipo `portal-sgc.vercel.app`

### Paso 4: Probar la aplicación
1. Acceder a la URL de Vercel
2. Navegar por Dashboard, Agenda y Documentoteca
3. Probar login administración con la contraseña configurada
4. Probar subida de PDF (debería commitear automáticamente al repositorio)

---

## ESTRUCTURA ACTUAL DEL REPOSITORIO

### Confirmación de push reciente
```
git push -u origin main
To https://github.com/ssaavedra1969-png/Cetificacion.git
   a51d1e1..54af9bd  main -> main
branch 'main' set up to track 'origin/main'.
```

### Archivos subidos (30 archivos)
- data/agenda.json - 10 puntos SGC seed data
- data/documentos.json - Catálogo de documentos y categorías
- src/app/layout.tsx - Layout principal con metadata en español
- src/app/page.tsx - Página Dashboard con KPIs
- src/app/administracion/page.tsx - Área de administración con CRUD
- src/app/documentoteca/page.tsx - Documentoteca con filtros
- src/app/login/page.tsx - Login de autenticación
- src/app/api/agenda/route.ts - API para lectura/escritura agenda
- src/app/api/documentos/route.ts - API para lectura/escritura documentos
- src/app/api/login/route.ts - API de autenticación por contraseña
- src/app/api/upload/route.ts - Serverless function para subida PDFs via GitHub API
- src/components/KPIs.tsx - Componentes KPIs del dashboard
- src/components/AgendaTable.tsx - Tabla de puntos SGC (vista tabla y tarjetas)
- src/components/AgendaFilters.tsx - Filtros por estado/responsable/planta/categoría
- src/lib/storage.ts - Utilidades de lectura/escritura JSON
- src/types/models.ts - TypeScript interfaces PuntoSGC, Documento, HistorialCambio
- next.config.ts - Configuración Next.js con Tailwind v4
- package.json - Dependencias (next 16, react 19, tailwind 4)
- vercel.json - Configuración de despliegue Vercel
- .gitignore - Exclusiones de node_modules y builds

---

## ACEPTANCE CRITERIA - ESTADO ACTUAL

✅ Compila exitosamente y subido a GitHub
✅ Se ven los 10 puntos precargados en la agenda
✅ Dashboard con KPIs calculados (total, pendientes, en curso, bloqueados, completados, % avance)
✅ Filtros por estado, responsable, planta y categoría funcionando
✅ Documentoteca lista para listar PDFs
✅ Administración con formulario de edición de puntos
✅ Función serverless `/api/upload/pdf` preparada para GitHub API
✅ Interfaz responsive en español
✅ README con instrucciones de deploy

---

## POSIBLES PASOS DESPUÉS DEL DEPLOY

1. **Probar flujo de PDF**: Intentar subir un PDF desde la administración - debería commitear automáticamente al repositorio
2. **Ver en GitHub**: Los archivos se commitearán en `public/documentos/` y `data/documentos.json`
3. **Personalizar**: Agregar más categorías, puntos SGC o funcionalidades
4. **Autenticación**: Para producción, reemplazar contraseña simple por proveedor de identidad (Auth0, Google Workspace, etc.)
5. **Base de datos**: Si se necesita persistencia beyond files JSON, considerar PostgreSQL en Supabase (plan gratuito)

---

## NOTAS IMPORTANTES

- **PDFs subidos**: Se guardan en `public/documentos/` del repositorio con nombre `timestamp-nombre.pdf`
- **URL pública**: Después de subir, el PDF estará disponible en `https://github.com/grupo-falpat/portal-sgc/raw/main/public/documentos/filename.pdf`
- **Autenticación**: La contraseña `ADMIN_PASSWORD` debe ser la misma en Vercel variables y en el formulario de login
- **Costos**: Todo el proyecto usa servicios gratuitos: GitHub Free + Vercel Free

---
¿Necesita ayuda para algún paso específico del deploy o tiene alguna duda sobre la configuración?