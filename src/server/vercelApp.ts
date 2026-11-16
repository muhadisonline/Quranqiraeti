import express, { NextFunction, Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { injectRouteSeoIntoHtml, resolveRouteSeoMetadata } from '../lib/seo';
import {
  createApiRouter,
  createSeoRouter,
  getChannelDataForSeo,
  getRequestOrigin,
} from './api';

const app = express();
app.use(express.json());

const seoRouter = createSeoRouter();
const apiRouter = createApiRouter();
app.use('/', seoRouter);
app.use('/api', seoRouter);
app.use('/api', apiRouter);

let cachedDistHtml: string | null = null;

function readTemplateHtml(): string | null {
  if (cachedDistHtml) return cachedDistHtml;
  const candidates = [
    path.resolve(process.cwd(), 'dist', 'index.html'),
    path.resolve(process.cwd(), 'index.html'),
  ];
  for (const filePath of candidates) {
    try {
      if (fs.existsSync(filePath)) {
        cachedDistHtml = fs.readFileSync(filePath, 'utf-8');
        return cachedDistHtml;
      }
    } catch {
      // try next candidate
    }
  }
  return null;
}

app.get('*', async (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api/')) {
    next();
    return;
  }

  const baseName = path.posix.basename(req.path);
  if (baseName.includes('.')) {
    res.status(404).send('Not found');
    return;
  }

  try {
    const templateHtml = readTemplateHtml();
    if (!templateHtml) {
      res.status(500).send('Application template unavailable');
      return;
    }
    const origin = getRequestOrigin(req);
    const { longVideos, shorts } = await getChannelDataForSeo();
    const seoMeta = resolveRouteSeoMetadata(req.path, origin, [...longVideos, ...shorts]);
    const html = injectRouteSeoIntoHtml(templateHtml, seoMeta);
    res
      .status(seoMeta.httpStatus)
      .setHeader('Content-Type', 'text/html; charset=utf-8')
      .setHeader('Cache-Control', seoMeta.httpStatus === 200 ? 's-maxage=300, stale-while-revalidate=3600' : 'no-store')
      .send(html);
  } catch (err) {
    next(err);
  }
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'API marşrutu tapılmadı.' });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Vercel API error:', err);
  res.status(500).json({ error: 'Server xətası baş verdi.' });
});

export default app;
