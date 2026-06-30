import { useQuery } from '@tanstack/react-query';
import { api, Asset } from '../api/client';

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true';
const BASE_URL = import.meta.env.BASE_URL;

export function useAsset(id: number | null) {
  return useQuery<Asset>({
    queryKey: ['asset', id],
    queryFn: async () => {
      if (DEMO) {
        const all = await fetch(`${BASE_URL}data/assets.json`).then((r) => r.json()) as Asset[];
        const found = all.find((a) => a.id === id);
        if (!found) throw new Error(`Asset ${id} not found`);
        return found;
      }
      return api.get<Asset>(`/assets/${id}`);
    },
    enabled: id !== null,
    staleTime: 30_000,
  });
}
