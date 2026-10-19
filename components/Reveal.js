'use client'

import { useEffect, useRef, useState } from 'react'

// Fades its content in (and starts any animations inside it) once it scrolls into view.
export default function Reveal({ children, className = '', style }) {
  const ref = useRef(null)
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setSeen(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={`reveal ${seen ? 'in' : ''} ${className}`} style={style}>
      {children}
    </div>
  )
}
