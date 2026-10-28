import { getAdmin } from './supabaseAdmin'
import { sendEmail, layout, esc, SITE } from './email'
import { dollars } from './payments'

async function person(admin, id) {
  if (!id) return null
  const { data } = await admin.auth.admin.getUserById(id)
  const email = data && data.user ? data.user.email : null
  const { data: profile } = await admin.from('profiles').select('display_name').eq('id', id).maybeSingle()
  return { id, email, name: (profile && profile.display_name) || 'the other student' }
}

function send(to, subject, content, url, label) {
  const html = layout({ heading: content.heading, paragraphs: content.paragraphs, buttonLabel: label, buttonUrl: url })
  const text = content.paragraphs.join('\n\n').replace(/<[^>]+>/g, '')
  return sendEmail({ to, subject, html, text })
}

// Emails both people about an order event. Never throws.
// events: paid, completed, cancelled (extra.by = 'buyer' | 'seller'), expired, disputed (extra.reason, extra.byId)
export async function notifyOrder(order, event, extra = {}) {
  try {
    const admin = getAdmin()
    const [buyer, seller] = await Promise.all([person(admin, order.buyer_id), person(admin, order.seller_id)])
    const url = `${SITE}/orders/${order.id}`
    const title = esc(order.listing_title)
    const price = dollars(order.amount_cents)
    const payout = dollars(order.amount_cents - order.fee_cents)
    const jobs = []

    if (event === 'paid') {
      if (seller) {
        jobs.push(
          send(seller.email, `${buyer ? buyer.name : 'Someone'} bought your ${order.listing_title}`, {
            heading: 'You made a sale',
            paragraphs: [
              `${esc(buyer ? buyer.name : 'A student')} bought <strong>${title}</strong> for ${price}. The money is held safely.`,
              `Message them to set up a meetup. When you hand over the item, ask for their 6 digit code and enter it in the app. You will be paid ${payout}.`,
            ],
          }, url, 'Open the order')
        )
      }
      if (buyer) {
        jobs.push(
          send(buyer.email, `Your payment for ${order.listing_title} is held safely`, {
            heading: 'Payment received',
            paragraphs: [
              `You paid ${price} for <strong>${title}</strong>. ${esc(seller ? seller.name : 'The seller')} only gets paid after you meet and give them your code.`,
              'Your 6 digit meetup code is on the order page. Only share it once the item is in your hands.',
            ],
          }, url, 'See your code')
        )
      }
    }

    if (event === 'completed') {
      if (seller) {
        jobs.push(
          send(seller.email, `You were paid ${payout} for ${order.listing_title}`, {
            heading: 'You got paid',
            paragraphs: [`The handoff for <strong>${title}</strong> is confirmed. ${payout} is on its way to your bank account.`],
          }, url, 'View order')
        )
      }
      if (buyer) {
        jobs.push(
          send(buyer.email, `Order complete: ${order.listing_title}`, {
            heading: 'All done',
            paragraphs: [`Your order for <strong>${title}</strong> is complete. Enjoy it!`],
          }, url, 'View order')
        )
      }
    }

    if (event === 'cancelled' || event === 'expired') {
      const why =
        event === 'expired'
          ? 'The handoff did not happen within 14 days, so the order was cancelled automatically.'
          : extra.by === 'seller'
            ? 'The seller cancelled the order.'
            : 'The buyer cancelled the order.'
      if (buyer) {
        jobs.push(
          send(buyer.email, `Refund for ${order.listing_title}`, {
            heading: 'You were refunded',
            paragraphs: [`${why} Your ${price} is being returned to your card. It can take a few days to show up.`],
          }, url, 'View order')
        )
      }
      if (seller) {
        jobs.push(
          send(seller.email, `Order cancelled: ${order.listing_title}`, {
            heading: 'Order cancelled',
            paragraphs: [`${why} <strong>${title}</strong> is back on Browse.`],
          }, url, 'View order')
        )
      }
    }

    if (event === 'disputed') {
      const reportedByBuyer = extra.byId && extra.byId === order.buyer_id
      for (const p of [buyer, seller]) {
        if (!p) continue
        jobs.push(
          send(p.email, `Problem reported: ${order.listing_title}`, {
            heading: 'We are looking into it',
            paragraphs: [
              `A problem was reported on <strong>${title}</strong>. The money stays held while we review it. We will email you within 2 business days.`,
            ],
          }, url, 'View order')
        )
      }
      jobs.push(
        sendEmail({
          to: 'hello@agorau.app',
          subject: `DISPUTE: ${order.listing_title} (${price})`,
          html: layout({
            heading: 'Order dispute',
            paragraphs: [
              `Order ${esc(order.id)} for <strong>${title}</strong>, ${price}.`,
              `Reported by the ${reportedByBuyer ? 'buyer' : 'seller'}: ${esc(extra.reason || '')}`,
              `Buyer: ${esc(buyer ? buyer.email : '')}<br>Seller: ${esc(seller ? seller.email : '')}`,
            ],
          }),
          text: `Dispute on order ${order.id}: ${extra.reason || ''}`,
        })
      )
    }

    await Promise.all(jobs)
  } catch (err) {
    console.error('notifyOrder failed:', err)
  }
}
