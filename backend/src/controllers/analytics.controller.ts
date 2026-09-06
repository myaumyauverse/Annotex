import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { AnalyticsService } from '../services/analytics.service.js';
import { ApiResponse } from '../types/index.js';

export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor() {
    this.analyticsService = new AnalyticsService();
  }

  /**
   * Get dashboard statistics
   */
  getDashboardStats = asyncHandler(async (_req: Request, res: Response) => {
    const stats = await this.analyticsService.getDashboardStats();

    const response: ApiResponse = {
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data: stats,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  });

  /**
   * Get user performance metrics
   */
  getUserPerformance = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const performance = await this.analyticsService.getUserPerformance(userId);

    const response: ApiResponse = {
      success: true,
      message: 'User performance retrieved successfully',
      data: performance,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  });

  /**
   * Get quality metrics
   */
  getQualityMetrics = asyncHandler(async (_req: Request, res: Response) => {
    const metrics = await this.analyticsService.getQualityMetrics();

    const response: ApiResponse = {
      success: true,
      message: 'Quality metrics retrieved successfully',
      data: metrics,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  });
}
