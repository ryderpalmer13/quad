import { NextResponse } from 'next/server'
import { getAdmin, getUserFromRequest } from '../../../../lib/supabaseAdmin'
import { sendEmail, layout, esc, SITE } from '../../../../lib/email'

export const dynamic = 'force-dynamic'

// The app calls this right after a message is sent. We email the receiver only for the first unread
// message from that person, so a long chat does not flood their inbox.
export async function POST(req) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Please log in.' }, { status: 401 })
    const body = await req.json().catch(() => ({}))
    const receiverId = body && body.receiverId ? String(body.receiverId) : ''
    if (!receiverId || receiverId === user.id) return NextResponse.json({ ok: true })

    const admin = getAdmin()
    const { count } = await admin
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('sender_id', user.id)
      .eq('receiver_id', receiverId)
      .eq('read', false)
    if (count !== 1) return NextResponse.json({ ok: true })

    const { data: receiver } = await admin.auth.admin.getUserById(receiverId)
    if (!receiver || !receiver.user || !receiver.user.email) return NextResponse.json({ ok: true })

    const { data: profile } = await admin.from('profiles').select('display_name').eq('id', user.id).maybeSingle()
    const name = (profile && profile.display_name) || 'A student'
    const url = `${SITE}/messages/${user.id}`

    await sendEmail({
      to: receiver.user.email,
      subject: `New message from ${name}`,
      html: layout({
        heading: 'You have a new message',
        paragraphs: [`${esc(name)} sent you a message on Agora U.`],
        buttonLabel: 'Read it',
        buttonUrl: url,
      }),
      text: `${name} sent you a message on Agora U. Read it: ${url}`,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('notify/message failed:', err)
    return NextResponse.json({ ok: true })
  }
}
