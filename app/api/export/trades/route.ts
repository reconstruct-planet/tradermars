import { NextResponse } from 'next/server';
import { getTradingData } from '@/lib/data';

export async function GET() {
  const data = await getTradingData();
  const headers = [
    'symbol',
    'assetType',
    'side',
    'quantity',
    'entryPrice',
    'exitPrice',
    'entryTime',
    'exitTime',
    'fees',
    'netPnl',
    'rMultiple',
    'strategy',
    'tags',
    'notes'
  ];
  const lines = [
    headers.join(','),
    ...data.trades.map((trade) =>
      [
        trade.symbol,
        trade.assetType,
        trade.side,
        trade.quantity,
        trade.entryPrice,
        trade.exitPrice ?? '',
        trade.entryTime,
        trade.exitTime ?? '',
        trade.fees,
        trade.netPnl,
        trade.rMultiple,
        trade.strategy ?? '',
        trade.tags.join('; '),
        trade.notes ?? ''
      ]
        .map(csvCell)
        .join(',')
    )
  ];

  return new NextResponse(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="edgefolio-trades.csv"'
    }
  });
}

function csvCell(value: string | number) {
  const text = String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}
