import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index';

describe('GET /api/dashboard/summary', () => {
  it('returns 200 with all required top-level fields', async () => {
    const res = await request(app).get('/api/dashboard/summary');
    expect(res.status).toBe(200);
    const body = res.body;
    expect(body).toHaveProperty('totalAssets');
    expect(body).toHaveProperty('assetsByType');
    expect(body).toHaveProperty('assetsByStatus');
    expect(body).toHaveProperty('totalFiberKm');
    expect(body).toHaveProperty('openIncidents');
    expect(body).toHaveProperty('resolvedIncidents');
    expect(body).toHaveProperty('mttrHours');
    expect(body).toHaveProperty('networkAvailabilityPct');
    expect(body).toHaveProperty('incidentTrend');
    expect(body).toHaveProperty('topSitesByAssets');
    expect(body).toHaveProperty('fiberCapacity');
  });

  it('incidentTrend has exactly 12 entries', async () => {
    const res = await request(app).get('/api/dashboard/summary');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.incidentTrend)).toBe(true);
    expect(res.body.incidentTrend).toHaveLength(12);
  });

  it('incidentTrend entries have week and count fields', async () => {
    const res = await request(app).get('/api/dashboard/summary');
    const trend = res.body.incidentTrend as { week: string; count: number }[];
    trend.forEach((entry) => {
      expect(entry).toHaveProperty('week');
      expect(entry).toHaveProperty('count');
      expect(typeof entry.count).toBe('number');
    });
  });

  it('assetsByType entries have key, label, color, and count fields', async () => {
    const res = await request(app).get('/api/dashboard/summary');
    const types = res.body.assetsByType as { key: string; label: string; color: string; count: number }[];
    expect(Array.isArray(types)).toBe(true);
    types.forEach((entry) => {
      expect(entry).toHaveProperty('key');
      expect(entry).toHaveProperty('label');
      expect(entry).toHaveProperty('color');
      expect(entry).toHaveProperty('count');
    });
  });
});
