'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../../utils.supabase.mjs'

export default function MessagesPage() {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    async function loadConversations() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        setStatusMessage('You must be logged in to view messages.')
        setLoading(false)
        return
      }

      const myId = userData.user.id

      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        setStatusMessage(error.message)
        setLoading(false)
        return
      }

      const otherIds = new Set()
      messages.forEach((message) => {
        const otherId = message.sender_id === myId ? message.receiver_id : message.sender_id
        otherIds.add(otherId)
      })

      const conversationList = []
      for (const otherId of otherIds) {
        const lastMessage = messages.find(
          (message) => message.sender_id === otherId || message.receiver_id === otherId
        )

        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', otherId)
          .single()

        conversationList.push({
          otherId: otherId,
          email: profile ? profile.email : otherId,
          lastMessage: lastMessage.content,
        })
      }

      setConversations(conversationList)
      setLoading(false)
    }

    loadConversations()
  }, [])

  return (
    <div style={{ maxWidth: '500px', margin: '48px auto', padding: '0 24px' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '32px' }}>Messages</h1>

      {loading && (
        <div>
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              style={{ borderBottom: '1px solid var(--color-hairline)', padding: '16px 0' }}
            >
              <div
                style={{ height: '10px', width: '40%', backgroundColor: '#F0F0F0', marginBottom: '8px' }}
              />
              <div style={{ height: '10px', width: '70%', backgroundColor: '#F0F0F0' }} />
            </div>
          ))}
        </div>
      )}

      {!loading && conversations.length === 0 && !statusMessage && <p>No conversations yet.</p>}

      {conversations.map((conversation) => (
        <Link
          key={conversation.otherId}
          href={`/messages/${conversation.otherId}`}
          style={{
            display: 'block',
            borderBottom: '1px solid var(--color-hairline)',
            padding: '16px 0',
            color: 'var(--color-black)',
          }}
        >
          <p style={{ margin: '0 0 4px 0', fontWeight: 600, fontSize: '14px' }}>
            {conversation.email}
          </p>
          <p style={{ margin: 0, color: '#888', fontSize: '13px' }}>
            {conversation.lastMessage}
          </p>
        </Link>
      ))}

      {statusMessage && <p style={{ marginTop: '16px', fontSize: '14px' }}>{statusMessage}</p>}
    </div>
  )
}
