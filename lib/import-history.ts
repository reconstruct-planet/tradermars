import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { demoTradingData } from './demo-data';
import { prisma } from './prisma';

export type ImportHistoryItem = {
  id: string;
  filename: string;
  broker: string | null;
  status: string;
  totalRows: number;
  importedRows: number;
  rejectedRows: number;
  createdAt: string;
  errors: Array<{ id: string; rowNumber: number; reason: string }>;
};

export async function getImportHistory(): Promise<ImportHistoryItem[]> {
  if (!process.env.DATABASE_URL) return [];

  const session = await getServerSession(authOptions).catch(() => null);
  const email = session?.user?.email ?? demoTradingData.user.email;

  try {
    const user = await prisma.user.findFirst({
      where: { email, status: 'ACTIVE', deletedAt: null },
      select: { id: true }
    });
    if (!user) return [];

    const batches = await prisma.importBatch.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 24,
      include: {
        rowErrors: {
          orderBy: { rowNumber: 'asc' },
          take: 3
        }
      }
    });

    return batches.map((batch) => ({
      id: batch.id,
      filename: batch.filename,
      broker: batch.broker,
      status: batch.status,
      totalRows: batch.totalRows,
      importedRows: batch.importedRows,
      rejectedRows: batch.rejectedRows,
      createdAt: batch.createdAt.toISOString(),
      errors: batch.rowErrors.map((error) => ({
        id: error.id,
        rowNumber: error.rowNumber,
        reason: error.reason
      }))
    }));
  } catch {
    return [];
  }
}
