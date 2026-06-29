import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { validate } from '../middleware/validate';

const router = Router();
const prisma = new PrismaClient();

const connectionSchema = z.object({
  fromAssetId: z.number().int(),
  toAssetId: z.number().int(),
  cableAssetId: z.number().int().nullable().optional(),
  fiberCount: z.number().int().min(0).default(0),
  notes: z.string().optional(),
});

router.get('/', async (_req, res, next) => {
  try {
    const connections = await prisma.connection.findMany({
      include: {
        fromAsset: { select: { id: true, name: true, code: true } },
        toAsset: { select: { id: true, name: true, code: true } },
      },
    });
    res.json(connections);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const c = await prisma.connection.findUniqueOrThrow({
      where: { id: Number(req.params.id) },
      include: {
        fromAsset: true,
        toAsset: true,
        cableAsset: true,
      },
    });
    res.json(c);
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(connectionSchema), async (req, res, next) => {
  try {
    const body = connectionSchema.parse(req.body);
    const c = await prisma.connection.create({ data: body });
    res.status(201).json(c);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', validate(connectionSchema.partial()), async (req, res, next) => {
  try {
    const body = connectionSchema.partial().parse(req.body);
    const c = await prisma.connection.update({ where: { id: Number(req.params.id) }, data: body });
    res.json(c);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.connection.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
