import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useThemeStore = create(
  persist(
    (set, get) => ({
      // State
      theme: 'light', // 'light' | 'dark'

      // Actions
      setTheme: (theme) => {
        set({ theme })
        // Apply theme to document - only add 'dark' class when in dark mode
        document.documentElement.classList.toggle('dark', theme === 'dark')
      },

      toggleTheme: () => {
        const currentTheme = get().theme
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
        get().setTheme(newTheme)
      },

      initializeTheme: () => {
        const theme = get().theme
        document.documentElement.classList.toggle('dark', theme === 'dark')
      },
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({
        theme: state.theme,
      }),
    }
  )
)

export default useThemeStore