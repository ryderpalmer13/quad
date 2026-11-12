'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../utils.supabase.mjs'
import { dollars } from '../../lib/payments'

// Private page for settling disputed orders. The server checks ADMIN_EMAILS, so anyone else just sees "Not available".
export default function AdminPage() {
  const router = useRouter()
  const [state, setState] = useState({ loading: true })
  const [confirming, setConfirming] = useState(null) // `${id}:${action}`
  const [busyId, setBusyId] = useState(null)
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
      router.push('/login')
      return
    }
    const res = await fetch('/api/admin/disputes', { headers: { Authorization: `Bearer ${data.session.access_token}` } })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      setState({ error: json.error || 'Not available.' })
      return
    }
    setState({ disputes: json.disputes })
  }, [router])

  useEffect(() => {
    load()
  }, [load])

  async function settle(id, action) {
    setBusyId(id)
    setNotice('')
    const { data } = await supabase.auth.getSession()
    const res = await fetch(`/api/admin/disputes/${id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${data.session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    const json = await res.json().catch(() => ({}))
    setBusyId(null)
    setConfirming(null)
    if (!res.ok) {
      setNotice(json.error || 'That did not work.')
      return
    }
    setNotice(action === 'refund' ? 'Refunded the buyer. Both people were emailed.' : 'Paid the seller. Both people were emailed.')
    load()
  }

  const box = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-hairline)',
    borderRadius: '12px',
    padding: '18px',
    marginBottom: '16px',
  }
  const btn = (primary) => ({
    flex: 1,
    padding: '12px',
    borderRadius: '8px',
    border: primary ? 'none' : '1px solid var(--color-hairline)',
    backgroundColor: primary ? 'var(--color-orange)' : 'transparent',
    color: primary ? '#fff' : 'var(--color-black)',
    fontWeight: 700,
    fontSize: '14px',
    cursor: 'pointer',
  })

  return (
    <div style={{ maxWidth: '560px', margin: '40px auto 110px auto', padding: '0 24px' }}>
      <Link href="/profile" style={{ fontSize: '13px', color: 'var(--color-gray)' }}>
        ‹ Profile
      </Link>
      <h1 style={{ fontSize: '28px', margin: '14px 0 6px 0' }}>Disputes</h1>
      <p style={{ color: 'var(--color-gray)', fontSize: '14px', margin: '0 0 20px 0' }}>
        Orders where someone reported a problem. The money stays held until you decide.
      </p>

      {state.loading && <p style={{ color: 'var(--color-gray)' }}>Loading...</p>}
      {state.error && <p style={{ color: '#B3261E' }}>{state.error}</p>}
      {notice && <p style={{ ...box, fontSize: '14px' }}>{notice}</p>}
      {state.disputes && state.disputes.length === 0 && (
        <p style={{ color: 'var(--color-gray)' }}>Nothing to settle right now.</p>
      )}

      {(state.disputes || []).map((d) => (
        <div key={d.id} style={box}>
          <div style={{ fontWeight: 700, fontSize: '18px' }}>{d.title}</div>
          <div style={{ color: 'var(--color-orange)', fontWeight: 700, margin: '2px 0 10px 0' }}>
            {dollars(d.amountCents)} <span style={{ color: 'var(--color-gray)', fontWeight: 400, fontSize: '13px' }}>
              (seller would get {dollars(d.amountCents - d.feeCents)})
            </span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-gray)', lineHeight: 1.6 }}>
            Buyer: {d.buyerEmail || 'deleted account'}
            <br />
            Seller: {d.sellerEmail || 'deleted account'}
            <br />
            Reported by: {d.reportedBy}
          </div>
          <p style={{ fontSize: '14px', lineHeight: 1.5, margin: '12px 0' }}>
            <strong>What they said:</strong> {d.reason}
          </p>

          {d.messages.length > 0 && (
            <details style={{ marginBottom: '14px' }}>
              <summary style={{ fontSize: '13px', cursor: 'pointer' }}>Their messages ({d.messages.length})</summary>
              <div style={{ marginTop: '8px', fontSize: '13px', lineHeight: 1.5 }}>
                {d.messages.map((m, i) => (
                  <div key={i} style={{ marginBottom: '4px' }}>
                    <strong>{m.from}:</strong> {m.content}
                  </div>
                ))}
              </div>
            </details>
          )}

          {d.chargeback ? (
            <p style={{ fontSize: '13px', color: '#B3261E', margin: 0 }}>
              This is a card chargeback. Handle it in the Stripe dashboard.
            </p>
          ) : confirming && confirming.startsWith(d.id) ? (
            <div>
              <p style={{ fontSize: '13px', margin: '0 0 10px 0' }}>
                {confirming.endsWith('refund')
                  ? `Refund ${dollars(d.amountCents)} to the buyer? This cannot be undone.`
                  : `Pay ${dollars(d.amountCents - d.feeCents)} to the seller? This cannot be undone.`}
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button style={btn(false)} onClick={() => setConfirming(null)} disabled={busyId === d.id}>
                  Go back
                </button>
                <button
                  style={btn(true)}
                  disabled={busyId === d.id}
                  onClick={() => settle(d.id, confirming.endsWith('refund') ? 'refund' : 'release')}
                >
                  {busyId === d.id ? 'Working...' : 'Yes, do it'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={btn(false)} onClick={() => setConfirming(`${d.id}:refund`)}>
                Refund buyer
              </button>
              <button style={btn(true)} onClick={() => setConfirming(`${d.id}:release`)}>
                Pay seller
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
