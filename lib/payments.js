// Agora U payment rules in one place. Change a number here and it changes everywhere.
export const FEE_PERCENT = 15 // Agora U takes 15 percent of the sale price
export const MIN_FEE_CENTS = 100 // but never less than $1.00
export const MIN_SALE_CENTS = 300 // items under $3.00 are handled in person, no payment in the app

export function priceToCents(value) {
  return Math.round(Number(value) * 100)
}

// Fee in cents for a sale of priceCents.
export function feeCents(priceCents) {
  return Math.max(MIN_FEE_CENTS, Math.round((priceCents * FEE_PERCENT) / 100))
}

// What the seller receives, in cents.
export function sellerGetsCents(priceCents) {
  return priceCents - feeCents(priceCents)
}

export function canPayInApp(priceCents) {
  return priceCents >= MIN_SALE_CENTS
}

export function dollars(cents) {
  return '$' + (cents / 100).toFixed(2)
}

// While we test with fake money, only these emails see any payment features.
// Set NEXT_PUBLIC_PAYMENTS_TESTERS to a comma separated list of emails.
// When we are ready for everyone, set NEXT_PUBLIC_PAYMENTS_LIVE to true.
export function paymentsEnabledFor(email) {
  if (process.env.NEXT_PUBLIC_PAYMENTS_LIVE === 'true') return true
  if (!email) return false
  const list = (process.env.NEXT_PUBLIC_PAYMENTS_TESTERS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return list.includes(String(email).toLowerCase())
}
