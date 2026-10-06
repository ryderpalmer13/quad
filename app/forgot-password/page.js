'use client'

import { useState } from 'react'
import { supabase } from '../../utils.supabase.mjs'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('')
    setSending(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setSending(false)

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('If that email has an account, a reset link is on its way. Check spam too.')
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
      <h1 style={{ fontSize: '28px', marginBottom: '12px' }}>Reset your password</h1>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '32px' }}>
        Enter your email and we'll send you a link to choose a new password.
      </p>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '32px' }}>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
        </div>
        <button
          type="submit"
          disabled={sending}
          style={{
            backgroundColor: 'var(--color-orange)',
            color: 'var(--color-white)',
            border: 'none',
            padding: '14px 24px',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            cursor: sending ? 'not-allowed' : 'pointer',
            width: '100%',
            opacity: sending ? 0.6 : 1,
          }}
        >
          {sending ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
      {message && <p style={{ marginTop: '16px', fontSize: '14px' }}>{message}</p>}
    </div>
  )
}