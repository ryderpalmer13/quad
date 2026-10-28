'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../utils.supabase.mjs'

export default function BlockedPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [people, setPeople] = useState([])

  async function load() {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      router.push('/login')
      return
    }
    const { data: rows } = await supabase.from('blocks').select('blocked_id').eq('blocker_id', userData.user.id)
    const ids = (rows || []).map((r) => r.blocked_id)
    let names = {}
    if (ids.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, email, display_name').in('id', ids)
      ;(profiles || []).forEach((p) => {
        names[p.id] = p.display_name || p.email
      })
    }
    setPeople(ids.map((id) => ({ id, name: names[id] || 'Student' })))
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function unblock(id) {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return
    await supabase.from('blocks').delete().eq('blocker_id', userData.user.id).eq('blocked_id', id)
    setPeople((current) => current.filter((p) => p.id !== id))
  }

  return (
    <div style={{ maxWidth: '480px', margin: '40px auto 110px auto', padding: '0 24px' }}>
      <Link href="/profile" style={{ fontSize: '13px', color: 'var(--color-gray)' }}>
        ‹ Profile
      </Link>
      <h1 style={{ fontSize: '28px', margin: '14px 0 20px 0' }}>Blocked users</h1>
      {loading && <p style={{ color: 'var(--color-gray)' }}>Loading...</p>}
      {!loading && people.length === 0 && <p style={{ color: 'var(--color-gray)' }}>You have not blocked anyone.</p>}
      {people.map((p) => (
        <div
          key={p.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 0',
            borderBottom: '1px solid var(--color-hairline)',
          }}
        >
          <span style={{ fontWeight: 600 }}>{p.name}</span>
          <button
            onClick={() => unblock(p.id)}
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
      ))}
    </div>
  )
}
