import { prisma } from './prisma.js';

/**
 * Prisma connectivity helpers
 */
export const database = prisma;

export async function verifyDatabaseConnection(): Promise<void> {
  await prisma.$queryRaw`SELECT 1`;
}
