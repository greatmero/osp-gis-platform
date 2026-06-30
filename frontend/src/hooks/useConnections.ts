import { useQuery } from '@tanstack/react-query';
import { api, Asset } from '../api/client';
import { useAllAssets } from './useAssetGeoJSON';

// Looser GeoJSON type for connection lines (properties don't match asset GeoProperties)
interface ConnectionFeatureCollection {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: { type: 'LineString'; coordinates: [number, number][] };
    properties: Record<string, unknown>;
  }>;
}

interface Connection {
  id: number;
  fromAssetId: number;
  toAssetId: number;
  cableAssetId: number | null;
  fiberCount: number;
  notes: string | null;
  fromAsset: { id: number; name: string; code: string };
  toAsset: { id: number; name: string; code: string };
}

export function useRawConnections() {
  return useQuery<Connection[]>({
    queryKey: ['connections'],
    queryFn: () => api.get<Connection[]>('/connections'),
    staleTime: 30_000,
  });
}

function getCoords(asset: Asset): [number, number] | null {
  try {
    const geom = asset.geometry as { type: string; coordinates: unknown };
    if (geom.type === 'Point') return (geom.coordinates as [number, number]);
    if (geom.type === 'LineString') {
      const coords = geom.coordinates as [number, number][];
      return coords[Math.floor(coords.length / 2)];
    }
  } catch {
    // ignore
  }
  return null;
}

export function useConnectionsGeoJSON(): ConnectionFeatureCollection {
  const { data: connectionsData } = useRawConnections();
  const { data: assetsData } = useAllAssets();

  const connections = connectionsData ?? [];
  const assets = assetsData?.assets ?? [];
  const assetMap = new Map(assets.map((a) => [a.id, a]));

  const features = connections
    .map((c) => {
      const from = assetMap.get(c.fromAssetId);
      const to = assetMap.get(c.toAssetId);
      if (!from || !to) return null;
      const fromCoord = getCoords(from);
      const toCoord = getCoords(to);
      if (!fromCoord || !toCoord) return null;
      return {
        type: 'Feature' as const,
        geometry: {
          type: 'LineString' as const,
          coordinates: [fromCoord, toCoord],
        },
        properties: {
          id: c.id,
          fromName: c.fromAsset.name,
          toName: c.toAsset.name,
          fiberCount: c.fiberCount,
          notes: c.notes,
        },
      };
    })
    .filter((f): f is NonNullable<typeof f> => f !== null);

  return { type: 'FeatureCollection' as const, features };
}
