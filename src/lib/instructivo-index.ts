export interface InstructivoItem {
  id: string;
  titulo: string;
  texto: string;
  keywords?: string[];
}

export const INSTRUCTIVO_INDEX: InstructivoItem[] = [
  { id: "sec-acceso", titulo: "1. Acceso al sistema", texto: "Ingresá a certificacion.vercel.app. Hacé clic en Ingresar. Ingresá tu usuario y contraseña. La sesión se mantiene mediante cookie segura sgc_session." },
  { id: "sec-navegacion", titulo: "2. Navegación", texto: "Inicio panel principal accesos rápidos. Documentoteca SGC repositorio central. Mapa SGC mapa de procesos árbol. Plan de Trabajo línea de tiempo Gantt. Administración gestión de temas y documentos. Instructivo manual." },
  { id: "sec-roles", titulo: "Roles y permisos", texto: "Lector ve documentos. Editor sube y edita documentos de sus plantas, edita temas y plan. Administrador acceso total incluyendo eliminar. Plantas Campana Luján General. Sin permiso HTTP 403." },
  { id: "sec-documentoteca", titulo: "3. Documentoteca SGC", texto: "Consultar 10 categorías buscador por nombre categoría planta responsable filtros por planta y tipo. Acciones por documento Ver PDF Descargar Editar Obsoletos Eliminar. Editar clic en lápiz Administración formulario cargado reemplazar archivo máximo 4 MB enlace externo Drive." },
  { id: "sec-documentoteca-3.1", titulo: "3.1 Consultar documentos", texto: "Categorías buscador filtros contador Mostrando X de Y documentos." },
  { id: "sec-documentoteca-3.2", titulo: "3.2 Acciones por documento", texto: "Ver visor integrado PDF vista completa Descargar archivo original Editar solo editores admin permiso de planta Obsoletos mover a obsoletos Eliminar solo admin confirmación." },
  { id: "sec-documentoteca-3.3", titulo: "3.3 Editar un documento", texto: "Clic en Editar requiere permiso edición planta. Se abre Administración formulario. Modificá campos nombre categoría planta versión responsable fecha descripción. Reemplazar archivo máx 4 MB. Enlace externo Drive. Guardar cambios." },
  { id: "sec-administracion", titulo: "4. Administración SGC", texto: "URL administracion requiere editor o admin. Temas grilla tarjetas P001..P028 clic para editar. Adjuntar doc sube documento vinculado. Nuevo tema crea tema. Documentos subir arrastrar explorar máx 4 MB editar eliminar solo admin filtros búsqueda planta tipo. Enlace externo si supera 4 MB o está en Drive pegá URL." },
  { id: "sec-plan", titulo: "5. Plan de Trabajo", texto: "URL plan. Lectura KPIs avance terminadas en curso pendientes bloqueadas atrasadas. Sección Atención atrasadas esta semana. Bloques colapsables tareas. Gantt arriba barras hoy leyenda. Edición editores admin Editar estructura tabla. Edición rápida por tarea modal. Marcar terminada. Ciclar estado clic píldora. Permisos ver todos editar solo editores admin." },
  { id: "sec-mapa", titulo: "6. Mapa SGC", texto: "URL mapa. Mapa de procesos tarjetas procesos estratégicos realización apoyo. Clic para filtrar árbol por código. Filtros chips Todos Manual Documentos de Calidad. Árbol siempre muestra todos filtro marca cyan atenúa resto. Botón Limpiar restablece categoría y búsqueda. Búsqueda por código nombre carpeta." },
  { id: "sec-limites", titulo: "7. Carga de documentos límites y buenas prácticas", texto: "Tamaño máximo 4 MB por subida límite de Vercel. Tipos permitidos PDF Word Excel imágenes. Archivos grandes subí a Drive y pegá enlace en O enlace externo. Documentos actuales 450 todos accesibles desde api files." },
  { id: "sec-problemas", titulo: "8. Solución de problemas", texto: "No tenés permisos rol lector o planta no asignada pedí admin rol planta. Botón editar no aparece rol lector iniciá sesión editor admin. Archivo supera 4 MB archivo muy grande usá enlace externo Drive o comprimí. No se abre el editor navegación SPA recargá Administración se abre con doc. Plan no guarda sesión expirada volvé a ingresar. Sin resultados en Mapa filtro restrictivo usá Limpiar." },
  { id: "sec-respaldos", titulo: "9. Respaldos y versionado", texto: "Código y documentos versionados en GitHub ramas main producción desarrollo preview. Respaldos locales carpeta Manuales original no modificar." },
];
