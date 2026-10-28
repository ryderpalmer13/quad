'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../utils.supabase.mjs'
import Avatar from '../../components/Avatar'
import HowItWorks from '../../components/HowItWorks'
import Stars, { summarize } from '../../components/Stars'
import { CATEGORIES } from '../../components/listingOptions'
import { paymentsEnabledFor, priceToCents, canPayInApp } from '../../lib/payments'

const FILTER_CATEGORIES = ['All', ...CATEGORIES]

const field = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '11px 14px',
  fontSize: '14px',
  border: '1px solid var(--color-hairline)',
  borderRadius: '10px',
  fontFamily: 'Inter, sans-serif',
  outline: 'none',
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-black)',
}

function formatPrice(value) {
  return Number(value) === 0 ? 'Free' : '$' + Number(value).toFixed(2)
}

function firstPhoto(listing) {
  if (listing.photo_urls && listing.photo_urls.length > 0) return listing.photo_urls[0]
  return listing.photo_url || null
}

export default function ListingsPage() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [sortBy, setSortBy] = useState('newest')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [currentUserId, setCurrentUserId] = useState(null)
  const [sellers, setSellers] = useState({})
  const [blockedIds, setBlockedIds] = useState([])
  const [ratings, setRatings] = useState({})
  const [payEnabled, setPayEnabled] = useState(false)
  const [buyingId, setBuyingId] = useState(null)
  const [buyErrors, setBuyErrors] = useState({})
  const router = useRouter()

  useEffect(() => {
    // Category chips on the home page link here with ?category=Furniture
    const wanted = new URLSearchParams(window.location.search).get('category')
    if (wanted && CATEGORIES.includes(wanted)) setCategoryFilter(wanted)
  }, [])

  useEffect(() => {
    async function fetchListings() {
      const { data: userData } = await supabase.auth.getUser()
      if (userData.user) {
        setCurrentUserId(userData.user.id)
        setPayEnabled(paymentsEnabledFor(userData.user.email))
        const { data: blockRows } = await supabase
          .from('blocks')
          .select('blocked_id')
          .eq('blocker_id', userData.user.id)
        setBlockedIds((blockRows || []).map((b) => b.blocked_id))
      }

      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('sold', false)
        .order('created_at', { ascending: false })

      if (!error) {
        setListings(data)

        // Look up seller names and ratings. If that is not set up yet, listings still show.
        const sellerIds = [...new Set(data.map((listing) => listing.user_id))]
        if (sellerIds.length > 0) {
          const { data: profileRows, error: profileError } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url')
            .in('id', sellerIds)

          const { data: reviewRows } = await supabase.from('reviews').select('seller_id, rating').in('seller_id', sellerIds)
          setRatings(summarize(reviewRows))

          if (!profileError && profileRows) {
            const lookup = {}
            profileRows.forEach((row) => {
              lookup[row.id] = row
            })
            setSellers(lookup)
          }
        }
      }
      setLoading(false)
    }

    fetchListings()
  }, [])

  const lowest = minPrice === '' ? null : Number(minPrice)
  const highest = maxPrice === '' ? null : Number(maxPrice)

  const filteredListings = listings
    .filter((listing) => {
      const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === 'All' || listing.category === categoryFilter
      const price = Number(listing.price)
      const matchesPrice = (lowest === null || price >= lowest) && (highest === null || price <= highest)
      return matchesSearch && matchesCategory && matchesPrice && !blockedIds.includes(listing.user_id)
    })
    .sort((a, b) => {
      if (sortBy === 'low') return Number(a.price) - Number(b.price)
      if (sortBy === 'high') return Number(b.price) - Number(a.price)
      return new Date(b.created_at) - new Date(a.created_at)
    })

  const filtersActive = categoryFilter !== 'All' || minPrice !== '' || maxPrice !== '' || searchTerm !== ''

  function clearFilters() {
    setSearchTerm('')
    setCategoryFilter('All')
    setMinPrice('')
    setMaxPrice('')
    setSortBy('newest')
  }

  function inAppItem(listing) {
    return payEnabled && canPayInApp(priceToCents(listing.price))
  }

  async function handleBuy(listing) {
    if (!currentUserId) {
      router.push('/login')
      return
    }
    setBuyErrors((current) => ({ ...current, [listing.id]: '' }))
    setBuyingId(listing.id)
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
      setBuyErrors((current) => ({ ...current, [listing.id]: json.error || 'Could not start checkout.' }))
    } catch (e) {
      setBuyErrors((current) => ({ ...current, [listing.id]: 'Could not start checkout.' }))
    }
    setBuyingId(null)
  }

  const smallButton = {
    width: '100%',
    marginTop: '10px',
    backgroundColor: 'var(--color-orange)',
    color: 'var(--color-white)',
    border: 'none',
    borderRadius: '999px',
    padding: '9px 12px',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.8px',
    textTransform: 'uppercase',
    cursor: 'pointer',
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '28px auto 40px auto', padding: '0 16px' }}>
      <h1 style={{ fontSize: 'clamp(24px, 6vw, 30px)', margin: '0 0 8px 0', color: 'var(--color-black)' }}>Browse</h1>

      <HowItWorks compact />

      <div style={{ maxWidth: '640px' }}>
      <input
        type="text"
        placeholder="Search listings"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ ...field, marginBottom: '10px' }}
      />

      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ ...field, flex: 1, minWidth: 0 }}>
          {FILTER_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c === 'All' ? 'All items' : c}
            </option>
          ))}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ ...field, flex: 1, minWidth: 0 }}>
          <option value="newest">Newest</option>
          <option value="low">Price: low to high</option>
          <option value="high">Price: high to low</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '22px' }}>
        <input
          type="number"
          min="0"
          inputMode="decimal"
          placeholder="Min $"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          style={{ ...field, flex: 1, minWidth: 0 }}
        />
        <span style={{ color: 'var(--color-gray)', fontSize: '13px' }}>to</span>
        <input
          type="number"
          min="0"
          inputMode="decimal"
          placeholder="Max $"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          style={{ ...field, flex: 1, minWidth: 0 }}
        />
        {filtersActive && (
          <button
            onClick={clearFilters}
            style={{ background: 'none', border: 'none', fontSize: '13px', color: 'var(--color-black)', textDecoration: 'underline', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Clear
          </button>
        )}
      </div>

      </div>

      {loading && (
        <div className="browse-grid">
          {[1, 2, 3, 4].map((n) => (
            <div key={n}>
              <div style={{ aspectRatio: '1 / 1', borderRadius: '12px', backgroundColor: 'var(--color-surface)', marginBottom: '10px' }} />
              <div style={{ height: '12px', width: '40%', backgroundColor: 'var(--color-surface)', marginBottom: '8px' }} />
              <div style={{ height: '12px', width: '70%', backgroundColor: 'var(--color-surface)' }} />
            </div>
          ))}
        </div>
      )}

      {!loading && filteredListings.length === 0 && (
        <p style={{ color: 'var(--color-gray)' }}>
          {filtersActive ? 'No listings match those filters.' : 'No listings yet. Be the first to sell something.'}
        </p>
      )}

      <div className="browse-grid">
        {filteredListings.map((listing) => {
          const photo = firstPhoto(listing)
          const seller = sellers[listing.user_id]
          const rating = ratings[listing.user_id]
          return (
            <div key={listing.id} className="tile">
            <Link href={`/listings/${listing.id}`} className="tile">
              <div className="tile-photo">
                {photo && <img src={photo} alt={listing.title} loading="lazy" />}
                {currentUserId === listing.user_id && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      backgroundColor: 'var(--color-black)',
                      color: 'var(--color-white)',
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      padding: '4px 8px',
                      borderRadius: '999px',
                    }}
                  >
                    Yours
                  </span>
                )}
              </div>
              <div style={{ fontWeight: 800, fontSize: '17px', color: 'var(--color-orange)', margin: '10px 0 2px 0' }}>
                {formatPrice(listing.price)}
              </div>
              <div className="tile-title" style={{ fontSize: '14px', fontWeight: 600, lineHeight: 1.3 }}>
                {listing.title}
              </div>
              {seller && seller.display_name && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '12px', color: 'var(--color-gray)' }}>
                  <Avatar url={seller.avatar_url} name={seller.display_name} size={18} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{seller.display_name}</span>
                  {rating && <Stars average={rating.average} count={rating.count} size={11} showCount={false} />}
                </div>
              )}
            </Link>
            {currentUserId !== listing.user_id &&
              (inAppItem(listing) ? (
                <button onClick={() => handleBuy(listing)} disabled={buyingId === listing.id} style={{ ...smallButton, opacity: buyingId === listing.id ? 0.6 : 1 }}>
                  {buyingId === listing.id ? 'Opening...' : 'Buy'}
                </button>
              ) : (
                <button onClick={() => (currentUserId ? router.push(`/messages/${listing.user_id}?small=1`) : router.push('/login'))} style={smallButton}>
                  Buy
                </button>
              ))}
            {buyErrors[listing.id] && (
              <p style={{ fontSize: '12px', color: '#B3261E', margin: '6px 0 0 0' }}>{buyErrors[listing.id]}</p>
            )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
