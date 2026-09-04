import { logger } from '../config/logger.js';
import { prisma } from '../config/prisma.js';
import { AppError } from '../middlewares/errorHandler.js';

export class PayoutService {
  private async refreshContributorEarnings(contributorIds: string[]) {
    if (contributorIds.length === 0) {
      return;
    }

    for (const contributorId of contributorIds) {
      const aggregate = await prisma.payout.aggregate({
        where: {
          contributorId,
          status: {
            in: ['pending', 'processing', 'completed'],
          },
        },
        _sum: {
          amountSOL: true,
        },
      });

      await prisma.user.update({
        where: { id: contributorId },
        data: {
          totalEarnings: aggregate._sum.amountSOL ?? 0,
        },
      });
    }
  }

  /**
   * Calculate payouts for accepted labels by distributing each record reward
   * across accepted labels for that record.
   */
  async calculatePayouts(datasetId?: string) {
    const where = datasetId
      ? {
          task: {
            datasetId,
          },
          isAccepted: true,
        }
      : {
          isAccepted: true,
        };

    const acceptedLabels = await prisma.label.findMany({
      where,
      include: {
        task: {
          include: {
            dataset: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (acceptedLabels.length === 0) {
      throw new AppError('No accepted labels found to calculate payouts', 400);
    }

    const labelsByRecord = new Map<string, typeof acceptedLabels>();

    for (const label of acceptedLabels) {
      const recordKey = label.recordId ?? `${label.taskId}:fallback`;
      const existing = labelsByRecord.get(recordKey) ?? [];
      existing.push(label);
      labelsByRecord.set(recordKey, existing);
    }

    const payoutResults: Array<{
      payoutId: string;
      contributorId: string;
      datasetId: string;
      labelId: string;
      amountSOL: number;
    }> = [];

    await prisma.$transaction(async (tx) => {
      for (const [, labels] of labelsByRecord) {
        const dataset = labels[0].task.dataset;
        const amountPerAcceptedLabel = dataset.rewardPerRecord / labels.length;

        for (const label of labels) {
          const payout = await tx.payout.upsert({
            where: { labelId: label.id },
            update: {
              amountSOL: amountPerAcceptedLabel,
              contributorId: label.contributorId,
              datasetId: label.task.datasetId,
            },
            create: {
              amountSOL: amountPerAcceptedLabel,
              contributorId: label.contributorId,
              datasetId: label.task.datasetId,
              labelId: label.id,
              status: 'pending',
            },
          });

          payoutResults.push({
            payoutId: payout.id,
            contributorId: payout.contributorId,
            datasetId: payout.datasetId,
            labelId: label.id,
            amountSOL: payout.amountSOL,
          });
        }
      }
    });

    const contributorIds = Array.from(new Set(payoutResults.map((payout) => payout.contributorId)));
    await this.refreshContributorEarnings(contributorIds);

    logger.info(`Calculated payouts: ${payoutResults.length} records`);

    return {
      payouts: payoutResults,
      totalPayouts: payoutResults.length,
      totalAmountSOL: payoutResults.reduce((sum, payout) => sum + payout.amountSOL, 0),
    };
  }

  async getContributorPendingPayouts(contributorId: string) {
    const payouts = await prisma.payout.findMany({
      where: {
        contributorId,
        status: {
          in: ['pending', 'processing'],
        },
      },
      include: {
        dataset: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      payouts,
      totalPendingSOL: payouts.reduce((sum: number, payout) => sum + payout.amountSOL, 0),
      totalPendingCount: payouts.length,
    };
  }
}
