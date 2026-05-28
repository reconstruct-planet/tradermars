import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { previewBybitFuturesImport } from '@/lib/bybit-futures-server';
import { CsvMapping } from '@/lib/csv';
import { validateImportCsv } from '@/lib/import-server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Sign in to validate imports.' }, { status: 401 });
  }

  const formData = await request.formData();
  const exchange = formData.get('exchange');
  const timezone = formData.get('timezone');
  if (exchange === 'BYBIT_FUTURES') {
    try {
      await prisma.user.findFirstOrThrow({
        where: { email: session.user.email, status: 'ACTIVE', deletedAt: null }
      });
      const validation = await previewBybitFuturesImport({
        closedPnlFile: optionalFile(formData.get('closedPnlFile')),
        tradeHistoryFile: optionalFile(formData.get('tradeHistoryFile')),
        timezone: typeof timezone === 'string' && timezone.trim() ? timezone.trim() : 'UTC'
      });

      return NextResponse.json({
        ok: true,
        mode: 'BYBIT_FUTURES',
        bybit: validation
      });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Bybit import preview failed.' },
        { status: 500 }
      );
    }
  }

  const file = formData.get('file');
  const mappingRaw = formData.get('mapping');

  if (!(file instanceof File) || typeof mappingRaw !== 'string') {
    return NextResponse.json({ error: 'Upload a CSV file and column mapping.' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findFirstOrThrow({
      where: { email: session.user.email, status: 'ACTIVE', deletedAt: null }
    });
    const validation = await validateImportCsv({
      db: prisma,
      userId: user.id,
      text: await file.text(),
      mapping: JSON.parse(mappingRaw) as CsvMapping
    });

    return NextResponse.json({
      ok: true,
      totalRows: validation.rows.length,
      broker: validation.metadata.broker,
      account: validation.metadata.account,
      validRows: validation.validRows.map((row) => ({
        rowNumber: row.rowNumber,
        data: {
          ...row.data,
          entryTime: row.data.entryTime.toISOString(),
          exitTime: row.data.exitTime?.toISOString() ?? null
        }
      })),
      invalidRows: validation.invalidRows.map((row) => ({
        rowNumber: row.rowNumber,
        reason: row.reason,
        raw: row.raw
      }))
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import preview failed.' },
      { status: 500 }
    );
  }
}

function optionalFile(value: FormDataEntryValue | null) {
  return value instanceof File && value.size > 0 ? value : null;
}
