import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { AuthService } from '../services/auth.service.js';
import { ApiResponse } from '../types/index.js';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Register a new user
   */
  register = asyncHandler(async (req: Request, res: Response) => {
    const userData = req.body;
    const result = await this.authService.register(userData);

    const response: ApiResponse = {
      success: true,
      message: 'User registered successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };

    res.status(201).json(response);
  });

  /**
   * Login user
   */
  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await this.authService.login(email, password);

    const response: ApiResponse = {
      success: true,
      message: 'Login successful',
      data: result,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  });

  /**
   * Refresh access token
   */
  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const result = await this.authService.refreshToken(refreshToken);

    const response: ApiResponse = {
      success: true,
      message: 'Token refreshed successfully',
      data: result,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  });

  /**
   * Get current user profile
   */
  getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const user = await this.authService.getUserProfile(userId);

    const response: ApiResponse = {
      success: true,
      message: 'User profile retrieved successfully',
      data: user,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  });
}
