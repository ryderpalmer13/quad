// Shows a star rating. average is a number like 4.6, count is how many reviews.
export default function Stars({ average, count, size = 14, showCount = true }) {
  if (!count) {
    return <span style={{ fontSize: `${size - 1}px`, color: 'var(--color-gray)' }}>New seller</span>
  }
  const rounded = Math.round(average)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: `${size - 1}px`, color: 'var(--color-gray)' }}>
      <span style={{ color: 'var(--color-orange)', fontSize: `${size}px`, letterSpacing: '1px' }} aria-label={`${average.toFixed(1)} out of 5`}>
        {'★'.repeat(rounded)}
        <span style={{ opacity: 0.3 }}>{'★'.repeat(5 - rounded)}</span>
      </span>
      <span>
        {average.toFixed(1)}
        {showCount ? ` (${count})` : ''}
      </span>
    </span>
  )
}

// Turns a list of review rows into { sellerId: { average, count } }.
export function summarize(rows) {
  const totals = {}
  ;(rows || []).forEach((r) => {
    const t = totals[r.seller_id] || { sum: 0, count: 0 }
    t.sum += r.rating
    t.count += 1
    totals[r.seller_id] = t
  })
  const out = {}
  Object.keys(totals).forEach((id) => {
    out[id] = { average: totals[id].sum / totals[id].count, count: totals[id].count }
  })
  return out
}
