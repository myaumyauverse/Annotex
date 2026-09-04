import { encodeURL, findReference, validateTransfer } from '@solana/pay';
import BigNumber from 'bignumber.js';
import QRCode from 'qrcode';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';
import { prisma } from '../config/prisma.js';
import { AppError } from '../middlewares/errorHandler.js';
import { TransactionStatus } from '../types/index.js';

export class BlockchainService {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(config.blockchain.solanaRpcUrl, 'confirmed');
  }

  private toPublicKey(address: string, fieldLabel: string): PublicKey {
    try {
      return new PublicKey(address);
    } catch {
      throw new AppError(`${fieldLabel} is not a valid Solana address`, 400);
    }
  }

  private async buildQrCode(url: string) {
    return QRCode.toDataURL(url, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  }

  private async getProjectRecipientAddress(datasetId: string) {
    const dataset = await prisma.dataset.findUnique({ where: { id: datasetId } });

    if (!dataset) {
      throw new AppError('Dataset not found', 404);
    }

    const schemaObject =
      dataset.schema && typeof dataset.schema === 'object' && !Array.isArray(dataset.schema)
        ? (dataset.schema as Record<string, unknown>)
        : {};

    const projectWallet =
      (typeof schemaObject.projectWalletAddress === 'string' && schemaObject.projectWalletAddress) ||
      config.blockchain.projectTreasuryWallet;

    if (!projectWallet) {
      throw new AppError('Project treasury wallet is not configured', 500);
    }

    return {
      dataset,
      projectWallet,
    };
  }

  async createProjectFundingRequest(params: {
    adminUserId: string;
    datasetId: string;
    amountSOL: number;
    label?: string;
    message?: string;
    memo?: string;
  }) {
    const { dataset, projectWallet } = await this.getProjectRecipientAddress(params.datasetId);
    const recipient = this.toPublicKey(projectWallet, 'Project wallet');
    const reference = Keypair.generate().publicKey;
    const amount = new BigNumber(params.amountSOL);

    const url = encodeURL({
      recipient,
      amount: amount as any,
      reference,
      label: params.label ?? `Annotex - ${dataset.name}`,
      message: params.message ?? `Fund dataset ${dataset.name}`,
      memo: params.memo ?? `fund:${dataset.id}`,
    });

    const paymentUrl = url.toString();
    const qrCode = await this.buildQrCode(paymentUrl);

    const transaction = await prisma.transaction.create({
      data: {
        userId: params.adminUserId,
        amount: params.amountSOL,
        status: TransactionStatus.PENDING,
        toAddress: projectWallet,
        description: `Project funding request for dataset ${dataset.name}`,
        metadata: {
          type: 'project_funding',
          datasetId: dataset.id,
          reference: reference.toBase58(),
          paymentUrl,
          network: 'solana-devnet',
        },
      },
    });

    return {
      transactionId: transaction.id,
      paymentUrl,
      qrCode,
      reference: reference.toBase58(),
      recipient: projectWallet,
      amountSOL: params.amountSOL,
      network: 'devnet',
    };
  }

  async createContributorPayoutRequest(params: {
    adminUserId: string;
    contributorId: string;
    datasetId?: string;
    label?: string;
    message?: string;
  }) {
    const contributor = await prisma.user.findUnique({ where: { id: params.contributorId } });

    if (!contributor) {
      throw new AppError('Contributor not found', 404);
    }

    const contributorWalletAddress = contributor.walletAddress;

    if (!contributorWalletAddress) {
      throw new AppError('Contributor has not connected a Solana wallet', 400);
    }

    const where = params.datasetId
      ? {
          contributorId: params.contributorId,
          datasetId: params.datasetId,
          status: 'pending',
        }
      : {
          contributorId: params.contributorId,
          status: 'pending',
        };

    const pendingPayouts = await prisma.payout.findMany({ where });

    if (pendingPayouts.length === 0) {
      throw new AppError('No pending contributor earnings found', 400);
    }

    const totalAmountSOL = pendingPayouts.reduce((sum: number, payout) => sum + payout.amountSOL, 0);
    const recipient = this.toPublicKey(contributorWalletAddress, 'Contributor wallet');
    const reference = Keypair.generate().publicKey;
    const payoutIds = pendingPayouts.map((payout) => payout.id);

    const url = encodeURL({
      recipient,
      amount: new BigNumber(totalAmountSOL) as any,
      reference,
      label: params.label ?? 'Annotex Contributor Payout',
      message: params.message ?? `Payout for ${contributor.firstName} ${contributor.lastName}`,
      memo: `payout:${contributor.id}`,
    });

    const paymentUrl = url.toString();
    const qrCode = await this.buildQrCode(paymentUrl);

    const transaction = await prisma.$transaction(async (tx) => {
      await tx.payout.updateMany({
        where: {
          id: { in: payoutIds },
          status: 'pending',
        },
        data: {
          status: 'processing',
        },
      });

      return tx.transaction.create({
        data: {
          userId: params.contributorId,
          amount: totalAmountSOL,
          status: TransactionStatus.PENDING,
          toAddress: contributorWalletAddress,
          fromAddress: config.blockchain.projectTreasuryWallet || undefined,
          description: `Contributor payout request (${pendingPayouts.length} labels)`,
          metadata: {
            type: 'contributor_payout',
            payoutIds,
            contributorId: params.contributorId,
            datasetId: params.datasetId ?? null,
            reference: reference.toBase58(),
            paymentUrl,
            network: 'solana-devnet',
            createdBy: params.adminUserId,
          },
        },
      });
    });

    return {
      transactionId: transaction.id,
      paymentUrl,
      qrCode,
      reference: reference.toBase58(),
      recipient: contributorWalletAddress,
      amountSOL: totalAmountSOL,
      payoutCount: pendingPayouts.length,
      network: 'devnet',
    };
  }

  async confirmTransferRequest(transactionId: string) {
    const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } });

    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    const metadata =
      transaction.metadata && typeof transaction.metadata === 'object' && !Array.isArray(transaction.metadata)
        ? (transaction.metadata as Record<string, unknown>)
        : null;

    if (!metadata || typeof metadata.reference !== 'string') {
      throw new AppError('Transaction does not include a Solana Pay reference', 400);
    }

    try {
      const recipient = this.toPublicKey(transaction.toAddress, 'Recipient wallet');
      const reference = this.toPublicKey(metadata.reference, 'Reference');
      const signatureInfo = await findReference(this.connection, reference, { finality: 'confirmed' });

      await validateTransfer(
        this.connection,
        signatureInfo.signature,
        {
          recipient,
          amount: new BigNumber(transaction.amount) as any,
          reference,
        },
        {
          commitment: 'confirmed',
        }
      );

      const completed = await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: TransactionStatus.COMPLETED,
          transactionHash: signatureInfo.signature,
          completedAt: new Date(),
          errorMessage: null,
        },
      });

      if (metadata.type === 'contributor_payout' && Array.isArray(metadata.payoutIds)) {
        const payoutIds = metadata.payoutIds.filter((item): item is string => typeof item === 'string');
        if (payoutIds.length > 0) {
          await prisma.payout.updateMany({
            where: { id: { in: payoutIds } },
            data: {
              status: 'completed',
              txHash: signatureInfo.signature,
              processedAt: new Date(),
            },
          });
        }
      }

      return {
        status: 'confirmed',
        transaction: completed,
        signature: signatureInfo.signature,
      };
    } catch (error) {
      logger.info(`Transfer not confirmed yet for transaction ${transactionId}`);

      return {
        status: 'pending',
        transaction,
      };
    }
  }

  /**
   * Connect wallet address to user account
   */
  async connectWallet(userId: string, walletAddress: string) {
    this.toPublicKey(walletAddress, 'Wallet address');

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if wallet is already connected to another account
    const existingUser = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new AppError('Wallet is already connected to another account', 409);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { walletAddress },
    });

    logger.info(`Wallet ${walletAddress} connected to user ${userId}`);

    return { walletAddress: updatedUser.walletAddress };
  }

  /**
   * Process payout to user
   *
   * Backward-compatible endpoint used by old callers.
   * Internally creates a Solana Pay payout request transaction.
   */
  async processPayout(userId: string, amount: number) {
    const contributor = await prisma.user.findUnique({ where: { id: userId } });
    if (!contributor || !contributor.walletAddress) {
      throw new AppError('Contributor wallet not connected', 400);
    }

    const reference = Keypair.generate().publicKey;
    const url = encodeURL({
      recipient: this.toPublicKey(contributor.walletAddress, 'Contributor wallet'),
      amount: new BigNumber(amount) as any,
      reference,
      label: 'Annotex Contributor Payout',
      message: `Manual payout for ${contributor.firstName} ${contributor.lastName}`,
      memo: `manual-payout:${contributor.id}`,
    });

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount,
        toAddress: contributor.walletAddress,
        fromAddress: config.blockchain.projectTreasuryWallet || undefined,
        description: 'Manual contributor payout request',
        status: TransactionStatus.PENDING,
        metadata: {
          type: 'manual_contributor_payout',
          reference: reference.toBase58(),
          paymentUrl: url.toString(),
          network: 'solana-devnet',
        },
      },
    });

    return transaction;
  }

  /**
   * Get transaction history for user
   */
  async getTransactions(
    userId: string,
    page: number = 1,
    limit: number = 10,
    includeAll: boolean = false
  ) {
    const skip = (page - 1) * limit;
    const where = includeAll ? undefined : { userId };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(transactionId: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        user: true,
      },
    });

    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    return transaction;
  }

  /**
   * Verify transaction on blockchain
   */
  async verifyTransaction(transactionHash: string) {
    try {
      const receipt = await this.connection.getSignatureStatus(transactionHash, {
        searchTransactionHistory: true,
      });
      const status = receipt.value?.confirmationStatus;

      return {
        verified: Boolean(receipt.value),
        status: status === 'processed' || status === 'confirmed' || status === 'finalized' ? 'success' : 'failed',
        confirmationStatus: status,
      };
    } catch (error) {
      logger.error('Transaction verification failed:', error);
      throw new AppError('Failed to verify transaction', 500);
    }
  }
}
