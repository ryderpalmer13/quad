'use client'

import { useState, useEffect, Fragment } from 'react'
import Link from 'next/link'
import { supabase } from '../utils.supabase.mjs'
import HowItWorks from '../components/HowItWorks'
import { CATEGORIES } from '../components/listingOptions'
import FloatingIcons from '../components/FloatingIcons'
import Reveal from '../components/Reveal'

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


  return (
    <div>
      <div className="hero-wrap">
      <div className="hero-glow" />
      <section
        style={{
          position: 'relative',
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '64px 24px 24px 24px',
        }}
      >
        <h1
          style={{
            fontSize: 'clamp(42px, 9vw, 76px)',
            fontWeight: 500,
            lineHeight: 1.05,
            letterSpacing: '-0.025em',
            maxWidth: '820px',
            marginBottom: '22px',
          }}
        >
          {['The', 'campus', 'marketplace'].map((w, i) => (
            <Fragment key={w}>
              <span className="word-mask">
                <span className="word-in" style={{ '--d': `${0.05 + i * 0.1}s` }}>
                  {w}
                </span>
              </span>{' '}
            </Fragment>
          ))}
          {['you', 'can', 'actually'].map((w, i) => (
            <Fragment key={w}>
              <span className="word-mask" style={{ color: 'var(--color-orange)' }}>
                <span className="word-in" style={{ '--d': `${0.4 + i * 0.1}s` }}>
                  {w}
                </span>
              </span>{' '}
            </Fragment>
          ))}
          <span className="word-mask" style={{ color: 'var(--color-orange)', position: 'relative' }}>
            <span className="word-in" style={{ '--d': '0.7s' }}>
              trust.
            </span>
            <svg className="squiggle" viewBox="0 0 100 10" preserveAspectRatio="none">
              <path d="M1 6 Q 13 0 25 5 T 50 5 T 75 5 T 99 4" />
            </svg>
          </span>
        </h1>
        <p
          className="rise"
          style={{
            '--d': '0.95s',
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
        {!loggedIn && (
          <div className="rise" style={{ '--d': '1.1s', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link href="/signup" className="press shimmer" style={primaryButton}>
              Join with your .edu
            </Link>
          </div>
        )}

        <div className="rise" style={{ '--d': '1.25s' }}>
          <FloatingIcons />
        </div>
      </section>
      </div>

      <div className="marquee-wrap" aria-hidden="true">
        <div className="marquee">
          <div className="marquee-track">
            {[0, 1].map((n) => (
              <div className="marquee-set" key={n}>
                {CATEGORIES.map((c) => (
                  <span key={c} className="marquee-item">
                    {c}
                    <i />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>


      <HowItWorks />

      <section style={{ maxWidth: '1100px', margin: '48px auto', padding: '0 24px' }}>
        <Reveal>
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
              className="press"
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
        </Reveal>
      </section>

      <section className="verified">
        <Reveal className="verified-inner">
          <svg className="check-draw" viewBox="0 0 64 64" width="72" height="72" fill="none">
            <circle cx="32" cy="32" r="28" />
            <path d="M19 33 L29 43 L46 23" />
          </svg>
          <h2>Verified students only.</h2>
          <p>Every member signs up with a .edu email, so you only ever meet real students from your campus.</p>
        </Reveal>
      </section>
    </div>
  )
}
