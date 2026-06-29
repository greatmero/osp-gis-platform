import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

import assetTypesRouter from './routes/assetTypes';
import assetsRouter from './routes/assets';
import connectionsRouter from './routes/connections';
import incidentsRouter from './routes/incidents';
import maintenanceRouter from './routes/maintenance';
import dashboardRouter from './routes/dashboard';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/asset-types', assetTypesRouter);
app.use('/api/assets', assetsRouter);
app.use('/api/connections', connectionsRouter);
app.use('/api/incidents', incidentsRouter);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api/dashboard', dashboardRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// 404
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message ?? 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
}

export default app;
