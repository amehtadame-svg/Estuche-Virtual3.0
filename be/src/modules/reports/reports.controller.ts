import { Request, Response } from 'express';
import { reportService } from './reports.service';
import { asyncHandler } from '../../middlewares/asyncHandler';

export const listReports = asyncHandler(async (req: Request, res: Response) => {
  const from = typeof req.query.from === 'string' ? req.query.from : undefined;
  const to = typeof req.query.to === 'string' ? req.query.to : undefined;
  const reports = await reportService.list({ from, to });
  return res.json(reports);
});

export const getGeneralSummary = asyncHandler(async (req: Request, res: Response) => {
  const from = typeof req.query.from === 'string' ? req.query.from : undefined;
  const to = typeof req.query.to === 'string' ? req.query.to : undefined;
  const summary = await reportService.getGeneralSummary({ from, to });
  return res.json(summary);
});

export const getAdminDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const dashboard = await reportService.getAdminDashboard();
  return res.json(dashboard);
});