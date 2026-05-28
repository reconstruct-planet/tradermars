'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  ColumnDef,
  ColumnSizingState,
  RowSelectionState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table';
import {
  Copy,
  Download,
  Eye,
  Filter,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Search,
  Tags,
  Trash2,
  X
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useI18n } from '@/components/i18n-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { dayKey } from '@/lib/metrics';
import type { NoteRecord, TradeRecord } from '@/lib/types';
import { formatCurrency as formatCurrencyDefault, formatNumber as formatNumberDefault } from '@/lib/utils';

type TradeFilters = {
  query: string;
  dateStart: string;
  dateEnd: string;
  side: string;
  assetType: string;
  strategy: string;
  tag: string;
  outcome: string;
  pnlMin: string;
  pnlMax: string;
  rMin: string;
  rMax: string;
  mistake: string;
};

const emptyFilters: TradeFilters = {
  query: '',
  dateStart: '',
  dateEnd: '',
  side: '',
  assetType: '',
  strategy: '',
  tag: '',
  outcome: '',
  pnlMin: '',
  pnlMax: '',
  rMin: '',
  rMax: '',
  mistake: ''
};

const TradeDialog = dynamic(
  () => import('@/components/trades/trade-dialog').then((module) => module.TradeDialog),
  { ssr: false }
);

