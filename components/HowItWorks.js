const STEPS = [
  { title: 'Message seller', text: 'Chat in the app to ask questions and set a time.' },
  { title: 'Meet up', text: 'Pick a public spot on campus and check the item in person.' },
  { title: 'Pay in person', text: 'Pay the seller directly. Agora U has no checkout.' },
]

// compact: one short line for the top of the Browse page.
// full: three numbered steps for the home page.
export default function HowItWorks({ compact = false }) {
  if (compact) {
    return (
      <p
        style={{
          margin: '0 0 24px 0',
          padding: '12px 16px',
          backgroundColor: 'var(--color-orange-light)',
          borderLeft: '3px solid var(--color-orange)',
          borderRadius: '4px',
          fontSize: '14px',
          lineHeight: 1.4,
          color: 'var(--color-black)',
        }}
      >
        <strong>Message seller. Meet up. Pay in person.</strong> There is no checkout, so you pay the
        student directly when you meet.
      </p>
    )
  }

  return (
    <section style={{ maxWidth: '1100px', margin: '24px auto 0 auto', padding: '0 24px' }}>
      <h2 style={{ fontSize: '28px', marginBottom: '20px' }}>How it works</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '16px',
        }}
      >
        {STEPS.map((step, i) => (
          <div
            key={step.title}
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-hairline)',
              borderRadius: '10px',
              padding: '20px',
            }}
          >
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-orange)',
                color: 'var(--color-white)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: '14px',
                marginBottom: '12px',
              }}
            >
              {i + 1}
            </div>
            <h3 style={{ fontSize: '18px', margin: '0 0 6px 0' }}>{step.title}</h3>
            <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.45, color: 'var(--color-gray)' }}>
              {step.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
