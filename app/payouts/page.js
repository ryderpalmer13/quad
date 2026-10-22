'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../utils.supabase.mjs'
import { paymentsEnabledFor, FEE_PERCENT, MIN_FEE_CENTS, dollars } from '../../lib/payments'

export default function PayoutsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const [state, setState] = useState('none') // none | incomplete | ready
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function authHeader() {
    const { data } = await supabase.auth.getSession()
    const token = data.session ? data.session.access_token : ''
    return { Authorization: `Bearer ${token}` }
  }

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        router.push('/login')
        return
      }
      if (!paymentsEnabledFor(userData.user.email)) {
        setAllowed(false)
        setLoading(false)
        return
      }
      setAllowed(true)

      try {
        const res = await fetch('/api/connect/status', { headers: await authHeader() })
        const json = await res.json()
        if (res.ok) setState(json.state)
        else setMessage(json.error || 'Could not check your payout status.')
      } catch (e) {
        setMessage('Could not check your payout status.')
      }
      setLoading(false)
    }
    load()
  }, [router])

  async function handleSetup() {
    setBusy(true)
    setMessage('')
    try {
      const res = await fetch('/api/connect/start', { method: 'POST', headers: await authHeader() })
      const json = await res.json()
      if (res.ok && json.url) {
        window.location.href = json.url
        return
      }
      setMessage(json.error || 'Could not start setup. Please try again.')
    } catch (e) {
      setMessage('Could not start setup. Please try again.')
    }
    setBusy(false)
  }

  const button = {
    backgroundColor: 'var(--color-orange)',
    color: 'var(--color-white)',
    border: 'none',
    padding: '16px 24px',
    fontSize: '15px',
    fontWeight: 600,
    borderRadius: '8px',
    width: '100%',
    cursor: busy ? 'not-allowed' : 'pointer',
    opacity: busy ? 0.6 : 1,
  }

  return (
    <div style={{ maxWidth: '480px', margin: '40px auto', padding: '0 24px' }}>
      <Link href="/profile" style={{ fontSize: '13px', color: 'var(--color-gray)' }}>
        ‹ Profile
      </Link>
      <h1 style={{ fontSize: '30px', margin: '14px 0 10px 0' }}>Seller payouts</h1>

      {loading && <p style={{ color: 'var(--color-gray)' }}>Loading...</p>}

      {!loading && !allowed && (
        <p style={{ color: 'var(--color-gray)', fontSize: '15px', lineHeight: 1.5 }}>
          In app payments are not available yet. Check back soon.
        </p>
      )}

      {!loading && allowed && (
        <>
          <p style={{ color: 'var(--color-gray)', fontSize: '15px', lineHeight: 1.5, margin: '0 0 22px 0' }}>
            When a buyer pays, the money is held safely until you meet and they give you their code. Then it is
            sent to your bank. To get paid, we need to set up your payout account.
          </p>

          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-hairline)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '22px',
              fontSize: '14px',
              lineHeight: 1.5,
            }}
          >
            <strong>Fee:</strong> {FEE_PERCENT}% of the sale price, minimum {dollars(MIN_FEE_CENTS)}. You see exactly
            what you will keep before you post.
          </div>

          {state === 'ready' && (
            <div
              style={{
                backgroundColor: 'var(--color-orange-light)',
                borderRadius: '12px',
                padding: '16px',
                fontWeight: 600,
                color: 'var(--color-black)',
              }}
            >
              ✓ You are set up to get paid.
            </div>
          )}

          {state === 'none' && (
            <button onClick={handleSetup} disabled={busy} style={button}>
              {busy ? 'Opening...' : 'Set up payouts'}
            </button>
          )}

          {state === 'incomplete' && (
            <>
              <p style={{ fontSize: '14px', color: 'var(--color-gray)', margin: '0 0 12px 0' }}>
                Your setup is not finished yet.
              </p>
              <button onClick={handleSetup} disabled={busy} style={button}>
                {busy ? 'Opening...' : 'Continue setup'}
              </button>
            </>
          )}

          {message && <p style={{ fontSize: '13px', color: '#B3261E', marginTop: '16px' }}>{message}</p>}
        </>
      )}
    </div>
  )
}
