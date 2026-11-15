# Manual de Usuario — Portal SGC Grupo Falpat

**Sitio:** https://cetificacion.vercel.app/
**Versión:** 1.0 · Noviembre 2026
**Empresa:** Grupo Falpat S.R.L. · ISO 9001:2026

---

## 1. Acceso al sistema

1. Ingresá a https://cetificacion.vercel.app/
2. Hacé clic en **Ingresar** (esquina superior derecha).
3. Ingresá tu usuario y contraseña.
4. La sesión se mantiene mediante una cookie segura (`sgc_session`).

### Roles y permisos

| Rol | Ver documentos | Subir/editar documentos | Editar temas | Editar plan de trabajo | Eliminar documentos |
|---|---|---|---|---|---|
| **Lector** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Editor** | ✅ | ✅ (solo sus plantas) | ✅ | ✅ | ❌ |
| **Administrador** | ✅ | ✅ (todas las plantas) | ✅ | ✅ | ✅ |

- **Plantas:** Campana, Luján, General. Un editor solo puede modificar documentos cuya planta coincida con las que tiene asignadas (o "General").
- Los administradores tienen acceso total, incluyendo eliminar documentos y temas.
- Si intentás una acción sin permiso, el sistema responde "No tenés permisos para modificar documentos".

---

## 2. Navegación

Barra lateral (Sidebar) con las siguientes secciones:

- **Inicio** — panel principal con accesos rápidos.
- **Documentoteca SGC** — repositorio central de documentos.
- **Mapa SGC** — mapa de procesos + árbol de documentos.
- **Plan de Trabajo** — línea de tiempo (Gantt) de implementación ISO 9001:2026.
- **Administración** — gestión de temas y documentos (solo editores/admin).
- **Cerrar sesión**.

---

## 3. Documentoteca SGC

URL: `/documentoteca`

### 3.1 Consultar documentos

- **Categorías:** cuadrícula con 10 categorías (Manual del SGC, Documentos de Calidad, Procedimientos Generales, Procedimientos Operativos, Instructivos de Trabajo, Formularios, Registros de Calidad, Documentos Externos, Soporte, Obsoletos). Hacé clic para filtrar.
- **Buscador:** por nombre, categoría, planta, responsable.
- **Filtros:** planta (Campana/Luján/General) y tipo de archivo (PDF, Word/Excel, Imágenes).
- **Contador:** "Mostrando X de Y documentos".

### 3.2 Acciones por documento (botones en cada fila)

| Botón | Acción |
|---|---|
| 👁 **Ver** (cyan) | Abre el visor integrado (PDF/imagen/Office). |
| 📄 **PDF** (gris) | Abre la vista tipo PDF en página completa. |
| ⬇ **Descargar** (gris) | Descarga el archivo original. |
| ✏ **Editar** (amber) | Abre el editor (solo editores/admin). Navega a Administración con el documento cargado. |
| 📦 **Obsoletos** (gris) | Mueve el documento a la categoría "Obsoletos" (solo editores/admin). |
| 🗑 **Eliminar** (rojo) | Elimina definitivamente el documento y su archivo (solo admin, con confirmación). |

### 3.3 Editar un documento

1. Hacé clic en ✏ **Editar** (requiere permiso de edición sobre la planta del documento).
2. Se abre la Administración con el formulario de edición cargado automáticamente.
3. Modificá los campos necesarios (nombre, categoría, planta, versión, responsable, fecha, descripción).
4. Para **reemplazar el archivo**, seleccioná uno nuevo (máx. 4 MB). Si el archivo supera 4 MB o ya está en Drive, pegá el enlace en **"O enlace externo (Google Drive, etc.)"**.
5. Hacé clic en **Guardar cambios**.

> **Nota:** la edición solo se habilita si tu rol es editor/admin y la planta del documento está entre tus plantas asignadas (o es "General"). Los administradores pueden editar cualquier documento.

---

## 4. Administración SGC

URL: `/administracion` (requiere login como editor o admin)

### 4.1 Temas y Puntos de Control

- Grilla de tarjetas con todos los temas (P001..P028).
- Hacé clic en una tarjeta para **editar** el tema (modal).
- **+ Adjuntar doc** sube un documento vinculado al tema.
- **+ Nuevo tema** crea un tema nuevo.

### 4.2 Gestor de Documentos (sección "Carga de documentos")

- **Subir documento:** arrastrá un archivo o explorá. Completá nombre (obligatorio) y opcionalmente categoría, planta, tema, versión, responsable, fecha, descripción.
- **Límite de subida:** 4 MB por archivo (límite de Vercel). Para archivos más grandes usá el enlace externo (Drive).
- **Enlace externo:** si el archivo ya está en Google Drive o supera 4 MB, pegá la URL pública en "O enlace externo" y no subas archivo.
- **Editar:** en la tabla "Documentos cargados" (desplegable), botón ✏. Requiere permiso de planta.
- **Eliminar:** botón 🗑 (solo admin).
- **Filtros:** búsqueda, planta, tipo de archivo.

### 4.3 Permisos de edición de documentos

