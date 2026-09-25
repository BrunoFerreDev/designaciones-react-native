import { Platform } from "react-native";

// URL base obtenida desde variable de entorno EXPO_PUBLIC_API_URL (.env)
export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://circuloarbitros-ja.up.railway.app";

export const ENDPOINTS = {
  // Auth
  LOGIN: "/auth/login",
  LOGOUT: "/auth/logout",

  // Árbitros
  ARBITROS: "/arbitros",
  ARBITRO_BY_ID: (id: number) => `/arbitros/${id}`,
  ARBITRO_ME: "/arbitros/me",
  ARBITRO_ME_CONTRASENIA: "/arbitros/me/contrasenia",
  ARBITRO_ME_DISPONIBILIDAD: "/arbitros/me/disponibilidad",
  ARBITRO_DISPONIBILIDAD: "/arbitros/me/disponibilidad",
  ARBITRO_ME_ESTADO_CUENTA: "/arbitros/me/estado-cuenta",
  ARBITRO_ME_DESIGNACIONES: "/arbitros/me/designaciones",
  ARBITRO_ME_SUSPENSIONES: "/arbitros/me/suspenciones",

  // Canchas
  CANCHAS: "/canchas",
  CANCHAS_ACTIVAS: "/canchas/activas",
  CANCHA_BY_ID: (id: number) => `/canchas/${id}`,

  // Designaciones
  DESIGNACIONES: "/designaciones",
  DESIGNACIONES_ULTIMAS: "/designaciones/ultimas-designaciones",
  DESIGNACION_BY_ID: (id: number) => `/designaciones/${id}`,
  DESIGNADOS: "/designados",
  DESIGNADOS_ASIGNAR: (idDesignacion: number) =>
    `/designaciones/${idDesignacion}/arbitros`,
  DESIGNADOS_ELIMINAR: "/designados/eliminar-designado",

  // Suspensiones
  SUSPENSIONES: "/suspenciones",
  SUSPENSION_BY_ID: (id: number) => `/suspenciones/${id}`,
  SUSPENSION_CREAR: (idArbitro: number) =>
    `/arbitros/${idArbitro}/suspenciones`,
} as const;
