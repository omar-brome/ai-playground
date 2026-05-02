# Cursor AI Prompts for Bond AI Clone

Use these prompts in Cursor to generate code components and features. Simply copy and paste into the Cursor chat.

---

## 🎨 UI Component Prompts

### Navbar Component
```
Generate a React component for a sticky navbar with:
- Logo on the left
- Navigation links in center (Features, How it Works, Pricing, Blog)
- Login and Get Started buttons on right
- Mobile: hamburger menu that opens a full-screen overlay
- Design: Use Tailwind CSS with a frosted glass effect (backdrop-blur)
- Colors: Use primary indigo (#6366F1) for buttons, text on dark background (#0F0F1A)
- Font: Inter font family
- Animation: Smooth slide-in for mobile menu using Framer Motion

Follow the design system in the PDS.md file.
```

### Chat Message Component
```
Generate a React component that displays a single chat message with:
- User messages: right-aligned, gradient bubble (purple to blue), user avatar on right
- AI messages: left-aligned, card with dark background, AI avatar on left
- Support Markdown rendering (bold, lists, code blocks, tables)
- Copy message button on hover
- Timestamp visible on hover
- Smooth slide-in animation from bottom
- Props: { role: 'user' | 'assistant', content: string, timestamp: Date }

Use Framer Motion for animations and react-markdown for rendering.
```

### Profile Card Component
```
Generate a React component for displaying a LinkedIn profile card with:
- Avatar (circular, with fallback initials)
- Full name + LinkedIn icon link
- Current role and company
- Location badge + experience badge (e.g., "5+ years")
- Top 3 skills as pill badges
- Green "Open to Work" banner if applicable
- Two action buttons: "View Full Profile" + "Save Profile"
- Connection count (e.g., "500+")
- Hover effect: subtle scale and shadow
- Responsive: works on mobile

Use Tailwind CSS and Lucide React icons.
```

### Chat Input Component
```
Generate a React component for chat input with:
- Auto-expanding textarea (grows with content, max 5 lines)
- Send button (disabled when empty, shows spinner while sending)
- Character counter (0/500)
- Keyboard support: Enter to send, Shift+Enter for new line
- Suggested prompt chips displayed above input on empty state:
  * "Find React developers in Dubai"
  * "Show me UX designers with 5+ years experience"
  * "Find marketing managers in London"
- Attach file icon (UI placeholder)
- Sticky at bottom

Use Tailwind CSS and React Hook Form. Include keyboard event handlers.
```

---

## 📄 Page Prompts

### Landing Page Hero Section
```
Generate the Hero section of a landing page with:
- Large headline: "Find Top Talent with AI-Powered LinkedIn Search"
- Subheadline: "Chat naturally with our AI. Get instant access to LinkedIn profiles matching your exact needs."
- Animated chat demo mockup showing sample conversation (CSS animation)
- Two CTA buttons: "Start for Free" (filled) + "Watch Demo" (outlined)
- Floating animated background: subtle gradient orbs (purple, blue, indigo)
- Dot grid background pattern
- Dark background (#0F0F1A), text in white (#F8FAFC)
- Responsive: full-width on mobile, centered on desktop
- Animations: floating elements, button hover effects

Use Tailwind CSS, Framer Motion, and CSS gradients. Follow the PDS.md design system.
```

### Features Section
```
Generate a Features section with:
- 6 feature cards in a grid (3x2 on desktop, 2x2 on tablet, 1 on mobile)
- Features:
  1. Natural Language Search — "Just describe who you need"
  2. Real LinkedIn Data — "Live profiles, not outdated databases"
  3. Smart Filters — "Filter by location, experience, skills"
  4. Export Results — "Download profiles as CSV or PDF"
  5. Chat History — "Pick up where you left off"
  6. Team Collaboration — "Share searches with your team"
- Each card: Lucide icon + title + description
- Hover animation: scale(1.05) with shadow
- Staggered animation: each card appears 0.1s after previous

Use Tailwind CSS, Framer Motion, and Lucide React icons.
```

