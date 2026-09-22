"use client"

import { BalanceChart, IncomeChart } from "@/components/charts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  formatCompactMoney,
  formatDepletedAge,
  formatMoney,
  formatPercent,
} from "@/lib/format"
import {
  monthlyFunding,
  type FlowYear,
  type FundingSlice,
  type Plan,
  type Projection,
} from "@/lib/retirement"
import { cn } from "@/lib/utils"

export type PlanView = "lasting" | "goal"

function fundingTone(ratio: number): "short" | "close" | "covered" {
  if (ratio >= 1.03) return "covered"
  if (ratio >= 0.97) return "close"
  return "short"
}

function MixBar({ title, slice }: { title: string; slice: FundingSlice }) {
  const parts = [
    { label: "From savings", value: slice.portfolio, className: "bg-chart-1" },
    { label: "Social Security", value: slice.socialSecurity, className: "bg-chart-2" },
    { label: "Pension", value: slice.pension, className: "bg-chart-3" },
  ].filter((part) => part.value >= 1)
  const total = parts.reduce((sum, part) => sum + part.value, 0)

  if (total < 1) {
    return (
      <div className="grid gap-2">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">
          Nothing is paid this year. Guaranteed income has not started, and the portfolio cannot cover the gap.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm tabular-nums text-muted-foreground">
          {formatMoney(slice.spending)} / month
        </p>
      </div>
      <div className="flex h-3 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        {parts.map((part) => (
          <div
            key={part.label}
            className={part.className}
            style={{ width: `${(part.value / total) * 100}%` }}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {parts.map((part) => (
          <li key={part.label} className="flex items-center gap-1.5 tabular-nums">
            <span className={cn("size-2 rounded-full", part.className)} />
            {part.label}
            <span className="text-foreground">{formatMoney(part.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function snapshotMixes(years: FlowYear[]) {
  const retired = years.filter((year) => year.phase === "retired")
  const first = retired[0]
  if (!first) return []

  const mixes: { title: string; slice: FundingSlice }[] = [
    {
      title: `At retirement, age ${first.age}`,
      slice: monthlyFunding(first),
    },
  ]

  const social = retired.find((year) => year.realSocialSecurity >= 12)
  if (social && social.age !== first.age) {
    mixes.push({
      title: `At ${social.age}, when Social Security starts`,
      slice: monthlyFunding(social),
    })
  }

  const pension = retired.find((year) => year.realPension >= 12)
  if (
    pension &&
    pension.age !== first.age &&
    pension.age !== social?.age
  ) {
    mixes.push({
      title: `At ${pension.age}, when the pension starts`,
      slice: monthlyFunding(pension),
    })
  }

  return mixes
}

function ChartBlock({
  projection,
  depleting,
  retirementAge,
  currentAge,
}: {
  projection: Projection
  depleting: boolean
  retirementAge: number
  currentAge: number
}) {
  const hasPortfolio = projection.balances.some((point) => point.realBalance > 1)
  const hasIncome = projection.years.some(
    (year) => year.phase === "retired" && year.realSpending + year.realSocialSecurity + year.realPension > 1,
  )

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h3 className="text-sm font-medium">Portfolio balance</h3>
        <p className="text-sm text-muted-foreground">
          Today&apos;s dollars, on each birthday.
        </p>
        {hasPortfolio ? (
          <BalanceChart
            balances={projection.balances}
            retirementAge={retirementAge}
            currentAge={currentAge}
            depleting={depleting}
          />
        ) : (
          <p className="rounded-xl bg-muted px-4 py-8 text-sm text-muted-foreground">
            There is no portfolio in this path. Any paycheck has to come from Social Security or a pension.
          </p>
        )}
      </div>
      <div className="grid gap-2">
        <h3 className="text-sm font-medium">Monthly income</h3>
        <p className="text-sm text-muted-foreground">
          How each retirement year is paid, in today&apos;s buying power.
        </p>
        {hasIncome ? (
          <>
            <IncomeChart years={projection.years} />
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-chart-1" />
                From savings
              </li>
              <li className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-chart-2" />
                Social Security
              </li>
              <li className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-chart-3" />
                Pension
              </li>
              <li className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-chart-4" />
                Uncovered
              </li>
            </ul>
          </>
        ) : (
          <p className="rounded-xl bg-muted px-4 py-8 text-sm text-muted-foreground">
            This path has no retirement spending and no guaranteed income.
          </p>
        )}
      </div>
    </div>
  )
}

function Ledger({ years }: { years: FlowYear[] }) {
  return (
    <div className="max-h-96 overflow-auto rounded-xl ring-1 ring-foreground/10">
      <table className="w-full min-w-[44rem] border-collapse text-sm">
        <caption className="sr-only">
          Year-by-year balances and income in today&apos;s dollars
        </caption>
        <thead className="sticky top-0 bg-card text-left text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">Age</th>
            <th scope="col" className="px-3 py-2 font-medium">Phase</th>
            <th scope="col" className="px-3 py-2 text-right font-medium">Balance</th>
            <th scope="col" className="px-3 py-2 text-right font-medium">From savings</th>
            <th scope="col" className="px-3 py-2 text-right font-medium">Social Security</th>
            <th scope="col" className="px-3 py-2 text-right font-medium">Pension</th>
            <th scope="col" className="px-3 py-2 text-right font-medium">Uncovered</th>
          </tr>
        </thead>
        <tbody>
          {years.map((year) => (
            <tr key={year.age} className="border-t border-border/80">
              <th scope="row" className="px-3 py-2 text-left font-medium tabular-nums">
                {year.age}
              </th>
              <td className="px-3 py-2 text-muted-foreground">
                {year.phase === "retired" ? "Retired" : "Saving"}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {formatMoney(year.realBalance)}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {formatMoney(year.realWithdrawal)}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {formatMoney(year.realSocialSecurity)}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {formatMoney(year.realPension)}
              </td>
              <td
                className={cn(
                  "px-3 py-2 text-right tabular-nums",
                  year.realShortfall >= 1 && "text-copper",
                )}
              >
                {formatMoney(year.realShortfall)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ResultsPanel({
  plan,
  view,
  onViewChange,
  mode = "all",
}: {
  plan: Plan
  view: PlanView
  onViewChange: (view: PlanView) => void
  mode?: "summary" | "detail" | "all"
}) {
  const { input } = plan
  const ratio = plan.fundedRatio
  const tone = ratio === null ? null : fundingTone(ratio)
  const yearsAway = input.retirementAge - input.currentAge
  const goalLasts = plan.goal.lastsThroughPlan
  const mixes = snapshotMixes(plan.sustainable.years)
  const activeProjection = view === "lasting" ? plan.sustainable : plan.goal

  const summary = (
    <>
      <section className="overflow-hidden rounded-3xl bg-primary px-5 py-6 text-primary-foreground sm:px-8 sm:py-8">
        <div className="mb-5 h-1 w-12 rounded-full bg-copper" />
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-primary-foreground/80">
            Paycheck that lasts through your {input.horizonAge} birthday
          </p>
          {tone ? (
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-medium">
              {tone === "covered" ? "Goal covered" : tone === "close" ? "Close" : "Short of the goal"}
            </span>
          ) : null}
        </div>
        <p
          className="mt-2 font-heading text-[clamp(2.6rem,7vw,4.4rem)] leading-none tabular-nums tracking-tight"
          aria-live="polite"
        >
          {formatMoney(plan.sustainableMonthly)}
          <span className="ml-2 font-sans text-lg font-medium tracking-normal text-primary-foreground/75">
            / month
          </span>
        </p>
        <p className="mt-3 max-w-xl text-sm leading-6 text-primary-foreground/80">
          In today&apos;s dollars, for {plan.sustainable.retirementYears} years of retirement.
          {yearsAway > 0
            ? ` Work continues for ${yearsAway} ${yearsAway === 1 ? "year" : "years"} before withdrawals start.`
            : " Withdrawals start immediately."}
        </p>

        {ratio !== null ? (
          <div className="mt-6 max-w-xl">
            <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
              <p>{formatPercent(ratio)} of your {formatMoney(input.desiredMonthlyIncome)} goal</p>
              <p className="text-primary-foreground/75">
                {plan.sustainableMonthly >= input.desiredMonthlyIncome
                  ? `${formatMoney(plan.sustainableMonthly - input.desiredMonthlyIncome)} to spare`
                  : `${formatMoney(input.desiredMonthlyIncome - plan.sustainableMonthly)} short`}
              </p>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-white/15"
              role="meter"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(Math.min(ratio, 1) * 100)}
              aria-label="Share of the spending goal covered by the lasting paycheck"
            >
              <div
                className={cn(
                  "h-full rounded-full",
                  ratio >= 1 ? "bg-white" : "bg-copper",
                )}
                style={{ width: `${Math.min(100, ratio * 100)}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="mt-6 text-sm text-primary-foreground/80">
            Set a monthly spending goal to see whether this paycheck covers it.
          </p>
        )}

        <p className="mt-5 max-w-xl text-sm leading-6 text-primary-foreground/85">
          {input.desiredMonthlyIncome > 0
            ? goalLasts
              ? `Spending the full ${formatMoney(input.desiredMonthlyIncome)} goal also lasts through that birthday.`
              : `Spending the full ${formatMoney(input.desiredMonthlyIncome)} goal runs out ${formatDepletedAge(plan.goal.depletedAge ?? input.horizonAge)}.`
            : null}{" "}
          If both returns are 1 percentage point lower, the lasting paycheck is{" "}
          {formatMoney(plan.stressedSustainableMonthly)} a month.
        </p>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>
              {yearsAway > 0 ? "Nest egg at retirement" : "Portfolio today"}
            </CardDescription>
            <CardTitle className="font-heading text-2xl tabular-nums">
              {formatCompactMoney(plan.goal.nestEggReal)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-5 text-muted-foreground">
            {yearsAway > 0 ? (
              <p>
                {formatMoney(plan.goal.nestEggNominal)} in the year you retire.
                {plan.goal.totalContributions > 0
                  ? ` Paychecks add ${formatMoney(plan.goal.totalContributions)} before then.`
                  : ""}
              </p>
            ) : (
              <p>Savings already available to withdraw.</p>
            )}
            <p className="mt-2">
              A flat 4% withdrawal would pay {formatMoney(plan.fourPercentMonthly)} a month
              from the portfolio, before Social Security and a pension.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>If you spend the goal</CardDescription>
            <CardTitle
              className={cn(
                "font-heading text-2xl",
                !goalLasts && input.desiredMonthlyIncome > 0 && "text-copper",
              )}
            >
              {input.desiredMonthlyIncome <= 0
                ? "No goal set"
                : goalLasts
                  ? `Through ${input.horizonAge}`
                  : formatDepletedAge(plan.goal.depletedAge ?? input.horizonAge)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-5 text-muted-foreground">
            {input.desiredMonthlyIncome <= 0
              ? "Add the monthly income you want to keep."
              : goalLasts
                ? `The ${formatMoney(input.desiredMonthlyIncome)} goal holds for all ${plan.goal.retirementYears} retirement years.`
                : `The portfolio cannot keep paying ${formatMoney(input.desiredMonthlyIncome)} through age ${input.horizonAge}.`}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Lower-return case</CardDescription>
            <CardTitle className="font-heading text-2xl tabular-nums">
              {formatMoney(plan.stressedSustainableMonthly)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-5 text-muted-foreground">
            Lasting monthly income if the return before retirement and the return in retirement are each 1 point lower.
          </CardContent>
        </Card>
      </div>
    </>
  )

  const detail = (
    <>
      {mixes.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>How the lasting paycheck is built</CardTitle>
            <CardDescription>
              Social Security and pension are used first. Savings cover what they don&apos;t, and extra guaranteed income goes back into the portfolio.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            {mixes.map((mix) => (
              <MixBar key={mix.title} title={mix.title} slice={mix.slice} />
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Over time</CardTitle>
          <CardDescription>
            The lasting paycheck is the most you can spend and still reach {input.horizonAge}. The full goal spends {formatMoney(input.desiredMonthlyIncome)} even if the money runs out.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={view}
            onValueChange={(value) => {
              if (value === "lasting" || value === "goal") onViewChange(value)
            }}
          >
            <TabsList className="w-full">
              <TabsTrigger value="lasting">Lasting paycheck</TabsTrigger>
              <TabsTrigger value="goal">Full goal</TabsTrigger>
            </TabsList>
            <TabsContent value="lasting" className="pt-4">
              {view === "lasting" ? (
                <ChartBlock
                  projection={plan.sustainable}
                  depleting={false}
                  retirementAge={input.retirementAge}
                  currentAge={input.currentAge}
                />
              ) : null}
            </TabsContent>
            <TabsContent value="goal" className="pt-4">
              {view === "goal" ? (
                <ChartBlock
                  projection={plan.goal}
                  depleting={!plan.goal.lastsThroughPlan && input.desiredMonthlyIncome > 0}
                  retirementAge={input.retirementAge}
                  currentAge={input.currentAge}
                />
              ) : null}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <details className="group rounded-2xl bg-card px-4 py-3 ring-1 ring-foreground/10 sm:px-5">
        <summary className="cursor-pointer text-sm font-medium">
          Year-by-year ledger ({activeProjection.years.length} years)
        </summary>
        <div className="pt-3">
          <p className="mb-3 text-sm text-muted-foreground">
            Amounts are in today&apos;s dollars. Balance is at the end of that year of age. Income figures are the year&apos;s total, not the monthly amount.
          </p>
          <Ledger years={activeProjection.years} />
        </div>
      </details>

      <details className="rounded-2xl bg-card px-4 py-3 ring-1 ring-foreground/10 sm:px-5">
        <summary className="cursor-pointer text-sm font-medium">
          How the numbers are calculated
        </summary>
        <div className="grid gap-3 pt-3 text-sm leading-6 text-muted-foreground">
          <p>
            Returns are nominal and compounded monthly. Contributions stop at retirement and are deposited at the end of each month. In retirement, spending is withdrawn at the start of the month.
          </p>
          <p>
            Spending, Social Security, and pension are entered in today&apos;s dollars and rise with inflation on each birthday. Guaranteed income is counted only after retirement has started. If it is more than spending, the extra is saved.
          </p>
          <p>
            The lasting paycheck is the highest spending level, in today&apos;s dollars, that still funds every month through the birthday you chose. The 4% figure is simply 4% of the nest egg at retirement, also shown in today&apos;s dollars.
          </p>
          <p>
            Taxes, fees, Social Security claiming rules, and a string of bad market years are not in the model. Cove is an illustration, not a financial plan.
          </p>
        </div>
      </details>
    </>
  )

  if (mode === "summary") return <div className="grid gap-6">{summary}</div>
  if (mode === "detail") return <div className="grid gap-6">{detail}</div>
  return (
    <div className="grid gap-6">
      {summary}
      {detail}
    </div>
  )
}
