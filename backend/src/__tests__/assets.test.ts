import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../index';

let testAssetId: number;
let typeId: number;
let typeKey: string;

const TEST_CODE = '__TST_ASSET__';

beforeAll(async () => {
  const typesRes = await request(app).get('/api/asset-types');
  expect(typesRes.status).toBe(200);
  const types = typesRes.body as { id: number; key: string }[];
  if (!types.length) throw new Error('No AssetTypes in DB — run npm run db:seed first');
  typeId = types[0].id;
  typeKey = types[0].key;

  const createRes = await request(app).post('/api/assets').send({
    assetTypeId: typeId,
    name: '__test asset__',
    code: TEST_CODE,
    status: 'operational',
    geometry: { type: 'Point', coordinates: [0, 0] },
    attributes: {},
  });
  expect(createRes.status).toBe(201);
  testAssetId = createRes.body.id;
});

afterAll(async () => {
  if (testAssetId) {
    await request(app).delete(`/api/assets/${testAssetId}`);
  }
});

describe('GET /api/assets', () => {
  it('returns paginated envelope', async () => {
    const res = await request(app).get('/api/assets');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('assets');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('limit');
    expect(Array.isArray(res.body.assets)).toBe(true);
  });

  it('filters by type', async () => {
    const res = await request(app).get(`/api/assets?type=${typeKey}`);
    expect(res.status).toBe(200);
    expect(res.body.assets.every((a: { assetType: { key: string } }) => a.assetType.key === typeKey)).toBe(true);
  });

  it('filters by status', async () => {
    const res = await request(app).get('/api/assets?status=operational');
    expect(res.status).toBe(200);
    expect(res.body.assets.every((a: { status: string }) => a.status === 'operational')).toBe(true);
  });

  it('respects limit param', async () => {
    const res = await request(app).get('/api/assets?limit=3');
    expect(res.status).toBe(200);
    expect(res.body.assets.length).toBeLessThanOrEqual(3);
  });
});

describe('GET /api/assets/:id', () => {
  it('returns asset with nested assetType', async () => {
    const res = await request(app).get(`/api/assets/${testAssetId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(testAssetId);
    expect(res.body.assetType).toBeDefined();
    expect(res.body.assetType.key).toBe(typeKey);
  });

  it('returns 500 for unknown id', async () => {
    const res = await request(app).get('/api/assets/99999999');
    expect(res.status).toBe(500);
  });
});

describe('POST /api/assets', () => {
  it('rejects missing name with 400', async () => {
    const res = await request(app).post('/api/assets').send({
      assetTypeId: typeId,
      code: '__NO_NAME__',
      status: 'operational',
      geometry: { type: 'Point', coordinates: [0, 0] },
    });
    expect(res.status).toBe(400);
  });
});
