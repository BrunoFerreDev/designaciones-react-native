import { apiClient } from './apiClient';
import { ENDPOINTS } from '../constants/api';
import {
  GetDesignacionDTO,
  DesignacionDTO,
  GetDesignadosDTO,
  PageResponse,
} from '../types';

export const designacionService = {
  async getDesignaciones(isDesignadorOrAdmin: boolean = false): Promise<GetDesignacionDTO[]> {
    if (isDesignadorOrAdmin) {
      try {
        const res = await apiClient.get<GetDesignacionDTO[]>(ENDPOINTS.DESIGNACIONES_ULTIMAS);
        if (Array.isArray(res.data)) return res.data;
      } catch {}

      try {
        const res = await apiClient.get<PageResponse<GetDesignacionDTO> | GetDesignacionDTO[]>(
          ENDPOINTS.DESIGNACIONES,
          { params: { page: 0, size: 100 } }
        );
        if (Array.isArray(res.data)) return res.data;
        if (res.data && Array.isArray(res.data.content)) return res.data.content;
      } catch (error: any) {
        if (error?.response?.status !== 403) throw error;
      }
    }

    // Para árbitro individual (o fallback)
    const resMe = await apiClient.get<PageResponse<GetDesignacionDTO> | GetDesignacionDTO[]>(
      ENDPOINTS.ARBITRO_ME_DESIGNACIONES,
      { params: { page: 0, size: 100 } }
    );
    if (Array.isArray(resMe.data)) return resMe.data;
    if (resMe.data && Array.isArray(resMe.data.content)) return resMe.data.content;
    return [];
  },

  async getDesignacionById(id: number): Promise<GetDesignacionDTO> {
    const res = await apiClient.get<GetDesignacionDTO>(ENDPOINTS.DESIGNACION_BY_ID(id));
    return res.data;
  },

  async createDesignacion(dto: DesignacionDTO): Promise<GetDesignacionDTO> {
    const res = await apiClient.post<GetDesignacionDTO>(ENDPOINTS.DESIGNACIONES, dto);
    return res.data;
  },

  async updateDesignacion(id: number, dto: DesignacionDTO): Promise<GetDesignacionDTO> {
    const res = await apiClient.put<GetDesignacionDTO>(ENDPOINTS.DESIGNACION_BY_ID(id), dto);
    return res.data;
  },

  async cambiarEstado(id: number, nuevoEstado: number): Promise<GetDesignacionDTO> {
    if (nuevoEstado === 1) {
      const res = await apiClient.put<GetDesignacionDTO>(`${ENDPOINTS.DESIGNACION_BY_ID(id)}/aceptar`);
      return res.data;
    } else if (nuevoEstado === 2) {
      const res = await apiClient.put<GetDesignacionDTO>(`${ENDPOINTS.DESIGNACION_BY_ID(id)}/finalizar`);
      return res.data;
    } else if (nuevoEstado === 3) {
      const res = await apiClient.put<GetDesignacionDTO>(`${ENDPOINTS.DESIGNACION_BY_ID(id)}/cambiar-cancelado`);
      return res.data;
    } else {
      const res = await apiClient.put<GetDesignacionDTO>(ENDPOINTS.DESIGNACION_BY_ID(id), {
        estadoDesignacion: nuevoEstado,
      });
      return res.data;
    }
  },

  async getDesignados(idDesignacion: number): Promise<GetDesignadosDTO[]> {
    try {
      const res = await apiClient.get<GetDesignadosDTO[]>(ENDPOINTS.DESIGNADOS, {
        params: { idDesignacion },
      });
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },

  async asignarArbitro(
    idDesignacion: number,
    idArbitro: number,
    forzar: boolean = false,
    historico?: boolean
  ): Promise<GetDesignacionDTO> {
    const res = await apiClient.post<GetDesignacionDTO>(
      ENDPOINTS.DESIGNADOS_ASIGNAR(idDesignacion),
      null,
      {
        params: {
          idArbitro,
          forzar,
          ...(historico !== undefined ? { historico } : {}),
        },
      }
    );
    return res.data;
  },

  async eliminarDesignado(idDesignacion: number, idDesignado: number): Promise<void> {
    await apiClient.delete(ENDPOINTS.DESIGNADOS_ELIMINAR, {
      params: { idDesignacion, idDesignado },
    });
  },

  async reprogramarDesignacion(idDesignacion: number): Promise<GetDesignacionDTO> {
    const res = await apiClient.put<GetDesignacionDTO>(`${ENDPOINTS.DESIGNACION_BY_ID(idDesignacion)}/reprogramar`);
    return res.data;
  },

  async eliminarDesignacion(idDesignacion: number): Promise<void> {
    await apiClient.delete(ENDPOINTS.DESIGNACION_BY_ID(idDesignacion));
  },
};
