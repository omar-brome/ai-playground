# Setup Instructions for Cursor/IDE

This guide will help you set up the Bond AI Clone project using Cursor or your preferred code editor.

---

## 📋 Pre-Flight Checklist

Before starting, ensure you have:

- ✅ Node.js v18+ installed (`node --version`)
- ✅ npm v9+ installed (`npm --version`)
- ✅ OpenAI API key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- ✅ RapidAPI key + LinkedIn API subscription from [rapidapi.com](https://rapidapi.com/)
- ✅ Git installed (optional, for version control)
- ✅ Cursor or VS Code with extensions: ESLint, Tailwind CSS IntelliSense, Prettier

---

## 🚀 Step-by-Step Setup

### Step 1: Initialize Project Structure

1. Open your terminal/command line
2. Navigate to your projects folder
3. Create the main project directory:
   ```bash
   mkdir bond-ai-clone
   cd bond-ai-clone
   ```

### Step 2: Create Client (React) Project

```bash
# Create React + Vite project
npm create vite@latest client -- --template react

# Navigate to client directory
cd client

# Install dependencies
npm install

# Install additional packages
npm install react-router-dom axios zustand @tanstack/react-query \
  react-hook-form zod framer-motion lucide-react react-hot-toast \
  react-markdown remark-gfm date-fns clsx tailwind-merge

# Install dev dependencies
npm install -D tailwindcss postcss autoprefixer

# Initialize Tailwind
npx tailwindcss init -p

# Go back to root
cd ..
```

### Step 3: Create Server (Express) Project

```bash
# Create server directory
mkdir server
cd server

# Initialize npm project
npm init -y

# Install dependencies
npm install express cors dotenv axios express-rate-limit jsonwebtoken bcryptjs body-parser

# Install dev dependency
npm install -D nodemon

# Go back to root
cd ..
```

### Step 4: Configure Environment Variables

#### Client Setup
```bash
# In client directory
cp .env.example .env
```

Edit `client/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

#### Server Setup
```bash
# In server directory
cp .env.example .env
```

Edit `server/.env` with your actual API keys:
```env
PORT=5000
NODE_ENV=development
OPENAI_API_KEY=your_actual_key_here
RAPIDAPI_KEY=your_actual_key_here
RAPIDAPI_HOST=linkedin-api8.p.rapidapi.com
JWT_SECRET=generate_a_random_string_here
```

### Step 5: Configure Build Tools

#### Vite Config (client/vite.config.js)
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
```

#### Tailwind Config (client/tailwind.config.js)
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366F1',
        secondary: '#8B5CF6',
        accent: '#06B6D4',
      }
    },
  },
  plugins: [],
}
```

### Step 6: Set Up Express Server (server/index.js)

```javascript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Routes (will be added)
// app.use('/api/chat', chatRoutes);
// app.use('/api/linkedin', linkedinRoutes);
// app.use('/api/auth', authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
```

### Step 7: Set Up React App (client/src/main.jsx)

```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### Step 8: Create Globals CSS (client/src/styles/globals.css)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
  font-family: 'Inter', sans-serif;
}

body {
  background: #0F0F1A;
  color: #F8FAFC;
  line-height: 1.6;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #1A1A2E;
}

::-webkit-scrollbar-thumb {
  background: #6366F1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #8B5CF6;
}
```

### Step 9: Create App Component (client/src/App.jsx)

```javascript
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Chat from './pages/Chat'
import Login from './pages/Login'
import Register from './pages/Register'
import NotFound from './pages/NotFound'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App
```

### Step 10: Create Folder Structure

```bash
# From root directory
cd client/src

# Create directory structure
mkdir -p components/layout components/chat components/results components/ui components/landing
mkdir -p pages hooks store services utils styles

cd ../..
```

### Step 11: Update package.json Scripts

#### client/package.json
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext .js,.jsx --fix"
  }
}
```

#### server/package.json
```json
{
  "type": "module",
  "scripts": {
    "dev": "nodemon index.js",
    "start": "node index.js"
  }
}
```

### Step 12: Start Development Servers

#### Terminal 1 - Backend:
```bash
cd server
npm run dev
```
Expected: `✅ Server running on http://localhost:5000`

