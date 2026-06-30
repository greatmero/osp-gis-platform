import { useQuery } from '@tanstack/react-query';
import { api, Asset } from '../api/client';

export function useAsset(id: number | null) {
  return useQuery<Asset>({
    queryKey: ['asset', id],
    queryFn: () => api.get<Asset>(`/assets/${id}`),
    enabled: id !== null,
    staleTime: 30_000,
  });
}
