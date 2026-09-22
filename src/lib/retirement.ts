/**
 * Retirement income model.
 *
 * Dollars compound monthly. Before retirement, contributions land at the end
 * of each month and stop on the retirement birthday. In retirement, spending
 * is withdrawn at the start of the month; Social Security and pension fill
 * that need first, and any surplus is saved back into the portfolio.
 *
 * Spending, Social Security, and pension are entered in today's dollars and
 * step up with inflation once a year. "Lasts until age N" means the plan
 * funds every month through that birthday.
 */

export type RetirementInput = {
  currentAge: number
  retirementAge: number
  horizonAge: number
  currentSavings: number
  monthlyContribution: number
  contributionGrowth: number
  preRetirementReturn: number
  retirementReturn: number
  inflation: number
  desiredMonthlyIncome: number
  socialSecurityMonthly: number
  socialSecurityAge: number
  pensionMonthly: number
  pensionAge: number
}

export type FlowYear = {
  age: number
  phase: "saving" | "retired"
  nominalBalance: number
  realBalance: number
  nominalContribution: number
  nominalWithdrawal: number
  nominalSocialSecurity: number
  nominalPension: number
  nominalSpending: number
  nominalShortfall: number
  realWithdrawal: number
  realSocialSecurity: number
  realPension: number
  realSpending: number
  realShortfall: number
}

export type BalancePoint = {
  age: number
  nominalBalance: number
  realBalance: number
}

export type Projection = {
  years: FlowYear[]
  balances: BalancePoint[]
  nestEggNominal: number
  nestEggReal: number
  totalContributions: number
  depletedAge: number | null
  lastsThroughPlan: boolean
  retirementYears: number
}

export type Plan = {
  input: RetirementInput
  goal: Projection
  sustainableMonthly: number
  sustainable: Projection
  stressedSustainableMonthly: number
  fourPercentMonthly: number
  fundedRatio: number | null
}

const MAX_SEARCH_MONTHLY = 50_000_000

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, value))
}

function clampInt(value: number, min: number, max: number): number {
  return Math.round(clamp(value, min, max))
}

function clampMoney(value: number, max: number): number {
  return Math.round(clamp(value, 0, max))
}

function clampUnit(value: number, max: number): number {
  const clamped = clamp(value, 0, max)
  return Math.round(clamped * 10000) / 10000
}

function annualRate(rate: number): number {
  if (!Number.isFinite(rate)) return 0
  return Math.min(0.25, Math.max(-0.5, rate))
}

function monthlyRate(annual: number): number {
  return Math.pow(1 + annualRate(annual), 1 / 12) - 1
}

export function sanitizeInput(input: RetirementInput): RetirementInput {
  const currentAge = clampInt(input.currentAge, 18, 80)
  const retirementAge = clampInt(input.retirementAge, currentAge, 85)
  const horizonAge = clampInt(input.horizonAge, retirementAge + 1, 110)

  return {
    currentAge,
    retirementAge,
    horizonAge,
    currentSavings: clampMoney(input.currentSavings, 20_000_000),
    monthlyContribution: clampMoney(input.monthlyContribution, 100_000),
    contributionGrowth: clampUnit(input.contributionGrowth, 0.08),
    preRetirementReturn: clampUnit(input.preRetirementReturn, 0.12),
    retirementReturn: clampUnit(input.retirementReturn, 0.1),
    inflation: clampUnit(input.inflation, 0.08),
    desiredMonthlyIncome: clampMoney(input.desiredMonthlyIncome, 100_000),
    socialSecurityMonthly: clampMoney(input.socialSecurityMonthly, 20_000),
    socialSecurityAge: clampInt(input.socialSecurityAge, 62, 75),
    pensionMonthly: clampMoney(input.pensionMonthly, 50_000),
    pensionAge: clampInt(input.pensionAge, 50, 90),
  }
}

export function sameInput(a: RetirementInput, b: RetirementInput): boolean {
  const keys = Object.keys(a) as (keyof RetirementInput)[]
  return keys.every((key) => a[key] === b[key])
}

type ProjectOptions = {
  summary?: boolean
}