- **Editar metadatos/archivo:** requiere rol editor o admin **y** que la planta del documento esté entre las plantas del usuario (o sea "General"). Los admin editan todo.
- **Eliminar:** solo admin.
- **Mover a Obsoletos:** editores/admin con permiso de planta.
- Si no tenés permiso, el botón ✏ no aparece o el sistema rechaza la operación con HTTP 403.

---

## 5. Plan de Trabajo (línea de tiempo)

URL: `/plan`

### 5.1 Lectura

- **KPIs:** avance general (%), tareas terminadas/en curso/pendientes/bloqueadas, atrasadas.
- **Sección "Atención":** lista de tareas atrasadas y las que vencen esta semana, con botón **Terminar**.
- **Bloques:** cada bloque (1..6) es colapsable. Muestra progreso (%), cantidad de tareas, fechas. Hacé clic en el bloque para expandir/colapsar.
- **Tareas:** código, nombre, responsable, estado (píldora de color), % de avance, fechas. Hacé clic en la píldora de estado para ciclar: Pendiente → En curso → Terminado.
- **Gantt:** sección plegable "Línea de tiempo (Gantt)" con barras por tarea y bloque.

### 5.2 Edición (solo editores/admin)

- **Editar estructura:** botón "Editar estructura" abre el editor de tabla (agregar/quitar bloques y tareas, modificar fechas, semanas, hitos, observaciones).
- **Edición rápida por tarea:** botón ✏ en cada tarea abre un modal con campos: código, tarea, responsable, estado, avance %, inicio, semanas, hito, observaciones. Guardar aplica el cambio.
- **Marcar terminada:** botón ✓ en la sección "Atención" o en cada tarea (cuando no está terminada) marca estado=Terminado y avance=100%.
- **Ciclar estado:** clic en la píldora de estado cambia el estado y actualiza el avance (Terminado → 100%).
- Los cambios se guardan en `data/plan.json` y se publican en GitHub (prod).

### 5.3 Permisos del plan

- Ver: todos los usuarios autenticados (y anónimos en prod).
- Editar (estructura, tareas, estados, avances): solo editores y administradores. Los lectores ven el plan en modo solo lectura (sin botones de edición).

---

## 6. Mapa SGC

URL: `/mapa`

- **Mapa de procesos:** tarjetas de procesos estratégicos, de realización y de apoyo. Hacé clic para filtrar el árbol por código (ej. "PG 06").
- **Filtros (chips):** Todos, Manual, Documentos de Calidad, Procedimientos Generales, etc. El árbol inferior siempre muestra todos los documentos; el filtro **marca en cyan** los que coinciden y atenúa el resto.
- **Botón Limpiar:** restablece categoría y búsqueda.
- **Búsqueda:** por código, nombre o carpeta.
- **Árbol:** carpetas colapsables con conteo; documentos con código de color, nombre, ruta y acciones (Ver/Descargar/Editar/Eliminar/Obsoletos) según permisos.

---

## 7. Carga de documentos — límites y buenas prácticas

- **Tamaño máximo por subida:** 4 MB (límite de Vercel para funciones serverless).
- **Tipos permitidos:** PDF, Word (.doc/.docx), Excel (.xls/.xlsx/.csv), imágenes (.png/.jpg/.jpeg/.webp/.gif).
- **Archivos grandes (>4 MB):** subí el archivo a Google Drive y pegá el enlace público en "O enlace externo". El portal guardará solo el enlace y el documento será accesible desde ahí.
- **Archivos ya en el repositorio (SGC):** se sirven desde `/api/files?id=...`. Todos los 450 documentos actuales son accesibles (verificado).

---

## 8. Solución de problemas

| Problema | Causa | Solución |
|---|---|---|
| "No tenés permisos para modificar documentos" | Rol lector o planta no asignada | Pedí al admin que te asigne el rol/planta correcta. |
| El botón ✏ no aparece | Rol lector | Iniciá sesión con usuario editor/admin. |
| "El archivo supera el máximo de 4 MB" | Archivo muy grande | Usá el enlace externo (Drive) o comprimí el archivo. |
| No se abre el editor al hacer clic en ✏ (Documentoteca) | Navegación SPA | Recargá la página de Administración; el editor se abre automáticamente con `?doc=`. |
| Plan no guarda cambios | Sesión expirada | Volvé a ingresar. |
| Documento no se visualiza | Archivo >4,5 MB en Vercel (casos antiguos) | Verificá el enlace; si es externo, abrirá Drive. |
| "Sin resultados" en el Mapa | Filtro muy restrictivo | Usá "Limpiar". |

---

## 9. Respaldos y versionado

- El código y los documentos (carpetas `Manuales/`, `SGC/`, `analisis_registros/`) están versionados en GitHub: https://github.com/ssaavedra1969-png/Cetificacion
- Ramas: `main` (producción), `desarrollo` (preview).
- Los archivos `registros.duckdb` y basura de Office se excluyen del repositorio (regenerables).
- Respaldos locales: carpeta `Manuales/` (original, no modificar).

---

## 10. Contacto

- Web: https://hormigon.grupofalpat.com.ar/
- Tel: +54 11 3197-2072
- Instagram: @grupofalpat
- Portal: https://cetificacion.vercel.app/
