'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../utils.supabase.mjs'

export default function Home() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser()
      setLoggedIn(!!userData.user)

      const { data } = await supabase
        .from('listings')
        .select('*')
        .eq('sold', false)
        .order('created_at', { ascending: false })
        .limit(6)

      setListings(data || [])
      setLoading(false)
    }

    load()
  }, [])

  function firstPhoto(listing) {
    if (listing.photo_urls && listing.photo_urls.length > 0) return listing.photo_urls[0]
    return listing.photo_url
  }

  function formatPrice(value) {
    return Number(value) === 0 ? 'Free' : '$' + Number(value).toFixed(2)
  }

  const primaryButton = {
    flex: '1 1 220px',
    maxWidth: '280px',
    textAlign: 'center',
    backgroundColor: 'var(--color-orange)',
    color: 'var(--color-white)',
    padding: '16px 30px',
    borderRadius: '6px',
    fontFamily: "'Inter', sans-serif",
    fontSize: '16px',
    fontWeight: 600,
  }

  const secondaryButton = {
    flex: '1 1 220px',
    maxWidth: '280px',
    textAlign: 'center',
    border: '1.5px solid var(--color-orange)',
    backgroundColor: 'transparent',
    color: 'var(--color-orange)',
    padding: '14.5px 30px',
    borderRadius: '6px',
    fontFamily: "'Inter', sans-serif",
    fontSize: '16px',
    fontWeight: 600,
  }

  return (
    <div>
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '64px 24px 24px 24px' }}>
        <h1
          style={{
            fontSize: 'clamp(40px, 8vw, 72px)',
            fontWeight: 500,
            lineHeight: 1.05,
            letterSpacing: '-0.025em',
            maxWidth: '820px',
            marginBottom: '20px',
          }}
        >
          The campus marketplace{' '}
          <span style={{ color: 'var(--color-orange)' }}>you can actually trust.</span>
        </h1>
        <p
          style={{
            fontSize: '18px',
            lineHeight: 1.5,
            maxWidth: '520px',
            margin: '0 0 32px 0',
            color: 'var(--color-gray)',
          }}
        >
          Buy and sell furniture, textbooks and dorm essentials with students at your school.
          Every member is verified with a .edu email.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link href="/listings" style={primaryButton}>
            Browse listings
          </Link>
          {!loggedIn && (
            <Link href="/signup" style={secondaryButton}>
              Join with your .edu
            </Link>
          )}
        </div>
      </section>

      <section style={{ maxWidth: '1100px', margin: '48px auto', padding: '0 24px' }}>
        <h2 style={{ fontSize: '28px', marginBottom: '24px' }}>Recently listed</h2>

        {loading && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '20px',
            }}
          >
            {[1, 2, 3].map((n) => (
              <div key={n}>
                <div
                  style={{
                    height: '200px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-surface)',
                    marginBottom: '12px',
                  }}
                />
                <div style={{ height: '12px', width: '60%', backgroundColor: 'var(--color-surface)' }} />
              </div>
            ))}
          </div>
        )}

        {!loading && listings.length === 0 && (
          <p style={{ color: 'var(--color-gray)' }}>No listings yet. Be the first to post one.</p>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '20px',
          }}
        >
          {listings.map((listing) => (
            <Link
              key={listing.id}
              href="/listings"
              style={{
                color: 'var(--color-black)',
                display: 'block',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-hairline)',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              {firstPhoto(listing) && (
                <img
                  src={firstPhoto(listing)}
                  alt={listing.title}
                  style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }}
                />
              )}
              <div style={{ padding: '14px 16px 16px 16px' }}>
                <p style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 6px 0' }}>
                  {listing.title}
                </p>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '18px',
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    color: 'var(--color-orange)',
                    margin: 0,
                  }}
                >
                  {formatPrice(listing.price)}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {listings.length > 0 && (
          <div style={{ marginTop: '32px' }}>
            <Link
              href="/listings"
              style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-orange)' }}
            >
              See all listings
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
