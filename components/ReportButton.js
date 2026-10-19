'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../utils.supabase.mjs'

const REASONS = [
  'Scam or fraud',
  'Fake or misleading listing',
  'Prohibited item',
  'Harassment or unsafe behavior',
  'Spam',
  'Something else',
]

export default function ReportButton({ listingId = null, reportedUserId = null, label = 'Report' }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function openModal() {
    const { data } = await supabase.auth.getUser()
    if (!data.user) {
      router.push('/login')
      return
    }
    setError('')
    setDone(false)
    setOpen(true)
  }

  function close() {
    setOpen(false)
    setReason('')
    setDetails('')
    setError('')
    setDone(false)
  }

  async function submit(e) {
    e.preventDefault()
    if (!reason) {
      setError('Please pick a reason.')
      return
    }
    setBusy(true)
    setError('')

    const { data } = await supabase.auth.getUser()
    if (!data.user) {
      setBusy(false)
      setError('Please log in to send a report.')
      return
    }

    const { error: insertError } = await supabase.from('reports').insert({
      reporter_id: data.user.id,
      listing_id: listingId,
      reported_user_id: reportedUserId,
      reason,
      details: details.trim() || null,
    })

    setBusy(false)
    if (insertError) {
      setError('Could not send the report. Please try again.')
    } else {
      setDone(true)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          fontSize: '12px',
          color: 'var(--color-gray)',
          textDecoration: 'underline',
          cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {label}
      </button>

      {open && (
        <div
          onClick={close}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(59, 42, 32, 0.55)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--color-white)',
              width: '100%',
              maxWidth: '420px',
              borderRadius: '10px',
              padding: '24px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            {done ? (
              <>
                <h2 style={{ fontSize: '20px', margin: '0 0 10px 0' }}>Thanks for letting us know</h2>
                <p style={{ fontSize: '14px', color: 'var(--color-gray)', margin: '0 0 20px 0' }}>
                  We review every report. If you ever feel unsafe, contact campus police or call 911.
                </p>
                <button
                  type="button"
                  onClick={close}
                  style={{
                    backgroundColor: 'var(--color-orange)',
                    color: 'var(--color-white)',
                    border: 'none',
                    padding: '12px 20px',
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    borderRadius: '6px',
                  }}
                >
                  Close
                </button>
              </>
            ) : (
              <form onSubmit={submit}>
                <h2 style={{ fontSize: '20px', margin: '0 0 6px 0' }}>
                  {listingId ? 'Report this listing' : 'Report this person'}
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--color-gray)', margin: '0 0 16px 0' }}>
                  Tell us what is wrong. Your report is private.
                </p>

                {REASONS.map((r) => (
                  <label
                    key={r}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', fontSize: '14px' }}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r}
                      checked={reason === r}
                      onChange={() => setReason(r)}
                    />
                    {r}
                  </label>
                ))}

                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Anything else we should know? (optional)"
                  maxLength={500}
                  rows={3}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    marginTop: '12px',
                    padding: '10px',
                    fontSize: '14px',
                    fontFamily: 'Inter, sans-serif',
                    border: '1px solid var(--color-hairline)',
                    borderRadius: '6px',
                    backgroundColor: 'var(--color-surface)',
                    resize: 'vertical',
                  }}
                />

                {error && <p style={{ color: '#B3261E', fontSize: '13px', margin: '10px 0 0 0' }}>{error}</p>}

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button
                    type="submit"
                    disabled={busy}
                    style={{
                      backgroundColor: 'var(--color-orange)',
                      color: 'var(--color-white)',
                      border: 'none',
                      padding: '12px 20px',
                      fontSize: '12px',
                      fontWeight: 700,
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      borderRadius: '6px',
                      opacity: busy ? 0.6 : 1,
                    }}
                  >
                    {busy ? 'Sending...' : 'Send report'}
                  </button>
                  <button
                    type="button"
                    onClick={close}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '13px',
                      color: 'var(--color-gray)',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
