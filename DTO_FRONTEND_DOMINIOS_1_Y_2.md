# Especificación de DTOs y Tipos TypeScript: Dominios 1 y 2

Guía integral para el desarrollo Frontend (React, Angular, Vue, Next.js) con **TypeScript**, documentando todos los DTOs, Records de Java, tipos de retorno, enums y contratos de API correspondientes a los **Dominios 1 (Árbitros y Seguridad)** y **2 (Designaciones y Canchas)**.

---

## 1. Convenciones Globales y Estructuras Comunes

### 1.1 Configuración de Peticiones HTTP
- **Base URL**: `http://localhost:8081` (o según variable de entorno).
- **Headers Requeridos**:
  ```http
  Authorization: Bearer <TOKEN_JWT>
  Content-Type: application/json
  Accept: application/json
  ```
- **Fechas**:
  - `LocalDate`: Cadena ISO en formato `"YYYY-MM-DD"` (ej: `"2026-10-15"`).
  - `LocalDateTime`: Cadena ISO en formato `"YYYY-MM-DDTHH:mm:ss"` (ej: `"2026-10-15T14:30:00"`).
- **Importes Monetarios**:
  - En Java: `BigDecimal` con precisión de 2 decimales.
  - En TypeScript: `number`.

### 1.2 Paginación Spring Boot (`PageResponse<T>`)
Todos los endpoints paginados de Spring Data retornan la siguiente estructura estándar:

```typescript
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // Índice de página actual (0-indexed)
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
```

---

## 2. Enums del Dominio (TypeScript)

```typescript
/** Roles de usuario y seguridad en la plataforma */
export type RolUsuario =
  | 'SUPERUSER'
  | 'PRESIDENTE'
  | 'SECRETARIO'
  | 'DESIGNADOR'
  | 'ARBITRO';

/** Categorías o escalafón técnico de los árbitros */
export type CategoriaArbitro =
  | 'AVANZADO'
  | 'INTERMEDIO'
  | 'PRINCIPAL_1'
  | 'PRINCIPAL_2'
  | 'PRINCIPAL_3'
  | 'PRINCIPAL_4'
  | 'ASISTENTE'
  | 'INICIAL';

/** Modalidad o categoría del campo de juego */
export type CategoriaCancha =
  | 'FUTBOL_11'
  | 'FUTBOL_10'
  | 'FUTBOL_9';

/** Etapas o fases del campeonato deportivo */
export type EtapaCampeonato =
  | 'FECHA_NORMAL'
  | 'FECHA_PICANTE'
  | 'CLASIFICACION'
  | 'CRUCES'
  | 'SEMIFINAL'
  | 'FINAL';

/**
 * Estados numéricos de una Designación
 * 0: Pendiente a completar (sin cuadrilla completa o en borrador)
 * 1: Aceptada / Confirmada
 * 2: Jornada finalizada
 * 3: Jornada cancelada
 * 4: Suspendida en juego
 */
export enum EstadoDesignacion {
  PENDIENTE = 0,
  ACEPTADA = 1,
  FINALIZADA = 2,
  CANCELADA = 3,
  SUSPENDIDA_EN_JUEGO = 4
}

/** Tipos de sanción disciplinaria */
export enum TipoSuspencion {
  LLAMADO_ATENCION = 1,
  SUSPENCION = 2
}
```

---

## 3. Dominio 1: Árbitros y Seguridad

Comprende autenticación, roles, perfil personal (`/me`), disponibilidad semanal, sanciones/suspensiones y estado de cuenta individual.

### 3.1 Interfaces TypeScript (Entrada y Salida)

