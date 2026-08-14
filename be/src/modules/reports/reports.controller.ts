import { Request, Response } from 'express';
import { reportService } from './reports.service';
import { asyncHandler } from '../../middlewares/asyncHandler';

export const listReports = asyncHandler(async (_req: Request, res: Response) => {
  const reports = await reportService.list();
  return res.json(reports);
});

export const getGeneralSummary = asyncHandler(async (_req: Request, res: Response) => {
  const summary = await reportService.getGeneralSummary();
  return res.json(summary);
});
