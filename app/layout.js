import './globals.css'
import NavBar from '../components/NavBar'

export const metadata = {
  title: 'Agora U',
  description: 'The campus marketplace you can actually trust. Verified college students only.',
}

export const viewport = {
  themeColor: '#BF5700',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        <NavBar />
        {children}
      </body>
    </html>
  )
}