```typescript
// ==========================================
// AUTENTICACIÓN
// ==========================================

/** Request Body para POST /auth/login */
export interface AuthLoginRequest {
  whatsapp: string;      // Identificador de acceso (teléfono)
  contrasenia: string;   // Contraseña en texto plano
}

/** Response Body para POST /auth/login */
export interface AuthResponse {
  username: string;
  message: string;
  jwt: string;
  status: boolean;
  roles: RolUsuario[];
  idArbitro: number;
  nombreCompleto: string;
}

// ==========================================
// GESTIÓN DE ÁRBITROS
// ==========================================

/** Request Body para POST /arbitros y PUT /arbitros/{idArbitro} */
export interface ArbitroDTO {
  nombre: string;
  apellido: string;
  whatsapp: string;
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

/** Response Body que representa al Árbitro en consultas */
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

/** Request y Response de disponibilidad */
export interface ArbitroDisponibilidadDTO {
  estado?: boolean;
  disponibleSabado: boolean;
  disponibleDomingo: boolean;
}

// ==========================================
// SEGURIDAD, ROLES Y CREDENCIALES
// ==========================================

/** Request Body para PUT /arbitros/me/contrasenia */
export interface CambiarContraseniaDTO {
  contraseniaActual: string;
  nuevaContrasenia: string; // Mínimo 6 caracteres
}

/** Request Body para PUT /arbitros/{idArbitro}/roles */
export interface ActualizarRolesDTO {
  roles: RolUsuario[];
}

/** Item para PUT /arbitros/roles/bulk (array de estos objetos) */
export interface ActualizarRolesBulkDTO {
  idArbitro: number;
  roles: RolUsuario[];
}

// ==========================================
// SANCIONES Y SUSPENSIONES
// ==========================================

/** Request Body para POST /arbitros/{idArbitro}/suspenciones */
export interface SuspencionDTO {
  fechaIncidente: string; // ISO-8601 LocalDateTime
  cantidadDias: number;
  motivo: string;
  tipoSuspencion: TipoSuspencion; // 1 = Llamado atencion, 2 = Suspencion
  arbitro: number;        // ID de árbitro sancionado
  cancha: number;         // ID de cancha donde ocurrió el incidente
}

/** Response Body de Suspensión */
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

// ==========================================
// PERFIL Y MÉTRICAS PERSONALES (/arbitros/me)
// ==========================================

/** Response Body para GET /arbitros/me/estado-cuenta */
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

/** Response Body para GET /arbitros/me/estadisticas y GET /designaciones/estadisticas/arbitro/{id} */
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
```

### 3.2 Tabla de Endpoints del Dominio 1

| Método | Endpoint | Request Body / Query Params | Response Type | Roles Permitidos |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | `AuthLoginRequest` | `AuthResponse` | Público |
| `POST` | `/auth/logout` | Header `Authorization` | `string` | Autenticado |
| `GET` | `/arbitros/me` | Ninguno | `GetArbitroDTO` | Autenticado |
| `PUT` | `/arbitros/me/contrasenia` | `CambiarContraseniaDTO` | `string` | Autenticado |
| `GET` | `/arbitros/me/disponibilidad` | Ninguno | `ArbitroDisponibilidadDTO` | Autenticado |
| `PUT` | `/arbitros/me/disponibilidad` | `ArbitroDisponibilidadDTO` | `GetArbitroDTO` | Autenticado |
| `GET` | `/arbitros/me/designaciones` | `page?: number, size?: number` | `PageResponse<GetDesignacionDTO>` | Autenticado |
| `GET` | `/arbitros/me/suspenciones` | `page?: number, size?: number` | `PageResponse<GetSuspencionDTO>` | Autenticado |
| `GET` | `/arbitros/me/estado-cuenta` | Ninguno | `EstadoCuentaArbitroDTO` | Autenticado |
| `GET` | `/arbitros/me/estadisticas` | `inicio?, fin?, orden?, page?, size?` | `GetEstadisticasArbitroDetalleDTO`| Autenticado |
| `GET` | `/arbitros` | `page: number, size: number` | `PageResponse<GetArbitroDTO>` | `SUPERUSER`, `PRESIDENTE`, `SECRETARIO`, `DESIGNADOR` |
| `POST`| `/arbitros` | `ArbitroDTO` | `GetArbitroDTO` | `SUPERUSER`, `PRESIDENTE`, `SECRETARIO` |
| `PUT` | `/arbitros/{idArbitro}` | `ArbitroDTO` | `GetArbitroDTO` | `SUPERUSER`, `PRESIDENTE`, `SECRETARIO` |
| `PUT` | `/arbitros/{idArbitro}/roles` | `ActualizarRolesDTO` | `GetArbitroDTO` | `SUPERUSER` |
| `PUT` | `/arbitros/roles/bulk` | `ActualizarRolesBulkDTO[]` | `GetArbitroDTO[]` | `SUPERUSER` |
| `PUT` | `/arbitros/{idArbitro}/reset-contrasenia` | Ninguno | `string` | `SUPERUSER` |
| `PUT` | `/arbitros/{idArbitro}/toggle` | Ninguno | `string` | `SUPERUSER`, `PRESIDENTE`, `SECRETARIO` |
| `GET` | `/arbitros/traer-disponibles` | `page: number, size: number` | `PageResponse<GetArbitroDTO>` | `SUPERUSER`, `PRESIDENTE`, `SECRETARIO`, `DESIGNADOR` |
| `GET` | `/suspenciones` | `page?: number, size?: number` | `PageResponse<GetSuspencionDTO>` | `SUPERUSER`, `PRESIDENTE`, `SECRETARIO`, `DESIGNADOR` |
| `POST`| `/arbitros/{idArbitro}/suspenciones` | `SuspencionDTO` | `GetSuspencionDTO` | `SUPERUSER`, `PRESIDENTE`, `SECRETARIO` |
| `DELETE`| `/suspenciones/{idSuspencion}`| Ninguno | `string` | `SUPERUSER`, `PRESIDENTE`, `SECRETARIO` |

