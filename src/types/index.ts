// ============================================================================
// TIPOS Y MODELOS TYPESCRIPT: DOMINIO 1 Y 2 (DESIGNACIONES BACKEND)
// Basado en DTO_FRONTEND_DOMINIOS_1_Y_2.md
// ============================================================================

export type RolUsuario =
  | 'SUPERUSER'
  | 'PRESIDENTE'
  | 'SECRETARIO'
  | 'DESIGNADOR'
  | 'ARBITRO';

export type CategoriaArbitro =
  | 'AVANZADO'
  | 'INTERMEDIO'
  | 'PRINCIPAL_1'
  | 'PRINCIPAL_2'
  | 'PRINCIPAL_3'
  | 'PRINCIPAL_4'
  | 'ASISTENTE'
  | 'INICIAL';

export type CategoriaCancha = 'FUTBOL_11' | 'FUTBOL_10' | 'FUTBOL_9';

export type EtapaCampeonato =
  | 'FECHA_NORMAL'
  | 'FECHA_PICANTE'
  | 'CLASIFICACION'
  | 'CRUCES'
  | 'SEMIFINAL'
  | 'FINAL';

export enum EstadoDesignacion {
  PENDIENTE = 0,
  ACEPTADA = 1,
  FINALIZADA = 2,
  CANCELADA = 3,
  SUSPENDIDA_EN_JUEGO = 4,
}

export enum TipoSuspencion {
  LLAMADO_ATENCION = 1,
  SUSPENCION = 2,
}

// ----------------------------------------------------------------------------
// ESTRUCTURAS COMUNES
// ----------------------------------------------------------------------------

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// ----------------------------------------------------------------------------
// DOMINIO 1: ÁRBITROS, AUTH & SEGURIDAD
// ----------------------------------------------------------------------------

export interface AuthLoginRequest {
  whatsapp: string;
  contrasenia: string;
}
export type LoginRequest = AuthLoginRequest;

export interface AuthResponse {
  username: string;
  message: string;
  jwt: string;
  status: boolean;
  roles: RolUsuario[];
  idArbitro: number;
  nombreCompleto: string;
}
export type LoginResponse = AuthResponse;

export interface ArbitroDTO {
  nombre: string;
  apellido: string;
  whatsapp: string;
  contrasenia?: string;
  estado?: boolean;
  estadoSistema?: boolean;
  disponibleSabado?: boolean;
  disponibleDomingo?: boolean;
  talleShort?: string;
  talleCamiseta?: string;
  categoria?: CategoriaArbitro | string;
  tieneAuto?: boolean;
  roles?: RolUsuario[] | string[];
}

export interface GetArbitroDTO {
  idArbitro: number;
  nombre: string;
  apellido: string;
  whatsapp: string;
  disponibleSabado: boolean;
  disponibleDomingo: boolean;
  talleShort: string | null;
  talleCamiseta: string | null;
  categoria: CategoriaArbitro | null;
  tieneAuto: boolean;
  estadoSistema: boolean;
  roles: RolUsuario[];
}
export type Arbitro = GetArbitroDTO;

export interface ArbitroDisponibilidadDTO {
  estado?: boolean;
  disponibleSabado: boolean;
  disponibleDomingo: boolean;
}

export interface CambiarContraseniaDTO {
  contraseniaActual: string;
  nuevaContrasenia: string;
}

export interface ActualizarRolesDTO {
  roles: RolUsuario[];
}

export interface ActualizarRolesBulkDTO {
  idArbitro: number;
  roles: RolUsuario[];
}

export interface SuspencionDTO {
  fechaIncidente: string;
  cantidadDias: number;
  motivo: string;
  tipoSuspencion: TipoSuspencion;
  arbitro: number; // ID árbitro
  cancha: number;  // ID cancha
}

export interface GetSuspencionDTO {
  idSuspencion: number;
  fechaIncidente: string;
  fechaFin: string;
  fechaRegistro: string;
  cantidadDias: number;
  motivo: string;
  tipoSuspencion: TipoSuspencion;
  arbitro: GetArbitroDTO;
  cancha: GetCanchaDTO;
}
export type Suspencion = GetSuspencionDTO;

export interface EstadoCuentaArbitroDTO {
  idArbitro: number;
  nombreCompleto: string;
  totalDeudaPrestamos: number;
  prestamosActivosCount: number;
  prestamosPendientes: GetPrestamoResumenDTO[];
  totalGastosConRecuperoPendientes: number;
}

export interface GetPrestamoResumenDTO {
  idPrestamo: number;
  montoSolicitado: number;
  montoDevuelto: number;
  estado: string;
  fechaSolicitud: string | null;
}

