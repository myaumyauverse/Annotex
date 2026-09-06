import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { BlockchainService } from '../services/blockchain.service.js';
import { PayoutService } from '../services/payout.service.js';
import { ApiResponse } from '../types/index.js';

export class PayoutController {
  private payoutService: PayoutService;
  private blockchainService: BlockchainService;

  constructor() {
    this.payoutService = new PayoutService();
    this.blockchainService = new BlockchainService();
  }

  calculatePayouts = asyncHandler(async (req: Request, res: Response) => {
    const datasetId = req.body.datasetId as string | undefined;
    const result = await this.payoutService.calculatePayouts(datasetId);

    const response: ApiResponse = {
      success: true,
      message: 'Payouts calculated successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  });

  getPendingPayouts = asyncHandler(async (req: Request, res: Response) => {
    const contributorId = req.userId!;
    const result = await this.payoutService.getContributorPendingPayouts(contributorId);

    const response: ApiResponse = {
      success: true,
      message: 'Pending payouts retrieved successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  });

  triggerPayout = asyncHandler(async (req: Request, res: Response) => {
    const { userId, datasetId } = req.body as { userId: string; datasetId?: string };

    const payoutRequest = await this.blockchainService.createContributorPayoutRequest({
      adminUserId: req.userId!,
      contributorId: userId,
      datasetId,
    });

    const response: ApiResponse = {
      success: true,
      message: 'Contributor payout request created successfully',
      data: payoutRequest,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  });
}
