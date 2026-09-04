import { Router } from 'express';
import { body, param } from 'express-validator';
import { PublicKey } from '@solana/web3.js';
import { BlockchainController } from '../controllers/blockchain.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validation.js';
import { UserRole } from '../types/index.js';

const router = Router();
const blockchainController = new BlockchainController();

/**
 * @swagger
 * /blockchain/connect-wallet:
 *   post:
 *     summary: Connect wallet address to user account
 *     tags: [Blockchain]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - walletAddress
 *             properties:
 *               walletAddress:
 *                 type: string
 *     responses:
 *       200:
 *         description: Wallet connected successfully
 */
router.post(
  '/connect-wallet',
  authenticate,
  validate([
    body('walletAddress').custom((value: string) => {
      try {
        new PublicKey(value);
        return true;
      } catch {
        throw new Error('walletAddress must be a valid Solana public key');
      }
    }),
  ]),
  blockchainController.connectWallet
);

router.post(
  '/project-funding-request',
  authenticate,
  authorize(UserRole.ADMIN),
  validate([
    body('datasetId').isUUID(),
    body('amountSOL').isFloat({ min: 0.000001 }),
    body('label').optional().isString(),
    body('message').optional().isString(),
    body('memo').optional().isString(),
  ]),
  blockchainController.createProjectFundingRequest
);

router.post(
  '/confirm-transfer',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.VALIDATOR),
  validate([body('transactionId').isUUID()]),
  blockchainController.confirmTransferRequest
);

/**
 * @swagger
 * /blockchain/payout:
 *   post:
 *     summary: Process payout to user (Admin only)
 *     tags: [Blockchain]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - amount
 *             properties:
 *               userId:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Payout processed successfully
 */
router.post(
  '/payout',
  authenticate,
  authorize(UserRole.ADMIN),
  validate([
    body('userId').isUUID(),
    body('amount').isFloat({ min: 0.001 }),
  ]),
  blockchainController.processPayout
);

/**
 * @swagger
 * /blockchain/transactions:
 *   get:
 *     summary: Get transaction history
 *     tags: [Blockchain]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Transaction history
 */
router.get(
  '/transactions',
  authenticate,
  blockchainController.getTransactions
);

/**
 * @swagger
 * /blockchain/transactions/{id}:
 *   get:
 *     summary: Get transaction by ID
 *     tags: [Blockchain]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction details
 */
router.get(
  '/transactions/:id',
  authenticate,
  validate([param('id').isUUID()]),
  blockchainController.getTransactionById
);

export default router;
