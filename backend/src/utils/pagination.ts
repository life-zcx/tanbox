import { Request, Response } from 'express';

export function pagination(req: Request, res: Response) {
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 100));
  const page = Math.min(100000, Math.max(1, Number(req.query.page) || 1));
  res.setHeader('Access-Control-Expose-Headers', 'X-Next-Page');
  return { take: Math.floor(limit), skip: (Math.floor(page) - 1) * Math.floor(limit), page: Math.floor(page) };
}

export function nextPage(res: Response, count: number, take: number, page: number) {
  if (count === take) res.setHeader('X-Next-Page', String(page + 1));
}
