export type GeometryKind = 'point' | 'line' | 'polygon';
export type AssetStatus = 'operational' | 'degraded' | 'down' | 'under_maintenance';
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'open' | 'investigating' | 'resolved';
export type FieldType = 'text' | 'number' | 'select' | 'date' | 'boolean';

export interface FieldSchema {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
}

// GeoJSON types
export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number];
}

export interface GeoLineString {
  type: 'LineString';
  coordinates: [number, number][];
}

export interface GeoPolygon {
  type: 'Polygon';
  coordinates: [number, number][][];
}

export type GeoGeometry = GeoPoint | GeoLineString | GeoPolygon;

export interface GeoFeature {
  type: 'Feature';
  geometry: GeoGeometry;
  properties: Record<string, unknown>;
}

export interface GeoFeatureCollection {
  type: 'FeatureCollection';
  features: GeoFeature[];
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
