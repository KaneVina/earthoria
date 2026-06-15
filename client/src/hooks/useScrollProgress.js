import { useEffect } from 'react'

export const useScrollProgress = () => {
  useEffect(() => {
    const handler = () => {
      const winScroll = document.documentElement.scrollTop
      const height = document.documentElement.scrollHeight - window.innerHeight
      const el = document.getElementById('progress')
      if (el) el.style.width = (winScroll / height * 100) + '%'

      const btn = document.getElementById('back-top')
      if (btn) btn.classList.toggle('visible', winScroll > 600)
    }
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])
}