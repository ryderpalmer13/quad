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
    return Number(value).toFixed(2)
  }

  return (
    <div>
      <section
        style={{
          backgroundColor: 'var(--color-orange)',
          color: 'var(--color-white)',
          padding: '72px 24px',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: '44px', fontWeight: 800, lineHeight: 1.1, marginBottom: '16px' }}>
          Buy and sell with students at UT.
        </h1>
        <p style={{ fontSize: '16px', maxWidth: '480px', margin: '0 auto 32px auto', opacity: 0.95 }}>
          Furniture, textbooks, dorm stuff. Verified students only, so you know who you're dealing
          with.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/listings"
            style={{
              backgroundColor: 'var(--color-white)',
              color: 'var(--color-orange)',
              padding: '14px 28px',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}
          >
            Browse Listings
          </Link>
          {!loggedIn && (
            <Link
              href="/signup"
              style={{
                border: '2px solid var(--color-white)',
                color: 'var(--color-white)',
                padding: '12px 28px',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}
            >
              Join with your .edu
            </Link>
          )}
        </div>
      </section>

      <section style={{ maxWidth: '1100px', margin: '56px auto', padding: '0 24px' }}>
        <h2 style={{ fontSize: '22px', marginBottom: '24px' }}>Just listed</h2>

        {loading && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '24px',
            }}
          >
            {[1, 2, 3].map((n) => (
              <div key={n}>
                <div style={{ height: '180px', backgroundColor: '#F0F0F0', marginBottom: '10px' }} />
                <div style={{ height: '12px', width: '60%', backgroundColor: '#F0F0F0' }} />
              </div>
            ))}
          </div>
        )}

        {!loading && listings.length === 0 && <p>No listings yet. Be the first to post one.</p>}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '24px',
          }}
        >
          {listings.map((listing) => (
            <Link
              key={listing.id}
              href="/listings"
              style={{ color: 'var(--color-black)', display: 'block' }}
            >
              {firstPhoto(listing) && (
                <img
                  src={firstPhoto(listing)}
                  alt={listing.title}
                  style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
                />
              )}
              <p style={{ fontSize: '14px', fontWeight: 600, margin: '10px 0 4px 0' }}>
                {listing.title}
              </p>
              <p style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-orange)', margin: 0 }}>
                ${formatPrice(listing.price)}
              </p>
            </Link>
          ))}
        </div>

        {listings.length > 0 && (
          <div style={{ marginTop: '32px' }}>
            <Link
              href="/listings"
              style={{ fontSize: '13px', color: 'var(--color-black)', textDecoration: 'underline' }}
            >
              See all listings
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}