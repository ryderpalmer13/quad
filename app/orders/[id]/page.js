'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../utils.supabase.mjs'
import { paymentsEnabledFor, dollars } from '../../../lib/payments'

export default function OrderPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id
  const [state, setState] = useState({ loading: true })

  useEffect(() => {
    let cancelled = false
    let tries = 0

    async function load() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        router.push('/login')
        return
      }
      if (!paymentsEnabledFor(userData.user.email)) {
        setState({ error: 'In app payments are not available yet.' })
        return
      }
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session ? sessionData.session.access_token : ''

      async function fetchOrder() {
        const res = await fetch(`/api/orders/${orderId}`, { headers: { Authorization: `Bearer ${token}` } })
        const json = await res.json()
        if (cancelled) return
        if (!res.ok) {
          setState({ error: json.error || 'Could not load this order.' })
          return
        }
        setState({ data: json })
        // Right after paying, Stripe can take a moment. Check a few more times.
        if (json.order.status === 'pending' && tries < 8) {
          tries += 1
          setTimeout(fetchOrder, 1500)
        }
      }
      fetchOrder()
    }

    load()
    return () => {
      cancelled = true
    }
  }, [orderId, router])

  const box = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-hairline)',
    borderRadius: '12px',
    padding: '18px',
    marginBottom: '16px',
  }

  const d = state.data

  return (
    <div style={{ maxWidth: '480px', margin: '40px auto', padding: '0 24px' }}>
      <Link href="/orders" style={{ fontSize: '13px', color: 'var(--color-gray)' }}>
        ‹ My orders
      </Link>

      {state.loading && <p style={{ color: 'var(--color-gray)', marginTop: '20px' }}>Loading...</p>}
      {state.error && <p style={{ color: '#B3261E', marginTop: '20px' }}>{state.error}</p>}

      {d && (
        <>
          <h1 style={{ fontSize: '28px', margin: '14px 0 6px 0' }}>{d.order.title}</h1>
          <p style={{ color: 'var(--color-orange)', fontWeight: 700, fontSize: '20px', margin: '0 0 22px 0' }}>
            {dollars(d.order.amountCents)}
          </p>

          {d.order.status === 'pending' && (
            <div style={box}>
              <strong>Confirming your payment...</strong>
              <p style={{ margin: '8px 0 0 0', color: 'var(--color-gray)', fontSize: '14px' }}>
                This usually takes a few seconds. If you did not finish paying, go back to Browse and try again.
              </p>
            </div>
          )}

          {d.order.status === 'paid' && d.role === 'buyer' && (
            <>
              <div style={{ ...box, textAlign: 'center' }}>
                <div style={{ fontSize: '34px' }}>🔒</div>
                <h2 style={{ fontSize: '22px', margin: '8px 0' }}>Payment held safely</h2>
                <p style={{ color: 'var(--color-gray)', fontSize: '14px', lineHeight: 1.5, margin: '0 0 18px 0' }}>
                  {d.otherName || 'The seller'} only gets paid after you meet and hand over your code.
                </p>
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--color-gray)' }}>
                  Your meetup code
                </div>
                <div style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '8px', margin: '10px 0 6px 0' }}>
                  {d.code ? `${d.code.slice(0, 3)} ${d.code.slice(3)}` : '...'}
                </div>
                <p style={{ color: 'var(--color-gray)', fontSize: '12px', margin: 0 }}>
                  Only share it once you have the item in your hands.
                </p>
              </div>
              <Link
                href={`/messages/${d.otherId}`}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  backgroundColor: 'var(--color-orange)',
                  color: 'var(--color-white)',
                  padding: '14px',
                  borderRadius: '8px',
                  fontWeight: 600,
                }}
              >
                Message {d.otherName || 'the seller'} to set up a meetup
              </Link>
              <p style={{ color: 'var(--color-gray)', fontSize: '12px', textAlign: 'center', marginTop: '12px' }}>
                Meet in a public spot on campus.
              </p>
            </>
          )}

          {d.order.status === 'paid' && d.role === 'seller' && (
            <>
              <div style={box}>
                <strong>The buyer has paid.</strong>
                <p style={{ margin: '8px 0 0 0', color: 'var(--color-gray)', fontSize: '14px', lineHeight: 1.5 }}>
                  The money is held safely. Meet {d.otherName || 'the buyer'}, hand over the item, and ask for their
                  6 digit code. You will enter it here to get paid.
                </p>
              </div>
              <Link
                href={`/messages/${d.otherId}`}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  backgroundColor: 'var(--color-orange)',
                  color: 'var(--color-white)',
                  padding: '14px',
                  borderRadius: '8px',
                  fontWeight: 600,
                }}
              >
                Message {d.otherName || 'the buyer'} to set up a meetup
              </Link>
            </>
          )}

          {d.order.status === 'completed' && (
            <div style={box}>
              <strong>✓ Completed.</strong>
              <p style={{ margin: '8px 0 0 0', color: 'var(--color-gray)', fontSize: '14px' }}>
                {d.role === 'seller'
                  ? `You were paid ${dollars(d.order.amountCents - d.order.feeCents)}.`
                  : 'The seller has been paid. Enjoy your item.'}
              </p>
            </div>
          )}

          {d.order.status === 'refunded' && (
            <div style={box}>
              <strong>Refunded.</strong>
              <p style={{ margin: '8px 0 0 0', color: 'var(--color-gray)', fontSize: '14px' }}>
                The payment was returned to the buyer.
              </p>
            </div>
          )}

          {d.order.status === 'cancelled' && (
            <div style={box}>
              <strong>Cancelled.</strong>
            </div>
          )}
        </>
      )}
    </div>
  )
}
