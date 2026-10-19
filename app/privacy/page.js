import LegalPage from '../../components/LegalPage'

export const metadata = {
  title: 'Privacy Policy | Agora U',
}

const sections = [
  {
    heading: 'What we collect',
    paragraphs: ['When you use Agora U, we collect:'],
    bullets: [
      'Your .edu email address and password (your password is stored securely and we cannot read it)',
      'Your display name and profile photo, if you add them',
      'The listings you post, including photos, descriptions, categories, and prices',
      'The messages you send and receive in the app',
      'Reports you submit, and basic technical information needed to run the app',
    ],
  },
  {
    heading: 'Why we collect it',
    paragraphs: [
      'We use this information to verify that members are students, run the marketplace, let buyers and sellers message each other, keep the community safe, and fix problems.',
    ],
  },
  {
    heading: 'Who can see what',
    paragraphs: [
      'Your display name, profile photo, and listings are visible to other members. Your email address is used to sign you in and is not shown on your listings. Your messages are visible only to you and the person you are talking to.',
      'If a message or listing is reported, or if we need to protect someone\'s safety, we may review the relevant content.',
    ],
  },
  {
    heading: 'We do not sell your data',
    paragraphs: [
      'We do not sell your personal information, and we do not show ads. We share information only as described here, or if the law requires it.',
    ],
  },
  {
    heading: 'Services we use',
    paragraphs: [
      'Agora U runs on trusted services that handle data on our behalf: Supabase (accounts, database, and photo storage), Vercel (hosting), and an email service that sends sign up and password reset emails. These providers only process data to help us run the app.',
    ],
  },
  {
    heading: 'Cookies and storage',
    paragraphs: [
      'We store a small amount of data in your browser to keep you logged in. We do not use advertising trackers.',
    ],
  },
  {
    heading: 'How long we keep it',
    paragraphs: [
      'We keep your information while your account is active. If you ask us to delete your account, we will remove your profile and listings. Some records, like reports or messages involving safety issues, may be kept longer when needed.',
    ],
  },
  {
    heading: 'Your choices',
    paragraphs: [
      'You can edit your name and photo anytime from your Profile, and mark or edit your listings. To delete your account or ask a question about your data, email hello@agorau.app.',
    ],
  },
  {
    heading: 'Age requirement',
    paragraphs: ['Agora U is for adults 18 and older. We do not knowingly collect information from anyone younger.'],
  },
  {
    heading: 'Changes to this policy',
    paragraphs: [
      'We may update this policy as the app changes. The date at the top shows when it was last updated.',
    ],
  },
  {
    heading: 'Contact',
    paragraphs: ['Questions about privacy? Email hello@agorau.app.'],
  },
]

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="October 19, 2026"
      intro="Your privacy matters. This page explains what Agora U collects, why, and who can see it."
      sections={sections}
    />
  )
}
