import 'dotenv/config';
import express, { Request } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { injectRouteSeoIntoHtml, resolveRouteSeoMetadata } from './src/lib/seo';
import {
  createApiRouter,
  createSeoRouter,
  fetchLiveChannelData,
  fetchMushafPage,
  fetchSurahTranslation,
  getChannelDataForSeo,
  getRequestOrigin,
  getRouteSeoExtras,
} from './src/server/api';
import { startTelegramBotRuntime } from './src/server/telegram';

const PORT = Number(process.env.PORT || 3000);

function isHtmlPageRequest(req: Request): boolean {
  if (req.method !== 'GET') return false;
  const p = req.path;
  if (
    p.startsWith('/api/') ||
    p.startsWith('/src/') ||
    p.startsWith('/@') ||
    p.startsWith('/node_modules/') ||
    p.startsWith('/assets/') ||
    p.startsWith('/og/') ||
    p.startsWith('/.well-known/')
  ) {
    return false;
  }
  const baseName = path.posix.basename(p);
  if (baseName.includes('.')) return false;
  return true;
}

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use('/', createSeoRouter());
  app.use('/api', createApiRouter());

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.use(async (req, res, next) => {
      if (!isHtmlPageRequest(req)) {
        next();
        return;
      }
      try {
        const rawHtml = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        const transformed = await vite.transformIndexHtml(req.originalUrl, rawHtml);
        const origin = getRequestOrigin(req);
        const [{ longVideos, shorts }, extras] = await Promise.all([
          getChannelDataForSeo(),
          getRouteSeoExtras(req.path),
        ]);
        const seoMeta = resolveRouteSeoMetadata(req.path, origin, [...longVideos, ...shorts], extras);
        const html = injectRouteSeoIntoHtml(transformed, seoMeta, {
          googleSiteVerification: process.env.GOOGLE_SITE_VERIFICATION,
        });
        res.status(seoMeta.httpStatus).setHeader('Content-Type', 'text/html; charset=utf-8').send(html);
      } catch (err) {
        vite.ssrFixStacktrace(err as Error);
        next(err);
      }
    });
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    const templateHtml = fs.readFileSync(path.join(distPath, 'index.html'), 'utf-8');
    app.use(express.static(distPath, { index: false }));

    app.get('*', async (req, res) => {
      const origin = getRequestOrigin(req);
      const [{ longVideos, shorts }, extras] = await Promise.all([
        getChannelDataForSeo(),
        getRouteSeoExtras(req.path),
      ]);
      const seoMeta = resolveRouteSeoMetadata(req.path, origin, [...longVideos, ...shorts], extras);
      const html = injectRouteSeoIntoHtml(templateHtml, seoMeta, {
        googleSiteVerification: process.env.GOOGLE_SITE_VERIFICATION,
      });
      res.status(seoMeta.httpStatus).setHeader('Content-Type', 'text/html; charset=utf-8').send(html);
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Quran Qiraeti server running on http://0.0.0.0:${PORT}`);
    void fetchLiveChannelData();
    void startTelegramBotRuntime({
      getChannelDataForSeo,
      fetchSurahTranslation,
      fetchMushafPage,
    });
  });
}

startServer();
