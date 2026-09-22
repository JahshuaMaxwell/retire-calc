"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { PlanForm } from "@/components/plan-form"
import { buttonVariants } from "@/components/ui/button"
import { ResultsPanel, type PlanView } from "@/components/results-panel"
import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import { PRESETS, presetById, DEFAULT_PRESET_ID } from "@/lib/presets"
import {
  planRetirement,
  sameInput,
  sanitizeInput,
  type RetirementInput,
} from "@/lib/retirement"

const STORAGE_KEY = "cove.plan.v1"

const INPUT_KEYS: (keyof RetirementInput)[] = [
  "currentAge",
  "retirementAge",
  "horizonAge",
  "currentSavings",
  "monthlyContribution",
  "contributionGrowth",
  "preRetirementReturn",
  "retirementReturn",
  "inflation",
  "desiredMonthlyIncome",
  "socialSecurityMonthly",
  "socialSecurityAge",
  "pensionMonthly",
  "pensionAge",
]

function isStoredInput(value: unknown): value is RetirementInput {
  if (!value || typeof value !== "object") return false
  const record = value as Record<string, unknown>
  return INPUT_KEYS.every(
    (key) => typeof record[key] === "number" && Number.isFinite(record[key]),
  )
}

function subscribeToPlan() {
  return () => {}
}

function readPlanSnapshot() {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? ""
  } catch {
    return ""
  }
}

function parseStored(raw: string): { input: RetirementInput; view: PlanView } | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as { input?: unknown; view?: unknown }
    if (!isStoredInput(parsed.input)) return null
    return {
      input: sanitizeInput(parsed.input),
      view: parsed.view === "goal" ? "goal" : "lasting",
    }
  } catch {
    return null
  }
}

function persist(input: RetirementInput, view: PlanView) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ input, view }))
  } catch {
    // The plan still works for this visit if storage is unavailable.
  }
}

export function Calculator() {
  const storedRaw = useSyncExternalStore(subscribeToPlan, readPlanSnapshot, () => "")
  const stored = useMemo(() => parseStored(storedRaw), [storedRaw])
  const fallback = presetById(DEFAULT_PRESET_ID).input
  const [inputOverride, setInputOverride] = useState<RetirementInput | null>(null)
  const [viewOverride, setViewOverride] = useState<PlanView | null>(null)
  const input = inputOverride ?? stored?.input ?? fallback
  const view = viewOverride ?? stored?.view ?? "lasting"

  const plan = useMemo(() => planRetirement(input), [input])
  const presetId =
    PRESETS.find((preset) => sameInput(preset.input, input))?.id ?? "custom"

  function update(partial: Partial<RetirementInput>) {
    const next = sanitizeInput({ ...input, ...partial })
    setInputOverride(next)
    persist(next, view)
  }

  function applyPreset(id: string) {
    const next = presetById(id).input
    setInputOverride(next)
    persist(next, view)
  }

  function changeView(nextView: PlanView) {
    setViewOverride(nextView)
    persist(input, nextView)
  }

  function reset() {
    const next = presetById(DEFAULT_PRESET_ID).input
    setInputOverride(next)
    setViewOverride("lasting")
    persist(next, "lasting")
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-heading text-4xl tracking-tight text-primary italic">
            Cove
          </p>
          <h1 className="mt-1 text-lg font-medium tracking-tight">
            Retirement income calculator
          </h1>
          <p className="mt-2 max-w-sm text-sm leading-5 text-muted-foreground">
            See the monthly paycheck your savings, Social Security, and pension can keep paying.
          </p>
        </div>
        <Link
          href="/install"
          className={cn(buttonVariants({ size: "lg" }), "h-11 px-4")}
        >
          Download app
        </Link>
      </header>

      <div className="sticky top-0 z-30 -mx-4 border-b border-border/80 bg-background/90 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:hidden">
        <div className="flex items-baseline justify-between gap-3">
          <Link href="/install" className="text-xs font-medium text-primary underline-offset-4 hover:underline">
            Download app
          </Link>
          <p className="text-xs text-muted-foreground">Lasting paycheck</p>
          <p className="font-heading text-xl tabular-nums">
            {formatMoney(plan.sustainableMonthly)}
            <span className="font-sans text-sm text-muted-foreground"> / month</span>
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[22.5rem_minmax(0,1fr)] lg:items-start">
        <section className="order-1 min-w-0 lg:col-start-2 lg:row-start-1">
          <ResultsPanel plan={plan} view={view} onViewChange={changeView} mode="summary" />
        </section>
        <div className="order-2 min-w-0 lg:sticky lg:top-6 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:max-h-[calc(100dvh-3rem)] lg:self-start lg:overflow-y-auto">
          <PlanForm
            input={plan.input}
            presetId={presetId}
            onChange={update}
            onPreset={applyPreset}
            onReset={reset}
          />
        </div>
        <section className="order-3 min-w-0 lg:col-start-2 lg:row-start-2">
          <ResultsPanel plan={plan} view={view} onViewChange={changeView} mode="detail" />
        </section>
      </div>
    </div>
  )
}
