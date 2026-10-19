'use client'

import { useState, useEffect, useRef } from 'react'

// A styled dropdown menu. Each option can have a small hint on the right.
// options: [{ value, label, hint? }]
export default function Dropdown({ options, value, onChange, summary }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    function onDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const current = options.find((o) => o.value === value) || options[0]
  const shown = summary ? summary(current) : current.label

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 0',
          border: 'none',
          borderRadius: 0,
          borderBottom: '2px solid var(--color-hairline)',
          backgroundColor: 'transparent',
          fontFamily: 'Inter, sans-serif',
          fontSize: '15px',
          color: 'var(--color-black)',
          textAlign: 'left',
          cursor: 'pointer',
        }}
      >
        <span>{shown}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 'calc(100% + 6px)',
            zIndex: 30,
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-hairline)',
            borderRadius: '14px',
            boxShadow: '0 12px 40px rgba(59, 42, 32, 0.25)',
            padding: '6px',
            maxHeight: '320px',
            overflowY: 'auto',
          }}
        >
          {options.map((o) => {
            const active = o.value === value
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '13px 14px',
                  border: 'none',
                  borderRadius: '9px',
                  backgroundColor: active ? 'var(--color-orange-light)' : 'transparent',
                  color: active ? 'var(--color-orange)' : 'var(--color-black)',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '15px',
                  fontWeight: 600,
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <span>
                  {o.label}
                  {active ? ' ✓' : ''}
                </span>
                {o.hint && (
                  <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--color-gray)' }}>
                    {o.hint}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
