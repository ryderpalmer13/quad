import { createClient } from '@supabase/supabase-js'
import ListingDetail from '../../../components/ListingDetail'

export const dynamic = 'force-dynamic'

async function loadListing(id) {
  try {
    const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const { data } = await client.from('listings').select('*').eq('id', id).maybeSingle()
    return data || null
  } catch (e) {
    return null
  }
}

function firstPhoto(listing) {
  if (!listing) return null
  if (listing.photo_urls && listing.photo_urls.length > 0) return listing.photo_urls[0]
  return listing.photo_url || null
}

// This is what shows up when the link is texted or posted: the title, price and first photo.
export async function generateMetadata({ params }) {
  const { id } = await params
  const listing = await loadListing(id)
  const base = new URL('https://agorau.app')
  if (!listing) return { metadataBase: base, title: 'Listing | Agora U' }

  const price = Number(listing.price) === 0 ? 'Free' : '$' + Number(listing.price).toFixed(2)
  const title = `${listing.title} · ${price} | Agora U`
  const description = String(listing.description || 'For sale on Agora U, the campus marketplace for verified students.').slice(0, 160)
  const photo = firstPhoto(listing)

  return {
    metadataBase: base,
    title,
    description,
    openGraph: { title, description, url: `/listings/${id}`, siteName: 'Agora U', images: photo ? [photo] : undefined },
    twitter: { card: photo ? 'summary_large_image' : 'summary', title, description, images: photo ? [photo] : undefined },
  }
}

export default async function ListingPage({ params }) {
  const { id } = await params
  const listing = await loadListing(id)
  return <ListingDetail id={id} initial={listing} />
}
