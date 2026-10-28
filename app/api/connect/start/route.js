import { NextResponse } from 'next/server'
import { getStripe } from '../../../../lib/stripe'
import { getAdmin, getUserFromRequest } from '../../../../lib/supabaseAdmin'
import { paymentsEnabledFor } from '../../../../lib/payments'

export const dynamic = 'force-dynamic'

async function createSellerAccount(stripe, user) {
  const base = {
    country: 'US',
    email: user.email,
    business_type: 'individual',
    business_profile: {
      url: 'https://agorau.app',
      mcc: '5399',
      product_description: 'Selling used items to other students on Agora U',
    },
    controller: {
      stripe_dashboard: { type: 'express' },
      fees: { payer: 'application' },
      losses: { payments: 'application' },
      requirement_collection: 'stripe',
    },
    metadata: { user_id: user.id },
  }

  // Preferred: sellers only receive money (transfers), so onboarding is lighter.
  try {
    return await stripe.accounts.create({
      ...base,
      capabilities: { transfers: { requested: true } },
      tos_acceptance: { service_agreement: 'recipient' },
    })
  } catch (err) {
    console.error('Recipient account failed, trying standard agreement:', err.message)
    return await stripe.accounts.create({
      ...base,
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
    })
  }
}

export async function POST(req) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Please log in.' }, { status: 401 })
    if (!paymentsEnabledFor(user.email)) {
      return NextResponse.json({ error: 'Payments are not available yet.' }, { status: 403 })
    }

    const stripe = getStripe()
    const admin = getAdmin()

    const { data: existing } = await admin
      .from('seller_accounts')
      .select('stripe_account_id')
      .eq('user_id', user.id)
      .maybeSingle()

    let accountId = existing ? existing.stripe_account_id : null

    if (!accountId) {
      const account = await createSellerAccount(stripe, user)
      accountId = account.id
      const { error } = await admin
        .from('seller_accounts')
        .insert({ user_id: user.id, stripe_account_id: accountId })
      if (error) throw new Error('Could not save the payout account: ' + error.message)
    }

    const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/payouts?refresh=1`,
      return_url: `${origin}/payouts?done=1`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: link.url })
  } catch (err) {
    console.error('connect/start failed:', err)
    return NextResponse.json({ error: 'Could not start payout setup. Please try again.' }, { status: 500 })
  }
}
