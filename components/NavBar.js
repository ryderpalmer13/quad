'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '../utils.supabase.mjs'

export default function NavBar() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [loggedIn, setLoggedIn] = useState(false)
  const pathname = usePathname() || ''
  const router = useRouter()

  useEffect(() => {
    async function loadUser() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        setLoggedIn(false)
        setUnreadCount(0)
        return
      }

      setLoggedIn(true)

      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userData.user.id)
        .eq('read', false)

      setUnreadCount(count || 0)
    }

    loadUser()

    const interval = setInterval(loadUser, 20000)
    window.addEventListener('messages-read', loadUser)

    return () => {
      clearInterval(interval)
      window.removeEventListener('messages-read', loadUser)
    }
  }, [pathname])

  async function handleLogout() {
    await supabase.auth.signOut()
    setLoggedIn(false)
    setUnreadCount(0)
    router.push('/login')
  }

  function tabClass(path) {
    return pathname.startsWith(path) ? 'tab tab-active' : 'tab'
  }

  return (
    <>
      <nav className="nav">
        <Link href="/" className="nav-logo">
          QUAD
        </Link>
        <div className="nav-links">
          <Link href="/listings" className="nav-link">
            Browse
          </Link>
          <Link href="/new-listing" className="nav-link">
            Sell
          </Link>
          <Link href="/messages" className="nav-link">
            Messages
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </Link>
        </div>
        <div className="nav-right">
          {loggedIn ? (
            <button
              onClick={handleLogout}
              className="nav-link"
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Log Out
            </button>
          ) : (
            <>
              <Link href="/login" className="nav-link">
                Log In
              </Link>
              <Link href="/signup" className="nav-signup">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>

      <div className="bottom-tabs">
        <Link href="/listings" className={tabClass('/listings')}>
          <svg viewBox="0 0 24 24">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          Browse
        </Link>
        <Link href="/new-listing" className={tabClass('/new-listing')}>
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v8M8 12h8" />
          </svg>
          Sell
        </Link>
        <Link href="/messages" className={tabClass('/messages')}>
          <svg viewBox="0 0 24 24">
            <path d="M4 5h16v11H10l-4 4v-4H4z" />
          </svg>
          Messages
          {unreadCount > 0 && <span className="tab-badge">{unreadCount}</span>}
        </Link>
      </div>
    </>
  )
}