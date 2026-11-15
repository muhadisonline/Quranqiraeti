import express, { NextFunction, Request, Response } from 'express';
import { createApiRouter, createSeoRouter } from '../src/server/api';

const app = express();
app.use(express.json());

const seoRouter = createSeoRouter();
const apiRouter = createApiRouter();
app.use('/', seoRouter);
app.use('/api', seoRouter);
app.use('/api', apiRouter);
app.use('/', apiRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'API marşrutu tapılmadı.' });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Vercel API error:', err);
  res.status(500).json({ error: 'Server xətası baş verdi.' });
});

export default app;
