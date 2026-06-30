import { useQuery } from '@tanstack/react-query';
import { api, Asset } from '../api/client';

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true';
const BASE_URL = import.meta.env.BASE_URL;

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
    queryFn: async () => {
      if (DEMO) {
        const all = await fetch(`${BASE_URL}data/assets.json`).then((r) => r.json()) as Asset[];
        const filtered = all
          .filter((a) => !type || a.assetType?.key === type)
          .filter((a) => !status || a.status === status);
        const start = (page - 1) * limit;
        return {
          assets: filtered.slice(start, start + limit),
          total: filtered.length,
          page,
          limit,
        };
      }
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
