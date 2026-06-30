import { useQuery } from '@tanstack/react-query';
import { api, AssetType } from '../api/client';

export function useAssetTypes() {
  return useQuery<AssetType[]>({
    queryKey: ['asset-types'],
    queryFn: () => api.get<AssetType[]>('/asset-types'),
    staleTime: 60_000,
  });
}
