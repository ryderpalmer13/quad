import { NextResponse } from 'next/server'
import { getStripe } from '../../../../lib/stripe'
import { getAdmin } from '../../../../lib/supabaseAdmin'
import { fulfillFromSession } from '../../../../lib/orders'
import { sendEmail } from '../../../../lib/email'

export const dynamic = 'force-dynamic'

// Stripe calls this when something happens, such as a payment finishing.
// The signature check proves the message really came from Stripe.
export async function POST(req) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  const signature = req.headers.get('stripe-signature')
  if (!secret || !signature) return NextResponse.json({ error: 'Not configured' }, { status: 400 })

  const raw = await req.text()
  let event
  try {
    event = getStripe().webhooks.constructEvent(raw, signature, secret)
  } catch (err) {
    return NextResponse.json({ error: 'Bad signature' }, { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      await fulfillFromSession(event.data.object)
    }
    if (event.type === 'charge.dispute.created') {
      // A card chargeback. Freeze the order if the money has not been paid out yet.
      const intent = event.data.object.payment_intent
      const intentId = typeof intent === 'string' ? intent : intent ? intent.id : null
      if (intentId) {
        await getAdmin()
          .from('orders')
          .update({
            status: 'disputed',
            disputed_at: new Date().toISOString(),
            dispute_reason: 'Card chargeback opened with the bank.',
          })
          .eq('stripe_payment_intent_id', intentId)
          .eq('status', 'paid')
        await sendEmail({
          to: 'hello@agorau.app',
          subject: 'CHARGEBACK opened on an Agora U payment',
          html: `<p>A card chargeback was opened. Payment intent: ${intentId}. If the order was still held, it is now marked disputed.</p>`,
          text: `Chargeback opened. Payment intent ${intentId}.`,
        })
      }
    }
    if (event.type === 'checkout.session.expired') {
      const orderId = event.data.object.metadata ? event.data.object.metadata.order_id : null
      if (orderId) {
        await getAdmin().from('orders').update({ status: 'cancelled' }).eq('id', orderId).eq('status', 'pending')
      }
    }
  } catch (err) {
    console.error('webhook handling failed:', err)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
