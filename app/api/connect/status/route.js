import { NextResponse } from 'next/server'
import { getStripe } from '../../../../lib/stripe'
import { getAdmin, getUserFromRequest } from '../../../../lib/supabaseAdmin'
import { paymentsEnabledFor } from '../../../../lib/payments'

export const dynamic = 'force-dynamic'

// Asks Stripe where this seller is in setup and saves the answer.
export async function GET(req) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Please log in.' }, { status: 401 })
    if (!paymentsEnabledFor(user.email)) {
      return NextResponse.json({ error: 'Payments are not available yet.' }, { status: 403 })
    }

    const admin = getAdmin()
    const { data: row } = await admin
      .from('seller_accounts')
      .select('stripe_account_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!row) return NextResponse.json({ state: 'none' })

    const account = await getStripe().accounts.retrieve(row.stripe_account_id)
    const transfersActive = account.capabilities && account.capabilities.transfers === 'active'
    const ready = Boolean(account.details_submitted && transfersActive)

    await admin
      .from('seller_accounts')
      .update({
        details_submitted: Boolean(account.details_submitted),
        payouts_ready: ready,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    return NextResponse.json({ state: ready ? 'ready' : 'incomplete' })
  } catch (err) {
    console.error('connect/status failed:', err)
    return NextResponse.json({ error: 'Could not check payout status.' }, { status: 500 })
  }
}
