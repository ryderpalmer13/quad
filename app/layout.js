import './globals.css'
import NavBar from '../components/NavBar'

export const metadata = {
  title: 'QUAD',
  description: 'Buy and sell with verified students at UT Austin.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <NavBar />
        {children}
      </body>
    </html>
  )
}