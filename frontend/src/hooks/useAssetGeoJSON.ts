import { useQuery } from '@tanstack/react-query';
import { api, Asset } from '../api/client';

export interface GeoProperties {
  id: number;
  name: string;
  code: string;
  status: string;
  assetTypeKey: string;
  assetTypeLabel: string;
  color: string;
  icon: string;
  attributes: Record<string, unknown>;
}

export interface GeoFeature {
  type: 'Feature';
  geometry: { type: string; coordinates: unknown };
  properties: GeoProperties;
}

export interface GeoFeatureCollection {
  type: 'FeatureCollection';
  features: GeoFeature[];
}

export function useAssetGeoJSON(typeKey: string, enabled = true) {
  return useQuery<GeoFeatureCollection>({
    queryKey: ['geojson', typeKey],
    queryFn: () => api.get<GeoFeatureCollection>(`/assets/geojson?type=${typeKey}`),
    enabled,
    staleTime: 60_000,
  });
}

export function useAllAssets() {
  return useQuery<{ assets: Asset[]; total: number }>({
    queryKey: ['assets', 'all'],
    queryFn: () => api.get<{ assets: Asset[]; total: number }>('/assets?limit=500'),
    staleTime: 60_000,
  });
}
