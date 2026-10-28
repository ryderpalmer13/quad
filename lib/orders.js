import crypto from 'crypto'
import { getStripe } from './stripe'
import { getAdmin } from './supabaseAdmin'
import { notifyOrder } from './orderEmails'

// Called after Stripe says a checkout was paid. Safe to call many times for the same order.
// It marks the order paid, makes the handoff code, and takes the listing off Browse.
export async function fulfillFromSession(session) {
  const orderId = session && session.metadata ? session.metadata.order_id : null
  if (!orderId) return null
  if (session.payment_status !== 'paid') return null

  const admin = getAdmin()
  const { data: order } = await admin.from('orders').select('*').eq('id', orderId).maybeSingle()
  if (!order) return null
  if (order.status !== 'pending') return order

  const paymentIntentId =
    typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent ? session.payment_intent.id : null

  // If someone else already paid for this same item, refund this buyer right away.
  const { data: others } = await admin
    .from('orders')
    .select('id')
    .eq('listing_id', order.listing_id)
    .eq('status', 'paid')
    .neq('id', orderId)
    .limit(1)

  if (others && others.length > 0) {
    if (paymentIntentId) {
      await getStripe().refunds.create({ payment_intent: paymentIntentId })
    }
    await admin
      .from('orders')
      .update({ status: 'refunded', stripe_payment_intent_id: paymentIntentId })
      .eq('id', orderId)
      .eq('status', 'pending')
    return { ...order, status: 'refunded' }
  }

  // Only one caller wins this update, so the code is made exactly once.
  const { data: updated } = await admin
    .from('orders')
    .update({
      status: 'paid',
      stripe_payment_intent_id: paymentIntentId,
      paid_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('status', 'pending')
    .select('*')
    .maybeSingle()

  if (!updated) return order

  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0')
  await admin.from('order_secrets').upsert({ order_id: orderId, code })
  await admin.from('listings').update({ sold: true }).eq('id', order.listing_id)
  await notifyOrder(updated, 'paid')

  return updated
}

// If an order is still pending, ask Stripe whether it was actually paid.
export async function syncPendingOrder(order) {
  if (!order || order.status !== 'pending' || !order.stripe_session_id) return order
  const session = await getStripe().checkout.sessions.retrieve(order.stripe_session_id)
  const result = await fulfillFromSession(session)
  return result || order
}
