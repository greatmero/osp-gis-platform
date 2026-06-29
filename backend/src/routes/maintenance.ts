import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req, res, next) => {
  try {
    const { assetId } = req.query as Record<string, string>;
    const where = assetId ? { assetId: Number(assetId) } : {};
    const logs = await prisma.maintenanceLog.findMany({
      where,
      include: { asset: { select: { id: true, name: true, code: true } } },
      orderBy: { date: 'desc' },
    });
    res.json(logs);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const log = await prisma.maintenanceLog.findUniqueOrThrow({
      where: { id: Number(req.params.id) },
      include: { asset: true },
    });
    res.json(log);
  } catch (err) {
    next(err);
  }
});

export default router;
