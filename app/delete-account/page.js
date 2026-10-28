'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../utils.supabase.mjs'

export default function DeleteAccountPage() {
  const router = useRouter()
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setBusy(true)
    setError('')
    try {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        router.push('/login')
        return
      }
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json.error || 'Could not delete your account.')
        setBusy(false)
        return
      }
      await supabase.auth.signOut()
      window.dispatchEvent(new Event('profile-updated'))
      router.push('/')
    } catch (e) {
      setError('Could not delete your account. Please try again.')
      setBusy(false)
    }
  }

  return (
    <div style={{ maxWidth: '480px', margin: '40px auto 110px auto', padding: '0 24px' }}>
      <Link href="/profile" style={{ fontSize: '13px', color: 'var(--color-gray)' }}>
        ‹ Profile
      </Link>
      <h1 style={{ fontSize: '28px', margin: '14px 0 12px 0' }}>Delete account</h1>
      <p style={{ color: 'var(--color-gray)', fontSize: '14px', lineHeight: 1.6 }}>
        This permanently deletes your profile, your listings and photos, your messages, and your login. It cannot be
        undone. Past order records are kept for payment and tax purposes, without your name attached to your account.
      </p>
      <p style={{ color: 'var(--color-gray)', fontSize: '14px', lineHeight: 1.6 }}>
        If you have an order in progress, finish or cancel it first.
      </p>
      <label style={{ display: 'block', fontSize: '13px', margin: '20px 0 8px 0' }}>
        Type <strong>DELETE</strong> to confirm
      </label>
      <input
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '12px',
          border: '1px solid var(--color-hairline)',
          borderRadius: '8px',
          fontSize: '16px',
          marginBottom: '14px',
        }}
      />
      {error && <p style={{ color: '#B3261E', fontSize: '14px' }}>{error}</p>}
      <button
        onClick={handleDelete}
        disabled={busy || typed !== 'DELETE'}
        style={{
          width: '100%',
          backgroundColor: '#B3261E',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          padding: '14px',
          fontWeight: 700,
          cursor: 'pointer',
          opacity: busy || typed !== 'DELETE' ? 0.5 : 1,
        }}
      >
        {busy ? 'Deleting...' : 'Permanently delete my account'}
      </button>
    </div>
  )
}
