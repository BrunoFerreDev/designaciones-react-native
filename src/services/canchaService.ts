import { apiClient } from './apiClient';
import { ENDPOINTS } from '../constants/api';
import { GetCanchaDTO, CanchaDTO, PageResponse } from '../types';

export const canchaService = {
  async getCanchas(): Promise<GetCanchaDTO[]> {
    const res = await apiClient.get<PageResponse<GetCanchaDTO> | GetCanchaDTO[]>(
      ENDPOINTS.CANCHAS,
      { params: { page: 0, size: 200 } }
    );
    if (Array.isArray(res.data)) return res.data;
    if (res.data && Array.isArray(res.data.content)) return res.data.content;
    return [];
  },

  async getCanchasActivas(): Promise<GetCanchaDTO[]> {
    const res = await apiClient.get<PageResponse<GetCanchaDTO> | GetCanchaDTO[]>(
      ENDPOINTS.CANCHAS_ACTIVAS,
      { params: { page: 0, size: 200 } }
    );
    if (Array.isArray(res.data)) return res.data;
    if (res.data && Array.isArray(res.data.content)) return res.data.content;
    return [];
  },

  async createCancha(dto: CanchaDTO): Promise<GetCanchaDTO> {
    const res = await apiClient.post<GetCanchaDTO>(ENDPOINTS.CANCHAS, dto);
    return res.data;
  },

  async updateCancha(id: number, dto: CanchaDTO): Promise<GetCanchaDTO> {
    const res = await apiClient.put<GetCanchaDTO>(`${ENDPOINTS.CANCHAS}/actualizar/${id}`, dto);
    return res.data;
  },
};
