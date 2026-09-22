"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { AgeField, MoneyField, PercentField } from "@/components/fields"
import { PRESETS } from "@/lib/presets"
import type { RetirementInput } from "@/lib/retirement"

export function PlanForm({
  input,
  presetId,
  onChange,
  onPreset,
  onReset,
}: {
  input: RetirementInput
  presetId: string
  onChange: (partial: Partial<RetirementInput>) => void
  onPreset: (id: string) => void
  onReset: () => void
}) {
  const retiredNow = input.currentAge >= input.retirementAge
  const activePreset = PRESETS.find((preset) => preset.id === presetId)

  return (
    <form
      className="grid gap-6 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="grid gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-heading text-xl">Your plan</h2>
          <Button type="button" variant="ghost" size="sm" onClick={onReset}>
            Reset
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <Button
              key={preset.id}
              type="button"
              size="sm"
              variant={presetId === preset.id ? "default" : "outline"}
              aria-pressed={presetId === preset.id}
              onClick={() => onPreset(preset.id)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
        <p className="text-sm leading-5 text-muted-foreground">
          {activePreset ? activePreset.blurb : "Custom numbers."}
        </p>
      </div>

      <Separator />

      <section className="grid gap-4">
        <h3 className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
          Timeline
        </h3>
        <AgeField
          label="Current age"
          value={input.currentAge}
          min={18}
          max={80}
          onChange={(currentAge) => onChange({ currentAge })}
        />
        <AgeField
          label="Retirement age"
          value={input.retirementAge}
          min={input.currentAge}
          max={85}
          hint={
            retiredNow
              ? "Withdrawals start now, and new savings stop."
              : "Contributions stop on this birthday."
          }
          onChange={(retirementAge) => onChange({ retirementAge })}
        />
        <AgeField
          label="Lasts until age"
          value={input.horizonAge}
          min={input.retirementAge + 1}
          max={110}
          hint="Income is planned through this birthday."
          onChange={(horizonAge) => onChange({ horizonAge })}
        />
      </section>

      <Separator />

      <section className="grid gap-4">
        <h3 className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
          Savings
        </h3>
        <MoneyField
          label="Saved now"
          value={input.currentSavings}
          max={20_000_000}
          hint="Investments you could draw in retirement. Don't include the house you live in."
          onChange={(currentSavings) => onChange({ currentSavings })}
        />
        <MoneyField
          label="Monthly savings"
          value={input.monthlyContribution}
          max={100_000}
          disabled={retiredNow}
          hint={
            retiredNow
              ? "New savings stay off because this plan is already in retirement."
              : "Added at the end of each month until you retire."
          }
          onChange={(monthlyContribution) => onChange({ monthlyContribution })}
        />
        <PercentField
          label="Yearly increase in savings"
          value={input.contributionGrowth}
          max={8}
          disabled={retiredNow || input.monthlyContribution === 0}
          hint="Raises the monthly savings amount once a year."
          onChange={(contributionGrowth) => onChange({ contributionGrowth })}
        />
      </section>

      <Separator />

      <section className="grid gap-4">
        <h3 className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
          Growth
        </h3>
        <PercentField
          label="Return before retirement"
          value={input.preRetirementReturn}
          max={12}
          disabled={retiredNow}
          hint="Nominal return, compounded monthly."
          onChange={(preRetirementReturn) => onChange({ preRetirementReturn })}
        />
        <PercentField
          label="Return in retirement"
          value={input.retirementReturn}
          max={10}
          hint="Often lower than the working years, because the mix is calmer."
          onChange={(retirementReturn) => onChange({ retirementReturn })}
        />
        <PercentField
          label="Inflation"
          value={input.inflation}
          max={8}
          hint="Raises spending, Social Security, and pension each year."
          onChange={(inflation) => onChange({ inflation })}
        />
      </section>

      <Separator />

      <section className="grid gap-4">
        <h3 className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
          Paycheck
        </h3>
        <MoneyField
          label="Monthly spending goal"
          value={input.desiredMonthlyIncome}
          max={100_000}
          hint="In today's dollars, after you stop working."
          onChange={(desiredMonthlyIncome) => onChange({ desiredMonthlyIncome })}
        />
        <MoneyField
          label="Social Security"
          value={input.socialSecurityMonthly}
          max={20_000}
          hint="Monthly benefit in today's dollars."
          onChange={(socialSecurityMonthly) => onChange({ socialSecurityMonthly })}
        />
        <AgeField
          label="Social Security starts"
          value={input.socialSecurityAge}
          min={62}
          max={75}
          disabled={input.socialSecurityMonthly === 0}
          hint="Counted only after you have retired."
          onChange={(socialSecurityAge) => onChange({ socialSecurityAge })}
        />
        <MoneyField
          label="Pension or other income"
          value={input.pensionMonthly}
          max={50_000}
          hint="Any other monthly income, in today's dollars."
          onChange={(pensionMonthly) => onChange({ pensionMonthly })}
        />
        <AgeField
          label="Pension starts"
          value={input.pensionAge}
          min={50}
          max={90}
          disabled={input.pensionMonthly === 0}
          hint="Also counted only once retirement has started."
          onChange={(pensionAge) => onChange({ pensionAge })}
        />
      </section>
    </form>
  )
}
