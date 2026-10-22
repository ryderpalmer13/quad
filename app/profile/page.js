'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../utils.supabase.mjs'
import Avatar from '../../components/Avatar'
import { paymentsEnabledFor } from '../../lib/payments'

// Crop to a centered square and shrink, so profile pictures stay small and load fast.
function squarePhoto(file, size) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const side = Math.min(img.width, img.height)
      const sx = (img.width - side) / 2
      const sy = (img.height - side) / 2
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, size, size)
      ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size)
      URL.revokeObjectURL(url)
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Could not read that photo.'))),
        'image/jpeg',
        0.85
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read that photo.'))
    }
    img.src = url
  })
}

export default function ProfilePage() {
  const router = useRouter()
  const fileInput = useRef(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState(null)
  const [email, setEmail] = useState('')
  const [showPayouts, setShowPayouts] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [listings, setListings] = useState([])
  const [editing, setEditing] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        router.push('/login')
        return
      }

      const id = userData.user.id
      setUserId(id)
      setEmail(userData.user.email || '')
      setShowPayouts(paymentsEnabledFor(userData.user.email))

      const full = await supabase
        .from('profiles')
        .select('email, display_name, avatar_url')
        .eq('id', id)
        .single()

      if (!full.error && full.data) {
        setDisplayName(full.data.display_name || '')
        setAvatarUrl(full.data.avatar_url || null)
        if (full.data.email) setEmail(full.data.email)
      }

      const { data: mine } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', id)
        .eq('sold', false)
        .order('created_at', { ascending: false })

      setListings(mine || [])
      setLoading(false)
    }

    load()
  }, [router])

  function firstPhoto(listing) {
    if (listing.photo_urls && listing.photo_urls.length > 0) return listing.photo_urls[0]
    return listing.photo_url
  }

  async function handlePickPhoto(e) {
    const file = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!file || !userId) return

    setMessage('')
    setBusy(true)
    try {
      const blob = await squarePhoto(file, 400)
      const path = `${userId}/avatar-${Date.now()}.jpg`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { contentType: 'image/jpeg', upsert: true })

      if (uploadError) throw new Error('Could not upload the photo. Please try again.')

      const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(path)
      const newUrl = publicData.publicUrl

      const { error: saveError } = await supabase
        .from('profiles')
        .update({ avatar_url: newUrl })
        .eq('id', userId)

      if (saveError) throw new Error('Could not save the photo. Please try again.')

      setAvatarUrl(newUrl)
      window.dispatchEvent(new Event('profile-updated'))
    } catch (err) {
      setMessage(err.message)
    }
    setBusy(false)
  }

  async function handleSaveName() {
    const cleaned = nameDraft.trim().slice(0, 40)
    setMessage('')
    setBusy(true)

    const { error } = await supabase
      .from('profiles')
      .update({ display_name: cleaned || null })
      .eq('id', userId)

    if (error) {
      setMessage('Could not save your name. Please try again.')
    } else {
      setDisplayName(cleaned)
      setEditing(false)
      window.dispatchEvent(new Event('profile-updated'))
    }
    setBusy(false)
  }

  async function handleMarkSold(listingId) {
    const { error } = await supabase.from('listings').update({ sold: true }).eq('id', listingId)
    if (!error) {
      setListings(listings.filter((listing) => listing.id !== listingId))
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    window.dispatchEvent(new Event('profile-updated'))
    router.push('/login')
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '560px', margin: '40px auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-orange-light)',
            }}
          />
          <div style={{ height: '18px', width: '160px', backgroundColor: 'var(--color-orange-light)' }} />
        </div>
      </div>
    )
  }

  const shownName = displayName || email

  const linkRow = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: '16px 0',
    background: 'none',
    border: 'none',
    borderBottom: '1px solid var(--color-hairline)',
    borderRadius: 0,
    fontSize: '15px',
    fontWeight: 500,
    color: 'var(--color-black)',
    cursor: 'pointer',
    textAlign: 'left',
  }

  const smallLink = {
    background: 'none',
    border: 'none',
    padding: 0,
    marginRight: '16px',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--color-orange)',
    cursor: 'pointer',
  }

  return (
    <div style={{ maxWidth: '560px', margin: '40px auto', padding: '0 24px' }}>
      <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
        <button
          onClick={() => fileInput.current && fileInput.current.click()}
          disabled={busy}
          aria-label="Change profile picture"
          style={{
            position: 'relative',
            padding: 0,
            border: '2px solid var(--color-orange)',
            borderRadius: '50%',
            background: 'var(--color-surface)',
            cursor: 'pointer',
            width: '100px',
            height: '100px',
            flex: 'none',
          }}
        >
          <span style={{ display: 'flex', padding: '3px' }}>
            <Avatar url={avatarUrl} name={shownName} size={90} />
          </span>
          <span
            style={{
              position: 'absolute',
              right: '-2px',
              bottom: '-2px',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-orange)',
              border: '3px solid var(--color-white)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 8h4l2-3h6l2 3h4v11H3z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
          </span>
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          onChange={handlePickPhoto}
          style={{ display: 'none' }}
        />

        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              fontSize: '26px',
              fontWeight: 600,
              marginBottom: '8px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {shownName}
          </h1>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '999px',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-hairline)',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--color-orange)',
            }}
          >
            ✓ Verified .edu
          </span>
        </div>
      </div>

      {message && (
        <p style={{ fontSize: '13px', color: '#B3261E', marginTop: '16px' }}>{message}</p>
      )}

      {editing && (
        <div style={{ marginTop: '24px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: 'var(--color-gray)',
              marginBottom: '8px',
            }}
          >
            Display name
          </label>
          <input
            type="text"
            value={nameDraft}
            maxLength={40}
            onChange={(e) => setNameDraft(e.target.value)}
            placeholder="First name and last initial"
            style={{
              width: '100%',
              padding: '14px 0',
              fontSize: '16px',
              border: 'none',
              borderBottom: '2px solid var(--color-hairline)',
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button
              onClick={handleSaveName}
              disabled={busy}
              style={{
                backgroundColor: 'var(--color-orange)',
                color: 'var(--color-white)',
                border: 'none',
                padding: '12px 22px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              style={{
                backgroundColor: 'transparent',
                color: 'var(--color-orange)',
                border: '1.5px solid var(--color-orange)',
                padding: '11px 22px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <h2 style={{ fontSize: '20px', fontWeight: 600, margin: '32px 0 14px 0' }}>My listings</h2>

      {listings.length === 0 && (
        <p style={{ color: 'var(--color-gray)', fontSize: '15px' }}>
          You have no active listings.{' '}
          <Link href="/new-listing" style={{ color: 'var(--color-orange)', fontWeight: 600 }}>
            Sell something
          </Link>
        </p>
      )}

      {listings.map((listing) => (
        <div
          key={listing.id}
          style={{
            display: 'flex',
            gap: '14px',
            alignItems: 'center',
            padding: '12px',
            marginBottom: '10px',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-hairline)',
            borderRadius: '8px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '6px',
              flex: 'none',
              backgroundColor: 'var(--color-orange-light)',
              overflow: 'hidden',
            }}
          >
            {firstPhoto(listing) && (
              <img
                src={firstPhoto(listing)}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '15px', fontWeight: 600 }}>{listing.title}</div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--color-orange)',
                margin: '2px 0 6px 0',
              }}
            >
              ${Number(listing.price).toFixed(2)}
            </div>
            <Link href={`/edit-listing/${listing.id}`} style={{ ...smallLink, display: 'inline' }}>
              Edit
            </Link>
            <button onClick={() => handleMarkSold(listing.id)} style={smallLink}>
              Mark as sold
            </button>
          </div>
        </div>
      ))}

      <div style={{ marginTop: '28px', borderTop: '1px solid var(--color-hairline)' }}>
        <button
          style={linkRow}
          onClick={() => {
            setNameDraft(displayName)
            setEditing(true)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        >
          <span>Edit profile</span>
          <span style={{ color: '#9A8C7E' }}>›</span>
        </button>
        {showPayouts && (
          <Link href="/payouts" style={linkRow}>
            <span>Seller payouts</span>
            <span style={{ color: '#9A8C7E' }}>›</span>
          </Link>
        )}
        <Link href="/terms" style={linkRow}>
          <span>Terms of Service</span>
          <span style={{ color: '#9A8C7E' }}>›</span>
        </Link>
        <Link href="/privacy" style={linkRow}>
          <span>Privacy Policy</span>
          <span style={{ color: '#9A8C7E' }}>›</span>
        </Link>
        <button style={linkRow} onClick={handleLogout}>
          <span>Log out</span>
          <span style={{ color: '#9A8C7E' }}>›</span>
        </button>
      </div>
    </div>
  )
}
