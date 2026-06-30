import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, Asset } from '../api/client';

interface CreateAssetPayload {
  assetTypeId: number;
  name: string;
  code: string;
  status: string;
  geometry: Record<string, unknown>;
  attributes: Record<string, unknown>;
  parentId?: number | null;
}

interface UpdateAssetPayload {
  id: number;
  name?: string;
  code?: string;
  status?: string;
  attributes?: Record<string, unknown>;
}

interface CreateConnectionPayload {
  fromAssetId: number;
  toAssetId: number;
  cableAssetId?: number | null;
  fiberCount: number;
  notes?: string;
}

export function useCreateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAssetPayload) => api.post<Asset>('/assets', payload),
    onSuccess: (data) => {
      const key = (data as Asset & { assetType?: { key: string } }).assetType?.key;
      if (key) qc.invalidateQueries({ queryKey: ['geojson', key] });
      qc.invalidateQueries({ queryKey: ['assets', 'all'] });
    },
  });
}

export function useUpdateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateAssetPayload) =>
      api.put<Asset>(`/assets/${id}`, body),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['asset', (data as Asset).id] });
      const key = (data as Asset & { assetType?: { key: string } }).assetType?.key;
      if (key) qc.invalidateQueries({ queryKey: ['geojson', key] });
      qc.invalidateQueries({ queryKey: ['assets', 'all'] });
    },
  });
}

export function useDeleteAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, typeKey }: { id: number; typeKey: string }) =>
      api.delete(`/assets/${id}`).then(() => ({ id, typeKey })),
    onSuccess: ({ typeKey }) => {
      qc.invalidateQueries({ queryKey: ['geojson', typeKey] });
      qc.invalidateQueries({ queryKey: ['assets', 'all'] });
    },
  });
}

export function useCreateConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateConnectionPayload) =>
      api.post('/connections', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['connections'] });
    },
  });
}
