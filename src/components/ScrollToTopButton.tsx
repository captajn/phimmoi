'use client'

import { useEffect, useState } from 'react'
import { MdKeyboardArrowUp } from 'react-icons/md'

export function ScrollToTopButton() {
  const [showButton, setShowButton] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowButton(window.scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!showButton) return null

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-8 right-8 p-3 bg-gray-800 hover:bg-gray-700 rounded-full shadow-lg transition-all"
      aria-label="Cuộn lên đầu trang"
    >
      <MdKeyboardArrowUp className="w-6 h-6 text-white" />
    </button>
  )
} 