import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { getStripe } from '../../../../../lib/stripe'
import { getAdmin, getUserFromRequest } from '../../../../../lib/supabaseAdmin'
import { paymentsEnabledFor } from '../../../../../lib/payments'

export const dynamic = 'force-dynamic'

const MAX_WRONG_CODES = 5

function fail(message, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

function sameCode(a, b) {
  const x = Buffer.from(String(a))
  const y = Buffer.from(String(b))
  return x.length === y.length && crypto.timingSafeEqual(x, y)
}

// The seller types the buyer's code. If it is right, the held money is sent to the seller.
export async function POST(req, { params }) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return fail('Please log in.', 401)
    if (!paymentsEnabledFor(user.email)) return fail('Payments are not available yet.', 403)

    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const code = body && body.code ? String(body.code).replace(/\D/g, '') : ''
    if (code.length !== 6) return fail('Enter the 6 digit code.')

    const admin = getAdmin()
    const { data: order } = await admin.from('orders').select('*').eq('id', id).maybeSingle()
    if (!order || order.seller_id !== user.id) return fail('Order not found.', 404)
    if (order.status === 'completed') return NextResponse.json({ ok: true })
    if (order.status !== 'paid') return fail('This order is not ready for a handoff.')

    if (order.failed_attempts >= MAX_WRONG_CODES) {
      return fail('Too many wrong codes, so this order is locked. Email hello@agorau.app for help.', 429)
    }

    const { data: secret } = await admin.from('order_secrets').select('code').eq('order_id', order.id).maybeSingle()
    if (!secret) return fail('Something went wrong with this order. Email hello@agorau.app.', 500)

    if (!sameCode(code, secret.code)) {
      const attempts = order.failed_attempts + 1
      await admin.from('orders').update({ failed_attempts: attempts }).eq('id', order.id).eq('status', 'paid')
      const left = MAX_WRONG_CODES - attempts
      return fail(
        left > 0
          ? `That code is not right. You have ${left} ${left === 1 ? 'try' : 'tries'} left.`
          : 'Too many wrong codes, so this order is locked. Email hello@agorau.app for help.',
        400
      )
    }

    // Right code. Only one request can claim the order, so the payout happens once.
    const { data: claimed } = await admin
      .from('orders')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', order.id)
      .eq('status', 'paid')
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
      console.error('transfer failed, putting order back to paid:', err)
      await admin
        .from('orders')
        .update({ status: 'paid', completed_at: null })
        .eq('id', order.id)
        .eq('status', 'completed')
      return fail('The payout did not go through, and nothing was charged to you. Please try again in a minute.', 500)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('orders/confirm failed:', err)
    return fail('Could not confirm the handoff. Please try again.', 500)
  }
}
