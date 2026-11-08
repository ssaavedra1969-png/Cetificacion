export type Rol = "admin" | "editor" | "lector";

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  plantas: string[];
  activo: boolean;
  salt: string;
  passwordHash: string;
  creadoEl: string;
  ultimoAcceso?: string;
}

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
  ruta?: string;
  tipo: "pdf" | "word" | "excel" | "imagen" | "otro";
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
