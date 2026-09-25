import { apiClient } from './apiClient';
import { ENDPOINTS } from '../constants/api';
import { GetSuspencionDTO, SuspencionDTO, PageResponse } from '../types';

export const suspensionService = {
  async getSuspensiones(isDesignadorOrAdmin: boolean = false): Promise<GetSuspencionDTO[]> {
    if (isDesignadorOrAdmin) {
      try {
        const res = await apiClient.get<PageResponse<GetSuspencionDTO> | GetSuspencionDTO[]>(
          ENDPOINTS.SUSPENSIONES,
          { params: { page: 0, size: 200 } }
        );
        if (Array.isArray(res.data)) return res.data;
        if (res.data && Array.isArray(res.data.content)) return res.data.content;
      } catch (error: any) {
        if (error?.response?.status !== 403) throw error;
      }
    }

    // Para árbitro individual
    const resMe = await apiClient.get<PageResponse<GetSuspencionDTO> | GetSuspencionDTO[]>(
      ENDPOINTS.ARBITRO_ME_SUSPENSIONES,
      { params: { page: 0, size: 100 } }
    );
    if (Array.isArray(resMe.data)) return resMe.data;
    if (resMe.data && Array.isArray(resMe.data.content)) return resMe.data.content;
    return [];
  },

  async createSuspension(idArbitro: number, dto: SuspencionDTO): Promise<GetSuspencionDTO> {
    const res = await apiClient.post<GetSuspencionDTO>(
      ENDPOINTS.SUSPENSION_CREAR(idArbitro),
      dto
    );
    return res.data;
  },

  async deleteSuspension(id: number): Promise<void> {
    await apiClient.delete(ENDPOINTS.SUSPENSION_BY_ID(id));
  },
};
