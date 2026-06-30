import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const OUT_DIR = path.join(__dirname, '..', '..', '..', 'frontend', 'public', 'data');

function haversineKm([lon1, lat1]: [number, number], [lon2, lat2]: [number, number]): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parseJson(v: unknown): unknown {
  if (typeof v === 'string') { try { return JSON.parse(v); } catch { return v; } }
  return v;
}

function write(name: string, data: unknown) {
  fs.writeFileSync(path.join(OUT_DIR, name), JSON.stringify(data, null, 2));
  console.log(`  ✓  ${name}`);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Exporting demo data → ${OUT_DIR}\n`);

  // ── Asset types ────────────────────────────────────────────────────────────
  const rawTypes = await prisma.assetType.findMany({ orderBy: { label: 'asc' } });
  const assetTypes = rawTypes.map((t) => ({
    ...t,
    fieldSchema: parseJson(t.fieldSchema),
    createdAt: t.createdAt.toISOString(),
  }));
  write('asset-types.json', assetTypes);

  // ── Assets ─────────────────────────────────────────────────────────────────
  const rawAssets = await prisma.asset.findMany({
    include: { assetType: true },
    orderBy: { name: 'asc' },
  });
  const assets = rawAssets.map((a) => ({
    ...a,
    geometry: parseJson(a.geometry),
    attributes: parseJson(a.attributes),
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    assetType: {
      ...a.assetType,
      fieldSchema: parseJson(a.assetType.fieldSchema),
      createdAt: a.assetType.createdAt.toISOString(),
    },
  }));
  write('assets.json', assets);

  // ── GeoJSON (all types in one file) ────────────────────────────────────────
  const features = rawAssets
    .map((a) => {
      let geom: unknown;
      try { geom = JSON.parse(a.geometry); } catch { return null; }
      let attrs: unknown;
      try { attrs = JSON.parse(a.attributes); } catch { attrs = {}; }
      return {
        type: 'Feature' as const,
        geometry: geom,
        properties: {
          id: a.id,
          name: a.name,
          code: a.code,
          status: a.status,
          assetTypeKey: a.assetType.key,
          assetTypeLabel: a.assetType.label,
          color: a.assetType.color,
          icon: a.assetType.icon,
          attributes: attrs,
        },
      };
    })
    .filter((f): f is NonNullable<typeof f> => f !== null);
  write('geojson-all.json', { type: 'FeatureCollection', features });

  // ── Incidents ──────────────────────────────────────────────────────────────
  const rawIncidents = await prisma.incident.findMany({
    include: { asset: { select: { id: true, name: true, code: true } } },
    orderBy: { openedAt: 'desc' },
  });
  const incidents = rawIncidents.map((i) => ({
    ...i,
    openedAt: i.openedAt.toISOString(),
    resolvedAt: i.resolvedAt?.toISOString() ?? null,
  }));
  write('incidents.json', incidents);

  // ── Connections ────────────────────────────────────────────────────────────
  const rawConnections = await prisma.connection.findMany({
    include: {
      fromAsset: { select: { id: true, name: true, code: true } },
      toAsset: { select: { id: true, name: true, code: true } },
    },
  });
  write('connections.json', rawConnections);

  // ── Dashboard summary ──────────────────────────────────────────────────────
  const typeCounts = new Map<number, number>();
  rawAssets.forEach((a) => typeCounts.set(a.assetTypeId, (typeCounts.get(a.assetTypeId) ?? 0) + 1));
  const assetsByType = rawTypes.map((t) => ({
    key: t.key, label: t.label, color: t.color,
    count: typeCounts.get(t.id) ?? 0,
  }));

  const statusCounts = new Map<string, number>();
  rawAssets.forEach((a) => statusCounts.set(a.status, (statusCounts.get(a.status) ?? 0) + 1));
  const assetsByStatus = Array.from(statusCounts.entries()).map(([status, count]) => ({ status, count }));

  let totalFiberKm = 0;
  rawAssets.forEach((a) => {
    if (a.assetType.key !== 'fiber_cable') return;
    try {
      const geom = JSON.parse(a.geometry) as { type: string; coordinates: [number, number][] };
      if (geom.type === 'LineString') {
        for (let i = 0; i < geom.coordinates.length - 1; i++) {
          totalFiberKm += haversineKm(geom.coordinates[i], geom.coordinates[i + 1]);
        }
      }
    } catch { /* skip */ }
  });

  const openIncidents = rawIncidents.filter((i) => i.status !== 'resolved').length;
  const resolvedList = rawIncidents.filter((i) => i.status === 'resolved');
  const mttrHours =
    resolvedList.length === 0
      ? 0
      : resolvedList.reduce((sum, i) => {
          if (!i.resolvedAt) return sum;
          return sum + (i.resolvedAt.getTime() - i.openedAt.getTime()) / 3_600_000;
        }, 0) / resolvedList.length;

  const operationalCount = rawAssets.filter((a) => a.status === 'operational').length;
  const networkAvailabilityPct =
    rawAssets.length === 0 ? 100 : Math.round((operationalCount / rawAssets.length) * 1000) / 10;

  const now = new Date();
  const incidentTrend = Array.from({ length: 12 }, (_, i) => {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (11 - i) * 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const count = rawIncidents.filter(
      (inc) => inc.openedAt >= weekStart && inc.openedAt < weekEnd,
    ).length;
    return { week: weekStart.toISOString().slice(0, 10), count };
  });

  const siteType = rawTypes.find((t) => t.key === 'site');
  const siteAssets = siteType ? rawAssets.filter((a) => a.assetTypeId === siteType.id) : [];
  const childCounts = new Map<number, number>();
  rawAssets.forEach((a) => {
    if (a.parentId) childCounts.set(a.parentId, (childCounts.get(a.parentId) ?? 0) + 1);
  });
  const topSitesByAssets = siteAssets
    .map((s) => ({ id: s.id, name: s.name, assetCount: childCounts.get(s.id) ?? 0 }))
    .sort((a, b) => b.assetCount - a.assetCount)
    .slice(0, 5);

  const totalFibers = rawConnections.reduce((s, c) => s + c.fiberCount, 0);
  write('dashboard.json', {
    totalAssets: rawAssets.length,
    assetsByType,
    assetsByStatus,
    totalFiberKm: Math.round(totalFiberKm * 10) / 10,
    openIncidents,
    resolvedIncidents: resolvedList.length,
    mttrHours: Math.round(mttrHours * 10) / 10,
    networkAvailabilityPct,
    incidentTrend,
    topSitesByAssets,
    fiberCapacity: { usedFibers: Math.round(totalFibers * 0.6), totalFibers },
  });

  await prisma.$disconnect();
  console.log('\nDone — 6 files written.');
}

main().catch((e) => { console.error(e); process.exit(1); });
