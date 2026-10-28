'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../utils.supabase.mjs'
import Avatar from './Avatar'
import ReportButton from './ReportButton'
import BlockButton from './BlockButton'
import Stars, { summarize } from './Stars'
import { paymentsEnabledFor, priceToCents, canPayInApp } from '../lib/payments'

function photosOf(listing) {
  if (listing.photo_urls && listing.photo_urls.length > 0) return listing.photo_urls
  return listing.photo_url ? [listing.photo_url] : []
}

export default function ListingDetail({ id, initial }) {
  const router = useRouter()
  const [listing, setListing] = useState(initial)
  const [loaded, setLoaded] = useState(Boolean(initial))
  const [seller, setSeller] = useState(null)
  const [rating, setRating] = useState(null)
  const [me, setMe] = useState(null)
  const [payEnabled, setPayEnabled] = useState(false)
  const [index, setIndex] = useState(0)
  const [buying, setBuying] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser()
      if (userData.user) {
        setMe(userData.user.id)
        setPayEnabled(paymentsEnabledFor(userData.user.email))
      }

      let item = initial
      if (!item) {
        const { data } = await supabase.from('listings').select('*').eq('id', id).maybeSingle()
        item = data || null
        setListing(item)
      }
      setLoaded(true)

      if (item) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .eq('id', item.user_id)
          .maybeSingle()
        setSeller(profile || null)
        const { data: reviewRows } = await supabase
          .from('reviews')
          .select('seller_id, rating')
          .eq('seller_id', item.user_id)
        setRating(summarize(reviewRows)[item.user_id] || { average: 0, count: 0 })

        if (userData.user) {
          const { data: blockRow } = await supabase
            .from('blocks')
            .select('blocked_id')
            .eq('blocker_id', userData.user.id)
            .eq('blocked_id', item.user_id)
            .maybeSingle()
          if (blockRow) setHidden(true)
        }
      }
    }
    load()
  }, [id, initial])

  async function handleBuy() {
    if (!me) {
      router.push('/login')
      return
    }
    setError('')
    setBuying(true)
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session ? data.session.access_token : ''
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ listingId: String(listing.id) }),
      })
      const json = await res.json()
      if (res.ok && json.url) {
        window.location.href = json.url
        return
      }
      setError(json.error || 'Could not start checkout.')
    } catch (e) {
      setError('Could not start checkout.')
    }
    setBuying(false)
  }

  async function handleShare() {
    const url = window.location.href
    const price = Number(listing.price) === 0 ? 'Free' : '$' + Number(listing.price).toFixed(2)
    if (navigator.share) {
      try {
        await navigator.share({ title: listing.title, text: `${listing.title} · ${price} on Agora U`, url })
        return
      } catch (e) {
        // They closed the share sheet. Nothing to do.
        return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      window.prompt('Copy this link:', url)
    }
  }

  const wrap = { maxWidth: '1000px', margin: '32px auto 120px auto', padding: '0 24px' }

  if (!loaded) {
    return (
      <div style={wrap}>
        <p style={{ color: 'var(--color-gray)' }}>Loading...</p>
      </div>
    )
  }

  if (!listing || hidden) {
    return (
      <div style={wrap}>
        <Link href="/listings" style={{ fontSize: '13px', color: 'var(--color-gray)' }}>
          ‹ Browse
        </Link>
        <h1 style={{ fontSize: '28px', margin: '16px 0 8px 0' }}>This listing is not available</h1>
        <p style={{ color: 'var(--color-gray)' }}>It may have been sold or removed.</p>
      </div>
    )
  }

  const photos = photosOf(listing)
  const own = me && me === listing.user_id
  const price = Number(listing.price) === 0 ? 'Free' : '$' + Number(listing.price).toFixed(2)
  const inApp = payEnabled && canPayInApp(priceToCents(listing.price))

  return (
    <div style={wrap}>
      <Link href="/listings" style={{ fontSize: '13px', color: 'var(--color-gray)' }}>
        ‹ Browse
      </Link>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '32px',
          marginTop: '16px',
          alignItems: 'start',
        }}
      >
        <div>
          <div style={{ backgroundColor: 'var(--color-orange-light)', borderRadius: '12px', overflow: 'hidden' }}>
            {photos.length > 0 ? (
              <img
                src={photos[index]}
                alt={listing.title}
                style={{ width: '100%', maxHeight: '480px', aspectRatio: '1 / 1', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <div style={{ aspectRatio: '1 / 1' }} />
            )}
          </div>
          {photos.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
              {photos.map((url, i) => (
                <button
                  key={url + i}
                  onClick={() => setIndex(i)}
                  style={{
                    padding: 0,
                    border: i === index ? '2px solid var(--color-orange)' : '2px solid transparent',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    width: '64px',
                    height: '64px',
                    cursor: 'pointer',
                    background: 'none',
                  }}
                >
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: 'var(--color-orange)',
              margin: '0 0 6px 0',
            }}
          >
            {listing.category || 'For Sale'}
            {listing.condition ? ` · ${listing.condition}` : ''}
          </p>
          <h1 style={{ fontSize: '30px', margin: '0 0 8px 0' }}>{listing.title}</h1>
          <p style={{ fontWeight: 800, fontSize: '26px', color: 'var(--color-orange)', margin: '0 0 16px 0' }}>{price}</p>

          {listing.description && (
            <p style={{ color: 'var(--color-gray)', fontSize: '15px', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: '0 0 18px 0' }}>
              {listing.description}
            </p>
          )}

          {seller && seller.display_name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 20px 0', fontSize: '14px' }}>
              <Avatar url={seller.avatar_url} name={seller.display_name} size={32} />
              <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span>
                  Sold by{' '}
                  <Link href={`/sellers/${listing.user_id}`} style={{ fontWeight: 700, textDecoration: 'underline' }}>
                    {seller.display_name}
                  </Link>
                </span>
                {rating && <Stars average={rating.average} count={rating.count} />}
              </span>
            </div>
          )}

          {listing.sold ? (
            <div style={{ padding: '14px', backgroundColor: 'var(--color-surface)', borderRadius: '8px', fontWeight: 600 }}>
              This item has been sold.
            </div>
          ) : own ? (
            <Link
              href={`/edit-listing/${listing.id}`}
              style={{ display: 'block', textAlign: 'center', padding: '14px', border: '1px solid var(--color-hairline)', borderRadius: '8px', fontWeight: 600 }}
            >
              Edit your listing
            </Link>
          ) : inApp ? (
            <>
              <button
                onClick={handleBuy}
                disabled={buying}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--color-black)',
                  color: 'var(--color-white)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '16px',
                  fontSize: '14px',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  cursor: buying ? 'not-allowed' : 'pointer',
                  opacity: buying ? 0.6 : 1,
                }}
              >
                {buying ? 'Opening checkout...' : 'Buy securely'}
              </button>
              <p style={{ fontSize: '12px', color: 'var(--color-gray)', margin: '10px 0 0 0', lineHeight: 1.5 }}>
                Your payment is held until you meet and share your code. Message the seller after you buy.
              </p>
              {error && <p style={{ fontSize: '13px', color: '#B3261E', margin: '8px 0 0 0' }}>{error}</p>}
            </>
          ) : (
            <button
              onClick={() => (me ? router.push(`/messages/${listing.user_id}?small=1`) : router.push('/login'))}
              style={{
                width: '100%',
                backgroundColor: 'var(--color-orange)',
                color: 'var(--color-white)',
                border: 'none',
                borderRadius: '8px',
                padding: '16px',
                fontSize: '14px',
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Message seller
            </button>
          )}

          <div style={{ display: 'flex', gap: '18px', alignItems: 'baseline', marginTop: '18px', flexWrap: 'wrap' }}>
            <button
              onClick={handleShare}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--color-black)',
                textDecoration: 'underline',
                cursor: 'pointer',
              }}
            >
              {copied ? 'Link copied' : 'Share'}
            </button>
            {!own && (
              <>
                <ReportButton listingId={String(listing.id)} reportedUserId={String(listing.user_id)} label="Report listing" />
                <BlockButton userId={listing.user_id} label="Block seller" onBlocked={() => setHidden(true)} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
