"use client"

import { useId, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { formatInteger } from "@/lib/format"
import { cn } from "@/lib/utils"

export function FieldHint({ id, children }: { id: string; children: string }) {
  return (
    <p id={id} className="text-xs leading-5 text-muted-foreground">
      {children}
    </p>
  )
}

export function MoneyField({
  label,
  value,
  onChange,
  hint,
  max = 20_000_000,
  disabled = false,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  hint?: string
  max?: number
  disabled?: boolean
}) {
  const id = useId()
  const hintId = `${id}-hint`
  const [draft, setDraft] = useState<string | null>(null)
  const text = draft ?? formatInteger(value)

  return (
    <div className={cn("grid gap-1.5", disabled && "opacity-60")}>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
          $
        </span>
        <Input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          disabled={disabled}
          aria-describedby={hint ? hintId : undefined}
          className="h-11 pl-7 text-base tabular-nums"
          value={text}
          onFocus={() => {
            setDraft(value ? String(Math.round(value)) : "")
          }}
          onBlur={() => {
            const raw = (draft ?? "").replace(/[^\d]/g, "")
            const parsed = raw === "" ? 0 : Number(raw)
            onChange(Number.isFinite(parsed) ? Math.min(max, Math.max(0, parsed)) : 0)
            setDraft(null)
          }}
          onChange={(event) => {
            const raw = event.target.value.replace(/[^\d]/g, "").slice(0, 11)
            setDraft(raw)
            const parsed = raw === "" ? 0 : Number(raw)
            if (Number.isFinite(parsed)) onChange(Math.min(max, parsed))
          }}
        />
      </div>
      {hint ? <FieldHint id={hintId}>{hint}</FieldHint> : null}
    </div>
  )
}

export function AgeField({
  label,
  value,
  onChange,
  min,
  max,
  hint,
  disabled = false,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  hint?: string
  disabled?: boolean
}) {
  const id = useId()
  const hintId = `${id}-hint`
  const [draft, setDraft] = useState<string | null>(null)
  const text = draft ?? String(value)

  return (
    <div className={cn("grid gap-2", disabled && "opacity-60")}>
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          disabled={disabled}
          aria-describedby={hint ? hintId : undefined}
          className="h-8 w-16 px-2 text-right tabular-nums"
          value={text}
          onFocus={() => setDraft(String(value))}
          onBlur={() => {
            const parsed = Number(draft)
            onChange(draft !== null && draft !== "" && Number.isFinite(parsed) ? parsed : value)
            setDraft(null)
          }}
          onChange={(event) => {
            setDraft(event.target.value.replace(/\D/g, "").slice(0, 3))
          }}
        />
      </div>
      <Slider
        min={min}
        max={max}
        step={1}
        disabled={disabled}
        value={[value]}
        aria-label={label}
        onValueChange={(next) => {
          const age = Array.isArray(next) ? next[0] : next
          if (typeof age === "number") onChange(age)
        }}
      />
      {hint ? <FieldHint id={hintId}>{hint}</FieldHint> : null}
    </div>
  )
}

export function PercentField({
  label,
  value,
  onChange,
  min = 0,
  max = 12,
  hint,
  disabled = false,
}: {
  label: string
  value: number
  onChange: (decimal: number) => void
  min?: number
  max?: number
  hint?: string
  disabled?: boolean
}) {
  const id = useId()
  const hintId = `${id}-hint`
  const percent = Math.round(value * 1000) / 10
  const [draft, setDraft] = useState<string | null>(null)
  const text = draft ?? percent.toFixed(1)

  const commit = (raw: string) => {
    const parsed = Number(raw)
    const next = Number.isFinite(parsed) ? parsed : percent
    const clamped = Math.min(max, Math.max(min, next))
    onChange(Math.round(clamped * 10) / 1000)
  }

  return (
    <div className={cn("grid gap-2", disabled && "opacity-60")}>
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id}>{label}</Label>
        <div className="relative">
          <Input
            id={id}
            inputMode="decimal"
            autoComplete="off"
            disabled={disabled}
            aria-describedby={hint ? hintId : undefined}
            className="h-8 w-20 pr-6 text-right tabular-nums"
            value={text}
            onFocus={() => setDraft(percent.toFixed(1))}
            onBlur={() => {
              commit(draft ?? percent.toFixed(1))
              setDraft(null)
            }}
            onChange={(event) => {
              const raw = event.target.value.replace(/[^\d.]/g, "")
              const single = raw.replace(/(\..*)\./g, "$1")
              setDraft(single)
              if (single !== "" && single !== ".") commit(single)
            }}
          />
          <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs text-muted-foreground">
            %
          </span>
        </div>
      </div>
      <Slider
        min={min}
        max={max}
        step={0.1}
        disabled={disabled}
        value={[percent]}
        aria-label={label}
        onValueChange={(next) => {
          const rate = Array.isArray(next) ? next[0] : next
          if (typeof rate === "number") {
            onChange(Math.round(rate * 10) / 1000)
          }
        }}
      />
      {hint ? <FieldHint id={hintId}>{hint}</FieldHint> : null}
    </div>
  )
}
