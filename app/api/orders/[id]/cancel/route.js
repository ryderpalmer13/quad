import { NextResponse } from 'next/server'
import { getStripe } from '../../../../../lib/stripe'
import { getAdmin, getUserFromRequest } from '../../../../../lib/supabaseAdmin'
import { paymentsEnabledFor } from '../../../../../lib/payments'
import { notifyOrder } from '../../../../../lib/orderEmails'

export const dynamic = 'force-dynamic'

// A buyer can cancel on their own for a short time after paying. A seller can cancel any time.
// After that, a buyer who has a problem uses Report, and we look at it.
const BUYER_CANCEL_MINUTES = 15

function fail(message, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(req, { params }) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return fail('Please log in.', 401)
    if (!paymentsEnabledFor(user.email)) return fail('Payments are not available yet.', 403)

    const { id } = await params
    const admin = getAdmin()
    const { data: order } = await admin.from('orders').select('*').eq('id', id).maybeSingle()
    if (!order || (order.buyer_id !== user.id && order.seller_id !== user.id)) {
      return fail('Order not found.', 404)
    }
    if (order.status !== 'paid') return fail('This order can no longer be cancelled.')

    if (order.buyer_id === user.id) {
      const ageMinutes = (Date.now() - new Date(order.paid_at).getTime()) / 60000
      if (ageMinutes > BUYER_CANCEL_MINUTES) {
        return fail(
          `Buyers can cancel within ${BUYER_CANCEL_MINUTES} minutes of paying. After that, use Report a problem and we will look into it.`
        )
      }
    }

    const { data: claimed } = await admin
      .from('orders')
      .update({ status: 'refunded' })
      .eq('id', order.id)
      .eq('status', 'paid')
      .select('*')
      .maybeSingle()
    if (!claimed) return fail('This order was already handled.', 409)

    try {
      await getStripe().refunds.create(
        { payment_intent: order.stripe_payment_intent_id },
        { idempotencyKey: `order-refund-${order.id}` }
      )
    } catch (err) {
      console.error('refund failed, putting order back to paid:', err)
      await admin.from('orders').update({ status: 'paid' }).eq('id', order.id).eq('status', 'refunded')
      return fail('The refund did not go through. Please try again in a minute.', 500)
    }

    // Put the item back on Browse.
    await admin.from('listings').update({ sold: false }).eq('id', order.listing_id)
    await notifyOrder(claimed, 'cancelled', { by: order.buyer_id === user.id ? 'buyer' : 'seller' })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('orders/cancel failed:', err)
    return fail('Could not cancel. Please try again.', 500)
  }
}
