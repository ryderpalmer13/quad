import { NextResponse } from 'next/server'
import { getStripe } from '../../../../lib/stripe'
import { getAdmin } from '../../../../lib/supabaseAdmin'
import { notifyOrder } from '../../../../lib/orderEmails'

export const dynamic = 'force-dynamic'

// If a paid order sits for this many days with no handoff and no report, the buyer is refunded.
const EXPIRE_DAYS = 14

// Vercel runs this once a day. It sends the secret so nobody else can trigger it.
export async function GET(req) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 401 })
  }

  const admin = getAdmin()
  const cutoff = new Date(Date.now() - EXPIRE_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const { data: stale } = await admin.from('orders').select('*').eq('status', 'paid').lt('paid_at', cutoff).limit(50)

  let refunded = 0
  for (const order of stale || []) {
    const { data: claimed } = await admin
      .from('orders')
      .update({ status: 'refunded' })
      .eq('id', order.id)
      .eq('status', 'paid')
      .select('id')
      .maybeSingle()
    if (!claimed) continue

    try {
      await getStripe().refunds.create(
        { payment_intent: order.stripe_payment_intent_id },
        { idempotencyKey: `order-refund-${order.id}` }
      )
      await admin.from('listings').update({ sold: false }).eq('id', order.listing_id)
      refunded += 1
      await notifyOrder(order, 'expired')
    } catch (err) {
      console.error('auto refund failed for order', order.id, err)
      await admin.from('orders').update({ status: 'paid' }).eq('id', order.id).eq('status', 'refunded')
    }
  }

  return NextResponse.json({ checked: (stale || []).length, refunded })
}
