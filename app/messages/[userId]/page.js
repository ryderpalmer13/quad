'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { supabase } from '../../../utils.supabase.mjs'
import ReportButton from '../../../components/ReportButton'
import BlockButton from '../../../components/BlockButton'
import { paymentsEnabledFor } from '../../../lib/payments'

export default function ThreadPage() {
  const params = useParams()
  const otherUserId = params.userId
  const searchParams = useSearchParams()
  const smallItem = searchParams.get('small') === '1'
  // Testers: messaging opens after an order. Everyone else is unchanged for now.
  const [gated, setGated] = useState(false)
  const [orderId, setOrderId] = useState(null)
  const [blocked, setBlocked] = useState(false)

  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [otherEmail, setOtherEmail] = useState('')
  const [content, setContent] = useState('')
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    async function loadThread() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        setStatusMessage('You must be logged in to view messages.')
        setLoading(false)
        return
      }

      setCurrentUserId(userData.user.id)

      const { data: blockRow } = await supabase
        .from('blocks')
        .select('blocked_id')
        .eq('blocker_id', userData.user.id)
        .eq('blocked_id', otherUserId)
        .maybeSingle()
      setBlocked(!!blockRow)

      if (paymentsEnabledFor(userData.user.email)) {
        const { data: orderRows } = await supabase
          .from('orders')
          .select('id, status, buyer_id, seller_id')
          .in('status', ['paid', 'completed'])
          .order('created_at', { ascending: false })
        const match = (orderRows || []).find(
          (o) =>
            (o.buyer_id === userData.user.id && o.seller_id === otherUserId) ||
            (o.seller_id === userData.user.id && o.buyer_id === otherUserId)
        )
        setGated(!match)
        setOrderId(match ? match.id : null)
      }

      let profile = null
      const full = await supabase
        .from('profiles')
        .select('email, display_name')
        .eq('id', otherUserId)
        .single()

      if (!full.error) {
        profile = full.data
      } else {
        const basic = await supabase.from('profiles').select('email').eq('id', otherUserId).single()
        profile = basic.data
      }

      if (profile) {
        setOtherEmail(profile.display_name || profile.email)
      }

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })

      if (!error) {
        const threadMessages = data.filter(
          (message) =>
            (message.sender_id === userData.user.id && message.receiver_id === otherUserId) ||
            (message.sender_id === otherUserId && message.receiver_id === userData.user.id)
        )
        setMessages(threadMessages)
      }

      await supabase
        .from('messages')
        .update({ read: true })
        .eq('receiver_id', userData.user.id)
        .eq('sender_id', otherUserId)
        .eq('read', false)

      window.dispatchEvent(new Event('messages-read'))

      setLoading(false)
    }

    loadThread()
  }, [otherUserId])

  async function handleSend(e) {
    e.preventDefault()
    setStatusMessage('')

    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) {
      setStatusMessage('You must be logged in to send a message.')
      return
    }

    const { error } = await supabase.from('messages').insert({
      sender_id: userData.user.id,
      receiver_id: otherUserId,
      content: content,
    })

    if (error) {
      setStatusMessage(
        String(error.message).toLowerCase().includes('row-level security')
          ? 'You cannot message this person.'
          : error.message
      )
    } else {
      setContent('')
      const { data } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })
      const threadMessages = data.filter(
        (message) =>
          (message.sender_id === userData.user.id && message.receiver_id === otherUserId) ||
          (message.sender_id === otherUserId && message.receiver_id === userData.user.id)
      )
      setMessages(threadMessages)
    }
  }

  return (
    <div style={{ maxWidth: '500px', margin: '48px auto', padding: '0 24px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '28px',
        }}
      >
        <h1 style={{ fontSize: '22px', margin: 0, fontWeight: 600 }}>
          {otherEmail || 'Conversation'}
        </h1>
        {currentUserId && (
          <span style={{ display: 'flex', gap: '14px', alignItems: 'baseline' }}>
            {!blocked && <BlockButton userId={otherUserId} onBlocked={() => setBlocked(true)} />}
            <ReportButton reportedUserId={String(otherUserId)} label="Report" />
          </span>
        )}
      </div>

      {loading && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '10px' }}>
            <div style={{ height: '32px', width: '60%', backgroundColor: 'var(--color-surface)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
            <div style={{ height: '32px', width: '45%', backgroundColor: 'var(--color-surface)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ height: '32px', width: '55%', backgroundColor: 'var(--color-surface)' }} />
          </div>
        </div>
      )}

      {!loading && (
        <>
          <div style={{ marginBottom: '24px' }}>
            {messages.length === 0 && !(gated && !smallItem) && <p>No messages yet. Say hello!</p>}
            {messages.map((message) => {
              const isMine = message.sender_id === currentUserId
              return (
                <div
                  key={message.id}
                  style={{
                    display: 'flex',
                    justifyContent: isMine ? 'flex-end' : 'flex-start',
                    marginBottom: '10px',
                  }}
                >
                  <div
                    style={{
                      backgroundColor: isMine ? 'var(--color-orange)' : 'var(--color-surface)',
                      color: isMine ? 'var(--color-white)' : 'var(--color-black)',
                      padding: '10px 16px',
                      maxWidth: '75%',
                      fontSize: '14px',
                    }}
                  >
                    <p style={{ margin: 0 }}>{message.content}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {blocked ? (
            <div
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-hairline)',
                borderRadius: '12px',
                padding: '18px',
                textAlign: 'center',
              }}
            >
              <strong>You blocked this person.</strong>
              <p style={{ margin: '8px 0 14px 0', fontSize: '14px', color: 'var(--color-gray)' }}>
                You cannot message each other.
              </p>
              <button
                onClick={async () => {
                  await supabase.from('blocks').delete().eq('blocker_id', currentUserId).eq('blocked_id', otherUserId)
                  setBlocked(false)
                }}
                style={{
                  background: 'none',
                  border: '1px solid var(--color-hairline)',
                  borderRadius: '999px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Unblock
              </button>
            </div>
          ) : gated && !smallItem ? (
            <div
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-hairline)',
                borderRadius: '12px',
                padding: '18px',
                textAlign: 'center',
              }}
            >
              <strong>Messaging opens after you buy.</strong>
              <p style={{ margin: '8px 0 14px 0', fontSize: '14px', color: 'var(--color-gray)', lineHeight: 1.5 }}>
                Buy the item securely first. Your payment is held safely, and then you can message the seller to set up
                a meetup.
              </p>
              <Link href="/listings" style={{ color: 'var(--color-orange)', fontWeight: 600 }}>
                Back to Browse
              </Link>
            </div>
          ) : (
          <>
          <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'var(--color-gray)' }}>
            {orderId
              ? 'Meet in a public spot on campus. Never pay outside the app, your payment is already held safely.'
              : 'Meet in a public spot on campus and pay in person.'}
            {orderId && (
              <>
                {' '}
                <Link href={`/orders/${orderId}`} style={{ color: 'var(--color-orange)', fontWeight: 600 }}>
                  View order
                </Link>
              </>
            )}
          </p>

          <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              placeholder="Type a message..."
              style={{
                flexGrow: 1,
                padding: '10px 0',
                border: 'none',
                borderBottom: '2px solid var(--color-hairline)',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: 'transparent',
              }}
            />
            <button
              type="submit"
              style={{
                backgroundColor: 'var(--color-orange)',
                color: 'var(--color-white)',
                border: 'none',
                padding: '10px 20px',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Send
            </button>
          </form>
          </>
          )}
        </>
      )}

      {statusMessage && <p style={{ marginTop: '16px', fontSize: '14px' }}>{statusMessage}</p>}
    </div>
  )
}