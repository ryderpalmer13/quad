'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../utils.supabase.mjs'

// Blocks a person: you will not see their listings or messages, and they cannot message you.
export default function BlockButton({ userId, onBlocked, label = 'Block' }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function block() {
    const { data } = await supabase.auth.getUser()
    if (!data.user) {
      router.push('/login')
      return
    }
    if (!window.confirm('Block this person? You will not see their listings or messages, and they cannot message you. You can unblock them any time from your Profile.')) {
      return
    }
    setBusy(true)
    const { error } = await supabase.from('blocks').insert({ blocker_id: data.user.id, blocked_id: userId })
    setBusy(false)
    if (error && error.code !== '23505') {
      window.alert('Could not block this person. Please try again.')
      return
    }
    if (onBlocked) onBlocked()
  }

  return (
    <button
      type="button"
      onClick={block}
      disabled={busy}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        fontSize: '12px',
        color: 'var(--color-gray)',
        textDecoration: 'underline',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}
