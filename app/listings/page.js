'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../utils.supabase.mjs'

const CATEGORIES = ['All', 'Furniture', 'Textbooks', 'Electronics', 'Clothing', 'Dorm & Decor', 'Other']

function PhotoCarousel({ photos, alt }) {
  const [index, setIndex] = useState(0)

  if (!photos || photos.length === 0) return null

  const multiple = photos.length > 1

  function prev(e) {
    e.preventDefault()
    setIndex((index - 1 + photos.length) % photos.length)
  }

  function next(e) {
    e.preventDefault()
    setIndex((index + 1) % photos.length)
  }

  const arrowStyle = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    backgroundColor: 'rgba(255,255,255,0.9)',
    border: 'none',
    width: '32px',
    height: '32px',
    borderRadius: '16px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 700,
  }

  return (
    <div
      className="carousel"
      style={{
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'var(--color-orange-light)',
      }}
    >
      <img
        src={photos[index]}
        alt={alt}
        className="listing-photo"
        style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }}
      />
      {multiple && (
        <>
          <button className="carousel-arrow" onClick={prev} style={{ ...arrowStyle, left: '8px' }}>
            ‹
          </button>
          <button className="carousel-arrow" onClick={next} style={{ ...arrowStyle, right: '8px' }}>
            ›
          </button>
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            {photos.map((_, i) => (
              <span
                key={i}
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: i === index ? 'var(--color-orange)' : 'rgba(255,255,255,0.8)',
                }}
              />
            ))}
          </div>
        </>
      )}
      <style jsx>{`
        .carousel-arrow {
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .carousel:hover .carousel-arrow {
          opacity: 1;
        }
      `}</style>
    </div>
  )
}

export default function ListingsPage() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [currentUserId, setCurrentUserId] = useState(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchListings() {
      const { data: userData } = await supabase.auth.getUser()
      if (userData.user) {
        setCurrentUserId(userData.user.id)
      }

      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('sold', false)
        .order('created_at', { ascending: false })

      if (!error) {
        setListings(data)
      }
      setLoading(false)
    }

    fetchListings()
  }, [])

  const filteredListings = listings.filter((listing) => {
    const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'All' || listing.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  function getPhotos(listing) {
    if (listing.photo_urls && listing.photo_urls.length > 0) return listing.photo_urls
    if (listing.photo_url) return [listing.photo_url]
    return []
  }

  function formatPrice(value) {
    return Number(value).toFixed(2)
  }

  function handleMessageSeller(sellerId) {
    if (!currentUserId) {
      router.push('/login')
      return
    }
    router.push(`/messages/${sellerId}`)
  }

  async function handleMarkSold(listingId) {
    const { error } = await supabase
      .from('listings')
      .update({ sold: true })
      .eq('id', listingId)

    if (!error) {
      setListings(listings.filter((listing) => listing.id !== listingId))
    }
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '48px auto', padding: '0 24px' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '24px', color: 'var(--color-black)' }}>
        Browse Listings
      </h1>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', alignItems: 'flex-end' }}>
        <input
          type="text"
          placeholder="Search listings..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flexGrow: 1,
            padding: '14px',
            fontSize: '14px',
            border: 'none',
            borderBottom: '2px solid var(--color-hairline)',
            fontFamily: 'Inter, sans-serif',
            outline: 'none',
          }}
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            padding: '14px 8px',
            fontSize: '14px',
            border: 'none',
            borderBottom: '2px solid var(--color-hairline)',
            fontFamily: 'Inter, sans-serif',
            outline: 'none',
            backgroundColor: 'transparent',
          }}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c === 'All' ? 'All Categories' : c}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '32px',
          }}
        >
          {[1, 2, 3].map((n) => (
            <div key={n}>
              <div style={{ height: '220px', backgroundColor: '#F0F0F0', marginBottom: '12px' }} />
              <div style={{ height: '10px', width: '60%', backgroundColor: '#F0F0F0', marginBottom: '8px' }} />
              <div style={{ height: '14px', width: '40%', backgroundColor: '#F0F0F0' }} />
            </div>
          ))}
        </div>
      )}

      {!loading && filteredListings.length === 0 && <p>No listings found.</p>}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '32px',
        }}
      >
        {filteredListings.map((listing) => (
          <div key={listing.id} className="listing-card">
            <PhotoCarousel photos={getPhotos(listing)} alt={listing.title} />
            <p
              style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                color: 'var(--color-orange)',
                margin: '14px 0 4px 0',
              }}
            >
              {listing.category || 'For Sale'}
              {listing.condition ? ` · ${listing.condition}` : ''}
            </p>
            <h2 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 6px 0' }}>
              {listing.title}
            </h2>
            <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '13px' }}>
              {listing.description}
            </p>
            <div
              style={{
                borderTop: '1px solid var(--color-hairline)',
                paddingTop: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontWeight: 800, fontSize: '18px', color: 'var(--color-orange)' }}>
                ${formatPrice(listing.price)}
              </span>
              {currentUserId === listing.user_id ? (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    color: 'var(--color-gray)',
                  }}
                >
                  Your listing
                </span>
              ) : (
                <button
                  onClick={() => handleMessageSeller(listing.user_id)}
                  style={{
                    backgroundColor: 'var(--color-orange)',
                    color: 'var(--color-white)',
                    border: 'none',
                    padding: '10px 18px',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  Message Seller
                </button>
              )}
            </div>
            {currentUserId === listing.user_id && (
              <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                <Link
                  href={`/edit-listing/${listing.id}`}
                  style={{ fontSize: '12px', color: 'var(--color-black)', textDecoration: 'underline' }}
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleMarkSold(listing.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontSize: '12px',
                    color: 'var(--color-black)',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                  }}
                >
                  Mark as sold
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        .listing-card {
          animation: fadeIn 0.4s ease;
        }
        .listing-card:hover .listing-photo {
          transform: scale(1.05);
        }
        .listing-photo {
          transition: transform 0.3s ease;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}