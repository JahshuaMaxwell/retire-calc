export function formatMoney(value: number, digits = 0): string {
  if (!Number.isFinite(value)) return "—"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value)
}

export function formatCompactMoney(value: number): string {
  if (!Number.isFinite(value)) return "—"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatInteger(value: number): string {
  if (!Number.isFinite(value)) return ""
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Math.round(value))
}

export function formatPercent(ratio: number): string {
  if (!Number.isFinite(ratio)) return "—"
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(ratio)
}

export function formatRate(decimal: number): string {
  if (!Number.isFinite(decimal)) return "—"
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(decimal)
}

export function formatDepletedAge(age: number): string {
  if (!Number.isFinite(age)) return "an unknown age"
  return `around age ${Math.round(age)}`
}