---

## 4. Dominio 2: Canchas, Aranceles y Designaciones

Comprende administración de predios deportivos, tablas arancelarias vigentes, armado de jornadas, asignación de cuadrillas arbitrales y métricas.

### 4.1 Interfaces TypeScript (Entrada y Salida)

```typescript
// ==========================================
// CANCHAS
// ==========================================

/** Request Body para POST /canchas y PUT /canchas/actualizar/{idCancha} */
export interface CanchaDTO {
  nombreCancha: string;
  categoria: CategoriaCancha;
  fueraDeJuego: boolean;
  estado: boolean;
  necesitaViaje: boolean;
}

/** Response Body para Cancha */
export interface GetCanchaDTO {
  idCancha: number;
  nombreCancha: string;
  categoria: CategoriaCancha;
  fueraDeJuego: boolean;
  estado: boolean;
  necesitaViaje: boolean;
}

/** Métricas por cancha en estadísticas */
export interface CanchaEstadisticaDTO {
  idCancha: number;
  nombreCancha: string;
  detalleDesignacion: string;
  totalDesignaciones: number;
  totalPartidos: number;
  totalDesignacionesFinalizadas: number;
}

// ==========================================
// ARANCELES ARBITRALES
// ==========================================

/** Request Body (Record) para POST /aranceles y PUT /aranceles/actualizar */
export interface ArancelDTO {
  descripcion: string;
  monto: number;           // Precio base / por partido
  fechaVigencia: string;   // "YYYY-MM-DD"
  cantidadPartidos: number;
  idCancha: number;
}

/** Response Body para Aranceles */
export interface GetArancelDTO {
  idArancel: number;
  descripcion: string;
  montoTotal: number;
  precioPorPartido: number;
  fechaVigencia: string;   // "YYYY-MM-DD"
  cantidadPartidos: number;
  activo: boolean;
  cancha: GetCanchaDTO;
}

/** Response para GET /aranceles/calcular */
export interface CalculoArancelResponse {
  idCancha: number;
  cantidadPartidos: number;
  arbitrosNecesarios: number;
  montoPorArbitro: number;
}

// ==========================================
// DESIGNACIONES (JORNADAS)
// ==========================================

/** Request Body para POST /designaciones y PUT /designaciones/{idDesignacion} */
export interface DesignacionDTO {
  idCancha: number;
  fecha: string;               // ISO-8601 "YYYY-MM-DDTHH:mm:ss"
  cantidadPartidos: number;
  etapaCampeonato: EtapaCampeonato;
  detalle?: string;
  editable?: boolean;
  estadoDesignacion?: EstadoDesignacion;
}

/** Response Body para Designación */
export interface GetDesignacionDTO {
  idDesignacion: number;
  fecha: string;
  cancha: GetCanchaDTO | null;
  etapaCampeonato: EtapaCampeonato;
  cantidadPartidos: number;
  estadoDesignacion: EstadoDesignacion;
  detalleDesignacion: string;
  editable: boolean;
}

/** Vista resumida de designación para listados rápidos o comparativas */
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

// ==========================================
// CUADRILLA ARBITRAL ASIGNADA (DESIGNADOS)
// ==========================================

/** Response Body para GET /designados?idDesignacion={id} */
export interface GetDesignadosDTO {
  idDesignados: number;
  arbitro: GetArbitroDTO;
  partidosDirigidos: number;
  montoPercibido: number;
  idDesignacion: number;
}

// ==========================================
// ESTADÍSTICAS Y COMPARATIVAS
// ==========================================

/** Resumen individual de un árbitro para gráficos globales */
export interface ArbitroEstadisticaDTO {
  idArbitro: number;
  nombreCompleto: string;
  totalDesignaciones: number;
  totalPartidosDirigidos: number;
  totalMontoPercibido: number;
}

/** Response Body para GET /designaciones/estadisticas */
export interface GetEstadisticasDesignacionesDTO {
  totalDesignaciones: number;
  totalPartidosDirigidos: number;
  designacionesPorEstado: Record<string, number>;
  estadisticasArbitros: ArbitroEstadisticaDTO[];
  estadisticasCanchas: CanchaEstadisticaDTO[];
  designacionesPorCategoriaArbitro: Record<string, number>;
}

/** Response Body para GET /designaciones/estadisticas/comparacion */
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
```

