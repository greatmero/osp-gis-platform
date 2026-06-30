import { useQuery } from '@tanstack/react-query';
import { api, Asset } from '../api/client';

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true';
const BASE_URL = import.meta.env.BASE_URL;

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
    queryFn: async () => {
      if (DEMO) {
        const all = await fetch(`${BASE_URL}data/geojson-all.json`).then((r) =>
          r.json()
        ) as GeoFeatureCollection;
        return {
          type: 'FeatureCollection' as const,
          features: all.features.filter((f) => f.properties.assetTypeKey === typeKey),
        };
      }
      return api.get<GeoFeatureCollection>(`/assets/geojson?type=${typeKey}`);
    },
    enabled,
    staleTime: 60_000,
  });
}

export function useAllAssets() {
  return useQuery<{ assets: Asset[]; total: number }>({
    queryKey: ['assets', 'all'],
    queryFn: async () => {
      if (DEMO) {
        const all = await fetch(`${BASE_URL}data/assets.json`).then((r) => r.json()) as Asset[];
        return { assets: all, total: all.length };
      }
      return api.get<{ assets: Asset[]; total: number }>('/assets?limit=500');
    },
    staleTime: 60_000,
  });
}
