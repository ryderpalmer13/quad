import Link from 'next/link'

// Shared layout for the Terms and Privacy pages.
export default function LegalPage({ title, updated, intro, sections }) {
  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '48px 24px 120px 24px' }}>
      <h1 style={{ fontSize: '34px', margin: '0 0 8px 0' }}>{title}</h1>
      <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: 'var(--color-gray)' }}>
        Last updated {updated}
      </p>
      <p style={{ fontSize: '16px', lineHeight: 1.6, margin: '0 0 32px 0' }}>{intro}</p>

      {sections.map((section, i) => (
        <section key={section.heading} style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', margin: '0 0 10px 0' }}>
            {i + 1}. {section.heading}
          </h2>
          {section.paragraphs.map((text, n) => (
            <p key={n} style={{ fontSize: '15px', lineHeight: 1.65, margin: '0 0 10px 0', color: 'var(--color-black)' }}>
              {text}
            </p>
          ))}
          {section.bullets && (
            <ul style={{ margin: '0 0 6px 0', paddingLeft: '20px' }}>
              {section.bullets.map((b) => (
                <li key={b} style={{ fontSize: '15px', lineHeight: 1.65, marginBottom: '4px' }}>
                  {b}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid var(--color-hairline)', fontSize: '14px' }}>
        <Link href="/terms" style={{ color: 'var(--color-orange)', fontWeight: 600, marginRight: '20px' }}>
          Terms of Service
        </Link>
        <Link href="/privacy" style={{ color: 'var(--color-orange)', fontWeight: 600 }}>
          Privacy Policy
        </Link>
      </div>
    </div>
  )
}
