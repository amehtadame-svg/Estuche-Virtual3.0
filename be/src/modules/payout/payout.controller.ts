import { Request, Response } from 'express';
import { payoutService } from './payout.service';
import { asyncHandler } from '../../middlewares/asyncHandler';

const requesterFrom = (req: Request) => (req as any).user as { id: string; role: string };

export const listPayouts = asyncHandler(async (_req: Request, res: Response) => {
  const payouts = await payoutService.list();
  return res.json(payouts);
});

export const getPayout = asyncHandler(async (req: Request, res: Response) => {
  const payout = await payoutService.getById(req.params.id);
  return res.json(payout);
});

export const createPayout = asyncHandler(async (req: Request, res: Response) => {
  const payout = await payoutService.create(req.body, requesterFrom(req));
  return res.status(201).json(payout);
});

export const updatePayoutStatus = asyncHandler(async (req: Request, res: Response) => {
  const payout = await payoutService.updateStatus(req.params.id, req.body.status, req.body.confirmedAt);
  return res.json(payout);
});
