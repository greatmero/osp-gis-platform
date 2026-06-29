import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { validate } from '../middleware/validate';

const router = Router();
const prisma = new PrismaClient();

const assetTypeSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  geometryKind: z.enum(['point', 'line', 'polygon']),
  icon: z.string().min(1),
  color: z.string().min(1),
  fieldSchema: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      type: z.enum(['text', 'number', 'select', 'date', 'boolean']),
      required: z.boolean(),
      options: z.array(z.string()).optional(),
    })
  ).optional().default([]),
});

router.get('/', async (_req, res, next) => {
  try {
    const types = await prisma.assetType.findMany({ orderBy: { label: 'asc' } });
    res.json(types.map((t) => ({ ...t, fieldSchema: JSON.parse(t.fieldSchema) })));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const t = await prisma.assetType.findUniqueOrThrow({ where: { id: Number(req.params.id) } });
    res.json({ ...t, fieldSchema: JSON.parse(t.fieldSchema) });
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(assetTypeSchema), async (req, res, next) => {
  try {
    const { fieldSchema, ...rest } = assetTypeSchema.parse(req.body);
    const t = await prisma.assetType.create({
      data: { ...rest, fieldSchema: JSON.stringify(fieldSchema) },
    });
    res.status(201).json({ ...t, fieldSchema: JSON.parse(t.fieldSchema) });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', validate(assetTypeSchema.partial()), async (req, res, next) => {
  try {
    const body = assetTypeSchema.partial().parse(req.body);
    const data: Record<string, unknown> = { ...body };
    if (body.fieldSchema !== undefined) {
      data.fieldSchema = JSON.stringify(body.fieldSchema);
    }
    const t = await prisma.assetType.update({
      where: { id: Number(req.params.id) },
      data,
    });
    res.json({ ...t, fieldSchema: JSON.parse(t.fieldSchema) });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.assetType.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
