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
  const [reloadKey, setReloadKey] = useState(0)
  const [codeInput, setCodeInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')
  const [reporting, setReporting] = useState(false)
  const [reportText, setReportText] = useState('')
  const [stars, setStars] = useState(0)
  const [reviewText, setReviewText] = useState('')

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
  }, [orderId, router, reloadKey])

  const box = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-hairline)',
    borderRadius: '12px',
    padding: '18px',
    marginBottom: '16px',
  }

  const d = state.data

  async function act(kind, body) {
    setBusy(true)
    setActionError('')
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session ? sessionData.session.access_token : ''
      const res = await fetch(`/api/orders/${orderId}/${kind}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body || {}),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setActionError(json.error || 'Something went wrong. Please try again.')
      } else {
        setCodeInput('')
        setReloadKey((k) => k + 1)
      }
    } catch (e) {
      setActionError('Something went wrong. Please try again.')
    }
    setBusy(false)
  }

  function cancelOrder() {
    if (window.confirm('Cancel this order? The buyer is refunded in full and the item goes back on Browse.')) {
      act('cancel')
    }
  }

  const linkBtn = {
    background: 'none',
    border: 'none',
    color: 'var(--color-gray)',
    fontSize: '13px',
    textDecoration: 'underline',
    cursor: 'pointer',
    display: 'block',
    margin: '16px auto 0 auto',
  }

  const reportBox = d && d.order.status === 'paid' && (
    <div style={{ marginTop: '8px' }}>
      {!reporting ? (
        <button onClick={() => setReporting(true)} style={linkBtn}>
          Report a problem
        </button>
      ) : (
        <div style={box}>
          <strong style={{ fontSize: '14px' }}>What went wrong?</strong>
          <p style={{ margin: '6px 0 10px 0', color: 'var(--color-gray)', fontSize: '13px', lineHeight: 1.5 }}>
            The money stays held while we look into it. We will email you within 2 business days.
          </p>
          <textarea
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="Tell us what happened"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px',
              border: '1px solid var(--color-hairline)',
              borderRadius: '8px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              marginBottom: '10px',
            }}
          />
          {actionError && <p style={{ color: '#B3261E', fontSize: '13px', margin: '0 0 10px 0' }}>{actionError}</p>}
          <button
            onClick={() => act('report', { reason: reportText })}
            disabled={busy || reportText.trim().length < 5}
            style={{
              width: '100%',
              backgroundColor: 'var(--color-black)',
              color: 'var(--color-white)',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              opacity: busy || reportText.trim().length < 5 ? 0.5 : 1,
            }}
          >
            {busy ? 'Sending...' : 'Send report'}
          </button>
        </div>
      )}
    </div>
  )


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
              {actionError && <p style={{ color: '#B3261E', fontSize: '13px', textAlign: 'center' }}>{actionError}</p>}
              {d.order.paidAt && Date.now() - new Date(d.order.paidAt).getTime() < 15 * 60000 && (
                <button onClick={cancelOrder} disabled={busy} style={linkBtn}>
                  Cancel and get a full refund (first 15 minutes)
                </button>
              )}
            </>
          )}

          {d.order.status === 'paid' && d.role === 'seller' && (
            <>
              <div style={box}>
                <strong>The buyer has paid.</strong>
                <p style={{ margin: '8px 0 0 0', color: 'var(--color-gray)', fontSize: '14px', lineHeight: 1.5 }}>
                  The money is held safely. Meet {d.otherName || 'the buyer'}, hand over the item, and ask for their
                  6 digit code. Only enter it once the item is in their hands.
                </p>
              </div>
              <div style={box}>
                <label style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--color-gray)' }}>
                  Buyer's code
                </label>
                <input
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  placeholder="000000"
                  style={{
                    display: 'block',
                    width: '100%',
                    boxSizing: 'border-box',
                    fontSize: '28px',
                    letterSpacing: '8px',
                    textAlign: 'center',
                    padding: '12px',
                    margin: '10px 0',
                    border: '1px solid var(--color-hairline)',
                    borderRadius: '8px',
                  }}
                />
                {actionError && <p style={{ color: '#B3261E', fontSize: '13px', margin: '0 0 10px 0' }}>{actionError}</p>}
                <button
                  onClick={() => act('confirm', { code: codeInput })}
                  disabled={busy || codeInput.length !== 6}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--color-orange)',
                    color: 'var(--color-white)',
                    padding: '14px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '15px',
                    cursor: 'pointer',
                    opacity: busy || codeInput.length !== 6 ? 0.5 : 1,
                  }}
                >
                  {busy ? 'Working...' : `Confirm and get paid ${dollars(d.order.amountCents - d.order.feeCents)}`}
                </button>
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
              <button onClick={cancelOrder} disabled={busy} style={linkBtn}>
                Cancel this sale and refund the buyer
              </button>
            </>
          )}

          {d.order.status === 'paid' && (
            <>
              <p style={{ color: 'var(--color-gray)', fontSize: '12px', textAlign: 'center', margin: '14px 0 0 0' }}>
                If the handoff does not happen within 14 days, the buyer is refunded automatically.
              </p>
              {reportBox}
            </>
          )}

          {d.order.status === 'disputed' && (
            <div style={box}>
              <strong>Under review</strong>
              <p style={{ margin: '8px 0 0 0', color: 'var(--color-gray)', fontSize: '14px', lineHeight: 1.5 }}>
                A problem was reported on this order. The money stays held while we look into it. We will email both of
                you within 2 business days.
              </p>
            </div>
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

          {d.order.status === 'completed' && d.role === 'buyer' && d.review && (
            <div style={box}>
              <strong>Your review</strong>
              <div style={{ color: 'var(--color-orange)', fontSize: '20px', margin: '6px 0' }}>
                {'★'.repeat(d.review.rating)}
                <span style={{ opacity: 0.3 }}>{'★'.repeat(5 - d.review.rating)}</span>
              </div>
              {d.review.comment && <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-gray)' }}>{d.review.comment}</p>}
            </div>
          )}

          {d.order.status === 'completed' && d.role === 'buyer' && !d.review && (
            <div style={box}>
              <strong>How was {d.otherName || 'the seller'}?</strong>
              <div style={{ display: 'flex', gap: '6px', margin: '10px 0' }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setStars(n)}
                    aria-label={`${n} stars`}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      fontSize: '34px',
                      cursor: 'pointer',
                      color: n <= stars ? 'var(--color-orange)' : 'var(--color-hairline)',
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Optional: say a little about the sale"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px',
                  border: '1px solid var(--color-hairline)',
                  borderRadius: '8px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  marginBottom: '10px',
                }}
              />
              {actionError && <p style={{ color: '#B3261E', fontSize: '13px', margin: '0 0 10px 0' }}>{actionError}</p>}
              <button
                onClick={() => act('review', { rating: stars, comment: reviewText })}
                disabled={busy || stars === 0}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--color-orange)',
                  color: 'var(--color-white)',
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                  opacity: busy || stars === 0 ? 0.5 : 1,
                }}
              >
                {busy ? 'Sending...' : 'Submit review'}
              </button>
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
