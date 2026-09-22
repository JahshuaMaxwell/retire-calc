import { sanitizeInput, type RetirementInput } from "./retirement"

export type Preset = {
  id: string
  label: string
  blurb: string
  input: RetirementInput
}

function preset(input: RetirementInput): RetirementInput {
  return sanitizeInput(input)
}

export const PRESETS: Preset[] = [
  {
    id: "early",
    label: "Early career",
    blurb: "Age 30, a long runway, and a modest monthly savings rate.",
    input: preset({
      currentAge: 30,
      retirementAge: 67,
      horizonAge: 95,
      currentSavings: 42_000,
      monthlyContribution: 750,
      contributionGrowth: 0.02,
      preRetirementReturn: 0.07,
      retirementReturn: 0.05,
      inflation: 0.025,
      desiredMonthlyIncome: 6_000,
      socialSecurityMonthly: 1_900,
      socialSecurityAge: 67,
      pensionMonthly: 0,
      pensionAge: 67,
    }),
  },
  {
    id: "mid",
    label: "Mid-career",
    blurb: "Age 45, with a nest egg already underway.",
    input: preset({
      currentAge: 45,
      retirementAge: 65,
      horizonAge: 92,
      currentSavings: 340_000,
      monthlyContribution: 1_500,
      contributionGrowth: 0.02,
      preRetirementReturn: 0.07,
      retirementReturn: 0.05,
      inflation: 0.025,
      desiredMonthlyIncome: 7_200,
      socialSecurityMonthly: 2_200,
      socialSecurityAge: 67,
      pensionMonthly: 0,
      pensionAge: 65,
    }),
  },
  {
    id: "near",
    label: "Near retirement",
    blurb: "Age 60, a pension, and Social Security two years behind.",
    input: preset({
      currentAge: 60,
      retirementAge: 66,
      horizonAge: 92,
      currentSavings: 920_000,
      monthlyContribution: 2_200,
      contributionGrowth: 0,
      preRetirementReturn: 0.06,
      retirementReturn: 0.045,
      inflation: 0.025,
      desiredMonthlyIncome: 8_000,
      socialSecurityMonthly: 2_450,
      socialSecurityAge: 67,
      pensionMonthly: 1_600,
      pensionAge: 66,
    }),
  },
  {
    id: "retired",
    label: "Already retired",
    blurb: "Age 68, drawing the portfolio and Social Security now.",
    input: preset({
      currentAge: 68,
      retirementAge: 68,
      horizonAge: 92,
      currentSavings: 680_000,
      monthlyContribution: 0,
      contributionGrowth: 0,
      preRetirementReturn: 0.05,
      retirementReturn: 0.045,
      inflation: 0.025,
      desiredMonthlyIncome: 5_400,
      socialSecurityMonthly: 2_150,
      socialSecurityAge: 67,
      pensionMonthly: 0,
      pensionAge: 68,
    }),
  },
]

export const DEFAULT_PRESET_ID = "mid"

export function presetById(id: string): Preset {
  return PRESETS.find((preset) => preset.id === id) ?? PRESETS[1]!
}
