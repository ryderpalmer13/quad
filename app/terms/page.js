import LegalPage from '../../components/LegalPage'

export const metadata = {
  title: 'Terms of Service | Agora U',
}

const sections = [
  {
    heading: 'What Agora U is',
    paragraphs: [
      'Agora U is a marketplace where verified college students can list items for sale and message each other. We connect buyers and sellers. We do not own, inspect, or guarantee any item listed, and we are not the seller of any item. The sale is between the buyer and the seller.',
    ],
  },
  {
    heading: 'Who can use it',
    paragraphs: [
      'You must be at least 18 years old and a current college student with a working .edu email address. You agree to give accurate information and to keep your login private. You are responsible for what happens on your account.',
    ],
  },
  {
    heading: 'Buying and selling',
    paragraphs: [
      'Sellers must own what they list, describe it honestly, and use real photos. Buyers should look over an item at the meetup before handing over their code.',
      'Items listed at $3.00 or more are bought and paid for through Agora U. Items under $3.00, including free items, are arranged between the two students in person.',
    ],
  },
  {
    heading: 'Payments and the meetup code',
    paragraphs: [
      'Payments are processed by Stripe, a third party payment company. Agora U is not a bank. To get paid, sellers must set up a payout account with Stripe and agree to Stripe\'s terms.',
      'When a buyer pays, the money is held. The buyer gets a 6 digit meetup code. After the buyer receives the item, the buyer gives the seller the code, the seller enters it in the app, and the money is sent to the seller. Only share your code once the item is in your hands. If you give your code away early, we may not be able to get your money back.',
      'To keep payments protected, buyers and sellers agree to complete the sale of an item through Agora U once it is purchased there, and not to take the payment off the app.',
    ],
  },
  {
    heading: 'Fees',
    paragraphs: [
      'Buyers pay the listed price. Sellers pay Agora U a fee of 15% of the sale price, with a minimum of $1.00, taken from the payout. The fee is shown to the seller when listing an item, and again on the order. We may change the fee in the future, and the fee shown when an item is listed is the fee that applies to that sale.',
    ],
  },
  {
    heading: 'Cancellations and refunds',
    paragraphs: [
      'A seller can cancel an order at any time before the handoff, and the buyer is refunded in full. A buyer can cancel within 15 minutes of paying and is refunded in full.',
      'If the handoff has not happened within 14 days of payment and no problem has been reported, the buyer is refunded automatically and the item goes back on Browse. Once the seller has been paid, the sale is final, so look over the item before you give your code.',
    ],
  },
  {
    heading: 'Problems and disputes',
    paragraphs: [
      'If something goes wrong with an order, either person can use Report a problem on the order page. While we look into it, the money stays held. We will review what both people tell us and decide whether to refund the buyer or pay the seller. Our decision is final, to the extent the law allows. We aim to respond within 2 business days.',
      'If a buyer opens a chargeback with their bank, we may hold or take back related payouts, and we may close accounts that abuse chargebacks.',
    ],
  },
  {
    heading: 'Taxes',
    paragraphs: [
      'Sellers are responsible for any taxes that apply to their sales. Stripe or Agora U may report seller earnings to tax authorities when the law requires it.',
    ],
  },
  {
    heading: 'What you cannot post',
    paragraphs: ['Do not post or send anything that is:'],
    bullets: [
      'Illegal, stolen, counterfeit, or fake, including fake tickets',
      'Weapons, drugs, alcohol, vaping products, or other restricted items',
      'A scam, a misleading listing, or spam',
      'Harassing, threatening, hateful, or sexually explicit',
      'Someone else\'s private information or photos without their permission',
    ],
  },
  {
    heading: 'Staying safe',
    paragraphs: [
      'Meet in a public, well lit place on campus, bring a friend if you can, and trust your gut. Never pay anyone outside the app for an item bought through Agora U, and never send money ahead of time to someone you have not met. If you feel unsafe, leave and contact campus police or call 911.',
    ],
  },
  {
    heading: 'Reports and removal',
    paragraphs: [
      'You can report any listing or person using the Report button. We may remove listings, limit features, hold payouts, or close accounts that break these rules or put others at risk, with or without notice.',
    ],
  },
  {
    heading: 'Your content',
    paragraphs: [
      'You keep ownership of the photos and text you post. By posting, you give Agora U permission to show that content in the app so the service can work.',
    ],
  },
  {
    heading: 'No guarantees',
    paragraphs: [
      'Agora U is provided as is. We try to keep it running smoothly and safely, but we cannot promise it will always be available or error free. We do not guarantee any item, any user, or any transaction.',
    ],
  },
  {
    heading: 'Limit of our responsibility',
    paragraphs: [
      'To the fullest extent the law allows, Agora U is not responsible for losses, injuries, or disputes that come from meetups, sales, or messages between users, and our total responsibility to you for any claim is limited to the fees we received on the order involved. Use the service at your own risk and use good judgment.',
    ],
  },
  {
    heading: 'Changes to these terms',
    paragraphs: [
      'We may update these terms as Agora U grows. If you keep using the app after a change, that means you accept the new version.',
    ],
  },
  {
    heading: 'Contact',
    paragraphs: ['Questions or concerns? Email hello@agorau.app.'],
  },
]

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="October 27, 2026"
      intro="Welcome to Agora U. By creating an account or using the app, you agree to these terms. They are written in plain language on purpose."
      sections={sections}
    />
  )
}
