const BASE = '/api';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `API error ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path: string) => apiFetch<void>(path, { method: 'DELETE' }),
};

// Shared API types (mirrors backend)
export interface AssetType {
  id: number;
  key: string;
  label: string;
  geometryKind: 'point' | 'line' | 'polygon';
  icon: string;
  color: string;
  fieldSchema: FieldSchema[];
  createdAt: string;
}

export interface FieldSchema {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'boolean';
  required: boolean;
  options?: string[];
}

export interface Asset {
  id: number;
  assetTypeId: number;
  assetType?: AssetType;
  name: string;
  code: string;
  status: 'operational' | 'degraded' | 'down' | 'under_maintenance';
  geometry: Record<string, unknown>;
  attributes: Record<string, unknown>;
  parentId?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Incident {
  id: number;
  assetId: number;
  asset?: Pick<Asset, 'id' | 'name' | 'code'>;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved';
  openedAt: string;
  resolvedAt?: string | null;
  description: string;
}

export interface DashboardSummary {
  totalAssets: number;
  assetsByType: { key: string; label: string; count: number; color: string }[];
  assetsByStatus: { status: string; count: number }[];
  totalFiberKm: number;
  openIncidents: number;
  resolvedIncidents: number;
  mttrHours: number;
  networkAvailabilityPct: number;
  incidentTrend: { week: string; count: number }[];
  topSitesByAssets: { id: number; name: string; assetCount: number }[];
  fiberCapacity: { usedFibers: number; totalFibers: number };
}
