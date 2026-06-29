import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { GeoFeatureCollection } from '../types';

const router = Router();
const prisma = new PrismaClient();

const assetSchema = z.object({
  assetTypeId: z.number().int(),
  name: z.string().min(1),
  code: z.string().min(1),
  status: z.enum(['operational', 'degraded', 'down', 'under_maintenance']).default('operational'),
  geometry: z.record(z.unknown()),
  attributes: z.record(z.unknown()).optional().default({}),
  parentId: z.number().int().nullable().optional(),
});

function parseAsset(a: { geometry: string; attributes: string; [key: string]: unknown }) {
  return {
    ...a,
    geometry: JSON.parse(a.geometry),
    attributes: JSON.parse(a.attributes),
  };
}

// GeoJSON endpoint — must be before /:id
router.get('/geojson', async (req, res, next) => {
  try {
    const typeKey = req.query.type as string | undefined;
    const where = typeKey ? { assetType: { key: typeKey } } : {};
    const assets = await prisma.asset.findMany({
      where,
      include: { assetType: true },
    });

    const collection: GeoFeatureCollection = {
      type: 'FeatureCollection',
      features: assets.map((a) => ({
        type: 'Feature',
        geometry: JSON.parse(a.geometry),
        properties: {
          id: a.id,
          name: a.name,
          code: a.code,
          status: a.status,
          assetTypeKey: a.assetType.key,
          assetTypeLabel: a.assetType.label,
          color: a.assetType.color,
          icon: a.assetType.icon,
          attributes: JSON.parse(a.attributes),
        },
      })),
    };
    res.json(collection);
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const { type, status, page = '1', limit = '50' } = req.query as Record<string, string>;
    const where: Record<string, unknown> = {};
    if (type) where.assetType = { key: type };
    if (status) where.status = status;

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        include: { assetType: true },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { name: 'asc' },
      }),
      prisma.asset.count({ where }),
    ]);
    res.json({ assets: assets.map(parseAsset), total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const a = await prisma.asset.findUniqueOrThrow({
      where: { id: Number(req.params.id) },
      include: {
        assetType: true,
        parent: true,
        children: true,
        connectionsFrom: { include: { toAsset: true } },
        connectionsTo: { include: { fromAsset: true } },
        incidents: { orderBy: { openedAt: 'desc' }, take: 5 },
        maintenance: { orderBy: { date: 'desc' }, take: 5 },
      },
    });
    res.json(parseAsset(a));
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(assetSchema), async (req, res, next) => {
  try {
    const body = assetSchema.parse(req.body);
    const a = await prisma.asset.create({
      data: {
        ...body,
        geometry: JSON.stringify(body.geometry),
        attributes: JSON.stringify(body.attributes),
      },
    });
    res.status(201).json(parseAsset(a));
  } catch (err) {
    next(err);
  }
});

router.put('/:id', validate(assetSchema.partial()), async (req, res, next) => {
  try {
    const body = assetSchema.partial().parse(req.body);
    const data: Record<string, unknown> = { ...body };
    if (body.geometry !== undefined) data.geometry = JSON.stringify(body.geometry);
    if (body.attributes !== undefined) data.attributes = JSON.stringify(body.attributes);
    const a = await prisma.asset.update({ where: { id: Number(req.params.id) }, data });
    res.json(parseAsset(a));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.asset.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
