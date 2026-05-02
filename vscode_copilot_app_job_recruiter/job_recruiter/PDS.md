# PROJECT DESIGN SPECIFICATION (PDS)
# Bond AI Clone — React Web Application
# Similar to: https://www.askbond.ai/

---

## 1. PROJECT OVERVIEW

Build a production-ready, fully responsive React web application that replicates
the core experience of askbond.ai — an AI-powered recruiting and talent
discovery assistant. The app features an intelligent chatbot that can search
and fetch LinkedIn profiles based on user queries (e.g., "Find me graphic
designers in Dubai" or "Show me senior React developers in the US").

---

## 2. TECH STACK

### Frontend
- React 18+ (Vite as build tool)
- React Router v6 (SPA routing)
- Tailwind CSS v3 (utility-first styling)
- Framer Motion (animations)
- Axios (HTTP requests)
- React Query / TanStack Query (data fetching & caching)
- Zustand (global state management)
- React Hook Form + Zod (form validation)
- Lucide React (icons)
- React Hot Toast (notifications)
- React Markdown (render AI markdown responses)
- date-fns (date formatting)

### AI & APIs
- OpenAI API (GPT-4o) — for chatbot intelligence & NLP
- RapidAPI LinkedIn Scraper (linkedin-api8.p.rapidapi.com)
  OR Fresh LinkedIn Profile Data API on RapidAPI
- .env file for all API keys (never hardcoded)

### Backend (lightweight Express server — required for API proxying)
- Node.js + Express
- cors, dotenv, express-rate-limit
- node-fetch or axios
- All LinkedIn & OpenAI calls go through this backend to protect API keys

---

## 3. FILE STRUCTURE

```
bond-ai-clone/
├── client/                        # React frontend
│   ├── public/
│   │   └── favicon.ico
│   ├── src/
│   │   ├── assets/
│   │   │   └── logo.svg
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   └── MobileNav.jsx
│   │   │   ├── chat/
│   │   │   │   ├── ChatWindow.jsx
│   │   │   │   ├── ChatMessage.jsx
│   │   │   │   ├── ChatInput.jsx
│   │   │   │   ├── TypingIndicator.jsx
│   │   │   │   └── SuggestedPrompts.jsx
│   │   │   ├── results/
│   │   │   │   ├── ProfileCard.jsx
│   │   │   │   ├── ProfileGrid.jsx
│   │   │   │   ├── ProfileModal.jsx
│   │   │   │   └── FilterBar.jsx
│   │   │   ├── ui/
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Input.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   ├── Badge.jsx
│   │   │   │   ├── Avatar.jsx
│   │   │   │   ├── Skeleton.jsx
│   │   │   │   └── Tooltip.jsx
│   │   │   └── landing/
│   │   │       ├── Hero.jsx
│   │   │       ├── Features.jsx
│   │   │       ├── HowItWorks.jsx
│   │   │       ├── Testimonials.jsx
│   │   │       └── Footer.jsx
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   ├── Chat.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── NotFound.jsx
│   │   ├── hooks/
│   │   │   ├── useChat.js
│   │   │   ├── useLinkedIn.js
│   │   │   ├── useAuth.js
│   │   │   └── useLocalStorage.js
│   │   ├── store/
│   │   │   ├── chatStore.js
│   │   │   ├── authStore.js
│   │   │   └── searchStore.js
│   │   ├── services/
│   │   │   ├── openai.js
│   │   │   ├── linkedin.js
│   │   │   └── api.js
│   │   ├── utils/
│   │   │   ├── parseLinkedInQuery.js
│   │   │   ├── formatProfile.js
│   │   │   ├── mockProfiles.js
│   │   │   └── constants.js
│   │   ├── styles/
│   │   │   └── globals.css
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── router.jsx
│   ├── .env.example
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                        # Express backend
│   ├── routes/
│   │   ├── chat.js
│   │   ├── linkedin.js
│   │   └── auth.js
│   ├── middleware/
│   │   ├── rateLimit.js
│   │   └── auth.js
│   ├── utils/
│   │   └── parseQuery.js
│   ├── .env.example
│   ├── index.js
│   └── package.json
│
└── README.md
```

---

## 4. PAGES & FEATURES

---

### PAGE 1 — LANDING PAGE (/)

Design a stunning, modern landing page similar to askbond.ai with:

#### Navbar
- Logo left, nav links center (Features, How it Works, Pricing, Blog)
- CTA buttons right: "Login" (outlined) + "Get Started" (filled, gradient)
- Sticky on scroll with frosted glass effect (backdrop-blur)
- Mobile: hamburger menu → full screen slide-in nav overlay

#### Hero Section
- Large headline: "Find Top Talent with AI-Powered LinkedIn Search"
- Subheadline: "Chat naturally with our AI. Get instant access to LinkedIn
  profiles matching your exact needs."
- Animated chat demo mockup (CSS animation showing sample conversation)
- Two CTA buttons: "Start for Free" + "Watch Demo"
- Floating animated background: subtle gradient orbs (purple, blue, indigo)
- Particle or dot grid background pattern

#### Features Section
- 6 feature cards in a 3x2 grid (2x2 on tablet, 1x on mobile):
  1. Natural Language Search — "Just describe who you need"
  2. Real LinkedIn Data — "Live profiles, not outdated databases"
  3. Smart Filters — "Filter by location, experience, skills"
  4. Export Results — "Download profiles as CSV or PDF"
  5. Chat History — "Pick up where you left off"
  6. Team Collaboration — "Share searches with your team"
- Each card: icon + title + description + subtle hover animation

#### How It Works Section
- 3-step horizontal stepper (vertical on mobile):
  Step 1: Describe your ideal candidate in plain English
  Step 2: AI searches and fetches LinkedIn profiles in real time
  Step 3: Review, filter, and export your results
- Animated connecting line between steps

#### Testimonials Section
- 3 testimonial cards with avatar, name, role, company, quote
- Auto-rotating carousel on mobile

#### Pricing Section
- 3 tiers: Free, Pro ($29/mo), Enterprise (Custom)
- Feature comparison list per tier
- Most popular badge on Pro
- Toggle: Monthly / Annual (show 20% discount)

#### Footer
- Logo + tagline
- 4 link columns: Product, Company, Resources, Legal
- Social icons: LinkedIn, Twitter, GitHub
- Copyright line

---

### PAGE 2 — AUTH PAGES (/login, /register)

- Centered card layout with gradient background
- Login: email + password + "Remember me" + "Forgot password?" link
- Register: full name + email + password + confirm password + terms checkbox
- Google OAuth button (UI only, mark as "coming soon" if not implemented)
- Form validation with inline error messages (React Hook Form + Zod)
- Smooth transitions between login and register
- Redirect to /chat on successful auth (use localStorage for auth state)

---

### PAGE 3 — DASHBOARD (/dashboard)

- Left sidebar (collapsible on mobile → bottom sheet)
  - User avatar + name + plan badge
  - Navigation: New Chat, Chat History, Saved Profiles, Settings
  - Recent chats list (clickable, loads that conversation)
  - Usage meter: "X / 50 searches used this month"

- Main content area shows:
  - Welcome card with quick stats: Total Searches, Profiles Found,
    Saved Profiles, This Month
  - Recent Activity feed
  - Quick Start prompts to launch a new chat

---

### PAGE 4 — CHAT PAGE (/chat, /chat/:id)

This is the CORE page of the application.

#### Layout
- Left sidebar: chat history list + New Chat button
- Main area: chat window
- Right panel (optional, toggleable): profile results panel
- On mobile: bottom tab navigation, full screen chat, swipe to see results

#### Chat Window
- Messages displayed in chat bubbles:
  - User: right-aligned, gradient bubble (purple/blue)
  - AI: left-aligned, white/dark card with avatar
- AI messages support full Markdown rendering (bold, lists, code, tables)
- Smooth scroll to latest message
- Message timestamps on hover
- Copy message button on hover

#### Typing Indicator
- Animated 3-dot bouncing indicator while AI is thinking
- "Searching LinkedIn..." status message during LinkedIn fetch
- Progress steps shown: "Understanding query... → Searching profiles...
  → Formatting results..."

#### Chat Input
- Sticky at bottom of chat window
- Auto-expanding textarea (grows with content, max 5 lines)
- Send button (disabled when empty, shows loading spinner while processing)
- Attach file icon (UI placeholder)
- Character counter
- Keyboard: Enter to send, Shift+Enter for new line
- Suggested prompt chips above input on empty chat:
  - "Find React developers in Dubai"
  - "Show me UX designers with 5+ years experience"
  - "Find marketing managers in London"
  - "Show me Python developers open to work"
  - "Find HR managers in Fortune 500 companies"

#### AI Behavior & LinkedIn Integration

The AI must:

1. Detect when a message is a LinkedIn search query using keyword detection:
   - Keywords: "find", "show me", "search for", "looking for", "need a",
     "developers", "designers", "engineers", "managers", "recruiters",
     any job title or role keyword
   
2. When a LinkedIn query is detected:
   - AI responds conversationally: "Great! Let me search LinkedIn for
     [role] in [location]..."
   - Backend calls LinkedIn API with extracted params
   - Show "Searching LinkedIn..." typing indicator
   - Return results as structured ProfileCard components rendered
     INSIDE the chat message bubble
   - Follow-up AI message: "I found X profiles matching your search.
     Would you like me to filter by experience level, refine the location,
     or export these results?"

3. When NOT a LinkedIn query:
   - Respond as a helpful AI recruiting assistant
   - Answer questions about hiring, recruiting strategies, job market trends
   - Help write job descriptions, outreach messages, interview questions

#### Query Parser (utils/parseLinkedInQuery.js)
Extract from natural language:
- jobTitle: "graphic designer", "React developer", "marketing manager"
- location: "Dubai", "United States", "London", "remote"
- experienceLevel: "senior", "junior", "mid-level", "entry level"
- openToWork: true/false (if user says "open to work" or "actively looking")
- keywords: any additional skills mentioned (React, Figma, Python, etc.)
- industry: if mentioned

#### LinkedIn API Integration (server/routes/linkedin.js)

Use RapidAPI — Fresh LinkedIn Profile Data or LinkedIn API:

```javascript
// Endpoint: GET /api/linkedin/search
// Query params: jobTitle, location, keywords, experienceLevel

const options = {
  method: 'GET',
  url: 'https://linkedin-api8.p.rapidapi.com/search-people',
  params: {
    keywords: `${jobTitle} ${keywords}`,
    location: location,
    page: '1'
  },
  headers: {
    'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
    'X-RapidAPI-Host': 'linkedin-api8.p.rapidapi.com'
  }
}
```

Map API response to this profile schema:
```javascript
{
  id: string,
  name: string,
  headline: string,          // "Senior React Developer at Google"
  location: string,
  profileUrl: string,        // LinkedIn profile URL
  avatar: string,            // Profile picture URL
  currentCompany: string,
  currentRole: string,
  experienceYears: number,
  skills: string[],
  openToWork: boolean,
  connections: string,       // "500+" connections
  summary: string
}
```

#### Profile Cards (rendered inside chat)

Each profile card shows:
- Avatar (with fallback initials if no photo)
- Full name + LinkedIn icon link
- Current role + company
- Location + experience badge
- Top 3 skills as pill badges
- "Open to Work" green banner if applicable
- Two buttons: "View Full Profile" (opens modal) + "Save Profile"
- Connection count

ProfileGrid: renders up to 6 cards in a 2-column grid inside chat bubble
"Show more" button loads next page of results

#### Profile Modal
Clicking "View Full Profile" opens a full-screen modal with:
- Large avatar + cover banner
- Full name, headline, location
- About/Summary section
- Experience timeline
- Education section
- Skills list (all skills)
- "Open LinkedIn Profile" button
- "Save to List" button
- "Send Outreach Template" button (generates AI outreach message)

#### Filter Bar (appears after results load)
- Filter chips: Location, Experience Level, Open to Work, Industry,
  Company Size
- Sort by: Relevance, Experience, Connections
- Results count badge

---

## 5. DESIGN SYSTEM

### Color Palette (CSS Variables + Tailwind config)
```
Primary:     #6366F1  (Indigo)
Secondary:   #8B5CF6  (Violet)
Accent:      #06B6D4  (Cyan)
Background:  #0F0F1A  (Dark navy — dark mode default)
Surface:     #1A1A2E  (Card backgrounds)
Border:      #2D2D4A
Text Primary: #F8FAFC
Text Muted:  #94A3B8
Success:     #10B981
Warning:     #F59E0B
Error:       #EF4444
Gradient:    linear-gradient(135deg, #6366F1, #8B5CF6, #06B6D4)
```

### Typography
- Font: "Inter" from Google Fonts
- Headings: font-bold, tracking-tight
- Body: font-normal, leading-relaxed
- Monospace: "JetBrains Mono" for code blocks

### Spacing & Layout
- Max content width: 1280px
- Chat area max width: 800px
- Border radius: rounded-xl (12px) for cards, rounded-2xl (16px) for modals
- Consistent padding: p-4 mobile, p-6 tablet, p-8 desktop

### Shadows
- Cards: 0 4px 24px rgba(99, 102, 241, 0.15)
- Modals: 0 25px 50px rgba(0, 0, 0, 0.5)
- Glow effect on active elements: 0 0 20px rgba(99, 102, 241, 0.4)

### Dark Mode
- App defaults to dark mode
- Light mode toggle in settings
- Use Tailwind dark: classes + CSS variables

---

## 6. ANIMATIONS (Framer Motion)

- Page transitions: fade + slide up (0.3s)
- Chat messages: slide in from bottom with fade
- Profile cards: stagger animation (each card appears 0.1s after previous)
- Typing indicator: bounce animation
- Modal: scale + fade in
- Sidebar: slide in/out
- Button hover: subtle scale(1.02) + glow
- Loading skeleton: shimmer animation
- Hero floating elements: slow floating animation (CSS keyframes)

---

## 7. MOBILE RESPONSIVENESS

### Breakpoints (Tailwind defaults)
- sm: 640px, md: 768px, lg: 1024px, xl: 1280px

### Mobile-specific UI
- Bottom navigation bar (Home, Chat, Saved, Profile)
- Chat sidebar becomes a slide-out drawer
- Profile cards stack to 1 column
- Filter bar becomes a bottom sheet modal
- Touch-friendly tap targets (min 44px)
- Swipe gestures on carousel and modals
- Safe area insets for notched phones (env(safe-area-inset-*))

---

## 8. STATE MANAGEMENT (Zustand)

### chatStore.js
```javascript
{
  conversations: [],         // all chat sessions
  activeConversationId: null,
  messages: [],              // messages in active chat
  isLoading: false,
  isSearching: false,
  addMessage: fn,
  setLoading: fn,
  createConversation: fn,
  loadConversation: fn,
  clearChat: fn
}
```

### searchStore.js
```javascript
{
  results: [],               // LinkedIn profile results
  filters: {},
  totalResults: 0,
  currentPage: 1,
  savedProfiles: [],
  setResults: fn,
  saveProfile: fn,
  removeProfile: fn,
  setFilters: fn,
  loadNextPage: fn
}
```

### authStore.js
```javascript
{
  user: null,
  isAuthenticated: false,
  token: null,
  login: fn,
  logout: fn,
  register: fn
}
```

---

## 9. API LAYER

### Backend Endpoints (Express)

```
POST   /api/chat              → Send message to OpenAI
GET    /api/linkedin/search   → Search LinkedIn profiles
GET    /api/linkedin/profile/:id → Get full profile details
POST   /api/auth/login        → Authenticate user
POST   /api/auth/register     → Register new user
GET    /api/user/saved        → Get saved profiles
POST   /api/user/saved        → Save a profile
DELETE /api/user/saved/:id    → Remove saved profile
GET    /api/chat/history      → Get conversation history
```

### OpenAI System Prompt (server/routes/chat.js)
```
You are Bond, an AI-powered recruiting assistant. Your job is to help
recruiters and hiring managers find the perfect candidates on LinkedIn.

When users ask you to find people (developers, designers, managers, etc.),
extract the job title, location, skills, and experience level from their
message and trigger a LinkedIn search. Always respond in a friendly,
professional tone.

When showing search results, summarize what you found and offer to:
- Refine the search
- Filter by specific criteria
- Generate personalized outreach messages
- Export the results

For non-search questions, provide expert recruiting advice, help write
job descriptions, interview questions, or outreach messages.

Always respond in Markdown format for rich text rendering.
```

---

## 10. ENVIRONMENT VARIABLES

### client/.env
```
VITE_API_BASE_URL=http://localhost:5000/api
```

### server/.env
```
PORT=5000
OPENAI_API_KEY=your_openai_key_here
RAPIDAPI_KEY=your_rapidapi_key_here
RAPIDAPI_HOST=linkedin-api8.p.rapidapi.com
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
```

---

## 11. SAMPLE DATA (Fallback Mock Data)

If LinkedIn API is unavailable or rate-limited, use this mock data:

Create 12 realistic mock profiles in utils/mockProfiles.js:
- Vary roles: developers, designers, managers, engineers
- Vary locations: Dubai, London, NYC, Remote, San Francisco
- Use UI Avatars API for profile photos:
  https://ui-avatars.com/api/?name=John+Doe&background=6366F1&color=fff
- Include realistic headlines, companies, skill sets
- Always fall back to mock data gracefully with a notice:
  "Showing sample results. Connect your LinkedIn API for live data."

---

## 12. ERROR HANDLING

- API failures: show toast notification + fallback to mock data
- Network errors: offline banner at top of page
- Auth errors: redirect to login with toast message
- Empty results: friendly empty state with suggestions
- Rate limiting: show "You've reached your search limit" modal
  with upgrade CTA
- All async operations wrapped in try/catch
- React Error Boundary on Chat and Results components

---

## 13. PERFORMANCE

- React.lazy + Suspense for route-level code splitting
- Virtualized list for long chat histories (react-window)
- Image lazy loading with blur placeholder
- Debounce search input (300ms)
- React Query caching for LinkedIn results (5 min stale time)
- Memoize expensive components with React.memo and useMemo

---

## 14. ADDITIONAL FEATURES

### Outreach Message Generator
When user clicks "Send Outreach" on a profile:
- Modal opens with AI-generated personalized LinkedIn message
- Based on: candidate's name, role, company, skills
- User can edit before copying
- "Regenerate" button for alternative versions

### Export Feature
- Export results as CSV (name, role, company, LinkedIn URL, location)
- Export as PDF (styled profile cards using jsPDF)
- "Copy LinkedIn URL" button on each card

### Chat History
- All conversations saved to localStorage
- Sidebar shows last 10 conversations with title + date
- Search through chat history
- Delete individual conversations
- Clear all history option

### Settings Page
- Profile settings: name, email, avatar
- API Configuration: add own OpenAI key + RapidAPI key
- Appearance: dark/light mode toggle, font size
- Notifications: email preferences
- Danger zone: delete account, clear data

---

## 15. BUILD & RUN INSTRUCTIONS (README.md)

Generate a full README.md with:
1. Project overview + screenshot placeholder
2. Features list
3. Tech stack
4. Prerequisites (Node 18+, npm 9+)
5. Installation steps:
   - Clone repo
   - Install client deps: cd client && npm install
   - Install server deps: cd server && npm install
   - Configure .env files
   - Run dev: npm run dev (client) + npm run dev (server)
   - Or use concurrently from root
6. How to get API keys:
   - OpenAI API key (platform.openai.com)
   - RapidAPI LinkedIn key (rapidapi.com/search LinkedIn API)
7. Deployment instructions (Vercel for client, Railway for server)

---

## START INSTRUCTION FOR CURSOR

Build this project step by step in this order:
1. Initialize Vite + React project, install all dependencies
2. Set up Tailwind CSS + design tokens + globals.css
3. Build Express server with all routes (stubbed)
4. Build Zustand stores
5. Build layout components (Navbar, Sidebar, MobileNav)
6. Build Landing page (Hero → Features → HowItWorks → Pricing → Footer)
7. Build Auth pages (Login + Register)
8. Build Chat page with ChatWindow, ChatInput, TypingIndicator
9. Build LinkedIn query parser + API integration
10. Build ProfileCard, ProfileGrid, ProfileModal
11. Build Dashboard page
12. Connect OpenAI API to chat route
13. Connect LinkedIn API to search route
14. Add Framer Motion animations throughout
15. Mobile responsiveness pass — test all breakpoints
16. Error handling + loading states + empty states
17. Final polish: shadows, gradients, micro-interactions