### Login Page
```
Generate a login page with:
- Centered card layout (400px wide)
- Gradient background (from primary indigo to secondary violet)
- Form fields: email input + password input
- "Remember me" checkbox
- "Forgot password?" link
- "Sign in" button (full width, gradient)
- Form validation: email format, password min 8 chars
- Show inline error messages below each field
- Link to register page: "Don't have an account? Sign up"
- Google OAuth button marked "Coming soon" (disabled)
- Smooth fade-in animation

Use React Hook Form, Zod validation, and Tailwind CSS.
```

### Chat Page Layout
```
Generate the main Chat page layout with:
- Left sidebar: 
  * "New Chat" button
  * Chat history list (last 10 conversations)
  * Each item shows title + last message date
- Main area: ChatWindow component (message history + chat input)
- Right panel (toggleable): Profile results showing matched profiles
- On mobile: Bottom navigation tabs (Chat, Saved, Profile), full-screen chat
- Left sidebar collapsible on mobile (hamburger → slide drawer)

Use React Router, Zustand for state, and Tailwind CSS grid layout.
```

---

## 🔌 Integration Prompts

### LinkedIn Query Parser
```
Generate a utility function `parseLinkedInQuery(userMessage)` that:
- Extracts from natural language:
  * jobTitle: "graphic designer", "React developer", etc.
  * location: "Dubai", "London", "remote", etc.
  * experienceLevel: "senior", "junior", "mid-level"
  * openToWork: true/false (if "open to work" mentioned)
  * keywords: additional skills (React, Figma, Python, etc.)
  * industry: if mentioned
- Returns: { jobTitle, location, experienceLevel, openToWork, keywords, industry }
- Example: "Find me senior React developers in Dubai" →
  { jobTitle: 'React Developer', location: 'Dubai', experienceLevel: 'senior' }

Use regex patterns and string matching.
```

### OpenAI API Integration
```
Generate a server route `POST /api/chat` that:
- Receives: { message: string, conversationId?: string }
- Detects if message is a LinkedIn search query using keyword matching
- If LinkedIn query:
  * Parse query using parseLinkedInQuery()
  * Call LinkedIn API with extracted params
  * Return AI response with profile results
- If regular question:
  * Send to OpenAI GPT-4o as recruiting assistant
  * Return text response
- Error handling: try/catch, return 500 with error message

Use OpenAI API, Express, and Axios. Include proper system prompt for recruiting context.
```

### LinkedIn API Integration
```
Generate a server route `GET /api/linkedin/search` that:
- Query params: jobTitle, location, keywords, experienceLevel
- Calls RapidAPI LinkedIn API
- Maps response to profile schema:
  * { id, name, headline, location, profileUrl, avatar, company, role, skills, etc. }
- Fallback to mock data if API fails
- Error handling: rate limiting message, proper HTTP status codes
- Rate limiting: max 30 requests per 15 minutes

Use RapidAPI, Axios, and fallback to mockProfiles.js on error.
```

---

## 🎯 Feature Prompts

### Dark/Light Mode Toggle
```
Generate a hook `useDarkMode()` that:
- Toggles dark/light mode
- Persists preference to localStorage
- Returns: { isDark, toggle }
- Apply to entire app by wrapping with context

Use React Context and localStorage. Tailwind dark: mode.
```

### Profile Saving Feature
```
Generate functionality to:
- Save/unsave profiles to localStorage
- Display "Save Profile" button on each card
- Show saved icon when profile is saved
- Display count of saved profiles in sidebar
- Create "Saved Profiles" page showing all saved profiles
- Bulk delete saved profiles

Use Zustand store, localStorage persistence, and React hooks.
```

