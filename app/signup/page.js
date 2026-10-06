'use client'

import { useState } from 'react'
import { supabase } from '../../utils.supabase.mjs'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  async function handleSignup(e) {
    e.preventDefault()
    setMessage('')

    if (!email.endsWith('.edu')) {
      setMessage('Please use a valid .edu student email address.')
      return
    }

    const { error } = await supabase.auth.signUp({
      email: email,
      password: password,
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Success! Check your email to confirm your account.')
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
      <h1 style={{ fontSize: '28px', marginBottom: '32px' }}>Sign up for QUAD</h1>
      <form onSubmit={handleSignup}>
        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>Student Email (.edu)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: '32px' }}>
          <label style={labelStyle}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />
        </div>
        <button
          type="submit"
          style={{
            backgroundColor: 'var(--color-orange)',
            color: 'var(--color-white)',
            border: 'none',
            padding: '14px 24px',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Sign Up
        </button>
      </form>
      {message && <p style={{ marginTop: '16px', fontSize: '14px' }}>{message}</p>}
    </div>
  )
}