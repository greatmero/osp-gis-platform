import { useQuery } from '@tanstack/react-query';
import { api, Asset } from '../api/client';

interface AssetsParams {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
}

interface AssetsResponse {
  assets: Asset[];
  total: number;
  page: number;
  limit: number;
}

export function useAssets(params: AssetsParams = {}) {
  const { page = 1, limit = 20, type = '', status = '' } = params;
  return useQuery<AssetsResponse>({
    queryKey: ['assets', 'table', { page, limit, type, status }],
    queryFn: () => {
      const q = new URLSearchParams();
      q.set('page', String(page));
      q.set('limit', String(limit));
      if (type) q.set('type', type);
      if (status) q.set('status', status);
      return api.get<AssetsResponse>(`/assets?${q.toString()}`);
    },
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}