export interface GetEstadisticasArbitroDetalleDTO {
  idArbitro: number;
  nombreCompleto: string;
  totalDesignaciones: number;
  totalPartidosDirigidos: number;
  totalMontoPercibido: number;
  designacionesPorEstado: Record<string, number>;
  estadisticasCanchas: PageResponse<CanchaEstadisticaDTO>;
  designacionesPorCategoria: Record<string, number>;
}

// ----------------------------------------------------------------------------
// DOMINIO 2: CANCHAS, ARANCELES & DESIGNACIONES
// ----------------------------------------------------------------------------

export interface CanchaDTO {
  nombreCancha: string;
  categoria: CategoriaCancha;
  fueraDeJuego: boolean;
  estado: boolean;
  necesitaViaje: boolean;
}

export interface GetCanchaDTO {
  idCancha: number;
  nombreCancha: string;
  categoria: CategoriaCancha;
  fueraDeJuego: boolean;
  estado: boolean;
  necesitaViaje: boolean;
}
export type Cancha = GetCanchaDTO;

export interface CanchaEstadisticaDTO {
  idCancha: number;
  nombreCancha: string;
  detalleDesignacion: string;
  totalDesignaciones: number;
  totalPartidos: number;
  totalDesignacionesFinalizadas: number;
}

export interface ArancelDTO {
  descripcion: string;
  monto: number;
  fechaVigencia: string;
  cantidadPartidos: number;
  idCancha: number;
}

export interface GetArancelDTO {
  idArancel: number;
  descripcion: string;
  montoTotal: number;
  precioPorPartido: number;
  fechaVigencia: string;
  cantidadPartidos: number;
  activo: boolean;
  cancha: GetCanchaDTO;
}

export interface CalculoArancelResponse {
  idCancha: number;
  cantidadPartidos: number;
  arbitrosNecesarios: number;
  montoPorArbitro: number;
}

export interface DesignacionDTO {
  idCancha: number;
  fecha: string;
  cantidadPartidos: number;
  etapaCampeonato: EtapaCampeonato;
  detalle?: string;
  editable?: boolean;
  estadoDesignacion?: EstadoDesignacion;
}

export interface GetDesignacionDTO {
  idDesignacion: number;
  fecha: string;
  cancha: GetCanchaDTO | null;
  etapaCampeonato: EtapaCampeonato;
  cantidadPartidos: number;
  estadoDesignacion: EstadoDesignacion;
  detalleDesignacion: string;
  editable: boolean;
  // Campos de compatibilidad opcionales
  idCanchaH?: number;
  detalleExtra?: string;
}
export type Designacion = GetDesignacionDTO;

export interface DesignacionResumenDTO {
  idDesignacion: number;
  fecha: string;
  nombreCancha: string;
  etapaCampeonato: string;
  cantidadPartidos: number;
  estadoDesignacion: string;
  categoriaArbitroEnDesignacion?: string;
  partidosDirigidos?: number;
  detalle?: string;
  montoPercibido?: number;
}

export interface GetDesignadosDTO {
  idDesignados: number;
  arbitro: GetArbitroDTO;
  partidosDirigidos: number;
  montoPercibido: number;
  idDesignacion: number;
}
export type Designados = GetDesignadosDTO;

export interface ArbitroEstadisticaDTO {
  idArbitro: number;
  nombreCompleto: string;
  totalDesignaciones: number;
  totalPartidosDirigidos: number;
  totalMontoPercibido: number;
}

export interface GetEstadisticasDesignacionesDTO {
  totalDesignaciones: number;
  totalPartidosDirigidos: number;
  designacionesPorEstado: Record<string, number>;
  estadisticasArbitros: ArbitroEstadisticaDTO[];
  estadisticasCanchas: CanchaEstadisticaDTO[];
  designacionesPorCategoriaArbitro: Record<string, number>;
}

export interface GetComparacionEstadisticasArbitrosDTO {
  comparacionArbitros: ArbitroComparacionDTO[];
}

export interface ArbitroComparacionDTO {
  idArbitro: number;
  nombreCompleto: string;
  totalDesignaciones: number;
  totalPartidosDirigidos: number;
  totalMontoPercibido: number;
  designacionesPorEstado: Record<string, number>;
  designacionesDetalle: DesignacionResumenDTO[];
}

// ----------------------------------------------------------------------------
// SESIÓN DE USUARIO
// ----------------------------------------------------------------------------

export interface AuthUser {
  idArbitro: number;
  nombreCompleto: string;
  nombre?: string;
  apellido?: string;
  roles: RolUsuario[];
  username: string;
  categoria?: CategoriaArbitro;
}
