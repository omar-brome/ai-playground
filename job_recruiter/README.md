# Bond AI Clone — AI-Powered Recruiting Assistant

> A production-ready React web application for AI-powered LinkedIn profile discovery and recruiting. Similar to [askbond.ai](https://www.askbond.ai/).

---

## 🎯 Features

✅ **Natural Language Search** — Ask "Find me React developers in Dubai" and get instant results  
✅ **Real-time LinkedIn Integration** — Live profile data from LinkedIn via RapidAPI  
✅ **AI Chat Assistant** — Powered by OpenAI GPT-4o for intelligent conversations  
✅ **Profile Management** — View, save, and export candidate profiles  
✅ **Smart Filtering** — Filter by location, experience, skills, and more  
✅ **Outreach Generator** — AI-generated personalized LinkedIn messages  
✅ **Dark Mode** — Beautiful dark-first design with light mode toggle  
✅ **Fully Responsive** — Mobile, tablet, and desktop optimized  
✅ **Chat History** — Save and revisit previous searches  
✅ **Export Results** — Download profiles as CSV or PDF  

---

## 🛠 Tech Stack

### Frontend
- **React 18+** with Vite
- **React Router v6** for SPA routing
- **Tailwind CSS v3** for styling
- **Framer Motion** for animations
- **Zustand** for state management
- **React Query** for data fetching
- **React Hook Form + Zod** for validation
- **Lucide React** for icons
- **React Hot Toast** for notifications
- **React Markdown** for message rendering

### Backend
- **Node.js + Express**
- **OpenAI API** (GPT-4o)
- **RapidAPI LinkedIn API**
- **JWT Authentication**
- **Rate Limiting & CORS**

---

## 📋 Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- **OpenAI API Key** (get it [here](https://platform.openai.com/api-keys))
- **RapidAPI Key + LinkedIn API** (subscribe [here](https://rapidapi.com/))

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone <repository-url>
cd bond-ai-clone
```

### 2. Install dependencies

#### Frontend
```bash
cd client
npm install
```

#### Backend
```bash
cd ../server
npm install
```

### 3. Configure environment variables

#### client/.env
Create a `.env` file in the `client/` directory:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

#### server/.env
Create a `.env` file in the `server/` directory:
```env
PORT=5000
NODE_ENV=development

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# LinkedIn API (RapidAPI)
RAPIDAPI_KEY=your_rapidapi_key_here
RAPIDAPI_HOST=linkedin-api8.p.rapidapi.com

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
```

### 4. Start development servers

#### From root directory (if using concurrently):
```bash
npm run dev
```

#### OR manually in separate terminals:

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
```

The app will be available at `http://localhost:5173/`

---

## 📁 Project Structure

```
bond-ai-clone/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── store/            # Zustand stores
│   │   ├── services/         # API services
│   │   ├── utils/            # Utilities & helpers
│   │   ├── styles/           # Global CSS
│   │   ├── App.jsx           # Main app component
│   │   ├── main.jsx          # Entry point
│   │   └── router.jsx        # Route configuration
│   ├── vite.config.js        # Vite configuration
│   ├── tailwind.config.js    # Tailwind configuration
│   └── package.json
│
├── server/                   # Express backend
│   ├── routes/              # API routes
│   ├── middleware/          # Express middleware
│   ├── utils/               # Utilities
│   ├── index.js             # Server entry point
│   └── package.json
│
└── README.md
```

---

## 📝 Available Scripts

### Client
```bash
npm run dev      # Start dev server (Vite)
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Lint with ESLint
```

### Server
```bash
npm run dev      # Start with nodemon
npm run start    # Start production server
```

---

## 🔑 How to Get API Keys

### OpenAI API Key
1. Go to [platform.openai.com](https://platform.openai.com/api-keys)
2. Sign up or log in
3. Navigate to "API Keys" section
4. Click "Create new secret key"
5. Copy and paste into `server/.env`

### RapidAPI LinkedIn Key
1. Go to [rapidapi.com](https://rapidapi.com/)
2. Sign up or log in
3. Search for "LinkedIn API" or similar
4. Subscribe to the API plan (free tier available)
5. Copy the API Key from the credentials
6. Paste into `server/.env` as `RAPIDAPI_KEY`

---

## 🎨 Design System

### Colors
- **Primary**: #6366F1 (Indigo)
- **Secondary**: #8B5CF6 (Violet)
- **Accent**: #06B6D4 (Cyan)
- **Background**: #0F0F1A (Dark navy)
- **Surface**: #1A1A2E
- **Success**: #10B981
- **Error**: #EF4444

### Typography
- **Font Family**: Inter (Google Fonts)
- **Headings**: Font-bold, tracking-tight
- **Body**: Font-normal, leading-relaxed

---

## 📱 Mobile Responsiveness

The app is fully responsive with mobile-first design:
- **Mobile (< 640px)**: Full-screen layout, bottom navigation
- **Tablet (640px - 1024px)**: 2-column layout, drawer navigation
- **Desktop (> 1024px)**: 3-column layout, sidebar navigation

---

## 🔐 Authentication

- Email/password authentication with JWT
- localStorage for client-side session persistence
- Protected routes on frontend and backend
- Rate limiting on auth endpoints

---

## ⚙️ Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | ✅ | Backend API base URL (client) |
| `PORT` | ✅ | Server port (default: 5000) |
| `OPENAI_API_KEY` | ✅ | OpenAI API key |
| `RAPIDAPI_KEY` | ✅ | RapidAPI key for LinkedIn |
| `RAPIDAPI_HOST` | ✅ | RapidAPI host name |
| `JWT_SECRET` | ✅ | Secret key for JWT signing |
| `NODE_ENV` | ❌ | Environment (development/production) |

---

## 🐛 Troubleshooting

### Port already in use
```bash
# macOS/Linux
lsof -i :5000
kill -9 <PID>

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### CORS errors
- Ensure backend is running on `http://localhost:5000`
- Check `VITE_API_BASE_URL` matches backend URL
- Verify CORS middleware is properly configured

### API rate limits
- LinkedIn API may have rate limits on free tier
- Fallback mock data is provided in `utils/mockProfiles.js`
- Consider upgrading API plan for higher limits

---

## 📦 Deployment

### Frontend (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd client
vercel
```

### Backend (Railway/Render)
1. Push code to GitHub
2. Connect to Railway/Render
3. Set environment variables in dashboard
4. Deploy automatically on push

---

## 📚 Documentation

- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev)
- [Tailwind CSS Docs](https://tailwindcss.com)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [RapidAPI Docs](https://docs.rapidapi.com)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the LICENSE file for details.

---

## 🙋 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review the PDS.md for specification details

---

## 🎯 Roadmap

- [ ] Social login (Google, LinkedIn)
- [ ] Team collaboration features
- [ ] Advanced filters and saved searches
- [ ] Email integration
- [ ] Analytics dashboard
- [ ] Browser extension
- [ ] Mobile app (React Native)

---

**Made with ❤️ for recruiters and hiring managers**
