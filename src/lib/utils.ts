import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number, currency = "USDT") {
  if (currency.toUpperCase() === "USDT") {
    return `${amount.toFixed(2)} USDT`
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount)
}
