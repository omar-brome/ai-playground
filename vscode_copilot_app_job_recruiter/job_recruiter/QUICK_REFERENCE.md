# Quick Reference Guide

## Project Overview
- **Name:** Bond AI Clone
- **Type:** AI-Powered LinkedIn Recruiting Assistant
- **Repository:** bond-ai-clone
- **Architecture:** React (Vite) + Express.js
- **Deployment:** Vercel (frontend), Railway (backend)

---

## 🔗 Key Endpoints

### Chat Routes
```
POST   /api/chat              Send message to OpenAI
GET    /api/chat/history      Get conversation history
```

### LinkedIn Routes
```
GET    /api/linkedin/search   Search LinkedIn profiles
GET    /api/linkedin/profile/:id  Get profile details
```

### Auth Routes
```
POST   /api/auth/login        User login
POST   /api/auth/register     User registration
```

### User Routes
```
GET    /api/user/saved        Get saved profiles
POST   /api/user/saved        Save a profile
DELETE /api/user/saved/:id    Remove saved profile
```

---

## 🎨 Design Tokens

### Colors
| Name | Hex | Usage |
|------|-----|-------|
| Primary | #6366F1 | Buttons, links, primary actions |
| Secondary | #8B5CF6 | Accents, hover states |
| Accent | #06B6D4 | Highlights, badges |
| Background | #0F0F1A | Main background |
| Surface | #1A1A2E | Card backgrounds |
| Border | #2D2D4A | Dividers, borders |
| Text Primary | #F8FAFC | Main text |
| Text Muted | #94A3B8 | Secondary text |
| Success | #10B981 | Success states |
| Error | #EF4444 | Error states |

### Typography
```css
/* Headings */
h1: 36px, bold, tracking-tight
h2: 28px, bold, tracking-tight
h3: 24px, bold, tracking-tight
h4: 20px, bold, tracking-tight

/* Body */
p: 16px, normal, leading-relaxed
small: 14px, normal
code: "JetBrains Mono", 14px
```

### Spacing
```
xs: 4px
sm: 8px
md: 12px
lg: 16px
xl: 24px
2xl: 32px
3xl: 48px
```

---

## 📂 Component Structure

### Layout Components
- `Navbar.jsx` - Top navigation bar
- `Sidebar.jsx` - Left sidebar (desktop)
- `MobileNav.jsx` - Bottom navigation (mobile)

### Chat Components
- `ChatWindow.jsx` - Main chat area
- `ChatMessage.jsx` - Individual message bubble
- `ChatInput.jsx` - Input field with send button
- `TypingIndicator.jsx` - Animated typing indicator
- `SuggestedPrompts.jsx` - Prompt suggestions

### Profile Components
- `ProfileCard.jsx` - Single profile card
- `ProfileGrid.jsx` - Grid of profile cards
- `ProfileModal.jsx` - Full profile details modal
- `FilterBar.jsx` - Filter and sort options

### UI Components
- `Button.jsx` - Reusable button
- `Input.jsx` - Text input
- `Modal.jsx` - Modal dialog
- `Badge.jsx` - Status/tag badge
- `Avatar.jsx` - User avatar
- `Skeleton.jsx` - Loading skeleton
- `Tooltip.jsx` - Tooltip component

### Landing Components
- `Hero.jsx` - Hero section
- `Features.jsx` - Features grid
- `HowItWorks.jsx` - How it works section
- `Testimonials.jsx` - Testimonials carousel
- `Footer.jsx` - Footer

---

## 🎯 Page Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | Landing | Marketing landing page |
| `/chat` | Chat | Main chat interface |
| `/chat/:id` | Chat | Resume conversation |
| `/login` | Login | User login |
| `/register` | Register | New user signup |
| `/dashboard` | Dashboard | User dashboard |
| `*` | NotFound | 404 page |

---

## 🔧 Custom Hooks

```javascript
// useChat.js - Chat management
useChat() → { messages, addMessage, isLoading, error }

// useLinkedIn.js - LinkedIn search
useLinkedIn() → { results, search, isSearching, error }

// useAuth.js - Authentication
useAuth() → { user, login, logout, register, isAuthenticated }

// useLocalStorage.js - Local storage
useLocalStorage(key, initialValue) → [value, setValue]
```

---

## 📊 Zustand Stores

