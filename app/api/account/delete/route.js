import { NextResponse } from 'next/server'
import { getStripe } from '../../../../lib/stripe'
import { getAdmin, getUserFromRequest } from '../../../../lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

function fail(message, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

// Pulls the file path out of a public storage URL for the given bucket.
function storagePath(url, bucket) {
  const marker = `/${bucket}/`
  const i = String(url || '').indexOf(marker)
  return i === -1 ? null : decodeURIComponent(String(url).slice(i + marker.length).split('?')[0])
}

export async function POST(req) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return fail('Please log in.', 401)

    const admin = getAdmin()
    const id = user.id

    // Money in motion has to finish first.
    const { data: open } = await admin
      .from('orders')
      .select('id')
      .or(`buyer_id.eq.${id},seller_id.eq.${id}`)
      .in('status', ['paid', 'disputed'])
      .limit(1)
    if (open && open.length > 0) {
      return fail('You have an order in progress. Finish or cancel it first, then you can delete your account.')
    }

    // Abandoned checkouts are just closed.
    await admin
      .from('orders')
      .update({ status: 'cancelled' })
      .or(`buyer_id.eq.${id},seller_id.eq.${id}`)
      .eq('status', 'pending')

    // Close the payout account at Stripe if there is one. If Stripe says no, that is okay.
    try {
      const { data: seller } = await admin.from('seller_accounts').select('stripe_account_id').eq('user_id', id).maybeSingle()
      if (seller && seller.stripe_account_id) {
        const stripe = getStripe()
        const remove = stripe.accounts.del || stripe.accounts.delete
        if (remove) await remove.call(stripe.accounts, seller.stripe_account_id)
      }
    } catch (err) {
      console.error('could not close stripe account:', err.message)
    }

    // Delete photos.
    const { data: listings } = await admin.from('listings').select('photo_url, photo_urls').eq('user_id', id)
    const photoPaths = []
    ;(listings || []).forEach((l) => {
      const urls = [...(l.photo_urls || []), l.photo_url].filter(Boolean)
      urls.forEach((u) => {
        const p = storagePath(u, 'listing-photos')
        if (p) photoPaths.push(p)
      })
    })
    if (photoPaths.length > 0) await admin.storage.from('listing-photos').remove(photoPaths)

    const { data: avatars } = await admin.storage.from('avatars').list(id)
    if (avatars && avatars.length > 0) {
      await admin.storage.from('avatars').remove(avatars.map((f) => `${id}/${f.name}`))
    }

    // Delete their data.
    await admin.from('listings').delete().eq('user_id', id)
    await admin.from('messages').delete().or(`sender_id.eq.${id},receiver_id.eq.${id}`)
    await admin.from('profiles').delete().eq('id', id)

    // Finally the login itself.
    const { error } = await admin.auth.admin.deleteUser(id)
    if (error) {
      console.error('deleteUser failed:', error)
      return fail('Could not finish deleting your account. Please email hello@agorau.app.', 500)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('account/delete failed:', err)
    return fail('Could not delete your account. Please try again.', 500)
  }
}
