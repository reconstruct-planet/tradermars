import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { CsvMapping } from '@/lib/csv';
import { validateImportCsv } from '@/lib/import-server';
import { prisma } from '@/lib/prisma';
import { createTradeWithTags, ensurePrimaryAccount } from '@/lib/trade-write';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Sign in to import trades.' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const mappingRaw = formData.get('mapping');

  if (!(file instanceof File) || typeof mappingRaw !== 'string') {
    return NextResponse.json({ error: 'Upload a CSV file and column mapping.' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: session.user.email }
    });
    const mapping = JSON.parse(mappingRaw) as CsvMapping;
    const validation = await validateImportCsv({
      db: prisma,
      userId: user.id,
      text: await file.text(),
      mapping
    });
    const validRows = validation.validRows;
    const rejectedRows = validation.invalidRows;
    const account = await ensurePrimaryAccount(prisma, user.id);
    const batch = await prisma.importBatch.create({
      data: {
        userId: user.id,
        filename: file.name,
        broker: validation.metadata.broker,
        status: 'PROCESSING',
        totalRows: validation.rows.length,
        importedRows: 0,
        rejectedRows: rejectedRows.length
      }
    });

    for (const row of validRows) {
      await createTradeWithTags({
        db: prisma,
        userId: user.id,
        accountId: account.id,
        input: row.data,
        importBatchId: batch.id
      });
    }

    for (const row of rejectedRows) {
      await prisma.importRowError.create({
        data: {
          batchId: batch.id,
          rowNumber: row.rowNumber,
          reason: row.reason,
          raw: row.raw
        }
      });
    }

    await prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        status: rejectedRows.length ? 'IMPORTED_WITH_ERRORS' : 'IMPORTED',
        importedRows: validRows.length,
        rejectedRows: rejectedRows.length
      }
    });

    return NextResponse.json({
      ok: true,
      batchId: batch.id,
      totalRows: validation.rows.length,
      importedRows: validRows.length,
      rejectedRows: rejectedRows.length,
      broker: validation.metadata.broker,
      account: validation.metadata.account,
      errors: rejectedRows.map((row) => ({
        rowNumber: row.rowNumber,
        reason: row.reason,
        raw: row.raw
      }))
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import failed.' },
      { status: 500 }
    );
  }
}
