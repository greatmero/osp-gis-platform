import { useQuery } from '@tanstack/react-query';
import { api, AssetType } from '../api/client';

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true';
const BASE_URL = import.meta.env.BASE_URL;

export function useAssetTypes() {
  return useQuery<AssetType[]>({
    queryKey: ['asset-types'],
    queryFn: DEMO
      ? () => fetch(`${BASE_URL}data/asset-types.json`).then((r) => r.json())
      : () => api.get<AssetType[]>('/asset-types'),
    staleTime: 60_000,
  });
}
