import { apiClient } from './apiClient';
import { ENDPOINTS } from '../constants/api';
import {
  GetDesignacionDTO,
  DesignacionDTO,
  GetDesignadosDTO,
  PageResponse,
} from '../types';

export const designacionService = {
  async getDesignaciones(
    isDesignadorOrAdmin?: boolean,
    filtrarRango14Dias: boolean = true
  ): Promise<GetDesignacionDTO[]> {
    let data: GetDesignacionDTO[] = [];

    // 1. Intentar endpoints globales para cualquier usuario (rol árbitro o administrador)
    try {
      const res = await apiClient.get<GetDesignacionDTO[]>(ENDPOINTS.DESIGNACIONES_ULTIMAS);
      if (Array.isArray(res.data) && res.data.length > 0) {
        data = res.data;
      }
    } catch {}

    if (data.length === 0) {
      try {
        const res = await apiClient.get<PageResponse<GetDesignacionDTO> | GetDesignacionDTO[]>(
          ENDPOINTS.DESIGNACIONES,
          { params: { page: 0, size: 200 } }
        );
        if (Array.isArray(res.data)) {
          data = res.data;
        } else if (res.data && Array.isArray(res.data.content)) {
          data = res.data.content;
        }
      } catch (error: any) {
        if (error?.response?.status === 403) {
          try {
            const resMe = await apiClient.get<PageResponse<GetDesignacionDTO> | GetDesignacionDTO[]>(
              ENDPOINTS.ARBITRO_ME_DESIGNACIONES,
              { params: { page: 0, size: 200 } }
            );
            if (Array.isArray(resMe.data)) data = resMe.data;
            else if (resMe.data && Array.isArray(resMe.data.content)) data = resMe.data.content;
          } catch {}
        } else {
          throw error;
        }
      }
    }

    // 2. Filtrar en rango de 14 días: del día actual, 7 días antes y 7 días después
    if (filtrarRango14Dias && data.length > 0) {
      const now = new Date();
      const fechaMin = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0, 0);
      const fechaMax = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59, 59, 999);

      data = data.filter((d) => {
        if (!d.fecha) return false;
        const normalized = d.fecha.includes('T') ? d.fecha : d.fecha.replace(' ', 'T');
        const f = new Date(normalized);
        if (isNaN(f.getTime())) return true;
        return f >= fechaMin && f <= fechaMax;
      });
    }

    return data;
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
