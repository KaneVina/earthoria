import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import { useScrollProgress } from '../../hooks/useScrollProgress'

export default function Layout() {
  useScrollProgress()

  return (
    <>
      <div id="progress"></div>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
      <button
        id="back-top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M18 15l-6-6-6 6"/>
        </svg>
      </button>
    </>
  )
}