import LegalPage from '../../components/LegalPage'

export const metadata = {
  title: 'Terms of Service | Agora U',
}

const sections = [
  {
    heading: 'What Agora U is',
    paragraphs: [
      'Agora U is a marketplace where verified college students can list items for sale and message each other. We only connect buyers and sellers. We are not part of any sale, we do not handle payments, and we do not own, inspect, or guarantee any item listed.',
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
      'There is no checkout on Agora U. Buyers and sellers arrange the meetup and the payment themselves, in person. Any deal is between you and the other student.',
      'Sellers must own what they list, describe it honestly, and use real photos. Buyers should look over an item before paying.',
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
      'Meet in a public, well lit place on campus, bring a friend if you can, and trust your gut. Never send money ahead of time to someone you have not met. If you feel unsafe, leave and contact campus police or call 911.',
    ],
  },
  {
    heading: 'Reports and removal',
    paragraphs: [
      'You can report any listing or person using the Report button. We may remove listings, limit features, or close accounts that break these rules or put others at risk, with or without notice.',
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
      'To the fullest extent the law allows, Agora U is not responsible for losses, injuries, or disputes that come from meetups, sales, or messages between users. Use the service at your own risk and use good judgment.',
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
      updated="October 19, 2026"
      intro="Welcome to Agora U. By creating an account or using the app, you agree to these terms. They are written in plain language on purpose."
      sections={sections}
    />
  )
}
