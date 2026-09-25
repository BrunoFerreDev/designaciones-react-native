import { apiClient } from './apiClient';
import { ENDPOINTS } from '../constants/api';
import {
  GetArbitroDTO,
  ArbitroDTO,
  ArbitroDisponibilidadDTO,
  EstadoCuentaArbitroDTO,
  CambiarContraseniaDTO,
  PageResponse,
} from '../types';

export const arbitroService = {
  async getArbitros(): Promise<GetArbitroDTO[]> {
    try {
      const res = await apiClient.get<PageResponse<GetArbitroDTO> | GetArbitroDTO[]>(
        ENDPOINTS.ARBITROS,
        { params: { page: 0, size: 200 } }
      );
      if (Array.isArray(res.data)) return res.data;
      if (res.data && Array.isArray(res.data.content)) return res.data.content;
      return [];
    } catch (error: any) {
      // Si el rol no tiene permiso para /arbitros (ej: solo ARBITRO), fallback a /arbitros/me
      if (error?.response?.status === 403) {
        const me = await arbitroService.getMe();
        return me ? [me] : [];
      }
      throw error;
    }
  },

  async getMe(): Promise<GetArbitroDTO | null> {
    try {
      const res = await apiClient.get<GetArbitroDTO>(ENDPOINTS.ARBITRO_ME);
      return res.data;
    } catch {
      return null;
    }
  },

  async getDisponibilidad(): Promise<ArbitroDisponibilidadDTO> {
    const res = await apiClient.get<ArbitroDisponibilidadDTO>(ENDPOINTS.ARBITRO_DISPONIBILIDAD);
    return res.data;
  },

  async updateDisponibilidad(disponibleSabado: boolean, disponibleDomingo: boolean): Promise<GetArbitroDTO> {
    const res = await apiClient.put<GetArbitroDTO>(ENDPOINTS.ARBITRO_DISPONIBILIDAD, {
      disponibleSabado,
      disponibleDomingo,
    });
    return res.data;
  },

  async createArbitro(dto: ArbitroDTO): Promise<GetArbitroDTO> {
    const res = await apiClient.post<GetArbitroDTO>(ENDPOINTS.ARBITROS, dto);
    return res.data;
  },

  async updateArbitro(id: number, dto: ArbitroDTO): Promise<GetArbitroDTO> {
    const res = await apiClient.put<GetArbitroDTO>(ENDPOINTS.ARBITRO_BY_ID(id), dto);
    return res.data;
  },

  async getEstadoCuenta(): Promise<EstadoCuentaArbitroDTO | null> {
    try {
      const res = await apiClient.get<EstadoCuentaArbitroDTO>(ENDPOINTS.ARBITRO_ME_ESTADO_CUENTA);
      return res.data;
    } catch {
      return null;
    }
  },

  async cambiarContrasenia(dto: CambiarContraseniaDTO): Promise<string> {
    const res = await apiClient.put<string>(ENDPOINTS.ARBITRO_ME_CONTRASENIA, dto);
    return res.data;
  },

  async toggleEstadoSistema(id: number): Promise<void> {
    await apiClient.put(`${ENDPOINTS.ARBITROS}/${id}/toggle`);
  },
};
