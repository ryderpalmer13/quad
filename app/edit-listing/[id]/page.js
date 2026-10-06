'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../utils.supabase.mjs'

const CATEGORIES = ['Furniture', 'Textbooks', 'Electronics', 'Clothing', 'Dorm & Decor', 'Other']
const CONDITIONS = ['New', 'Like New', 'Good', 'Used', 'Well Loved']

export default function EditListingPage() {
  const params = useParams()
  const router = useRouter()
  const listingId = params.id

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [condition, setCondition] = useState(CONDITIONS[0])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadListing() {
      const { data: userData } = await supabase.auth.getUser()

      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', listingId)
        .single()

      if (error || !data) {
        setMessage('Listing not found.')
        setLoading(false)
        return
      }

      if (!userData.user || userData.user.id !== data.user_id) {
        setMessage('You can only edit your own listings.')
        setLoading(false)
        return
      }

      setTitle(data.title)
      setDescription(data.description)
      setPrice(data.price)
      setCategory(data.category || CATEGORIES[0])
      setCondition(data.condition || CONDITIONS[0])
      setLoading(false)
    }

    loadListing()
  }, [listingId])

  async function handleSave(e) {
    e.preventDefault()
    setMessage('')
    setSaving(true)

    const { error } = await supabase
      .from('listings')
      .update({
        title: title,
        description: description,
        price: price,
        category: category,
        condition: condition,
      })
      .eq('id', listingId)

    setSaving(false)

    if (error) {
      setMessage(error.message)
    } else {
      router.push('/listings')
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm('Delete this listing? This cannot be undone.')
    if (!confirmed) return

    const { error } = await supabase.from('listings').delete().eq('id', listingId)

    if (error) {
      setMessage(error.message)
    } else {
      router.push('/listings')
    }
  }

  const labelStyle = {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    color: 'var(--color-gray)',
    display: 'block',
    marginBottom: '8px',
  }
  const inputStyle = {
    width: '100%',
    padding: '10px 0',
    border: 'none',
    borderBottom: '2px solid var(--color-hairline)',
    fontFamily: 'Inter, sans-serif',
    fontSize: '15px',
    outline: 'none',
    backgroundColor: 'transparent',
  }

  return (
    <div style={{ maxWidth: '440px', margin: '48px auto', padding: '0 24px' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '32px' }}>Edit Listing</h1>

      {loading && <p>Loading...</p>}

      {!loading && title !== '' && (
        <form onSubmit={handleSave}>
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: '24px', display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={inputStyle}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                style={inputStyle}
              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: '32px' }}>
            <label style={labelStyle}>Price</label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            style={{
              backgroundColor: 'var(--color-orange)',
              color: 'var(--color-white)',
              border: 'none',
              padding: '14px 24px',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              cursor: saving ? 'not-allowed' : 'pointer',
              width: '100%',
              opacity: saving ? 0.6 : 1,
              marginBottom: '16px',
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            style={{
              background: 'none',
              border: '2px solid var(--color-black)',
              color: 'var(--color-black)',
              padding: '12px 24px',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            Delete Listing
          </button>
        </form>
      )}

      {message && <p style={{ marginTop: '16px', fontSize: '14px' }}>{message}</p>}
    </div>
  )
}