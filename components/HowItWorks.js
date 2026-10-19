// compact: one small quiet line for the top of the Browse page.
// full: one slim strip with the three steps, for the home page.
export default function HowItWorks({ compact = false }) {
  if (compact) {
    return (
      <p
        style={{
          margin: '-8px 0 20px 0',
          fontSize: '13px',
          color: 'var(--color-gray)',
        }}
      >
        Message seller. Meet up. Pay in person.
      </p>
    )
  }

  const steps = ['Message seller', 'Meet up', 'Pay in person']

  return (
    <section style={{ maxWidth: '1100px', margin: '8px auto 0 auto', padding: '0 24px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          padding: '4px 0',
          fontFamily: 'Inter, sans-serif',
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--color-black)',
          textAlign: 'center',
        }}
      >
        {steps.map((step, i) => (
          <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-orange)',
                color: 'var(--color-white)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              {i + 1}
            </span>
            {step}
          </div>
        ))}
      </div>
      <p style={{ margin: '10px 0 0 0', textAlign: 'center', fontSize: '13px', color: 'var(--color-gray)' }}>
        No checkout. You pay the student directly when you meet.
      </p>
    </section>
  )
}