#### Terminal 2 - Frontend:
```bash
cd client
npm run dev
```
Expected: `Local: http://localhost:5173/`

---

## ✅ Verification

1. **Server running?** Visit `http://localhost:5000/api/health` in your browser
   - Should show: `{"status":"Server is running"}`

2. **Client running?** Visit `http://localhost:5173`
   - Should see the React dev server

3. **Ports correct?**
   - Client: 5173
   - Server: 5000
   - Update `.env` files if different

---

## 🛠 Next Steps After Setup

1. **Create basic pages** in `client/src/pages/`
2. **Build layout components** (Navbar, Sidebar, etc.)
3. **Set up Zustand stores** in `client/src/store/`
4. **Build Express routes** in `server/routes/`
5. **Connect OpenAI API** in backend
6. **Connect LinkedIn API** in backend
7. **Add Tailwind styling** to components
8. **Implement Framer Motion** animations
9. **Add theme switching** (dark/light mode)

---

## 🎨 Step 13: Add Theme Switching (Dark/Light Mode)

### Create Theme Store
```javascript
// client/src/store/themeStore.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'dark',
      setTheme: (theme) => {
        set({ theme })
        document.documentElement.classList.toggle('dark', theme === 'dark')
        document.documentElement.classList.toggle('light', theme === 'light')
      },
      toggleTheme: () => {
        const currentTheme = get().theme
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
        get().setTheme(newTheme)
      },
      initializeTheme: () => {
        const theme = get().theme
        document.documentElement.classList.toggle('dark', theme === 'dark')
        document.documentElement.classList.toggle('light', theme === 'light')
      },
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
)

export default useThemeStore
```

### Update CSS Variables for Light Theme
```css
/* client/src/styles/globals.css */
.light {
  /* Colors */
  --color-primary: #4F46E5;
  --color-primary-hover: #4338CA;
  --color-secondary: #7C3AED;
  --color-accent: #0891B2;

  /* Background Colors */
  --color-bg-primary: #FFFFFF;
  --color-bg-secondary: #F8FAFC;
  --color-bg-card: #FFFFFF;
  --color-bg-hover: #F1F5F9;

  /* Text Colors */
  --color-text-primary: #0F172A;
  --color-text-secondary: #475569;
  --color-text-muted: #64748B;

  /* Border Colors */
  --color-border: #E2E8F0;
  --color-border-light: #CBD5E1;
}
```

### Update Tailwind Config for CSS Variables
```javascript
// client/tailwind.config.js
colors: {
  primary: 'rgb(var(--color-primary) / <alpha-value>)',
  'bg-primary': 'rgb(var(--color-bg-primary) / <alpha-value>)',
  // ... other colors
}
```

### Create Theme Toggle Component
```javascript
// client/src/components/ui/ThemeToggle.jsx
import { Moon, Sun } from 'lucide-react'
import { Button } from './Button'
import useThemeStore from '../../store/themeStore'

function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore()

  return (
    <Button variant="ghost" size="sm" onClick={toggleTheme}>
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}
```

### Add Theme Toggle to Navbar
```javascript
// client/src/components/layout/Navbar.jsx
import { ThemeToggle } from '../ui'

// Add to navbar JSX:
<div className="flex items-center gap-3">
  <ThemeToggle />
  {/* existing user actions */}
</div>
```

### Initialize Theme on App Start
```javascript
// client/src/main.jsx
import useThemeStore from './store/themeStore'

// Initialize theme on app start
useThemeStore.getState().initializeTheme()
```

### Update Settings Page
```javascript
// client/src/pages/Settings.jsx
import useThemeStore from '../store/themeStore'

function Settings() {
  const { theme, toggleTheme } = useThemeStore()

  // Replace local darkMode state with theme store
  <Button variant={theme === 'dark' ? 'secondary' : 'outline'} onClick={toggleTheme}>
    {theme === 'dark' ? 'On' : 'Off'}
  </Button>
}
```

**Expected Result:**
- ✅ Theme toggle button in navbar
- ✅ Theme persists across sessions
- ✅ Settings page shows current theme state
- ✅ Smooth transitions between dark/light modes
- ✅ All components adapt to theme changes

