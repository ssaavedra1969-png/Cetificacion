export interface HistorialCambio {
  fecha: string;
  usuario: string;
  campo: string;
  valorAnterior: string;
  valorNuevo: string;
}

export interface Documento {
  id: string;
  nombre: string;
  categoria: string;
  puntoId: string;
  planta: string;
  fecha: string;
  version: string;
  responsable: string;
  descripcion: string;
  archivoUrl: string;
  tipo: "pdf" | "imagen" | "otro";
}

export interface PuntoSGC {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  plantas: string[];
  responsable: string;
  prioridad: "alta" | "media" | "baja";
  estado: "Pendiente" | "En curso" | "Bloqueado" | "Completado";
  fechaCompromiso?: string;
  fechaActualizacion: string;
  notas: string;
  documentosIds: string[];
  historial: HistorialCambio[];
}
