// Round profile picture. Shows the photo if there is one, otherwise initials.
export default function Avatar({ url, name, size = 40 }) {
  const letters = (name || '?')
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

  const base = {
    width: size,
    height: size,
    borderRadius: '50%',
    flex: 'none',
    display: 'block',
  }

  if (url) {
    return <img src={url} alt="" style={{ ...base, objectFit: 'cover' }} />
  }

  return (
    <span
      aria-hidden="true"
      style={{
        ...base,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-orange-light)',
        color: 'var(--color-orange)',
        fontFamily: "'Fraunces', serif",
        fontWeight: 600,
        fontSize: Math.round(size * 0.38),
      }}
    >
      {letters}
    </span>
  )
}
