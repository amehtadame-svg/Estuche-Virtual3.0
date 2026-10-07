import { Request, Response } from 'express';
import { receiptService } from './receipt.service';
import { asyncHandler } from '../../middlewares/asyncHandler';

const requesterFrom = (req: Request) => (req as any).user as { id: string; role: string } | undefined;

export const listReceipts = asyncHandler(async (_req: Request, res: Response) => {
  const receipts = await receiptService.list();
  return res.json(receipts);
});

export const createReceipt = asyncHandler(async (req: Request, res: Response) => {
  const receipt = await receiptService.create(req.body);
  return res.status(201).json(receipt);
});

export const updateReceipt = asyncHandler(async (req: Request, res: Response) => {
  const receipt = await receiptService.update(req.params.id, req.body, requesterFrom(req));
  return res.json(receipt);
});

export const deleteReceipt = asyncHandler(async (req: Request, res: Response) => {
  await receiptService.remove(req.params.id);
  return res.status(204).send();
});
