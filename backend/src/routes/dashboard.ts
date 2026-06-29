import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { DashboardSummary } from '../types';

const router = Router();
const prisma = new PrismaClient();

router.get('/summary', async (_req, res, next) => {
  try {
    const [assets, assetTypes, incidents, connections] = await Promise.all([
      prisma.asset.findMany({ include: { assetType: true } }),
      prisma.assetType.findMany(),
      prisma.incident.findMany(),
      prisma.connection.findMany(),
    ]);

    // Assets by type
    const typeCounts = new Map<number, number>();
    assets.forEach((a) => typeCounts.set(a.assetTypeId, (typeCounts.get(a.assetTypeId) ?? 0) + 1));
    const assetsByType = assetTypes.map((t) => ({
      key: t.key,
      label: t.label,
      color: t.color,
      count: typeCounts.get(t.id) ?? 0,
    }));

    // Assets by status
    const statusCounts = new Map<string, number>();
    assets.forEach((a) => statusCounts.set(a.status, (statusCounts.get(a.status) ?? 0) + 1));
    const assetsByStatus = Array.from(statusCounts.entries()).map(([status, count]) => ({
      status,
      count,
    }));

    // Fiber km — sum LineString geometry lengths approximated by coordinate distance
    const fiberTypeKeys = ['fiber_cable'];
    let totalFiberKm = 0;
    assets.forEach((a) => {
      if (!fiberTypeKeys.includes(a.assetType.key)) return;
      try {
        const geom = JSON.parse(a.geometry);
        if (geom.type === 'LineString') {
          const coords: [number, number][] = geom.coordinates;
          for (let i = 0; i < coords.length - 1; i++) {
            totalFiberKm += haversineKm(coords[i], coords[i + 1]);
          }
        }
      } catch {
        // skip unparseable geometry
      }
    });

    // Incidents KPIs
    const openIncidents = incidents.filter((i) => i.status !== 'resolved').length;
    const resolvedIncidents = incidents.filter((i) => i.status === 'resolved');
    const mttrHours =
      resolvedIncidents.length === 0
        ? 0
        : resolvedIncidents.reduce((sum, i) => {
            if (!i.resolvedAt) return sum;
            return sum + (i.resolvedAt.getTime() - i.openedAt.getTime()) / 3_600_000;
          }, 0) / resolvedIncidents.length;

    // Network availability: operational / total
    const operationalCount = assets.filter((a) => a.status === 'operational').length;
    const networkAvailabilityPct =
      assets.length === 0 ? 100 : Math.round((operationalCount / assets.length) * 1000) / 10;

    // 12-week incident trend
    const now = new Date();
    const incidentTrend = Array.from({ length: 12 }, (_, i) => {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (11 - i) * 7);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      const count = incidents.filter(
        (inc) => inc.openedAt >= weekStart && inc.openedAt < weekEnd
      ).length;
      return {
        week: weekStart.toISOString().slice(0, 10),
        count,
      };
    });

    // Top 5 sites by child asset count
    const siteType = assetTypes.find((t) => t.key === 'site');
    const siteAssets = siteType ? assets.filter((a) => a.assetTypeId === siteType.id) : [];
    const childCounts = new Map<number, number>();
    assets.forEach((a) => {
      if (a.parentId) childCounts.set(a.parentId, (childCounts.get(a.parentId) ?? 0) + 1);
    });
    const topSitesByAssets = siteAssets
      .map((s) => ({ id: s.id, name: s.name, assetCount: childCounts.get(s.id) ?? 0 }))
      .sort((a, b) => b.assetCount - a.assetCount)
      .slice(0, 5);

    // Fiber capacity
    const totalFibers = connections.reduce((s, c) => s + c.fiberCount, 0);
    // Approximate used fibers as 60% of total (real system would track per-fiber)
    const usedFibers = Math.round(totalFibers * 0.6);

    const summary: DashboardSummary = {
      totalAssets: assets.length,
      assetsByType,
      assetsByStatus,
      totalFiberKm: Math.round(totalFiberKm * 10) / 10,
      openIncidents,
      resolvedIncidents: resolvedIncidents.length,
      mttrHours: Math.round(mttrHours * 10) / 10,
      networkAvailabilityPct,
      incidentTrend,
      topSitesByAssets,
      fiberCapacity: { usedFibers, totalFibers },
    };

    res.json(summary);
  } catch (err) {
    next(err);
  }
});

function haversineKm([lon1, lat1]: [number, number], [lon2, lat2]: [number, number]): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default router;
