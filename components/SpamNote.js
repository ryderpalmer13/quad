// Shown after we send an email, because some school mail systems put new senders in Junk.
export default function SpamNote({ children }) {
  return (
    <div
      role="status"
      style={{
        marginTop: '20px',
        padding: '16px',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-hairline)',
        borderLeft: '4px solid var(--color-orange)',
        borderRadius: '6px',
        fontSize: '14px',
        lineHeight: 1.5,
      }}
    >
      <p style={{ margin: '0 0 8px 0', fontWeight: 600 }}>{children}</p>
      <p style={{ margin: 0, color: 'var(--color-gray)' }}>
        Check your <strong>Junk or Spam folder</strong> too. School email systems sometimes put
        new senders there. If you find it, mark it <strong>Not junk</strong> so future emails
        reach your inbox.
      </p>
    </div>
  )
}