### Chat Store
```javascript
{
  conversations: [],
  activeConversationId: null,
  messages: [],
  isLoading: false,
  addMessage: (message) => void,
  createConversation: () => void,
  loadConversation: (id) => void,
}
```

### Search Store
```javascript
{
  results: [],
  filters: {},
  totalResults: 0,
  savedProfiles: [],
  setResults: (results) => void,
  saveProfile: (profile) => void,
  setFilters: (filters) => void,
}
```

### Auth Store
```javascript
{
  user: null,
  isAuthenticated: false,
  token: null,
  login: (email, password) => void,
  logout: () => void,
  register: (data) => void,
}
```

---

## 🔑 API Response Schemas

### Profile Object
```javascript
{
  id: string,
  name: string,
  headline: string,
  location: string,
  profileUrl: string,
  avatar: string,
  currentCompany: string,
  currentRole: string,
  experienceYears: number,
  skills: string[],
  openToWork: boolean,
  connections: string,
  summary: string
}
```

### Chat Message
```javascript
{
  id: string,
  role: 'user' | 'assistant',
  content: string,
  timestamp: Date,
  profiles?: Profile[]
}
```

### Conversation
```javascript
{
  id: string,
  title: string,
  createdAt: Date,
  updatedAt: Date,
  messages: ChatMessage[]
}
```

---

## 🚀 Development Commands

### Client
```bash
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Lint code
```

### Server
```bash
npm run dev      # Start with nodemon
npm run start    # Start production server
```

---

## 🔐 Environment Variables Checklist

- [ ] `VITE_API_BASE_URL` set in client/.env
- [ ] `PORT` set in server/.env (usually 5000)
- [ ] `OPENAI_API_KEY` set in server/.env
- [ ] `RAPIDAPI_KEY` set in server/.env
- [ ] `RAPIDAPI_HOST` set in server/.env
- [ ] `JWT_SECRET` set in server/.env
- [ ] `.env` files added to `.gitignore`

---

## 📱 Responsive Breakpoints

| Breakpoint | Width | Devices |
|------------|-------|---------|
| sm | 640px | Large phones |
| md | 768px | Tablets |
| lg | 1024px | Small laptops |
| xl | 1280px | Large screens |

---

## 🎬 Animation Timings

| Type | Duration | Easing |
|------|----------|--------|
| Page transition | 300ms | ease-out |
| Message slide in | 200ms | ease-out |
| Modal open | 250ms | ease-out |
| Button hover | 150ms | ease-out |
| Skeleton shimmer | 1500ms | ease-in-out |

---

## 🧪 Testing Queries

### Sample LinkedIn Queries to Test
- "Find React developers in Dubai"
- "Show me UX designers with 5+ years experience"
- "Find marketing managers in London"
- "Show me Python developers open to work"
- "Find senior frontend engineers"

### Non-Search Queries to Test
- "How do I write a great job description?"
- "What should I ask in a technical interview?"
- "How do I improve my employer brand?"
- "What skills should I look for in a manager?"

---

## 📚 File Size Targets

| File Type | Max Size |
|-----------|----------|
| Bundle | 150KB |
| CSS | 50KB |
| JS | 100KB |
| Images | 100KB each |

---

## 🔍 Debugging Tips

### Check Server Health
```bash
curl http://localhost:5000/api/health
```

### View Environment Variables
```javascript
console.log(process.env) // Server
console.log(import.meta.env) // Client
```

### Monitor API Calls
- Open DevTools → Network tab
- Filter by XHR/Fetch
- Check headers and response

### Common Error Messages
- `ECONNREFUSED` - Server not running
- `CORS error` - Backend not allowing frontend origin
- `404 Not Found` - Route doesn't exist
- `401 Unauthorized` - Missing or invalid JWT

---

## 🎯 Development Workflow

1. **Plan** - Read PDS.md and understand features
2. **Structure** - Create file/folder structure
3. **Scaffold** - Build component shells
4. **Style** - Add Tailwind CSS classes
5. **Integrate** - Connect to APIs
6. **Test** - Test with sample data
7. **Polish** - Add animations and micro-interactions
8. **Deploy** - Build and deploy

---

## 📞 Support & Resources

- **Issues?** Check README.md troubleshooting section
- **Questions?** Review PDS.md specification
- **APIs?** Check RapidAPI and OpenAI documentation
- **Styling?** Check Tailwind CSS docs

---

**Last Updated:** 2024
**Version:** 1.0.0
