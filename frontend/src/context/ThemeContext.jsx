import { createContext, useContext, useEffect, useLayoutEffect, useState } from 'react'

const ThemeContext = createContext(null)
const STORAGE_KEY = 'uniwell-appearance'
const DEFAULT_MIGRATION_KEY = 'uniwell-appearance-light-default-v1'
const APPEARANCE_MODES = ['light', 'dark', 'device']

function getSavedMode() {
  try {
    const savedMode = localStorage.getItem(STORAGE_KEY)
    const migratedDefault = localStorage.getItem(DEFAULT_MIGRATION_KEY) === 'true'
    if (savedMode === 'device' && !migratedDefault) return 'light'
    return APPEARANCE_MODES.includes(savedMode) ? savedMode : 'light'
  } catch (error) {
    console.warn('[ThemeContext] Failed to read appearance preference:', error)
    return 'light'
  }
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(getSavedMode)

  useLayoutEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const applyTheme = () => {
      const theme = mode === 'device'
        ? (mediaQuery.matches ? 'dark' : 'light')
        : mode
      document.documentElement.dataset.theme = theme
      document.documentElement.style.colorScheme = theme
    }

    applyTheme()
    mediaQuery.addEventListener('change', applyTheme)
    return () => mediaQuery.removeEventListener('change', applyTheme)
  }, [mode])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, mode)
      localStorage.setItem(DEFAULT_MIGRATION_KEY, 'true')
    } catch (error) {
      console.warn('[ThemeContext] Failed to save appearance preference:', error)
    }
  }, [mode])

  return (
    <ThemeContext.Provider value={{ mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