---

## 🔄 Step 14: Add Authentication Guards

### Create Auth Context/Provider
```javascript
// client/src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect } from 'react'
import useAuthStore from '../store/authStore'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const { isAuthenticated, initializeAuth } = useAuthStore()

  useEffect(() => {
    initializeAuth()
  }, [])

  return (
    <AuthContext.Provider value={{ isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

### Create Protected Route Component
```javascript
// client/src/components/auth/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
```

### Update App.jsx with Route Protection
```javascript
// client/src/App.jsx
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          {/* Protect other authenticated routes */}
        </Routes>
      </Router>
    </AuthProvider>
  )
}
```

**Expected Result:**
- ✅ Unauthenticated users redirected to login
- ✅ Auth state persists across browser sessions
- ✅ Protected routes only accessible when logged in

---

## 📱 Step 15: Add Responsive Design & Mobile Optimization

### Update Navbar for Mobile
```javascript
// client/src/components/layout/Navbar.jsx
const [isMenuOpen, setIsMenuOpen] = useState(false)

// Add mobile menu button and MobileNav component
<button
  className="md:hidden"
  onClick={() => setIsMenuOpen(true)}
>
  ☰
</button>

<MobileNav isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
```

### Create Mobile Navigation Component
```javascript
// client/src/components/layout/MobileNav.jsx
function MobileNav({ isOpen, onClose }) {
  return (
    <div className={`fixed inset-0 z-50 md:hidden ${isOpen ? 'block' : 'hidden'}`}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-80 bg-bg-card p-6">
        {/* Mobile navigation content */}
      </div>
    </div>
  )
}
```

### Add Responsive Grid Layouts
```javascript
// Update components with responsive classes
<div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
  {/* Responsive grid items */}
</div>
```

**Expected Result:**
- ✅ Mobile-friendly navigation
- ✅ Responsive layouts for all screen sizes
- ✅ Touch-friendly buttons and interactions

---

## 🎭 Step 16: Add Loading States & Error Handling

### Create Loading Spinner Component
```javascript
// client/src/components/ui/Spinner.jsx
function Spinner({ size = 'md' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-primary border-t-transparent`} />
  )
}
```

### Add Error Boundary
```javascript
// client/src/components/ErrorBoundary.jsx
import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <div className="p-8 text-center">Something went wrong. Please refresh the page.</div>
    }

    return this.props.children
  }
}
```

### Update Stores with Loading States
```javascript
// Update Zustand stores to include loading/error states
const useSearchStore = create((set, get) => ({
  isSearching: false,
  error: null,
  search: async (query) => {
    set({ isSearching: true, error: null })
    try {
      // API call
      set({ results: data, isSearching: false })
    } catch (error) {
      set({ error: error.message, isSearching: false })
    }
  }
}))
```

**Expected Result:**
- ✅ Loading spinners during async operations
- ✅ Error messages for failed requests
- ✅ Graceful error handling with fallbacks

---

## 🚀 Step 17: Add Animations & Transitions

### Install Framer Motion
```bash
npm install framer-motion
```

### Add Page Transitions
```javascript
// client/src/components/animations/PageTransition.jsx
import { motion } from 'framer-motion'

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 }
}

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.4
}

function PageTransition({ children }) {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      {children}
    </motion.div>
  )
}
```

### Add Hover Animations
```javascript
// Update components with motion
import { motion } from 'framer-motion'

<motion.div
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  className="card-class"
>
  {/* Card content */}
</motion.div>
```

**Expected Result:**
- ✅ Smooth page transitions
- ✅ Interactive hover effects
- ✅ Loading animations
- ✅ Micro-interactions for better UX

---

## 🔍 Step 18: Add Search & Filtering Enhancements

### Add Advanced Filters
```javascript
// client/src/components/search/AdvancedFilters.jsx
function AdvancedFilters({ filters, onChange }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Input
        label="Location"
        value={filters.location}
        onChange={(e) => onChange({ location: e.target.value })}
      />
      <Input
        label="Experience (years)"
        type="number"
        value={filters.experience}
        onChange={(e) => onChange({ experience: e.target.value })}
      />
      {/* More filter inputs */}
    </div>
  )
}
```

### Add Search Suggestions
```javascript
// client/src/components/search/SearchSuggestions.jsx
function SearchSuggestions({ suggestions, onSelect }) {
  return (
    <div className="absolute top-full left-0 right-0 bg-bg-card border border-border rounded-xl shadow-lg z-10">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSelect(suggestion)}
          className="w-full text-left px-4 py-2 hover:bg-bg-hover"
        >
          {suggestion}
        </button>
      ))}
    </div>
  )
}
```

**Expected Result:**
- ✅ Advanced filtering options
- ✅ Search suggestions/autocomplete
- ✅ Saved search queries
- ✅ Filter presets

---

## 📊 Step 19: Add Data Visualization

### Install Chart Library
```bash
npm install recharts
```

### Create Analytics Dashboard
```javascript
// client/src/pages/Analytics.jsx
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts'

function Analytics() {
  const data = [
    { name: 'Jan', candidates: 65 },
    { name: 'Feb', candidates: 78 },
    // ... more data
  ]

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="candidates" fill="var(--color-primary)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

**Expected Result:**
- ✅ Charts for candidate analytics
- ✅ Search performance metrics
- ✅ Hiring pipeline visualization
- ✅ Interactive data exploration

---

## 🔒 Step 20: Add Security & Performance Optimizations

### Add Rate Limiting
```javascript
// server/middleware/rateLimiter.js
import rateLimit from 'express-rate-limit'

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
})
```

### Add Input Validation
```javascript
// server/middleware/validation.js
import { body, validationResult } from 'express-validator'

