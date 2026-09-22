import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  planRetirement,
  projectRetirement,
  sanitizeInput,
  type RetirementInput,
} from "./retirement.ts"

function base(overrides: Partial<RetirementInput> = {}): RetirementInput {
  return {
    currentAge: 65,
    retirementAge: 65,
    horizonAge: 75,
    currentSavings: 120_000,
    monthlyContribution: 0,
    contributionGrowth: 0,
    preRetirementReturn: 0,
    retirementReturn: 0,
    inflation: 0,
    desiredMonthlyIncome: 1_000,
    socialSecurityMonthly: 0,
    socialSecurityAge: 67,
    pensionMonthly: 0,
    pensionAge: 65,
    ...overrides,
  }
}

describe("projectRetirement", () => {
  it("accumulates end-of-month contributions with a zero return", () => {
    const projection = projectRetirement(
      base({
        currentAge: 30,
        retirementAge: 31,
        horizonAge: 32,
        currentSavings: 0,
        monthlyContribution: 1_000,
        desiredMonthlyIncome: 0,
      }),
    )

    assert.equal(projection.nestEggNominal, 12_000)
    assert.equal(projection.totalContributions, 12_000)
    assert.ok(Math.abs(projection.balances.at(-1)!.nominalBalance - 12_000) < 1)
  })

  it("compounds an effective annual return monthly", () => {
    const projection = projectRetirement(
      base({
        currentAge: 40,
        retirementAge: 41,
        horizonAge: 42,
        currentSavings: 10_000,
        desiredMonthlyIncome: 0,
        preRetirementReturn: 0.12,
        retirementReturn: 0,
      }),
    )

    assert.ok(Math.abs(projection.nestEggNominal - 11_200) < 1)
  })

  it("spends an even balance down to zero across the horizon", () => {
    const projection = projectRetirement(base())

    assert.equal(projection.lastsThroughPlan, true)
    assert.equal(projection.depletedAge, null)
    assert.ok(projection.balances.at(-1)!.nominalBalance < 1)
    assert.equal(projection.retirementYears, 10)
  })

  it("records the age when spending outruns the portfolio", () => {
    const projection = projectRetirement(
      base({
        horizonAge: 66,
        currentSavings: 12_000,
        desiredMonthlyIncome: 2_000,
      }),
    )

    assert.equal(projection.lastsThroughPlan, false)
    assert.ok(projection.depletedAge !== null)
    assert.ok(Math.abs(projection.depletedAge! - 65.5) < 0.05)
  })

  it("lets Social Security cover spending and saves a surplus", () => {
    const projection = projectRetirement(
      base({
        horizonAge: 66,
        currentSavings: 0,
        desiredMonthlyIncome: 0,
        socialSecurityMonthly: 500,
        socialSecurityAge: 65,
      }),
    )

    assert.equal(projection.lastsThroughPlan, true)
    assert.ok(Math.abs(projection.balances.at(-1)!.nominalBalance - 6_000) < 1)
    assert.ok(Math.abs(projection.years[0]!.realSocialSecurity - 6_000) < 1)
  })

  it("inflates Social Security on each birthday", () => {
    const projection = projectRetirement(
      base({
        horizonAge: 67,
        currentSavings: 0,
        desiredMonthlyIncome: 0,
        inflation: 0.1,
        socialSecurityMonthly: 1_000,
        socialSecurityAge: 65,
      }),
    )

    assert.ok(Math.abs(projection.years[0]!.nominalSocialSecurity - 12_000) < 1)
    assert.ok(Math.abs(projection.years[1]!.nominalSocialSecurity - 13_200) < 1)
    assert.ok(Math.abs(projection.years[1]!.realSocialSecurity - 12_000) < 1)
  })

  it("discounts the nest egg back to today's dollars", () => {
    const projection = projectRetirement(
      base({
        currentAge: 64,
        retirementAge: 65,
        horizonAge: 66,
        currentSavings: 100_000,
        desiredMonthlyIncome: 0,
        inflation: 0.1,
      }),
    )

    assert.ok(Math.abs(projection.nestEggNominal - 100_000) < 1)
    assert.ok(Math.abs(projection.nestEggReal - 100_000 / 1.1) < 1)
  })

  it("uses savings to bridge the years before Social Security", () => {
    const covered = projectRetirement(
      base({
        horizonAge: 70,
        currentSavings: 24_000,
        desiredMonthlyIncome: 1_000,
        socialSecurityMonthly: 1_000,
        socialSecurityAge: 67,
      }),
    )
    const short = projectRetirement(
      base({
        horizonAge: 70,
        currentSavings: 24_000,
        desiredMonthlyIncome: 1_001,
        socialSecurityMonthly: 1_000,
        socialSecurityAge: 67,
      }),
    )

    assert.equal(covered.lastsThroughPlan, true)
    assert.equal(short.lastsThroughPlan, false)
    assert.ok(covered.years[0]!.realSocialSecurity < 1)
    assert.ok(Math.abs(covered.years[2]!.realSocialSecurity - 12_000) < 1)
  })
})

describe("planRetirement", () => {
  it("finds the paycheck that exhausts a zero-return portfolio", () => {
    const plan = planRetirement(base())

    assert.equal(plan.sustainableMonthly, 1_000)
    assert.equal(plan.sustainable.lastsThroughPlan, true)
    assert.equal(
      planRetirement(base({ desiredMonthlyIncome: 1_001 })).goal.lastsThroughPlan,
      false,
    )
  })

  it("raises the lasting paycheck when Social Security is added", () => {
    const without = planRetirement(base())
    const withSocial = planRetirement(
      base({
        socialSecurityMonthly: 500,
        socialSecurityAge: 65,
      }),
    )

    assert.ok(withSocial.sustainableMonthly > without.sustainableMonthly)
    assert.equal(withSocial.sustainableMonthly, 1_500)
  })

  it("lowers the lasting paycheck when returns fall", () => {
    const plan = planRetirement(
      base({
        currentAge: 45,
        retirementAge: 65,
        horizonAge: 90,
        currentSavings: 300_000,
        monthlyContribution: 1_000,
        preRetirementReturn: 0.07,
        retirementReturn: 0.05,
        inflation: 0.025,
        desiredMonthlyIncome: 6_000,
        socialSecurityMonthly: 2_000,
        socialSecurityAge: 67,
      }),
    )

    assert.ok(plan.stressedSustainableMonthly < plan.sustainableMonthly)
    assert.ok(plan.fundedRatio !== null)
  })

  it("keeps ages in a solvable order", () => {
    const clean = sanitizeInput(
      base({
        currentAge: 70,
        retirementAge: 60,
        horizonAge: 65,
        currentSavings: -50,
        preRetirementReturn: 2,
      }),
    )

    assert.equal(clean.currentAge, 70)
    assert.equal(clean.retirementAge, 70)
    assert.ok(clean.horizonAge > clean.retirementAge)
    assert.equal(clean.currentSavings, 0)
    assert.equal(clean.preRetirementReturn, 0.12)
  })
})
