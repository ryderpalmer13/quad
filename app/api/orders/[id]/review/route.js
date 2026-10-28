import { NextResponse } from 'next/server'
import { getAdmin, getUserFromRequest } from '../../../../../lib/supabaseAdmin'
import { paymentsEnabledFor } from '../../../../../lib/payments'

export const dynamic = 'force-dynamic'

function fail(message, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

// After a completed order, the buyer can rate the seller once.
export async function POST(req, { params }) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return fail('Please log in.', 401)
    if (!paymentsEnabledFor(user.email)) return fail('Payments are not available yet.', 403)

    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const rating = Number(body && body.rating)
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return fail('Pick a rating from 1 to 5 stars.')
    const comment = body && body.comment ? String(body.comment).trim().slice(0, 500) : ''

    const admin = getAdmin()
    const { data: order } = await admin.from('orders').select('*').eq('id', id).maybeSingle()
    if (!order || order.buyer_id !== user.id) return fail('Order not found.', 404)
    if (order.status !== 'completed') return fail('You can leave a review once the order is complete.')

    const { error } = await admin.from('reviews').insert({
      order_id: order.id,
      seller_id: order.seller_id,
      buyer_id: user.id,
      rating,
      comment: comment || null,
    })
    if (error) {
      if (error.code === '23505') return fail('You already reviewed this order.', 409)
      console.error('review insert failed:', error)
      return fail('Could not save your review. Please try again.', 500)
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('orders/review failed:', err)
    return fail('Could not save your review. Please try again.', 500)
  }
}
