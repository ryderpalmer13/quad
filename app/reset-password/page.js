'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../utils.supabase.mjs'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [ready, setReady] = useState(false)
  const [checked, setChecked] = useState(false)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setReady(true)
      }
      setChecked(true)
    })

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
      setChecked(true)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('')

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters.')
      return
    }

    if (password !== confirm) {
      setMessage("The two passwords don't match.")
      return
    }

    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: password })
    setSaving(false)

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Password updated! Taking you to Browse...')
      setTimeout(() => router.push('/listings'), 1200)
    }
  }

  const labelStyle = {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    color: 'var(--color-gray)',
    display: 'block',
    marginBottom: '8px',
  }
  const inputStyle = {
    width: '100%',
    padding: '10px 0',
    border: 'none',
    borderBottom: '2px solid var(--color-hairline)',
    fontFamily: 'Inter, sans-serif',
    fontSize: '15px',
    outline: 'none',
    backgroundColor: 'transparent',
  }

  return (
    <div style={{ maxWidth: '400px', margin: '80px auto', padding: '0 24px' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '32px' }}>Choose a new password</h1>

      {checked && !ready && (
        <p style={{ fontSize: '14px' }}>
          This reset link is invalid or has expired. Request a new one from the login page.
        </p>
      )}

      {ready && (
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: '32px' }}>
            <label style={labelStyle}>Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            style={{
              backgroundColor: 'var(--color-orange)',
              color: 'var(--color-white)',
              border: 'none',
              padding: '14px 24px',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              cursor: saving ? 'not-allowed' : 'pointer',
              width: '100%',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Update Password'}
          </button>
        </form>
      )}

      {message && <p style={{ marginTop: '16px', fontSize: '14px' }}>{message}</p>}
    </div>
  )
}