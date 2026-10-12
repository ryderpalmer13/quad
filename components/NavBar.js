'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '../utils.supabase.mjs'
import Avatar from './Avatar'

export default function NavBar() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [loggedIn, setLoggedIn] = useState(false)
  const [me, setMe] = useState(null)
  const pathname = usePathname() || ''

  useEffect(() => {
    async function loadUser() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        setLoggedIn(false)
        setUnreadCount(0)
        setMe(null)
        return
      }

      setLoggedIn(true)

      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userData.user.id)
        .eq('read', false)

      setUnreadCount(count || 0)

      // Ask for the picture and name. If those columns are not set up yet, fall back to email.
      let profile = null
      const full = await supabase
        .from('profiles')
        .select('email, display_name, avatar_url')
        .eq('id', userData.user.id)
        .single()

      if (!full.error) {
        profile = full.data
      } else {
        const basic = await supabase
          .from('profiles')
          .select('email')
          .eq('id', userData.user.id)
          .single()
        profile = basic.data
      }

      setMe({
        name: (profile && profile.display_name) || (profile && profile.email) || userData.user.email,
        avatar: profile ? profile.avatar_url : null,
      })
    }

    loadUser()

    const interval = setInterval(loadUser, 20000)
    window.addEventListener('messages-read', loadUser)
    window.addEventListener('profile-updated', loadUser)

    return () => {
      clearInterval(interval)
      window.removeEventListener('messages-read', loadUser)
      window.removeEventListener('profile-updated', loadUser)
    }
  }, [pathname])

  function tabClass(path) {
    return pathname.startsWith(path) ? 'tab tab-active' : 'tab'
  }

  return (
    <>
      <nav className="nav">
        <Link href="/" className="nav-logo" aria-label="Agora U home">
          <img src="/agora-logo-white.png" alt="Agora U" />
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
            <Link href="/profile" aria-label="Your profile" style={{ display: 'flex' }}>
              <span
                style={{
                  display: 'flex',
                  borderRadius: '50%',
                  border: '2px solid rgba(255, 248, 239, 0.9)',
                }}
              >
                <Avatar url={me ? me.avatar : null} name={me ? me.name : ''} size={32} />
              </span>
            </Link>
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
        <Link href="/profile" className={tabClass('/profile')}>
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
          </svg>
          Profile
        </Link>
      </div>
    </>
  )
}
