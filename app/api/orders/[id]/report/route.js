import { NextResponse } from 'next/server'
import { getAdmin, getUserFromRequest } from '../../../../../lib/supabaseAdmin'
import { paymentsEnabledFor } from '../../../../../lib/payments'
import { notifyOrder } from '../../../../../lib/orderEmails'

export const dynamic = 'force-dynamic'

function fail(message, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

// Either person can report a problem. The money stays held and the order is frozen until we review it.
export async function POST(req, { params }) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return fail('Please log in.', 401)
    if (!paymentsEnabledFor(user.email)) return fail('Payments are not available yet.', 403)

    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const reason = body && body.reason ? String(body.reason).trim().slice(0, 1000) : ''
    if (reason.length < 5) return fail('Please tell us what went wrong in a sentence or two.')

    const admin = getAdmin()
    const { data: order } = await admin.from('orders').select('*').eq('id', id).maybeSingle()
    if (!order || (order.buyer_id !== user.id && order.seller_id !== user.id)) {
      return fail('Order not found.', 404)
    }
    if (order.status === 'disputed') return NextResponse.json({ ok: true })
    if (order.status !== 'paid') return fail('Only an order that is paid and waiting for handoff can be reported.')

    const { data: updated } = await admin
      .from('orders')
      .update({
        status: 'disputed',
        disputed_at: new Date().toISOString(),
        disputed_by: user.id,
        dispute_reason: reason,
      })
      .eq('id', order.id)
      .eq('status', 'paid')
      .select('id')
      .maybeSingle()
    if (!updated) return fail('This order was already handled.', 409)

    await notifyOrder(order, 'disputed', { reason, byId: user.id })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('orders/report failed:', err)
    return fail('Could not send your report. Please try again.', 500)
  }
}
