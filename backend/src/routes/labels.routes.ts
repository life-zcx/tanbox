import { Router, Request, Response } from 'express';
import http from 'http';
import { authenticateJWT, requireAdmin } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

const router = Router();

// Protect label generator operations with JWT
router.use(authenticateJWT);

const LABEL_GENERATOR_HOST = process.env.LABEL_GENERATOR_HOST || 'label-generator';
const LABEL_GENERATOR_PORT = parseInt(process.env.LABEL_GENERATOR_PORT || '5060', 10);

const proxyToLabelGenerator = (targetPath: string) => {
  return (req: Request, res: Response) => {
    const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    const fullPath = `/api/labels${targetPath}${query}`;

    const headers = { ...req.headers };
    delete headers.host;

    const isJson = req.is('application/json');
    let jsonBodyBuffer: Buffer | null = null;

    if (isJson && req.body && Object.keys(req.body).length > 0) {
      jsonBodyBuffer = Buffer.from(JSON.stringify(req.body));
      headers['content-length'] = String(jsonBodyBuffer.length);
      headers['content-type'] = 'application/json';
    }

    const proxyReq = http.request(
      {
        hostname: LABEL_GENERATOR_HOST,
        port: LABEL_GENERATOR_PORT,
        path: fullPath,
        method: req.method,
        headers,
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
        proxyRes.pipe(res);
      }
    );

    proxyReq.on('error', (err) => {
      logger.error(`Label generator proxy error on ${fullPath}:`, err);
      if (!res.headersSent) {
        res.status(502).json({ message: 'Микросервис генератора этикеток временно недоступен' });
      }
    });

    if (jsonBodyBuffer) {
      proxyReq.write(jsonBodyBuffer);
      proxyReq.end();
    } else {
      req.pipe(proxyReq);
    }
  };
};

router.all('/parse-csv', proxyToLabelGenerator('/parse-csv'));
router.all('/generate-pdf', proxyToLabelGenerator('/generate-pdf'));
router.all('/preview', proxyToLabelGenerator('/preview'));

export default router;
