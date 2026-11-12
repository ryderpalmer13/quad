import { NextResponse } from 'next/server'
import { getStripe } from '../../../../../lib/stripe'
import { getAdmin, getUserFromRequest } from '../../../../../lib/supabaseAdmin'
import { isAdmin } from '../../../../../lib/admin'
import { notifyOrder } from '../../../../../lib/orderEmails'

export const dynamic = 'force-dynamic'

function fail(message, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

// Settles a disputed order. action = 'refund' (money back to the buyer) or 'release' (money to the seller).
export async function POST(req, { params }) {
  try {
    const user = await getUserFromRequest(req)
    if (!user || !isAdmin(user)) return fail('Not available.', 403)

    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const action = body && body.action
    if (action !== 'refund' && action !== 'release') return fail('Unknown action.')

    const admin = getAdmin()
    const { data: order } = await admin.from('orders').select('*').eq('id', id).maybeSingle()
    if (!order) return fail('Order not found.', 404)
    if (order.status !== 'disputed') return fail('This order is not in dispute anymore.', 409)
    if (!order.disputed_by) {
      return fail('This is a card chargeback. Handle it in the Stripe dashboard, not here.')
    }

    if (action === 'refund') {
      const { data: claimed } = await admin
        .from('orders')
        .update({ status: 'refunded' })
        .eq('id', order.id)
        .eq('status', 'disputed')
        .select('*')
        .maybeSingle()
      if (!claimed) return fail('This order was already handled.', 409)

      try {
        await getStripe().refunds.create(
          { payment_intent: order.stripe_payment_intent_id },
          { idempotencyKey: `order-refund-${order.id}` }
        )
      } catch (err) {
        console.error('admin refund failed, putting order back to disputed:', err)
        await admin.from('orders').update({ status: 'disputed' }).eq('id', order.id).eq('status', 'refunded')
        return fail('Stripe would not refund it: ' + err.message, 500)
      }

      await admin.from('listings').update({ sold: false }).eq('id', order.listing_id)
      await notifyOrder(claimed, 'resolved', { outcome: 'refund' })
      return NextResponse.json({ ok: true })
    }

    // Release to the seller.
    const { data: claimed } = await admin
      .from('orders')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', order.id)
      .eq('status', 'disputed')
      .select('*')
      .maybeSingle()
    if (!claimed) return fail('This order was already handled.', 409)

    try {
      const stripe = getStripe()
      const { data: seller } = await admin
        .from('seller_accounts')
        .select('stripe_account_id')
        .eq('user_id', order.seller_id)
        .single()

      const intent = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id)
      const chargeId = typeof intent.latest_charge === 'string' ? intent.latest_charge : intent.latest_charge.id

      const transfer = await stripe.transfers.create(
        {
          amount: order.amount_cents - order.fee_cents,
          currency: 'usd',
          destination: seller.stripe_account_id,
          source_transaction: chargeId,
          transfer_group: order.id,
          metadata: { order_id: order.id },
        },
        { idempotencyKey: `order-transfer-${order.id}` }
      )
      await admin.from('orders').update({ stripe_transfer_id: transfer.id }).eq('id', order.id)
    } catch (err) {
      console.error('admin release failed, putting order back to disputed:', err)
      await admin.from('orders').update({ status: 'disputed', completed_at: null }).eq('id', order.id).eq('status', 'completed')
      return fail('The payout did not go through: ' + err.message, 500)
    }

    await notifyOrder(claimed, 'resolved', { outcome: 'release' })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('admin/disputes/[id] failed:', err)
    return fail('Could not settle this order.', 500)
  }
}
