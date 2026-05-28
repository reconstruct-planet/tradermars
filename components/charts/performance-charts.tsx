'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const positive = '#0f766e';
const negative = '#dc2626';
const accent = '#ea580c';
const blue = '#2563eb';

export function EquityCurveChart({ data }: { data: Array<{ date: string; equity: number; pnl: number }> }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={positive} stopOpacity={0.35} />
              <stop offset="95%" stopColor={positive} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} width={72} />
          <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
          <Area type="monotone" dataKey="equity" stroke={positive} fill="url(#equityFill)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PnlBarChart({ data }: { data: Array<{ name?: string; date?: string; pnl: number }> }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey={(row) => row.name ?? row.date} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} width={64} />
          <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
          <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
            {data.map((row, index) => (
              <Cell key={index} fill={row.pnl >= 0 ? positive : negative} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WinLossPie({ wins, losses }: { wins: number; losses: number }) {
  const data = [
    { name: 'Wins', value: wins, fill: positive },
    { name: 'Losses', value: losses, fill: negative }
  ];
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={54} outerRadius={88} paddingAngle={4}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WinRateLine({ data }: { data: Array<{ trade: number; winRate: number; symbol: string }> }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="trade" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(value) => `${Math.round(Number(value) * 100)}%`} tick={{ fontSize: 12 }} width={56} />
          <Tooltip
            formatter={(value) => `${Math.round(Number(value) * 100)}%`}
            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
          />
          <Line type="monotone" dataKey="winRate" stroke={blue} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MultiBarChart({
  data,
  dataKey = 'pnl'
}: {
  data: Array<{ name: string; pnl: number; trades?: number; averageR?: number }>;
  dataKey?: 'pnl' | 'averageR' | 'trades';
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} width={64} />
          <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
          <Bar dataKey={dataKey} fill={dataKey === 'averageR' ? accent : blue} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
