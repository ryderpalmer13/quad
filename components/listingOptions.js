export const CATEGORIES = [
  'Furniture',
  'Textbooks',
  'Electronics',
  'Appliances',
  'Clothing',
  'Dorm & Decor',
  'Bikes & Scooters',
  'Sports & Outdoors',
  'Tickets',
  'Free Stuff',
  'Other',
]

// value is what gets saved and shown on the listing card. label and hint are what the seller sees in the menu.
export const CONDITIONS = [
  { value: 'New', label: 'New', hint: 'never used' },
  { value: 'Like New', label: 'Like new', hint: 'barely used, no wear' },
  { value: 'Good', label: 'Good', hint: 'used, minor wear' },
  { value: 'Fair', label: 'Fair', hint: 'visible wear, works fine' },
  { value: 'Well Worn', label: 'Well worn', hint: 'heavy wear, still works' },
]

export const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({ value: c, label: c }))

// Older listings used different words. This keeps them showing correctly when edited.
export function normalizeCondition(value) {
  if (value === 'Used') return 'Fair'
  if (value === 'Well Loved') return 'Well Worn'
  return CONDITIONS.some((c) => c.value === value) ? value : CONDITIONS[0].value
}
