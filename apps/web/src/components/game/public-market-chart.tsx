"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type Point = {
  label: string;
  marketCap: number;
  holders: number;
};

export function PublicMarketChart({ points }: { points: Point[] }) {
  return (
    <div className="h-72" data-testid="public-token-chart">
      <ResponsiveContainer height="100%" width="100%">
        <AreaChart
          data={points}
          margin={{ bottom: 0, left: 0, right: 8, top: 8 }}
        >
          <defs>
            <linearGradient id="publicTokenMarket" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#84cc16" stopOpacity={0.55} />
              <stop offset="95%" stopColor="#84cc16" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(148,163,184,0.16)" vertical={false} />
          <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} />
          <YAxis
            stroke="#94a3b8"
            tickFormatter={(value) => `$${Math.round(Number(value) / 1000)}k`}
            tickLine={false}
            width={54}
          />
          <Tooltip
            contentStyle={{
              background: "#020617",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 8,
              color: "#fff"
            }}
          />
          <Area
            dataKey="marketCap"
            fill="url(#publicTokenMarket)"
            stroke="#84cc16"
            strokeWidth={3}
            type="monotone"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
