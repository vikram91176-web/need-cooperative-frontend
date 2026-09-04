import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import ChatbotWidget from './ChatbotWidget'

/**
 * Layout.jsx — the frame that every page sits inside.
 *
 * WHY: Without this, we would paste <Navbar /> and <Footer /> into all 15+
 *      pages. Here they are written once. `<Outlet />` is the hole where React
 *      Router drops whichever page matches the current URL.
 */
export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pt-16 w-full min-w-0">
        <Outlet />
      </main>
      <Footer />
      <ChatbotWidget />
    </div>
  )
}
