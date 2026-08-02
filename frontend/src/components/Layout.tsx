import { Outlet } from 'react-router-dom'
import Navbar from './Navbar.tsx'
import Footer from './Footer.tsx'

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50 pt-16 pb-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}