'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../utils.supabase.mjs'
import { paymentsEnabledFor } from '../lib/payments'

const KEY = 'agora-payout-prompt-dismissed'

// A friendly card that nudges sellers to set up payouts. It only shows for
// people who have not finished setup, and it can be skipped.
// strong: always shown (ignores Skip), used right after posting a listing.
export default function PayoutPrompt({ strong = false, title, body }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function check() {
      try {
        if (!strong && window.localStorage.getItem(KEY) === '1') return
      } catch (e) {}
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user || !paymentsEnabledFor(userData.user.email)) return
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session ? sessionData.session.access_token : ''
      try {
        const res = await fetch('/api/connect/status', { headers: { Authorization: `Bearer ${token}` } })
        const json = await res.json()
        if (!cancelled && res.ok && json.state !== 'ready') setShow(true)
      } catch (e) {}
    }
    check()
    return () => {
      cancelled = true
    }
  }, [strong])

  if (!show) return null

  function skip() {
    try {
      window.localStorage.setItem(KEY, '1')
    } catch (e) {}
    setShow(false)
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-hairline)',
        borderRadius: '12px',
        padding: '16px 18px',
        margin: '0 0 20px 0',
      }}
    >
      <strong style={{ fontSize: '15px' }}>{title || 'Want to sell too?'}</strong>
      <p style={{ margin: '6px 0 14px 0', fontSize: '13px', color: 'var(--color-gray)', lineHeight: 1.5 }}>
        {body || 'Set up payouts in about 3 minutes so you can get paid in the app when something sells.'}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link
          href="/payouts"
          style={{
            backgroundColor: 'var(--color-orange)',
            color: 'var(--color-white)',
            borderRadius: '999px',
            padding: '9px 18px',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
          }}
        >
          Set up payouts
        </Link>
        {!strong && (
          <button
            onClick={skip}
            style={{ background: 'none', border: 'none', fontSize: '13px', color: 'var(--color-gray)', textDecoration: 'underline', cursor: 'pointer' }}
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  )
}
