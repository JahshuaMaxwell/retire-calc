"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { formatCompactMoney, formatMoney } from "@/lib/format"
import { monthlyFunding, type BalancePoint, type FlowYear } from "@/lib/retirement"

const axisTick = { fontSize: 12, fill: "oklch(0.45 0.02 70)" }
const gridStroke = "oklch(0.88 0.015 80)"

type TipEntry = {
  name?: string
  value?: number
  color?: string
  payload?: { age?: number }
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: TipEntry[]
}) {
  if (!active || !payload?.length) return null
  const age = payload[0]?.payload?.age
  const rows = payload.filter((item) => Number(item.value) > 0.5)
  if (!rows.length) return null

  return (
    <div className="rounded-lg bg-foreground px-3 py-2 text-xs text-background shadow-lg">
      <p className="mb-1 font-medium">Age {age}</p>
      <div className="grid gap-0.5">
        {rows.map((item) => (
          <p key={item.name} className="flex items-center justify-between gap-4 tabular-nums">
            <span className="flex items-center gap-1.5">
              <span
                className="size-1.5 rounded-full"
                style={{ background: item.color }}
              />
              {item.name}
            </span>
            <span>{formatMoney(Number(item.value) || 0)}</span>
          </p>
        ))}
      </div>
    </div>
  )
}

export function BalanceChart({
  balances,
  retirementAge,
  currentAge,
  depleting,
}: {
  balances: BalancePoint[]
  retirementAge: number
  currentAge: number
  depleting: boolean
}) {
  const stroke = depleting ? "var(--chart-4)" : "var(--chart-1)"

  return (
    <div className="h-64 w-full sm:h-72" role="img" aria-label="Portfolio balance by age, in today's dollars">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={balances} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={gridStroke} vertical={false} />
          <XAxis
            dataKey="age"
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <YAxis
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(value: number) => formatCompactMoney(value)}
          />
          <Tooltip content={<ChartTooltip />} />
          {retirementAge > currentAge ? (
            <ReferenceLine
              x={retirementAge}
              stroke="oklch(0.55 0.03 70)"
              strokeDasharray="4 4"
              label={{
                value: "Retire",
                position: "insideTopRight",
                fill: "oklch(0.42 0.02 70)",
                fontSize: 12,
              }}
            />
          ) : null}
          <Area
            type="monotone"
            dataKey="realBalance"
            name="Balance"
            stroke={stroke}
            fill={stroke}
            fillOpacity={0.16}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function IncomeChart({ years }: { years: FlowYear[] }) {
  const data = years
    .filter((year) => year.phase === "retired")
    .map((year) => {
      const funding = monthlyFunding(year)
      return {
        age: funding.age,
        portfolio: funding.portfolio,
        socialSecurity: funding.socialSecurity,
        pension: funding.pension,
        shortfall: funding.shortfall,
      }
    })

  return (
    <div
      className="h-64 w-full sm:h-72"
      role="img"
      aria-label="Monthly retirement income by source, in today's dollars"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={gridStroke} vertical={false} />
          <XAxis
            dataKey="age"
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <YAxis
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(value: number) => formatCompactMoney(value)}
          />
          <Tooltip content={<ChartTooltip />} />
          <Area
            type="linear"
            stackId="income"
            dataKey="portfolio"
            name="From savings"
            stroke="var(--chart-1)"
            fill="var(--chart-1)"
            fillOpacity={0.9}
          />
          <Area
            type="linear"
            stackId="income"
            dataKey="socialSecurity"
            name="Social Security"
            stroke="var(--chart-2)"
            fill="var(--chart-2)"
            fillOpacity={0.9}
          />
          <Area
            type="linear"
            stackId="income"
            dataKey="pension"
            name="Pension"
            stroke="var(--chart-3)"
            fill="var(--chart-3)"
            fillOpacity={0.9}
          />
          <Area
            type="linear"
            stackId="income"
            dataKey="shortfall"
            name="Uncovered"
            stroke="var(--chart-4)"
            fill="var(--chart-4)"
            fillOpacity={0.85}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
