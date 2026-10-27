import { NextResponse } from 'next/server'
import { getStripe } from '../../../../lib/stripe'
import { getAdmin, getUserFromRequest } from '../../../../lib/supabaseAdmin'
import { paymentsEnabledFor, priceToCents, feeCents, canPayInApp } from '../../../../lib/payments'

export const dynamic = 'force-dynamic'

function fail(message, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(req) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return fail('Please log in.', 401)
    if (!paymentsEnabledFor(user.email)) return fail('Payments are not available yet.', 403)

    const body = await req.json().catch(() => ({}))
    const listingId = body && body.listingId ? String(body.listingId) : ''
    if (!listingId) return fail('Missing listing.')

    const admin = getAdmin()
    const { data: listing } = await admin.from('listings').select('*').eq('id', listingId).maybeSingle()
    if (!listing) return fail('That listing no longer exists.')
    if (listing.sold) return fail('Sorry, this item was just sold.')
    if (listing.user_id === user.id) return fail('You cannot buy your own listing.')

    // Price always comes from our database, never from the browser.
    const amountCents = priceToCents(listing.price)
    if (!canPayInApp(amountCents)) return fail('This item is too cheap for in app payment. Message the seller to arrange it.')

    const { data: seller } = await admin
      .from('seller_accounts')
      .select('payouts_ready')
      .eq('user_id', listing.user_id)
      .maybeSingle()
    if (!seller || !seller.payouts_ready) {
      return fail('This seller has not finished setting up payouts yet. Message them to let them know.')
    }

    const { data: held } = await admin
      .from('orders')
      .select('id')
      .eq('listing_id', listingId)
      .eq('status', 'paid')
      .limit(1)
    if (held && held.length > 0) return fail('Sorry, this item was just sold.')

    // Clear this buyer's abandoned checkouts for the same item.
    await admin
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('listing_id', listingId)
      .eq('buyer_id', user.id)
      .eq('status', 'pending')

    const fee = feeCents(amountCents)
    const { data: order, error: orderError } = await admin
      .from('orders')
      .insert({
        listing_id: listingId,
        listing_title: listing.title,
        buyer_id: user.id,
        seller_id: listing.user_id,
        amount_cents: amountCents,
        fee_cents: fee,
      })
      .select('*')
      .single()
    if (orderError) throw new Error(orderError.message)

    const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: amountCents,
            product_data: { name: listing.title },
          },
        },
      ],
      metadata: { order_id: order.id },
      payment_intent_data: {
        transfer_group: order.id,
        metadata: { order_id: order.id },
      },
      success_url: `${origin}/orders/${order.id}?paid=1`,
      cancel_url: `${origin}/listings`,
    })

    await admin.from('orders').update({ stripe_session_id: session.id }).eq('id', order.id)

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('orders/create failed:', err)
    return fail('Could not start checkout. Please try again.', 500)
  }
}