### Chat History
```
Generate chat history functionality:
- Save conversations to localStorage with auto-generated titles
- Sidebar shows last 10 conversations with title + date
- Click conversation to load it
- "Delete conversation" option
- "Clear all history" with confirmation modal
- Search through chat history

Use Zustand store, localStorage, and date-fns for formatting.
```

### Export Results
```
Generate export feature with:
- "Export as CSV" button: name, role, company, LinkedIn URL, location
- "Export as PDF" button: styled profile cards
- "Copy LinkedIn URL" button on each card
- Toast notification on copy/export success

Use Papa Parse for CSV, jsPDF for PDF, and react-hot-toast for notifications.
```

---

## 🎨 Animation Prompts

### Message Entrance Animation
```
Generate a Framer Motion animation where chat messages:
- Slide in from bottom with fade effect
- Duration: 200ms
- Stagger: each message 0.05s after previous
- Easing: ease-out

Use `motion.div` and `AnimatePresence` from Framer Motion.
```

### Loading Skeleton
```
Generate a skeleton loading component with:
- Shimmer animation (left-to-right, 1.5s duration)
- Placeholder shapes matching profile card layout
- Smooth fade transition when loading completes

Use Tailwind CSS and CSS keyframes for shimmer effect.
```

### Modal Animation
```
Generate a modal component with:
- Scale animation: 0.9 → 1.0
- Fade animation: 0 → 1.0
- Duration: 250ms, ease-out
- Backdrop: fade in
- Close animation: reverse

Use Framer Motion with `AnimatePresence`.
```

---

## 🔧 Utility Prompts

### Mock Profiles Generator
```
Generate 12 realistic mock LinkedIn profiles in `utils/mockProfiles.js`:
- Vary roles: developers, designers, managers, engineers
- Vary locations: Dubai, London, NYC, Remote, San Francisco
- Use UI Avatars API for photos: https://ui-avatars.com/api/?name=John+Doe&background=6366F1&color=fff
- Include: name, headline, company, role, experience, skills, connections
- Profile schema: { id, name, headline, location, profileUrl, avatar, currentCompany, currentRole, experienceYears, skills, openToWork, connections, summary }

Export as default array.
```

### Error Boundary Component
```
Generate a React Error Boundary component that:
- Catches errors in Chat and Results components
- Displays fallback UI with error message
- Includes "Try again" button
- Logs error to console

Use class component and componentDidCatch lifecycle.
```

---

## 🚀 Full Feature Prompts

### Complete Chat Page
```
Generate a complete Chat page with:
- Layout: left sidebar + main chat + right results panel
- Left sidebar: chat history + new chat button
- Main area: messages display + chat input + typing indicator
- Right panel: profile results grid
- Mobile: bottom tabs, full-screen chat, collapsible sidebar
- All components integrated with Zustand stores
- Connected to backend APIs for messages and LinkedIn search

Import from existing components. Use React Router for state management.
```

### Complete Authentication System
```
Generate complete auth system:
- Login page with email/password form
- Register page with validation
- JWT token storage in localStorage
- Protected routes that redirect to login if not authenticated
- Auth store in Zustand
- useAuth hook for components
- Logout button in navbar
- Server routes: POST /api/auth/login, POST /api/auth/register

Use React Hook Form, JWT, localStorage, and React Router.
```

---

## 💡 Pro Tips

1. **Always reference PDS.md** for specifications
2. **Use existing components** - don't regenerate
3. **Keep components reusable** - pass props for customization
4. **Follow design system** - use exact colors, spacing, fonts
5. **Test responsive** - check mobile, tablet, desktop
6. **Error handling** - always include try/catch and fallbacks
7. **Performance** - use React.memo, useMemo for expensive components

---

## 🎯 Suggested Cursor Workflow

1. Paste PDS.md content into Cursor chat for context
2. Use "Generate X component" prompts in order
3. After each component, ask: "Now add the next component"
4. For page layouts, ask: "Integrate these components into a page"
5. Finally: "Connect to backend APIs"

---

**Happy coding with Cursor! 🚀**
