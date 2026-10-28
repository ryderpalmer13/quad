'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '../../../utils.supabase.mjs'
import Avatar from '../../../components/Avatar'
import Stars, { summarize } from '../../../components/Stars'

function when(value) {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function SellerPage() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [reviews, setReviews] = useState([])
  const [listings, setListings] = useState([])

  useEffect(() => {
    async function load() {
      const { data: p } = await supabase.from('profiles').select('id, display_name, avatar_url').eq('id', id).maybeSingle()
      setProfile(p || null)
      const { data: r } = await supabase
        .from('reviews')
        .select('seller_id, rating, comment, created_at')
        .eq('seller_id', id)
        .order('created_at', { ascending: false })
      setReviews(r || [])
      const { data: l } = await supabase
        .from('listings')
        .select('id, title, price, photo_url, photo_urls')
        .eq('user_id', id)
        .eq('sold', false)
        .order('created_at', { ascending: false })
      setListings(l || [])
      setLoading(false)
    }
    load()
  }, [id])

  const summary = summarize(reviews)[id]

  return (
    <div style={{ maxWidth: '640px', margin: '32px auto 120px auto', padding: '0 24px' }}>
      <Link href="/listings" style={{ fontSize: '13px', color: 'var(--color-gray)' }}>
        ‹ Browse
      </Link>

      {loading && <p style={{ color: 'var(--color-gray)', marginTop: '16px' }}>Loading...</p>}

      {!loading && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '18px 0 26px 0' }}>
            <Avatar url={profile ? profile.avatar_url : null} name={profile && profile.display_name ? profile.display_name : ''} size={64} />
            <div>
              <h1 style={{ fontSize: '28px', margin: '0 0 4px 0' }}>
                {profile && profile.display_name ? profile.display_name : 'Student seller'}
              </h1>
              <Stars average={summary ? summary.average : 0} count={summary ? summary.count : 0} size={16} />
            </div>
          </div>

          <h2 style={{ fontSize: '18px', margin: '0 0 12px 0' }}>Reviews</h2>
          {reviews.length === 0 && <p style={{ color: 'var(--color-gray)' }}>No reviews yet.</p>}
          {reviews.map((r, i) => (
            <div key={i} style={{ padding: '14px 0', borderBottom: '1px solid var(--color-hairline)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Stars average={r.rating} count={1} showCount={false} />
                <span style={{ fontSize: '12px', color: 'var(--color-gray)' }}>Verified buyer · {when(r.created_at)}</span>
              </div>
              {r.comment && <p style={{ margin: '8px 0 0 0', fontSize: '14px', lineHeight: 1.5 }}>{r.comment}</p>}
            </div>
          ))}

          <h2 style={{ fontSize: '18px', margin: '32px 0 12px 0' }}>Listings</h2>
          {listings.length === 0 && <p style={{ color: 'var(--color-gray)' }}>Nothing for sale right now.</p>}
          {listings.map((l) => {
            const photo = l.photo_urls && l.photo_urls.length > 0 ? l.photo_urls[0] : l.photo_url
            return (
              <Link
                key={l.id}
                href={`/listings/${l.id}`}
                style={{ display: 'flex', gap: '14px', alignItems: 'center', padding: '10px 0', color: 'var(--color-black)' }}
              >
                <div style={{ width: '56px', height: '56px', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--color-orange-light)', flex: 'none' }}>
                  {photo && <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                </div>
                <span style={{ flex: 1, fontWeight: 600 }}>{l.title}</span>
                <span style={{ color: 'var(--color-orange)', fontWeight: 700 }}>
                  {Number(l.price) === 0 ? 'Free' : '$' + Number(l.price).toFixed(2)}
                </span>
              </Link>
            )
          })}
        </>
      )}
    </div>
  )
}
