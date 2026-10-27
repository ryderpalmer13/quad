'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../utils.supabase.mjs'
import { paymentsEnabledFor, priceToCents, feeCents, canPayInApp, dollars, FEE_PERCENT } from '../lib/payments'

// Shows a seller what they will keep after the fee, while they type a price.
export default function FeeNote({ price }) {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser()
      setEnabled(Boolean(data.user) && paymentsEnabledFor(data.user.email))
    }
    load()
  }, [])

  if (!enabled) return null
  const cents = priceToCents(price)
  if (!price || !Number.isFinite(cents) || cents <= 0) return null

  let text
  if (!canPayInApp(cents)) {
    text = 'Items under $3.00 are arranged in person, so there is no fee.'
  } else {
    const fee = feeCents(cents)
    text = `Agora U fee (${FEE_PERCENT}%): ${dollars(fee)}. You keep ${dollars(cents - fee)}.`
  }

  return (
    <p style={{ fontSize: '13px', color: 'var(--color-gray)', margin: '8px 0 0 0' }}>{text}</p>
  )
}
