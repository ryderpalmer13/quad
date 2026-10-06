'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../utils.supabase.mjs'

export default function ThreadPage() {
  const params = useParams()
  const otherUserId = params.userId

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

      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', otherUserId)
        .single()

      if (profile) {
        setOtherEmail(profile.email)
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
      setStatusMessage(error.message)
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
      <h1 style={{ fontSize: '22px', marginBottom: '28px', fontWeight: 600 }}>
        {otherEmail || 'Conversation'}
      </h1>

      {loading && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '10px' }}>
            <div style={{ height: '32px', width: '60%', backgroundColor: '#F0F0F0' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
            <div style={{ height: '32px', width: '45%', backgroundColor: '#F0F0F0' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ height: '32px', width: '55%', backgroundColor: '#F0F0F0' }} />
          </div>
        </div>
      )}

      {!loading && (
        <>
          <div style={{ marginBottom: '24px' }}>
            {messages.length === 0 && <p>No messages yet. Say hello!</p>}
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
                      backgroundColor: isMine ? 'var(--color-orange)' : '#F5F5F5',
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

      {statusMessage && <p style={{ marginTop: '16px', fontSize: '14px' }}>{statusMessage}</p>}
    </div>
  )
}