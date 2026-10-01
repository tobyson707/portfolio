import React, { useState } from 'react'
import { useStore } from '../store'
import { executeRadialThemeToggle } from '../utils/themeTransition'

export default function ThemeToggle() {
  const theme = useStore((s) => s.theme)
  const isDark = theme === 'dark'
  const [isPressed, setIsPressed] = useState(false)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsPressed(true)
    setTimeout(() => setIsPressed(false), 260)
    executeRadialThemeToggle(e)
  }

  return (
    <div className="theme-toggle-wrapper">
      <button
        type="button"
        className={`theme-toggle-btn ${isPressed ? 'is-switching' : ''}`}
        onClick={handleClick}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-pressed={isDark}
      >
        {isDark ? (
          /* Sun icon in dark mode */
          <svg
            key="sun-icon"
            className="theme-icon-svg theme-icon-enter"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        ) : (
          /* Moon icon in light mode */
          <svg
            key="moon-icon"
            className="theme-icon-svg theme-icon-enter"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>
    </div>
  )
}
