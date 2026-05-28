'use client';

import { FormEvent, useState } from 'react';
import { X } from 'lucide-react';
import { useI18n } from '@/components/i18n-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { TradeRecord } from '@/lib/types';
import { toDateTimeLocal } from '@/lib/utils';

const emptyTrade = {
  symbol: '',
  assetType: 'STOCK',
  side: 'LONG',
  quantity: 1,
  entryPrice: 0,
  exitPrice: 0,
  entryTime: new Date().toISOString(),
  exitTime: '',
  fees: 0,
  netPnl: 0,
  riskAmount: 100,
  rMultiple: 0,
  strategy: '',
  session: '',
  setup: '',
  mistake: '',
  tags: '',
  notes: ''
};

export function TradeDialog({
  open,
  onClose,
  trade,
  onSaved
}: {
  open: boolean;
  onClose: () => void;
  trade?: TradeRecord | null;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const values = trade
    ? {
        symbol: trade.symbol,
        assetType: trade.assetType,
        side: trade.side,
        quantity: trade.quantity,
        entryPrice: trade.entryPrice,
        exitPrice: trade.exitPrice ?? 0,
        entryTime: trade.entryTime,
        exitTime: trade.exitTime ?? '',
        fees: trade.fees,
        netPnl: trade.netPnl,
        riskAmount: trade.riskAmount ?? 100,
        rMultiple: trade.rMultiple,
        strategy: trade.strategy ?? '',
        session: trade.session ?? '',
        setup: trade.setup ?? '',
        mistake: trade.mistake ?? '',
        tags: trade.tags.join(', '),
        notes: trade.notes ?? ''
      }
    : emptyTrade;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      symbol: String(formData.get('symbol')),
      assetType: String(formData.get('assetType')),
      side: String(formData.get('side')),
      quantity: Number(formData.get('quantity')),
      entryPrice: Number(formData.get('entryPrice')),
      exitPrice: Number(formData.get('exitPrice')) || null,
      entryTime: String(formData.get('entryTime')),
      exitTime: String(formData.get('exitTime') || '') || null,
      fees: Number(formData.get('fees')) || 0,
      netPnl: Number(formData.get('netPnl')) || 0,
      riskAmount: Number(formData.get('riskAmount')) || null,
      rMultiple: Number(formData.get('rMultiple')) || 0,
      strategy: String(formData.get('strategy') || ''),
      session: String(formData.get('session') || ''),
      setup: String(formData.get('setup') || ''),
      mistake: String(formData.get('mistake') || ''),
      notes: String(formData.get('notes') || ''),
      tags: String(formData.get('tags') || '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
    };

    const response = await fetch(trade ? `/api/trades/${trade.id}` : '/api/trades', {
      method: trade ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      setError(formatApiError(result.error, t('trades.dialog.saveFailed')));
      setLoading(false);
      return;
    }

    setLoading(false);
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-auto rounded-lg border bg-card shadow-soft">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="text-lg font-semibold">{trade ? t('trades.editTrade') : t('trades.addTrade')}</h2>
            <p className="text-sm text-muted-foreground">{t('trades.dialog.closedTradeHint')}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <form className="grid gap-4 p-4 md:grid-cols-4" onSubmit={onSubmit}>
          <Field label={t('trades.dialog.symbol')}><Input name="symbol" defaultValue={values.symbol} required /></Field>
          <Field label={t('trades.dialog.assetType')}>
            <Select name="assetType" defaultValue={values.assetType}>
              {['STOCK', 'OPTION', 'FUTURE', 'FOREX', 'CRYPTO'].map((item) => <option key={item}>{item}</option>)}
            </Select>
          </Field>
          <Field label={t('trades.dialog.side')}>
            <Select name="side" defaultValue={values.side}>
              <option>LONG</option>
              <option>SHORT</option>
            </Select>
          </Field>
          <Field label={t('trades.dialog.quantity')}><Input name="quantity" type="number" step="0.0001" defaultValue={values.quantity} required /></Field>
          <Field label={t('trades.dialog.entryPrice')}><Input name="entryPrice" type="number" step="0.0001" defaultValue={values.entryPrice} required /></Field>
          <Field label={t('trades.dialog.exitPrice')}><Input name="exitPrice" type="number" step="0.0001" defaultValue={values.exitPrice} /></Field>
          <Field label={t('trades.dialog.entryTime')}><Input name="entryTime" type="datetime-local" defaultValue={toDateTimeLocal(values.entryTime)} required /></Field>
          <Field label={t('trades.dialog.exitTime')}><Input name="exitTime" type="datetime-local" defaultValue={values.exitTime ? toDateTimeLocal(values.exitTime) : ''} /></Field>
          <Field label={t('trades.dialog.fees')}><Input name="fees" type="number" step="0.01" defaultValue={values.fees} /></Field>
          <Field label={t('trades.dialog.netPnl')}><Input name="netPnl" type="number" step="0.01" defaultValue={values.netPnl} /></Field>
          <Field label={t('trades.dialog.riskAmount')}><Input name="riskAmount" type="number" step="0.01" defaultValue={values.riskAmount} /></Field>
          <Field label={t('trades.dialog.rMultiple')}><Input name="rMultiple" type="number" step="0.01" defaultValue={values.rMultiple} /></Field>
          <Field label={t('trades.dialog.strategy')}><Input name="strategy" defaultValue={values.strategy} /></Field>
          <Field label={t('trades.dialog.session')}><Input name="session" defaultValue={values.session} /></Field>
          <Field label={t('trades.dialog.setup')}><Input name="setup" defaultValue={values.setup} /></Field>
          <Field label={t('trades.dialog.mistake')}><Input name="mistake" defaultValue={values.mistake} /></Field>
          <div className="md:col-span-2">
            <Field label={t('trades.dialog.tags')}><Input name="tags" defaultValue={values.tags} placeholder={t('trades.dialog.notesPlaceholder')} /></Field>
          </div>
          <div className="md:col-span-2">
            <Field label={t('trades.dialog.notes')}><Textarea name="notes" defaultValue={values.notes} /></Field>
          </div>
          {error ? <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive md:col-span-4">{error}</p> : null}
          <div className="flex justify-end gap-2 md:col-span-4">
            <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={loading}>{loading ? t('trades.dialog.saving') : t('trades.dialog.saveTrade')}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function formatApiError(error: unknown, fallback: string) {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'fieldErrors' in error) {
    const fieldErrors = (error as { fieldErrors?: Record<string, string[]> }).fieldErrors ?? {};
    const messages = Object.values(fieldErrors).flat();
    if (messages.length) return messages.join(' ');
  }
  return fallback;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-2 block font-medium">{label}</span>
      {children}
    </label>
  );
}
