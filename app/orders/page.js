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

export default function OrdersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const [userId, setUserId] = useState(null)
  const [orders, setOrders] = useState([])

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
        .select('id, listing_title, amount_cents, status, buyer_id, created_at')
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })
      setOrders(data || [])
      setLoading(false)
    }
    load()
  }, [router])

  return (
    <div style={{ maxWidth: '520px', margin: '40px auto', padding: '0 24px' }}>
      <Link href="/profile" style={{ fontSize: '13px', color: 'var(--color-gray)' }}>
        ‹ Profile
      </Link>
      <h1 style={{ fontSize: '30px', margin: '14px 0 20px 0' }}>My orders</h1>

      {loading && <p style={{ color: 'var(--color-gray)' }}>Loading...</p>}
      {!loading && !allowed && <p style={{ color: 'var(--color-gray)' }}>In app payments are not available yet.</p>}
      {!loading && allowed && orders.length === 0 && (
        <p style={{ color: 'var(--color-gray)' }}>No orders yet.</p>
      )}

      {orders.map((order) => (
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
