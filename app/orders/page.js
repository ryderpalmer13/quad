'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../utils.supabase.mjs'
import { paymentsEnabledFor, dollars } from '../../lib/payments'

const STATUS_LABELS = {
  pending: 'Waiting for payment',
  paid: 'Paid, held safely',
  completed: 'Completed',
  refunded: 'Refunded',
  cancelled: 'Cancelled',
}

const TABS = [
  { key: 'buying', label: 'Buying' },
  { key: 'selling', label: 'Selling' },
  { key: 'completed', label: 'Completed' },
]

const EMPTY = {
  buying: 'Nothing you are buying right now.',
  selling: 'Nothing waiting on you right now. When someone buys your item, it shows up here.',
  completed: 'No completed orders yet.',
}

const TAB_FILTERS = (userId) => ({
  buying: (o) => o.buyer_id === userId && (o.status === 'pending' || o.status === 'paid'),
  selling: (o) => o.seller_id === userId && o.status === 'paid',
  completed: (o) => o.status === 'completed' || o.status === 'refunded',
})

export default function OrdersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const [userId, setUserId] = useState(null)
  const [orders, setOrders] = useState([])
  const [tab, setTab] = useState('buying')

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        router.push('/login')
        return
      }
      setUserId(userData.user.id)
      if (!paymentsEnabledFor(userData.user.email)) {
        setLoading(false)
        return
      }
      setAllowed(true)
      const { data } = await supabase
        .from('orders')
        .select('id, listing_title, amount_cents, status, buyer_id, seller_id, created_at')
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })
      setOrders(data || [])
      setLoading(false)
    }
    load()
  }, [router])

  const shown = orders.filter(TAB_FILTERS(userId)[tab])

  return (
    <div style={{ maxWidth: '520px', margin: '40px auto 110px auto', padding: '0 24px' }}>
      <h1 style={{ fontSize: '30px', margin: '0 0 18px 0' }}>My orders</h1>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {TABS.map((t) => {
          const count = orders.filter(TAB_FILTERS(userId)[t.key]).length
          const active = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1,
                padding: '10px 6px',
                borderRadius: '999px',
                border: '1px solid ' + (active ? 'var(--color-orange)' : 'var(--color-hairline)'),
                backgroundColor: active ? 'var(--color-orange)' : 'var(--color-surface)',
                color: active ? 'var(--color-white)' : 'var(--color-black)',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              {t.label}
              {count > 0 ? ` (${count})` : ''}
            </button>
          )
        })}
      </div>

      {loading && <p style={{ color: 'var(--color-gray)' }}>Loading...</p>}
      {!loading && !allowed && <p style={{ color: 'var(--color-gray)' }}>In app payments are not available yet.</p>}
      {!loading && allowed && shown.length === 0 && (
        <p style={{ color: 'var(--color-gray)' }}>{EMPTY[tab]}</p>
      )}

      {shown.map((order) => (
        <Link
          key={order.id}
          href={`/orders/${order.id}`}
          style={{
            display: 'block',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-hairline)',
            borderRadius: '12px',
            padding: '14px 16px',
            marginBottom: '12px',
            color: 'var(--color-black)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <strong style={{ fontSize: '15px' }}>{order.listing_title}</strong>
            <strong style={{ color: 'var(--color-orange)' }}>{dollars(order.amount_cents)}</strong>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-gray)', marginTop: '6px' }}>
            {order.buyer_id === userId ? 'You bought this' : 'You sold this'} · {STATUS_LABELS[order.status] || order.status}
          </div>
        </Link>
      ))}
    </div>
  )
}
