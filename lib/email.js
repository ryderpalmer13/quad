// Sends an email through Brevo. If no key is set, or Brevo is down, it logs and moves on,
// so an email problem can never break a purchase or a message.
export async function sendEmail({ to, subject, html, text }) {
  const key = process.env.BREVO_API_KEY
  if (!key || !to) {
    console.log('email skipped (no key or no address):', subject)
    return false
  }
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': key, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { name: 'Agora U', email: 'hello@agorau.app' },
        to: [{ email: to }],
        replyTo: { email: 'hello@agorau.app', name: 'Agora U' },
        subject,
        htmlContent: html,
        textContent: text,
      }),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) {
      console.error('brevo send failed:', res.status, await res.text())
      return false
    }
    return true
  } catch (err) {
    console.error('brevo send error:', err.message)
    return false
  }
}

export const SITE = 'https://agorau.app'

export function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// One simple branded layout for every email.
export function layout({ heading, paragraphs, buttonLabel, buttonUrl, footer }) {
  const body = paragraphs
    .map((p) => `<p style="margin:0 0 14px 0;font-size:15px;line-height:1.6;color:#3B2A20;">${p}</p>`)
    .join('')
  const button = buttonUrl
    ? `<p style="margin:22px 0 6px 0;"><a href="${esc(buttonUrl)}" style="background:#B45A20;color:#ffffff;text-decoration:none;padding:13px 22px;border-radius:8px;font-weight:600;font-size:15px;display:inline-block;">${esc(buttonLabel)}</a></p>`
    : ''
  return `<!doctype html><html><body style="margin:0;padding:0;background:#F3EEE5;">
<div style="max-width:520px;margin:0 auto;padding:28px 20px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;">
<div style="font-size:22px;font-weight:700;color:#B45A20;letter-spacing:1px;margin-bottom:18px;">AGORA U</div>
<div style="background:#FAF7F1;border:1px solid #E3DACB;border-radius:12px;padding:24px;">
<h1 style="margin:0 0 14px 0;font-size:21px;color:#3B2A20;">${heading}</h1>
${body}${button}
</div>
<p style="font-size:12px;color:#8B7B6C;margin:16px 4px 0 4px;line-height:1.5;">${footer || 'Agora U, the campus marketplace for verified students.'}</p>
</div></body></html>`
}