### 4.2 Tabla de Endpoints del Dominio 2

| Método | Endpoint | Request Body / Query Params | Response Type | Roles Permitidos |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/canchas` | `page: number, size: number` | `PageResponse<GetCanchaDTO>` | Todos los roles autenticados |
| `GET` | `/canchas/activas` | `page: number, size: number` | `PageResponse<GetCanchaDTO>` | Todos los roles autenticados |
| `POST`| `/canchas` | `CanchaDTO` | `GetCanchaDTO` | `SUPERUSER`, `PRESIDENTE`, `SECRETARIO` |
| `PUT` | `/canchas/actualizar/{idCancha}` | `CanchaDTO` | `GetCanchaDTO` | `SUPERUSER`, `PRESIDENTE`, `SECRETARIO` |
| `PUT` | `/canchas/{idCancha}/toggle` | Ninguno | `void` (204 No Content) | `SUPERUSER`, `PRESIDENTE`, `SECRETARIO` |
| `GET` | `/aranceles` | `page?: number, size?: number` | `PageResponse<GetArancelDTO>`| `SUPERUSER`, `PRESIDENTE`, `SECRETARIO`, `DESIGNADOR` |
| `GET` | `/aranceles/cancha/{idCancha}` | Ninguno | `GetArancelDTO[]` | `SUPERUSER`, `PRESIDENTE`, `SECRETARIO`, `DESIGNADOR` |
| `POST`| `/aranceles` | `ArancelDTO` | `GetArancelDTO` | `SUPERUSER`, `PRESIDENTE` |
| `PUT` | `/aranceles/actualizar` | `idArancel: number`, Body: `ArancelDTO` | `GetArancelDTO` | `SUPERUSER`, `PRESIDENTE` |
| `GET` | `/aranceles/calcular` | `idCancha: number, cantidadPartidos: number` | `CalculoArancelResponse` | `SUPERUSER`, `PRESIDENTE`, `SECRETARIO`, `DESIGNADOR` |
| `POST`| `/designaciones` | `DesignacionDTO` | `GetDesignacionDTO` | `SUPERUSER`, `PRESIDENTE`, `DESIGNADOR` |
| `PUT` | `/designaciones/{idDesignacion}` | `DesignacionDTO` | `GetDesignacionDTO` | `SUPERUSER`, `PRESIDENTE`, `DESIGNADOR` |
| `GET` | `/designaciones/{idDesignacion}` | Ninguno | `GetDesignacionDTO` | Todos los roles autenticados |
| `GET` | `/designaciones?estado={n}` | `estado: number, page: number, size: number` | `PageResponse<GetDesignacionDTO>` | Todos los roles autenticados |
| `GET` | `/designaciones/mes` | `mes: number, anio: number` | `GetDesignacionDTO[]` | Todos los roles autenticados |
| `GET` | `/designaciones/buscar` | `inicio?, fin?, fecha?` | `GetDesignacionDTO[]` | Todos los roles autenticados |
| `GET` | `/designaciones/ultimas-designaciones`| Ninguno | `GetDesignacionDTO[]` | Todos los roles autenticados |
| `DELETE`| `/designaciones/{idDesignacion}` | Ninguno | `void` (204 No Content) | `SUPERUSER`, `PRESIDENTE`, `DESIGNADOR` |
| `PUT` | `/designaciones/{idDesignacion}/aceptar` | Ninguno | `GetDesignacionDTO` | `SUPERUSER`, `PRESIDENTE`, `DESIGNADOR` |
| `PUT` | `/designaciones/{idDesignacion}/finalizar`| `detalle?: string` | `GetDesignacionDTO` | `SUPERUSER`, `PRESIDENTE`, `DESIGNADOR` |
| `PUT` | `/designaciones/{idDesignacion}/cambiar-cancelado`| `detalle?: string` | `GetDesignacionDTO` | `SUPERUSER`, `PRESIDENTE`, `DESIGNADOR` |
| `PUT` | `/designaciones/{idDesignacion}/reprogramar`| Ninguno | `GetDesignacionDTO` | `SUPERUSER`, `PRESIDENTE`, `DESIGNADOR` |
| `POST`| `/designaciones/{idDesignacion}/arbitros` | `idArbitro: number, forzar?: boolean, historico?: boolean` | `GetDesignacionDTO` | `SUPERUSER`, `PRESIDENTE`, `DESIGNADOR` |
| `POST`| `/designaciones/{idDesignacion}/arbitros/bulk`| `number[]` (IDs de árbitros) | `GetDesignacionDTO` | `SUPERUSER`, `PRESIDENTE`, `DESIGNADOR` |
| `DELETE`| `/designaciones/{idDesignacion}/arbitros/{idArbitro}`| Ninguno | `GetDesignacionDTO` | `SUPERUSER`, `PRESIDENTE`, `DESIGNADOR` |
| `POST`| `/designaciones/{idDesignacion}/sincronizar-arancel`| Ninguno | `string` | `SUPERUSER`, `PRESIDENTE`, `DESIGNADOR` |
| `GET` | `/designados` | `idDesignacion: number` | `GetDesignadosDTO[]` | `SUPERUSER`, `PRESIDENTE`, `SECRETARIO`, `DESIGNADOR` |
| `DELETE`| `/designados/eliminar-designado` | `idDesignacion: number, idDesignado: number` | `void` (204 No Content) | `SUPERUSER`, `PRESIDENTE`, `DESIGNADOR` |
| `PUT` | `/designados/{idDesignado}/actualizar-monto-percibido`| `nuevoMonto: number` | `string` | `SUPERUSER`, `PRESIDENTE`, `DESIGNADOR` |
| `PUT` | `/designados/actualizar-monto-a-designados`| `idDesignacion: number, montoPorArbitro: number`| `string` | `SUPERUSER`, `PRESIDENTE`, `DESIGNADOR` |
| `PUT` | `/designados/actualizar-cantidad-partidos`| `idDesignacion: number, idDesignado: number, cantidad: number`| `string` | `SUPERUSER`, `PRESIDENTE`, `DESIGNADOR` |
| `GET` | `/designaciones/estadisticas` | `inicio?, fin?, orden?` | `GetEstadisticasDesignacionesDTO` | `SUPERUSER`, `PRESIDENTE`, `SECRETARIO`, `DESIGNADOR` |
| `GET` | `/designaciones/estadisticas/arbitro/{idArbitro}`| `inicio?, fin?, orden?, page?, size?` | `GetEstadisticasArbitroDetalleDTO` | `SUPERUSER`, `PRESIDENTE`, `SECRETARIO`, `DESIGNADOR` |
| `GET` | `/designaciones/estadisticas/comparacion`| `idsArbitros: number[], mesInicio?, mesFin?`| `GetComparacionEstadisticasArbitrosDTO` | `SUPERUSER`, `DESIGNADOR` |

---

## 5. Ejemplos Reales de Carga útil (Payloads JSON)

### 5.1 Login y Obtención de Sesión
- **POST** `/auth/login`
```json
{
  "whatsapp": "1134567890",
  "contrasenia": "password123"
}
```
- **Respuesta (200 OK)**
```json
{
  "username": "1134567890",
  "message": "User logged successfully",
  "jwt": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMTM0NTY3ODkwIiwicm9sZXMiOlsiUk9MRV9ERVNJR05BRE9SIl19...",
  "status": true,
  "roles": ["DESIGNADOR"],
  "idArbitro": 3,
  "nombreCompleto": "Gómez Carlos"
}
```

### 5.2 Crear Nueva Designación
- **POST** `/designaciones`
```json
{
  "idCancha": 5,
  "fecha": "2026-10-18T10:00:00",
  "cantidadPartidos": 3,
  "etapaCampeonato": "CRUCES",
  "detalle": "Octavos de final - Torneo Apertura"
}
```
- **Respuesta (200 OK)**
```json
{
  "idDesignacion": 24,
  "fecha": "2026-10-18T10:00:00",
  "cancha": {
    "idCancha": 5,
    "nombreCancha": "Predio Las Palmeras",
    "categoria": "FUTBOL_11",
    "fueraDeJuego": true,
    "estado": true,
    "necesitaViaje": false
  },
  "etapaCampeonato": "CRUCES",
  "cantidadPartidos": 3,
  "estadoDesignacion": 0,
  "detalleDesignacion": "Octavos de final - Torneo Apertura",
  "editable": true
}
```

### 5.3 Asignación de Árbitros en Cuadrilla (Bulk)
- **POST** `/designaciones/24/arbitros/bulk`
```json
[3, 8, 14]
```

### 5.4 Consultar Designados de una Designación
- **GET** `/designados?idDesignacion=24`
- **Respuesta (200 OK)**
```json
[
  {
    "idDesignados": 61,
    "arbitro": {
      "idArbitro": 3,
      "nombre": "Carlos",
      "apellido": "Gómez",
      "whatsapp": "1134567890",
      "disponibleSabado": true,
      "disponibleDomingo": true,
      "talleShort": "L",
      "talleCamiseta": "XL",
      "categoria": "AVANZADO",
      "tieneAuto": true,
      "estadoSistema": true,
      "roles": ["DESIGNADOR", "ARBITRO"]
    },
    "partidosDirigidos": 3,
    "montoPercibido": 24000.00,
    "idDesignacion": 24
  }
]
```

---

## 6. Archivo Completo de Tipos para Frontend (`designaciones-types.ts`)

Podés copiar y pegar este bloque directamente en tu proyecto frontend (ej: `src/types/designaciones-api.d.ts`):

```typescript
// ============================================================================
// TIPOS Y MODELOS TYPESCRIPT: DOMINIO 1 Y 2 (DESIGNACIONES BACKEND)
// ============================================================================

export type RolUsuario = 'SUPERUSER' | 'PRESIDENTE' | 'SECRETARIO' | 'DESIGNADOR' | 'ARBITRO';

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

export interface AuthResponse {
  username: string;
  message: string;
  jwt: string;
  status: boolean;
  roles: RolUsuario[];
  idArbitro: number;
  nombreCompleto: string;
}

export interface ArbitroDTO {
  nombre: string;
  apellido: string;
  whatsapp: string;
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
  arbitro: number;
  cancha: number;
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
}

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
```
