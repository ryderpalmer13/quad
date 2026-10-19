'use client'

import Reveal from './Reveal'

// compact: one small quiet line for the top of the Browse page.
// full: the three steps for the home page, animated when scrolled into view.
export default function HowItWorks({ compact = false }) {
  if (compact) {
    return (
      <p style={{ margin: '-8px 0 20px 0', fontSize: '13px', color: 'var(--color-gray)' }}>
        Message seller. Meet up. Pay in person.
      </p>
    )
  }

  const steps = ['Message seller', 'Meet up', 'Pay in person']

  return (
    <section style={{ maxWidth: '1100px', margin: '56px auto 0 auto', padding: '0 24px' }}>
      <Reveal className="hiw">
        <div style={{ position: 'relative', padding: '4px 0' }}>
          <div className="hiw-line" />
          <div
            style={{
              position: 'relative',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--color-black)',
              textAlign: 'center',
            }}
          >
            {steps.map((step, i) => (
              <div
                key={step}
                className="rise"
                style={{
                  '--d': `${0.2 + i * 0.35}s`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <span
                  className="pop step-num"
                  style={{
                    '--d': `${0.3 + i * 0.35}s`,
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-orange)',
                    color: 'var(--color-white)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Fraunces, serif',
                    fontSize: '19px',
                    fontWeight: 600,
                    boxShadow: '0 0 0 6px var(--color-white)',
                  }}
                >
                  {i + 1}
                </span>
                {step}
              </div>
            ))}
          </div>
        </div>
        <p
          className="rise"
          style={{
            '--d': '1.4s',
            margin: '18px 0 0 0',
            textAlign: 'center',
            fontSize: '13px',
            color: 'var(--color-gray)',
          }}
        >
          No checkout. You pay the student directly when you meet.
        </p>
      </Reveal>
    </section>
  )
}
