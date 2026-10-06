'use client'

import { useState } from 'react'
import { supabase } from '../../utils.supabase.mjs'

const CATEGORIES = ['Furniture', 'Textbooks', 'Electronics', 'Clothing', 'Dorm & Decor', 'Other']
const CONDITIONS = ['New', 'Like New', 'Good', 'Used', 'Well Loved']
const MAX_PHOTOS = 4
const MAX_DIMENSION = 1600
const MAX_BYTES = 5 * 1024 * 1024

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('the browser could not read this image'))
    }
    img.src = url
  })
}

async function shrinkToJpeg(file) {
  const img = await loadImage(file)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight))
  const width = Math.round(img.naturalWidth * scale)
  const height = Math.round(img.naturalHeight * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(img, 0, 0, width, height)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('the photo could not be converted'))),
      'image/jpeg',
      0.85
    )
  })
}

export default function NewListingPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [condition, setCondition] = useState(CONDITIONS[0])
  const [photos, setPhotos] = useState([])
  const [photoMessage, setPhotoMessage] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [processing, setProcessing] = useState(false)

  async function handlePhotoChange(e) {
    const input = e.target
    const chosen = Array.from(input.files || [])
    if (chosen.length === 0) return

    setPhotoMessage('')

    const room = MAX_PHOTOS - photos.length
    if (room <= 0) {
      setPhotoMessage(`You can add up to ${MAX_PHOTOS} photos.`)
      input.value = ''
      return
    }

    const toAdd = chosen.slice(0, room)
    const notes = []
    if (chosen.length > room) {
      notes.push(`Only ${MAX_PHOTOS} photos allowed, so some were skipped.`)
    }

    setProcessing(true)
    const added = []

    try {
      for (const file of toAdd) {
        try {
          const blob = await shrinkToJpeg(file)
          added.push({
            id: `${Date.now()}-${Math.random()}`,
            blob: blob,
            previewUrl: URL.createObjectURL(blob),
          })
        } catch (err) {
          const usable = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
          if (usable && file.size <= MAX_BYTES) {
            added.push({
              id: `${Date.now()}-${Math.random()}`,
              blob: file,
              previewUrl: URL.createObjectURL(file),
            })
          } else {
            notes.push(`Couldn't add a photo: ${err.message}.`)
          }
        }
      }
    } catch (err) {
      notes.push(`Something went wrong: ${err.message}`)
    }

    setPhotos((current) => [...current, ...added])
    setPhotoMessage(notes.join(' '))
    setProcessing(false)
    input.value = ''
  }

  function removePhoto(id) {
    const target = photos.find((p) => p.id === id)
    if (target) URL.revokeObjectURL(target.previewUrl)
    setPhotos(photos.filter((p) => p.id !== id))
  }

  async function handleCreateListing(e) {
    e.preventDefault()
    setMessage('')

    if (photos.length === 0) {
      setMessage('Please add at least one photo before posting.')
      return
    }

    setSubmitting(true)

    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) {
      setMessage('You must be logged in to post a listing.')
      setSubmitting(false)
      return
    }

    const photoUrls = []

    for (let i = 0; i < photos.length; i++) {
      const blob = photos[i].blob
      const ext = (blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')
      const fileName = `${userData.user.id}-${Date.now()}-${i}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('listing-photos')
        .upload(fileName, blob, { contentType: blob.type || 'image/jpeg' })

      if (uploadError) {
        setMessage(uploadError.message)
        setSubmitting(false)
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from('listing-photos')
        .getPublicUrl(fileName)

      photoUrls.push(publicUrlData.publicUrl)
    }

    const { error } = await supabase.from('listings').insert({
      title: title,
      description: description,
      price: price,
      category: category,
      condition: condition,
      user_id: userData.user.id,
      photo_url: photoUrls[0],
      photo_urls: photoUrls,
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Listing posted!')
      setTitle('')
      setDescription('')
      setPrice('')
      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl))
      setPhotos([])
    }

    setSubmitting(false)
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
      <h1 style={{ fontSize: '28px', marginBottom: '32px' }}>Sell an Item</h1>
      <form onSubmit={handleCreateListing}>
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
        <div style={{ marginBottom: '24px' }}>
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

        <div style={{ marginBottom: '32px' }}>
          <label style={labelStyle}>
            Photos ({photos.length}/{MAX_PHOTOS})
          </label>

          {photos.length > 0 && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {photos.map((photo) => (
                <div key={photo.id} style={{ position: 'relative', width: '80px', height: '80px' }}>
                  <img
                    src={photo.previewUrl}
                    alt="Selected photo"
                    style={{ width: '80px', height: '80px', objectFit: 'cover', display: 'block' }}
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(photo.id)}
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      width: '22px',
                      height: '22px',
                      borderRadius: '11px',
                      border: 'none',
                      backgroundColor: 'var(--color-black)',
                      color: 'var(--color-white)',
                      fontSize: '13px',
                      lineHeight: '22px',
                      padding: 0,
                      cursor: 'pointer',
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {photos.length < MAX_PHOTOS && (
            <>
              <label
                htmlFor="photo-input"
                style={{
                  display: 'inline-block',
                  border: '2px solid var(--color-orange)',
                  color: 'var(--color-orange)',
                  padding: '10px 18px',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                {processing ? 'Processing...' : photos.length === 0 ? 'Add Photo' : 'Add Another'}
              </label>
              <input
                id="photo-input"
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoChange}
                style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, overflow: 'hidden' }}
              />
            </>
          )}

          {photoMessage && (
            <p style={{ fontSize: '13px', color: '#B00020', marginTop: '10px' }}>{photoMessage}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || processing}
          style={{
            backgroundColor: 'var(--color-orange)',
            color: 'var(--color-white)',
            border: 'none',
            padding: '14px 24px',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            cursor: submitting || processing ? 'not-allowed' : 'pointer',
            width: '100%',
            opacity: submitting || processing ? 0.6 : 1,
          }}
        >
          {submitting ? 'Posting...' : 'Post Listing'}
        </button>
      </form>
      {message && <p style={{ marginTop: '16px', fontSize: '14px' }}>{message}</p>}
    </div>
  )
}