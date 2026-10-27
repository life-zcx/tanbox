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

    let payloadBuffer: Buffer | null = null;
    const method = (req.method || 'GET').toUpperCase();
    const hasBody = !['GET', 'HEAD', 'DELETE'].includes(method);

    if (hasBody && req.body) {
      if (Buffer.isBuffer(req.body)) {
        payloadBuffer = req.body;
      } else if (typeof req.body === 'object' && Object.keys(req.body).length > 0) {
        payloadBuffer = Buffer.from(JSON.stringify(req.body));
        headers['content-type'] = 'application/json';
      }
    }

    if (payloadBuffer) {
      headers['content-length'] = String(payloadBuffer.length);
    } else if (!hasBody) {
      delete headers['content-length'];
    }

    const proxyReq = http.request(
      {
        hostname: LABEL_GENERATOR_HOST,
        port: LABEL_GENERATOR_PORT,
        path: fullPath,
        method,
        headers,
        timeout: 60000,
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
        proxyRes.pipe(res);
      }
    );

    proxyReq.on('timeout', () => {
      proxyReq.destroy(new Error('Proxy request timed out'));
    });

    proxyReq.on('error', (err) => {
      logger.error(`Label generator proxy error on ${fullPath}:`, err);
      if (!res.headersSent) {
        res.status(502).json({ message: 'Микросервис генератора этикеток временно недоступен' });
      }
    });

    req.on('close', () => {
      if (!proxyReq.destroyed) {
        proxyReq.destroy();
      }
    });

    if (payloadBuffer) {
      proxyReq.write(payloadBuffer);
      proxyReq.end();
    } else if (!hasBody) {
      proxyReq.end();
    } else {
      req.pipe(proxyReq);
    }
  };
};

router.all('/parse-csv', proxyToLabelGenerator('/parse-csv'));
// Direct batch generation without order/payment checks is strictly restricted to Admin
router.all('/generate-pdf', requireAdmin, proxyToLabelGenerator('/generate-pdf'));
router.all('/preview', proxyToLabelGenerator('/preview'));
router.get('/progress/:trackId', (req, res) => {
  return proxyToLabelGenerator(`/progress/${encodeURIComponent(req.params.trackId)}`)(req, res);
});

export default router;
