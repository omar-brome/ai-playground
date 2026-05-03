import { Moon, Sun } from 'lucide-react'
import Button from './Button'
import useThemeStore from '../../store/themeStore'

function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="w-9 h-9 p-0"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  )
}

export default ThemeToggle