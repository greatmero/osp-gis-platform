import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { validate } from '../middleware/validate';

const router = Router();
const prisma = new PrismaClient();

const incidentSchema = z.object({
  assetId: z.number().int(),
  category: z.string().min(1),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum(['open', 'investigating', 'resolved']).default('open'),
  openedAt: z.string().datetime().optional(),
  resolvedAt: z.string().datetime().nullable().optional(),
  description: z.string().min(1),
});

router.get('/', async (req, res, next) => {
  try {
    const { status, severity, assetId } = req.query as Record<string, string>;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (assetId) where.assetId = Number(assetId);

    const incidents = await prisma.incident.findMany({
      where,
      include: { asset: { select: { id: true, name: true, code: true } } },
      orderBy: { openedAt: 'desc' },
    });
    res.json(incidents);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const i = await prisma.incident.findUniqueOrThrow({
      where: { id: Number(req.params.id) },
      include: { asset: true },
    });
    res.json(i);
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(incidentSchema), async (req, res, next) => {
  try {
    const body = incidentSchema.parse(req.body);
    const i = await prisma.incident.create({
      data: {
        ...body,
        openedAt: body.openedAt ? new Date(body.openedAt) : new Date(),
        resolvedAt: body.resolvedAt ? new Date(body.resolvedAt) : null,
      },
    });
    res.status(201).json(i);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', validate(incidentSchema.partial()), async (req, res, next) => {
  try {
    const body = incidentSchema.partial().parse(req.body);
    const data: Record<string, unknown> = { ...body };
    if (body.openedAt) data.openedAt = new Date(body.openedAt);
    if (body.resolvedAt !== undefined)
      data.resolvedAt = body.resolvedAt ? new Date(body.resolvedAt) : null;
    const i = await prisma.incident.update({ where: { id: Number(req.params.id) }, data });
    res.json(i);
  } catch (err) {
    next(err);
  }
});

export default router;
