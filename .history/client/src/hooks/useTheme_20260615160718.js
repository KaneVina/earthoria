import { useEffect, useState } from 'react'

export const useTheme = () => {
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem('earthoria-theme') === 'dark'
  )

  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDark)
    localStorage.setItem('earthoria-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const toggleTheme = () => setIsDark(prev => !prev)

  return { isDark, toggleTheme }
}