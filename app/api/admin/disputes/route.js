import { NextResponse } from 'next/server'
import { getAdmin, getUserFromRequest } from '../../../../lib/supabaseAdmin'
import { isAdmin } from '../../../../lib/admin'

export const dynamic = 'force-dynamic'

async function emailOf(admin, id) {
  if (!id) return null
  const { data } = await admin.auth.admin.getUserById(id)
  return data && data.user ? data.user.email : null
}

// Lists every order that is waiting on a decision, with the chat between the two people.
export async function GET(req) {
  try {
    const user = await getUserFromRequest(req)
    if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Not available.' }, { status: 403 })

    const admin = getAdmin()
    const { data: orders } = await admin
      .from('orders')
      .select('*')
      .eq('status', 'disputed')
      .order('disputed_at', { ascending: true })

    const out = []
    for (const o of orders || []) {
      const [buyerEmail, sellerEmail] = await Promise.all([emailOf(admin, o.buyer_id), emailOf(admin, o.seller_id)])
      let messages = []
      if (o.buyer_id && o.seller_id) {
        const { data: msgs } = await admin
          .from('messages')
          .select('sender_id, content, created_at')
          .or(
            `and(sender_id.eq.${o.buyer_id},receiver_id.eq.${o.seller_id}),and(sender_id.eq.${o.seller_id},receiver_id.eq.${o.buyer_id})`
          )
          .order('created_at', { ascending: false })
          .limit(30)
        messages = (msgs || []).reverse().map((m) => ({
          from: String(m.sender_id) === String(o.buyer_id) ? 'buyer' : 'seller',
          content: m.content,
          at: m.created_at,
        }))
      }
      const chargeback = !o.disputed_by
      out.push({
        id: o.id,
        title: o.listing_title,
        amountCents: o.amount_cents,
        feeCents: o.fee_cents,
        buyerEmail,
        sellerEmail,
        reason: o.dispute_reason,
        reportedBy: chargeback ? 'bank' : String(o.disputed_by) === String(o.buyer_id) ? 'buyer' : 'seller',
        chargeback,
        disputedAt: o.disputed_at,
        messages,
      })
    }

    return NextResponse.json({ disputes: out })
  } catch (err) {
    console.error('admin/disputes failed:', err)
    return NextResponse.json({ error: 'Could not load disputes.' }, { status: 500 })
  }
}