export function projectRetirement(
  input: RetirementInput,
  options: ProjectOptions = {},
): Projection {
  const currentAge = input.currentAge
  const retirementAge = Math.max(input.retirementAge, currentAge)
  const horizonAge = Math.max(input.horizonAge, retirementAge + 1)
  const inflation = annualRate(input.inflation)
  const savingRate = monthlyRate(input.preRetirementReturn)
  const retirementMonthlyRate = monthlyRate(input.retirementReturn)
  const summary = options.summary === true

  let balance = Math.max(0, input.currentSavings)
  let totalContributions = 0
  let totalShortfall = 0
  let depletedAge: number | null = null
  let nestEggNominal = balance
  let nestEggCaptured = currentAge >= retirementAge

  const years: FlowYear[] = []
  const balances: BalancePoint[] = summary
    ? []
    : [{ age: currentAge, nominalBalance: balance, realBalance: balance }]

  for (let age = currentAge; age < horizonAge; age += 1) {
    const retired = age >= retirementAge
    if (!nestEggCaptured && retired) {
      nestEggNominal = balance
      nestEggCaptured = true
    }

    const factor = Math.pow(1 + inflation, age - currentAge)
    const monthlyNeed = retired
      ? Math.max(0, input.desiredMonthlyIncome) * factor
      : 0
    const monthlySocial =
      retired && age >= input.socialSecurityAge
        ? Math.max(0, input.socialSecurityMonthly) * factor
        : 0
    const monthlyPension =
      retired && age >= input.pensionAge
        ? Math.max(0, input.pensionMonthly) * factor
        : 0
    const monthlyContribution = retired
      ? 0
      : Math.max(0, input.monthlyContribution) *
        Math.pow(1 + Math.max(0, input.contributionGrowth), age - currentAge)

    let contribution = 0
    let withdrawal = 0
    let socialSecurity = 0
    let pension = 0
    let spending = 0
    let shortfall = 0
    const growth = retired ? retirementMonthlyRate : savingRate

    for (let month = 0; month < 12; month += 1) {
      const other = monthlySocial + monthlyPension
      const gap = monthlyNeed - other
      spending += monthlyNeed
      socialSecurity += monthlySocial
      pension += monthlyPension

      if (gap > 0) {
        const take = Math.min(balance, gap)
        balance -= take
        withdrawal += take
        const miss = gap - take
        if (miss > 0.5) {
          shortfall += miss
          if (depletedAge === null) {
            const covered = gap > 0 ? take / gap : 0
            depletedAge = age + (month + covered) / 12
          }
        }
      } else if (gap < 0) {
        balance += -gap
      }

      balance *= 1 + growth
      if (balance < 0.005) balance = 0

      if (!retired) {
        balance += monthlyContribution
        contribution += monthlyContribution
      }
    }

    totalContributions += contribution
    totalShortfall += shortfall

    const endAge = age + 1
    const endFactor = Math.pow(1 + inflation, endAge - currentAge)
    const realBalance = endFactor === 0 ? balance : balance / endFactor

    if (!summary) {
      const real = (nominal: number) => (factor === 0 ? nominal : nominal / factor)
      years.push({
        age,
        phase: retired ? "retired" : "saving",
        nominalBalance: balance,
        realBalance,
        nominalContribution: contribution,
        nominalWithdrawal: withdrawal,
        nominalSocialSecurity: socialSecurity,
        nominalPension: pension,
        nominalSpending: spending,
        nominalShortfall: shortfall,
        realWithdrawal: real(withdrawal),
        realSocialSecurity: real(socialSecurity),
        realPension: real(pension),
        realSpending: real(spending),
        realShortfall: real(shortfall),
      })
      balances.push({
        age: endAge,
        nominalBalance: balance,
        realBalance,
      })
    }
  }

  const yearsUntilRetirement = Math.max(0, retirementAge - currentAge)
  const retirementFactor = Math.pow(1 + inflation, yearsUntilRetirement)

  return {
    years,
    balances,
    nestEggNominal,
    nestEggReal: retirementFactor === 0 ? nestEggNominal : nestEggNominal / retirementFactor,
    totalContributions,
    depletedAge: totalShortfall >= 1 ? depletedAge : null,
    lastsThroughPlan: totalShortfall < 1,
    retirementYears: horizonAge - retirementAge,
  }
}

function findSustainableMonthly(input: RetirementInput): number {
  const lasts = (monthly: number) =>
    projectRetirement(
      { ...input, desiredMonthlyIncome: monthly },
      { summary: true },
    ).lastsThroughPlan

  if (!lasts(0)) return 0

  let hi = 2_000
  let guard = 0
  while (lasts(hi) && hi < MAX_SEARCH_MONTHLY && guard < 24) {
    hi *= 2
    guard += 1
  }

  if (lasts(hi)) return hi

  let lo = 0
  for (let i = 0; i < 48; i += 1) {
    const mid = (lo + hi) / 2
    if (lasts(mid)) lo = mid
    else hi = mid
  }

  return lo
}

export function planRetirement(raw: RetirementInput): Plan {
  const input = sanitizeInput(raw)
  const goal = projectRetirement(input)
  const sustainableMonthly = Math.floor(findSustainableMonthly(input))
  const sustainable = projectRetirement({
    ...input,
    desiredMonthlyIncome: sustainableMonthly,
  })
  const stressedSustainableMonthly = Math.floor(
    findSustainableMonthly({
      ...input,
      preRetirementReturn: input.preRetirementReturn - 0.01,
      retirementReturn: input.retirementReturn - 0.01,
    }),
  )
  const fourPercentMonthly = (goal.nestEggReal * 0.04) / 12
  const fundedRatio =
    input.desiredMonthlyIncome > 0
      ? sustainableMonthly / input.desiredMonthlyIncome
      : null

  return {
    input,
    goal,
    sustainableMonthly,
    sustainable,
    stressedSustainableMonthly,
    fourPercentMonthly,
    fundedRatio,
  }
}

export type FundingSlice = {
  age: number
  portfolio: number
  socialSecurity: number
  pension: number
  shortfall: number
  spending: number
}

export function monthlyFunding(year: FlowYear): FundingSlice {
  const spending = year.realSpending / 12
  const socialSecurity = Math.min(year.realSocialSecurity / 12, spending)
  const pension = Math.min(
    year.realPension / 12,
    Math.max(0, spending - socialSecurity),
  )
  const portfolio = Math.min(
    year.realWithdrawal / 12,
    Math.max(0, spending - socialSecurity - pension),
  )
  return {
    age: year.age,
    portfolio,
    socialSecurity,
    pension,
    shortfall: year.realShortfall / 12,
    spending,
  }
}
