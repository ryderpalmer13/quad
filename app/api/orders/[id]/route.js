import { NextResponse } from 'next/server'
import { getAdmin, getUserFromRequest } from '../../../../lib/supabaseAdmin'
import { syncPendingOrder } from '../../../../lib/orders'

export const dynamic = 'force-dynamic'

// Returns one order to its buyer or seller. Only the buyer ever gets the code.
export async function GET(req, { params }) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Please log in.' }, { status: 401 })

    const { id } = await params
    const admin = getAdmin()
    const { data: found } = await admin.from('orders').select('*').eq('id', id).maybeSingle()
    if (!found || (found.buyer_id !== user.id && found.seller_id !== user.id)) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
    }

    const order = await syncPendingOrder(found)
    const role = order.buyer_id === user.id ? 'buyer' : 'seller'

    let code = null
    if (role === 'buyer' && order.status === 'paid') {
      const { data: secret } = await admin.from('order_secrets').select('code').eq('order_id', order.id).maybeSingle()
      code = secret ? secret.code : null
    }

    const otherId = role === 'buyer' ? order.seller_id : order.buyer_id
    const { data: other } = await admin.from('profiles').select('display_name').eq('id', otherId).maybeSingle()

    return NextResponse.json({
      order: {
        id: order.id,
        title: order.listing_title,
        status: order.status,
        amountCents: order.amount_cents,
        feeCents: order.fee_cents,
        createdAt: order.created_at,
      },
      role,
      otherId,
      otherName: other && other.display_name ? other.display_name : null,
      code,
    })
  } catch (err) {
    console.error('orders/get failed:', err)
    return NextResponse.json({ error: 'Could not load this order.' }, { status: 500 })
  }
}