export function TradesTable({ trades, notes }: { trades: TradeRecord[]; notes: NoteRecord[] }) {
  const router = useRouter();
  const { t, formatCurrency, formatNumber, formatDate } = useI18n();
  const [sorting, setSorting] = useState<SortingState>([{ id: 'entryTime', desc: true }]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    setup: false,
    session: false,
    grossPnl: false,
    fees: false
  });
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [dialogTrade, setDialogTrade] = useState<TradeRecord | null | undefined>(undefined);
  const [detailTrade, setDetailTrade] = useState<TradeRecord | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [viewsOpen, setViewsOpen] = useState(false);
  const [bulkTagOpen, setBulkTagOpen] = useState(false);
  const [bulkTags, setBulkTags] = useState('');
  const [busyMessage, setBusyMessage] = useState<string | null>(null);
  const [filters, setFilters] = useState<TradeFilters>(emptyFilters);

  const strategies = useMemo(
    () => Array.from(new Set(trades.map((trade) => trade.strategy).filter(Boolean))).sort() as string[],
    [trades]
  );
  const tags = useMemo(
    () => Array.from(new Set(trades.flatMap((trade) => trade.tags))).sort(),
    [trades]
  );
  const mistakes = useMemo(
    () => Array.from(new Set(trades.map((trade) => trade.mistake).filter(Boolean))).sort() as string[],
    [trades]
  );

  const filteredTrades = useMemo(() => filterTrades(trades, filters), [filters, trades]);
  const detailNotes = useMemo(
    () => detailTrade ? notes.filter((note) => note.day?.slice(0, 10) === dayKey(detailTrade.entryTime)) : [],
    [detailTrade, notes]
  );

  const deleteTrade = useCallback(async (trade: TradeRecord) => {
    if (!window.confirm(t('trades.deleteConfirm', { symbol: trade.symbol, date: dayKey(trade.entryTime) }))) return;
    setBusyMessage(`${t('common.delete')}...`);
    const response = await fetch(`/api/trades/${trade.id}`, { method: 'DELETE' });
    setBusyMessage(null);
    if (!response.ok) {
      window.alert(t('trades.deleteFailed'));
      return;
    }
    router.refresh();
  }, [router, t]);

  const duplicateTrade = useCallback(async (trade: TradeRecord) => {
    setBusyMessage(t('trades.duplicating', { symbol: trade.symbol }));
    const response = await fetch('/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toTradePayload({
        ...trade,
        notes: trade.notes ? `${trade.notes}\n\nDuplicated from ${dayKey(trade.entryTime)} trade.` : `Duplicated from ${dayKey(trade.entryTime)} trade.`
      }))
    });
    setBusyMessage(null);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      window.alert(typeof payload.error === 'string' ? payload.error : t('trades.duplicateFailed'));
      return;
    }
    router.refresh();
  }, [router, t]);

  const columns = useMemo<ColumnDef<TradeRecord>[]>(
    () => [
      {
        id: 'select',
        size: 44,
        enableSorting: false,
        header: ({ table }) => (
          <input
            aria-label={t('trades.bulk.selectAllVisible')}
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            aria-label={`${t('common.view')} ${row.original.symbol}`}
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        )
      },
      {
        accessorKey: 'symbol',
        header: t('trades.columnsMap.symbol'),
        size: 110,
        cell: ({ row }) => (
          <button className="font-semibold text-primary hover:underline" onClick={() => setDetailTrade(row.original)}>
            {row.original.symbol}
          </button>
        )
      },
      { accessorKey: 'assetType', header: t('trades.columnsMap.asset'), size: 110 },
      {
        accessorKey: 'side',
        header: t('trades.columnsMap.side'),
        size: 90,
        cell: ({ row }) => <Badge variant="secondary">{row.original.side}</Badge>
      },
      { accessorKey: 'quantity', header: t('trades.columnsMap.qty'), size: 100, cell: ({ row }) => formatNumber(row.original.quantity, 2) },
      { accessorKey: 'entryPrice', header: t('trades.columnsMap.entry'), size: 100, cell: ({ row }) => formatNumber(row.original.entryPrice, 2) },
      { accessorKey: 'exitPrice', header: t('trades.columnsMap.exit'), size: 100, cell: ({ row }) => row.original.exitPrice === null ? t('common.open') : formatNumber(row.original.exitPrice, 2) },
      { accessorKey: 'entryTime', header: t('trades.columnsMap.entryTime'), size: 190, cell: ({ row }) => formatDate(row.original.entryTime, { dateStyle: 'short', timeStyle: 'short' }) },
      { accessorKey: 'exitTime', header: t('trades.columnsMap.exitTime'), size: 190, cell: ({ row }) => row.original.exitTime ? formatDate(row.original.exitTime, { dateStyle: 'short', timeStyle: 'short' }) : t('common.open') },
      { accessorKey: 'grossPnl', header: t('trades.columnsMap.grossPnl'), size: 120, cell: ({ row }) => pnlText(row.original.grossPnl, formatCurrency) },
      { accessorKey: 'fees', header: t('trades.columnsMap.fees'), size: 90, cell: ({ row }) => formatCurrency(row.original.fees) },
      { accessorKey: 'netPnl', header: t('trades.columnsMap.netPnl'), size: 120, cell: ({ row }) => pnlText(row.original.netPnl, formatCurrency) },
      { accessorKey: 'rMultiple', header: 'R', size: 80, cell: ({ row }) => formatNumber(row.original.rMultiple) },
      { accessorKey: 'strategy', header: t('trades.columnsMap.strategy'), size: 160, cell: ({ row }) => row.original.strategy ?? t('common.unassigned') },
      { accessorKey: 'session', header: t('trades.columnsMap.session'), size: 150, cell: ({ row }) => row.original.session ?? t('common.unassigned') },
      { accessorKey: 'setup', header: t('trades.columnsMap.setup'), size: 170, cell: ({ row }) => row.original.setup ?? t('common.unassigned') },
      {
        accessorKey: 'tags',
        header: t('trades.columnsMap.tags'),
        size: 250,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex min-w-52 flex-wrap gap-1">
            {row.original.tags.length ? row.original.tags.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>) : <span className="text-muted-foreground">{t('trades.columnsMap.tags')}: {t('common.none')}</span>}
          </div>
        )
      },
      { accessorKey: 'mistake', header: t('trades.columnsMap.mistake'), size: 170, cell: ({ row }) => row.original.mistake ?? t('common.none') },
      { accessorKey: 'notes', header: t('trades.columnsMap.notes'), size: 300, cell: ({ row }) => <span className="line-clamp-2 text-muted-foreground">{row.original.notes ?? ''}</span> },
      {
        id: 'actions',
        header: '',
        size: 190,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" onClick={() => setDetailTrade(row.original)} title={t('common.view')}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setDialogTrade(row.original)} title={t('common.edit')}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => duplicateTrade(row.original)} title={t('common.duplicate')}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => deleteTrade(row.original)} title={t('common.delete')}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      }
    ],
    [deleteTrade, duplicateTrade, formatCurrency, formatDate, formatNumber, t]
  );

  const table = useReactTable({
    data: filteredTrades,
    columns,
    state: { sorting, rowSelection, columnVisibility, columnSizing },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    columnResizeMode: 'onChange',
    enableColumnResizing: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  const selectedTrades = table.getSelectedRowModel().rows.map((row) => row.original);

  async function bulkDelete() {
    if (!selectedTrades.length) return;
    if (!window.confirm(t('trades.bulkDeleteConfirm', { count: selectedTrades.length }))) return;
    setBusyMessage(t('trades.bulkDeleting', { count: selectedTrades.length }));
    for (const trade of selectedTrades) {
      const response = await fetch(`/api/trades/${trade.id}`, { method: 'DELETE' });
      if (!response.ok) {
        setBusyMessage(null);
        window.alert(t('trades.bulkDeleteStopped', { symbol: trade.symbol }));
        router.refresh();
        return;
      }
    }
    setBusyMessage(null);
    setRowSelection({});
    router.refresh();
  }

  async function bulkTag() {
    if (!selectedTrades.length) return;
    const parsedTags = bulkTags.split(',').map((tag) => tag.trim()).filter(Boolean);
    if (!parsedTags.length) {
      window.alert(t('trades.enterTag'));
      return;
    }
    setBusyMessage(t('trades.bulkTagging', { count: selectedTrades.length }));
    const response = await fetch('/api/trades/bulk-tag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tradeIds: selectedTrades.map((trade) => trade.id),
        tags: parsedTags
      })
    });
    setBusyMessage(null);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      window.alert(payload.error ?? t('trades.bulkTagFailed'));
      return;
    }
    setBulkTagOpen(false);
    setBulkTags('');
    setRowSelection({});
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">{t('trades.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('trades.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setViewsOpen(true)}>
            <Save className="mr-2 h-4 w-4" />
            {t('trades.savedViews')}
          </Button>
          <Button variant="outline" onClick={() => exportTrades(filteredTrades)}>
            <Download className="mr-2 h-4 w-4" />
            {t('trades.exportCsv')}
          </Button>
          <Button onClick={() => setDialogTrade(null)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('trades.addTrade')}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder={t('trades.searchPlaceholder')} value={filters.query} onChange={(event) => setFilters({ ...filters, query: event.target.value })} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setFiltersOpen(true)}>
              <Filter className="mr-2 h-4 w-4" />
              {t('trades.advancedFilters')}
            </Button>
            <Button variant="outline" onClick={() => setColumnsOpen(true)}>
              <MoreHorizontal className="mr-2 h-4 w-4" />
              {t('trades.columns')}
            </Button>
            <Button variant="outline" onClick={() => {
              setFilters(emptyFilters);
              setRowSelection({});
            }}>
              <RotateCcw className="mr-2 h-4 w-4" />
              {t('common.reset')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedTrades.length ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium">{t('trades.selected', { count: selectedTrades.length })}</p>
              <p className="text-xs text-muted-foreground">{t('trades.bulkHint')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setBulkTagOpen(true)}>
                <Tags className="mr-2 h-4 w-4" />
                {t('trades.bulkTag')}
              </Button>
              <Button variant="destructive" onClick={bulkDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                {t('trades.bulkDelete')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <Table style={{ width: table.getCenterTotalSize() }}>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="relative select-none"
                        style={{ width: header.getSize() }}
                      >
                        <button
                          className={header.column.getCanSort() ? 'flex w-full items-center gap-1 text-left' : 'flex w-full items-center gap-1 text-left'}
                          onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{ asc: 'up', desc: 'down' }[header.column.getIsSorted() as string] ?? null}
                        </button>
                        {header.column.getCanResize() ? (
                          <div
                            className="absolute right-0 top-0 h-full w-1 cursor-col-resize touch-none bg-transparent hover:bg-primary/50"
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                          />
                        ) : null}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className={row.getIsSelected() ? 'bg-primary/5' : ''}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={table.getVisibleLeafColumns().length} className="h-32 text-center text-muted-foreground">
                      {t('trades.noRows')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <span>{t('trades.filteredSummary', { filtered: filteredTrades.length, total: trades.length })}</span>
        <div className="flex items-center gap-2">
          <Select
            className="w-24"
            value={String(table.getState().pagination.pageSize)}
            onChange={(event) => table.setPageSize(Number(event.target.value))}
          >
            {[10, 20, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
          </Select>
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>{t('trades.previous')}</Button>
          <span>{t('trades.pageStatus', { page: table.getState().pagination.pageIndex + 1, total: table.getPageCount() || 1 })}</span>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>{t('trades.next')}</Button>
        </div>
      </div>

      <TradeDialog
        open={dialogTrade !== undefined}
        trade={dialogTrade}
        onClose={() => setDialogTrade(undefined)}
        onSaved={() => router.refresh()}
      />

      {detailTrade ? (
        <TradeDetailDrawer
          trade={detailTrade}
          notes={detailNotes}
          onClose={() => setDetailTrade(null)}
          onEdit={() => {
            setDetailTrade(null);
            setDialogTrade(detailTrade);
          }}
        />
      ) : null}

      {filtersOpen ? (
        <AdvancedFilterDrawer
          filters={filters}
          setFilters={setFilters}
          strategies={strategies}
          tags={tags}
          mistakes={mistakes}
          onClose={() => setFiltersOpen(false)}
        />
      ) : null}

      {columnsOpen ? (
        <ColumnVisibilityPanel table={table} onClose={() => setColumnsOpen(false)} />
      ) : null}

      {viewsOpen ? (
        <SavedViewsPanel onClose={() => setViewsOpen(false)} />
      ) : null}

      {bulkTagOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle>{t('trades.bulk.panelTitle')}</CardTitle>
                <CardDescription>{t('trades.bulk.description', { count: selectedTrades.length })}</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setBulkTagOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input value={bulkTags} onChange={(event) => setBulkTags(event.target.value)} placeholder={t('trades.bulk.placeholder')} />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setBulkTagOpen(false)}>{t('common.cancel')}</Button>
                <Button onClick={bulkTag}>{t('trades.bulk.applyTags')}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {busyMessage ? (
        <div className="fixed bottom-4 right-4 z-50 rounded-md border bg-card px-4 py-3 text-sm shadow-soft">
          {busyMessage}
        </div>
      ) : null}
    </div>
  );
}

function AdvancedFilterDrawer({
  filters,
  setFilters,
  strategies,
  tags,
  mistakes,
  onClose
}: {
  filters: TradeFilters;
  setFilters: (filters: TradeFilters) => void;
  strategies: string[];
  tags: string[];
  mistakes: string[];
  onClose: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/35">
      <div className="h-full w-full max-w-lg overflow-auto border-l bg-background p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-normal">{t('trades.filters.title')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('trades.filters.description')}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-6 grid gap-4">
          <FilterField label={t('common.startDate')}><Input type="date" value={filters.dateStart} onChange={(event) => setFilters({ ...filters, dateStart: event.target.value })} /></FilterField>
          <FilterField label={t('common.endDate')}><Input type="date" value={filters.dateEnd} onChange={(event) => setFilters({ ...filters, dateEnd: event.target.value })} /></FilterField>
          <FilterField label={t('common.side')}>
            <Select value={filters.side} onChange={(event) => setFilters({ ...filters, side: event.target.value })}>
              <option value="">{t('trades.filters.anySide')}</option>
              <option value="LONG">{t('trades.dialog.long')}</option>
              <option value="SHORT">{t('trades.dialog.short')}</option>
            </Select>
          </FilterField>
          <FilterField label={t('common.assetType')}>
            <Select value={filters.assetType} onChange={(event) => setFilters({ ...filters, assetType: event.target.value })}>
              <option value="">{t('trades.filters.anyAsset')}</option>
              {['STOCK', 'OPTION', 'FUTURE', 'FOREX', 'CRYPTO'].map((item) => <option key={item}>{item}</option>)}
            </Select>
          </FilterField>
          <FilterField label={t('common.strategy')}>
            <Select value={filters.strategy} onChange={(event) => setFilters({ ...filters, strategy: event.target.value })}>
              <option value="">{t('trades.filters.anyStrategy')}</option>
              {strategies.map((strategy) => <option key={strategy}>{strategy}</option>)}
            </Select>
          </FilterField>
          <FilterField label={t('common.tag')}>
            <Select value={filters.tag} onChange={(event) => setFilters({ ...filters, tag: event.target.value })}>
              <option value="">{t('trades.filters.anyTag')}</option>
              {tags.map((tag) => <option key={tag}>{tag}</option>)}
            </Select>
          </FilterField>
          <FilterField label={t('common.mistake')}>
            <Select value={filters.mistake} onChange={(event) => setFilters({ ...filters, mistake: event.target.value })}>
              <option value="">{t('trades.filters.anyMistake')}</option>
              <option value="none">{t('trades.filters.noMistake')}</option>
              {mistakes.map((mistake) => <option key={mistake}>{mistake}</option>)}
            </Select>
          </FilterField>
          <FilterField label={t('common.outcome')}>
            <Select value={filters.outcome} onChange={(event) => setFilters({ ...filters, outcome: event.target.value })}>
              <option value="">{t('trades.filters.anyOutcome')}</option>
              <option value="win">{t('trades.filters.win')}</option>
              <option value="loss">{t('trades.filters.loss')}</option>
              <option value="breakeven">{t('trades.filters.breakeven')}</option>
            </Select>
          </FilterField>
          <div className="grid grid-cols-2 gap-3">
            <FilterField label={t('trades.filters.pnlMin')}><Input value={filters.pnlMin} onChange={(event) => setFilters({ ...filters, pnlMin: event.target.value })} /></FilterField>
            <FilterField label={t('trades.filters.pnlMax')}><Input value={filters.pnlMax} onChange={(event) => setFilters({ ...filters, pnlMax: event.target.value })} /></FilterField>
            <FilterField label={t('trades.filters.rMin')}><Input value={filters.rMin} onChange={(event) => setFilters({ ...filters, rMin: event.target.value })} /></FilterField>
            <FilterField label={t('trades.filters.rMax')}><Input value={filters.rMax} onChange={(event) => setFilters({ ...filters, rMax: event.target.value })} /></FilterField>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setFilters(emptyFilters)}>{t('common.clearAll')}</Button>
            <Button onClick={onClose}>{t('common.applyFilters')}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ColumnVisibilityPanel({ table, onClose }: { table: ReturnType<typeof useReactTable<TradeRecord>>; onClose: () => void }) {
  const { t } = useI18n();

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/35">
      <div className="h-full w-full max-w-sm overflow-auto border-l bg-background p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-normal">{t('trades.columns')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('trades.columnsDescription')}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-6 space-y-2">
          {table.getAllLeafColumns().filter((column) => column.id !== 'select' && column.id !== 'actions').map((column) => (
            <label key={column.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <span>{column.id}</span>
              <input type="checkbox" checked={column.getIsVisible()} onChange={column.getToggleVisibilityHandler()} />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function SavedViewsPanel({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle>{t('trades.savedViewsPlaceholder')}</CardTitle>
            <CardDescription>{t('trades.savedViewsDescription')}</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="grid gap-3">
          {['Morning scalps', 'Mistake review', 'Options only', 'A+ setups'].map((view) => (
            <div key={view} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <span>{view}</span>
              <Badge variant="secondary">{t('common.comingSoon')}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

const formatCurrency = formatCurrencyDefault;
const formatNumber = formatNumberDefault;

function TradeDetailDrawer({
  trade,
  notes,
  onClose,
  onEdit
}: {
  trade: TradeRecord;
  notes: NoteRecord[];
  onClose: () => void;
  onEdit: () => void;
}) {
  const { t, formatCurrency, formatNumber, formatDate } = useI18n();
  const calculatedGross =
    trade.exitPrice === null
      ? trade.grossPnl
      : trade.side === 'SHORT'
        ? (trade.entryPrice - trade.exitPrice) * trade.quantity
        : (trade.exitPrice - trade.entryPrice) * trade.quantity;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/35">
      <div className="h-full w-full max-w-2xl overflow-auto border-l bg-background p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{t('trades.title')}</p>
            <h2 className="text-3xl font-semibold tracking-normal">{trade.symbol}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{trade.strategy ?? t('common.unassigned')} · {dayKey(trade.entryTime)}</p>
          </div>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              {t('common.edit')}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <MiniMetric label={t('trades.columnsMap.netPnl')} value={formatCurrency(trade.netPnl)} tone={trade.netPnl >= 0 ? 'positive' : 'negative'} />
          <MiniMetric label={t('trades.columnsMap.grossPnl')} value={formatCurrency(calculatedGross)} tone={calculatedGross >= 0 ? 'positive' : 'negative'} />
          <MiniMetric label={t('trades.columnsMap.r')} value={formatNumber(trade.rMultiple)} />
          <MiniMetric label={t('trades.columnsMap.fees')} value={formatCurrency(trade.fees)} />
        </div>

        <Card className="mt-5">
          <CardHeader>
            <CardTitle>{t('trades.columnsMap.entry')} / {t('trades.columnsMap.exit')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-2">
            <DetailRow label={t('trades.columnsMap.asset')} value={trade.assetType} />
            <DetailRow label={t('trades.columnsMap.side')} value={trade.side} />
            <DetailRow label={t('trades.columnsMap.qty')} value={formatNumber(trade.quantity, 4)} />
            <DetailRow label={t('trades.columnsMap.entry')} value={formatNumber(trade.entryPrice, 4)} />
            <DetailRow label={t('trades.columnsMap.exit')} value={trade.exitPrice === null ? t('common.open') : formatNumber(trade.exitPrice, 4)} />
            <DetailRow label={t('trades.columnsMap.entryTime')} value={formatDate(trade.entryTime, { dateStyle: 'medium', timeStyle: 'short' })} />
            <DetailRow label={t('trades.columnsMap.exitTime')} value={trade.exitTime ? formatDate(trade.exitTime, { dateStyle: 'medium', timeStyle: 'short' }) : t('common.open')} />
            <DetailRow label={t('analytics.riskReward')} value={trade.riskAmount ? formatCurrency(trade.riskAmount) : t('common.notSet')} />
          </CardContent>
        </Card>

        <Card className="mt-5">
          <CardHeader>
            <CardTitle>{t('trades.columnsMap.strategy')} / {t('trades.columnsMap.tags')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <DetailRow label={t('trades.columnsMap.strategy')} value={trade.strategy ?? t('common.unassigned')} />
              <DetailRow label={t('trades.columnsMap.session')} value={trade.session ?? t('common.unassigned')} />
              <DetailRow label={t('trades.columnsMap.setup')} value={trade.setup ?? t('common.unassigned')} />
              <DetailRow label={t('trades.columnsMap.mistake')} value={trade.mistake ?? t('common.none')} />
            </div>
            <div className="flex flex-wrap gap-2">
              {trade.tags.length ? trade.tags.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>) : <span className="text-sm text-muted-foreground">{t('common.noData')}</span>}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-5">
          <CardHeader>
            <CardTitle>{t('trades.columnsMap.netPnl')}</CardTitle>
            <CardDescription>{t('trades.columnsMap.side')} + {t('trades.columnsMap.qty')} + {t('trades.columnsMap.entry')} + {t('trades.columnsMap.exit')} + {t('trades.columnsMap.fees')}</CardDescription>
          </CardHeader>
          <CardContent className="rounded-md bg-secondary/45 p-4 font-mono text-sm">
            {trade.side === 'SHORT' ? t('trades.detail.formulaShort') : t('trades.detail.formulaLong')} = {formatCurrency(trade.netPnl)}
          </CardContent>
        </Card>

        <Card className="mt-5">
          <CardHeader>
            <CardTitle>{t('dashboard.charts.equityCurve')}</CardTitle>
            <CardDescription>{t('calendar.screenshots')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-dashed p-4">
              <svg viewBox="0 0 520 220" className="h-56 w-full text-primary">
                <path d="M12 160 C60 142 82 96 128 112 S206 164 256 102 S338 42 508 72" fill="none" stroke="currentColor" strokeWidth="5" />
                <line x1="126" x2="126" y1="30" y2="190" stroke="#0f766e" strokeDasharray="6 6" strokeWidth="3" />
                <line x1="386" x2="386" y1="30" y2="190" stroke="#dc2626" strokeDasharray="6 6" strokeWidth="3" />
                <circle cx="126" cy="112" r="8" fill="#0f766e" />
                <circle cx="386" cy="58" r="8" fill="#dc2626" />
                <text x="100" y="28" className="fill-current text-xs">{t('trades.columnsMap.entry')}</text>
                <text x="362" y="28" className="fill-current text-xs">{t('trades.columnsMap.exit')}</text>
              </svg>
            </div>
            <div className="mt-3 rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              {t('calendar.screenshots')}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-5">
          <CardHeader>
            <CardTitle>{t('calendar.notes')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea readOnly value={trade.notes ?? t('common.noData')} />
            {notes.length ? notes.map((note) => (
              <div key={note.id} className="rounded-md border p-3 text-sm">
                <p className="font-medium">{note.title}</p>
                <p className="mt-1 text-muted-foreground">{note.content}</p>
              </div>
            )) : <p className="text-sm text-muted-foreground">{t('calendar.noNotes')}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-2 block font-medium">{label}</span>
      {children}
    </label>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b pb-2 last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function MiniMetric({ label, value, tone }: { label: string; value: string; tone?: 'positive' | 'negative' }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${tone === 'positive' ? 'text-emerald-600 dark:text-emerald-400' : tone === 'negative' ? 'text-red-600 dark:text-red-400' : ''}`}>{value}</p>
    </div>
  );
}

function pnlText(value: number, formatCurrency: (value: number, currency?: string) => string) {
  return <span className={value >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>{formatCurrency(value)}</span>;
}

function filterTrades(trades: TradeRecord[], filters: TradeFilters) {
  return trades.filter((trade) => {
    const query = filters.query.toLowerCase();
    const entryDate = dayKey(trade.entryTime);
    const matchesQuery =
      !query ||
      [trade.symbol, trade.assetType, trade.side, trade.strategy, trade.session, trade.setup, trade.mistake, trade.notes, ...trade.tags]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query);

    return (
      matchesQuery &&
      (!filters.dateStart || entryDate >= filters.dateStart) &&
      (!filters.dateEnd || entryDate <= filters.dateEnd) &&
      (!filters.side || trade.side === filters.side) &&
      (!filters.assetType || trade.assetType === filters.assetType) &&
      (!filters.strategy || trade.strategy === filters.strategy) &&
      (!filters.tag || trade.tags.includes(filters.tag)) &&
      (!filters.mistake || (filters.mistake === 'none' ? !trade.mistake : trade.mistake === filters.mistake)) &&
      (!filters.outcome || (
        filters.outcome === 'win' ? trade.netPnl > 0 :
        filters.outcome === 'loss' ? trade.netPnl < 0 :
        trade.netPnl === 0
      )) &&
      (!filters.pnlMin || trade.netPnl >= Number(filters.pnlMin)) &&
      (!filters.pnlMax || trade.netPnl <= Number(filters.pnlMax)) &&
      (!filters.rMin || trade.rMultiple >= Number(filters.rMin)) &&
      (!filters.rMax || trade.rMultiple <= Number(filters.rMax))
    );
  });
}

function toTradePayload(trade: TradeRecord) {
  return {
    symbol: trade.symbol,
    assetType: trade.assetType,
    side: trade.side,
    quantity: trade.quantity,
    entryPrice: trade.entryPrice,
    exitPrice: trade.exitPrice,
    entryTime: trade.entryTime,
    exitTime: trade.exitTime,
    fees: trade.fees,
    grossPnl: trade.grossPnl,
    netPnl: trade.netPnl,
    riskAmount: trade.riskAmount,
    rMultiple: trade.rMultiple,
    strategy: trade.strategy,
    session: trade.session,
    setup: trade.setup,
    mistake: trade.mistake,
    notes: trade.notes,
    tags: trade.tags
  };
}

function exportTrades(trades: TradeRecord[]) {
  const headers = ['symbol', 'assetType', 'side', 'quantity', 'entryPrice', 'exitPrice', 'entryTime', 'exitTime', 'fees', 'netPnl', 'rMultiple', 'strategy', 'tags', 'notes'];
  const csv = [
    headers.join(','),
    ...trades.map((trade) => [
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
    ].map(csvCell).join(','))
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'edgefolio-filtered-trades.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function csvCell(value: string | number) {
  const text = String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}