export const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    next()
  }
]
```

### Add Performance Monitoring
```javascript
// client/src/utils/performance.js
export const measurePerformance = (name, fn) => {
  const start = performance.now()
  const result = fn()
  const end = performance.now()
  console.log(`${name} took ${end - start} milliseconds`)
  return result
}
```

**Expected Result:**
- ✅ Rate limiting for API endpoints
- ✅ Input validation and sanitization
- ✅ Performance monitoring
- ✅ Error logging and reporting

---

## 🎯 Final Steps

1. **Testing:** Add unit tests with Jest and React Testing Library
2. **Documentation:** Complete API documentation with Swagger
3. **Deployment:** Set up CI/CD pipeline with Vercel/Netlify
4. **Monitoring:** Add error tracking with Sentry
5. **SEO:** Add meta tags and structured data
6. **PWA:** Make app installable with service worker
7. **Internationalization:** Add i18n support for multiple languages
8. **Accessibility:** Ensure WCAG compliance

**Congratulations!** 🎉 You now have a fully-featured AI-powered job recruiter application!

## 🐛 Common Issues & Fixes

### Issue: "Module not found"
**Fix:** Ensure all dependencies are installed:
```bash
npm install
```

### Issue: CORS errors
**Fix:** Check both servers are running and URLs match in `.env`

### Issue: Port already in use
**Fix:** Kill the process on the port:
```bash
# macOS/Linux
lsof -i :5000
kill -9 <PID>

# Windows PowerShell
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Issue: "Cannot find module 'dotenv'"
**Fix:** Install dotenv:
```bash
npm install dotenv
```

---

## 🎯 Using with Cursor

1. **Open the project** in Cursor
2. **Open Terminal** (Terminal → New Terminal)
3. **Run servers** as shown above
4. **Use Cursor's AI** to generate components based on PDS
5. **Paste the PDS** into Cursor chat for context

**Helpful Cursor prompts:**
- "Generate a Navbar component following this design system..."
- "Create a Chat page with message history from the PDS"
- "Build the ProfileCard component with Tailwind"

---

## 📚 Useful Resources

- [Vite Docs](https://vitejs.dev)
- [React Docs](https://react.dev)
- [Tailwind Docs](https://tailwindcss.com/docs)
- [Express Docs](https://expressjs.com)
- [OpenAI API](https://platform.openai.com/docs)
- [RapidAPI Hub](https://rapidapi.com)

---

**Ready to start coding? Let's build! 🚀**
