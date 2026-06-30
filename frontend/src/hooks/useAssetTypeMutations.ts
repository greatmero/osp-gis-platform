import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, AssetType, FieldSchema } from '../api/client';

interface AssetTypePayload {
  key: string;
  label: string;
  geometryKind: 'point' | 'line' | 'polygon';
  icon: string;
  color: string;
  fieldSchema: FieldSchema[];
}

export function useCreateAssetType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AssetTypePayload) => api.post<AssetType>('/asset-types', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asset-types'] });
      qc.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });
}

export function useUpdateAssetType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<AssetTypePayload> & { id: number }) =>
      api.put<AssetType>(`/asset-types/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asset-types'] });
      qc.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });
}

export function useDeleteAssetType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/asset-types/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asset-types'] });
      qc.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });
}
