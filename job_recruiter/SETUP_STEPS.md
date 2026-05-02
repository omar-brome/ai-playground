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

---

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
