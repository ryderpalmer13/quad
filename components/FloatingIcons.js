const ICONS = [
  { name: 'Furniture', d: 'M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3 M3 13a2 2 0 0 1 4 0v2h10v-2a2 2 0 0 1 4 0v4H3z M6 17v2 M18 17v2' },
  { name: 'Textbooks', d: 'M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z' },
  { name: 'Electronics', d: 'M4 5h16v11H4z M2 19h20' },
  { name: 'Bikes', d: 'M5.5 14a3.5 3.5 0 1 0 0.01 0z M18.5 14a3.5 3.5 0 1 0 0.01 0z M15 6h-4l-3 8 M11 6l4 8 M9 4h3' },
  { name: 'Tickets', d: 'M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4z M14 7v10' },
  { name: 'Free stuff', d: 'M20 12v9H4v-9 M2 7h20v5H2z M12 21V7 M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7z M12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7z' },
]

// A cluster of bobbing category bubbles. Decorative only.
export default function FloatingIcons() {
  return (
    <div className="float-zone" aria-hidden="true">
      {ICONS.map((icon, i) => (
        <div
          key={icon.name}
          className={`bubble bubble-${i + 1}`}
          style={{ '--i': i }}
        >
          <svg
            viewBox="0 0 24 24"
            width="26"
            height="26"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={icon.d} />
          </svg>
        </div>
      ))}
    </div>
  )
}
