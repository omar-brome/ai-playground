import { Link } from 'react-router-dom'
import { Button } from '../components/ui'

function Landing() {
  return (
    <div className="min-h-screen bg-corporate-gradient dark:bg-dark-gradient">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 bg-white/10 dark:bg-neutral-900/10 backdrop-blur-md border-b border-white/20 dark:border-neutral-700/50">
        <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-all duration-300 hover:scale-105 cursor-pointer">
          <div className="w-8 h-8 bg-primary-600 hover:bg-primary-700 rounded-xl flex items-center justify-center shadow-glow-primary hover:shadow-glow transition-all duration-300">
            <span className="text-white font-bold text-sm">B</span>
          </div>
          <span className="text-xl font-bold text-white dark:text-white drop-shadow-lg">Bond AI</span>
        </Link>

        <div className="flex items-center space-x-4">
          <Link to="/login">
            <Button variant="ghost" size="sm" className="backdrop-blur-sm bg-white/10 hover:bg-white/20 border-white/30 text-white">
              Sign In
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="primary" size="sm" className="shadow-glow-primary hover:shadow-glow">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold text-white dark:text-white mb-6 drop-shadow-2xl">
            Find Your Perfect
            <span className="text-primary-300 dark:text-primary-400 drop-shadow-lg"> Candidates</span>
            <br />
            with AI Power
          </h1>

          <p className="text-xl text-white/90 dark:text-white/90 mb-8 max-w-2xl mx-auto drop-shadow-lg">
            Revolutionize your recruiting process with AI-driven LinkedIn search.
            Find, analyze, and connect with top talent in minutes, not hours.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-bounce-in">
            <Link to="/register">
              <Button size="lg" className="shadow-glow-primary hover:shadow-glow hover:scale-105 transition-all duration-300">
                Start Recruiting Today
              </Button>
            </Link>
          </div>

          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 animate-fade-in">
            Revolutionize your recruiting process with AI-driven LinkedIn search.
            Find, analyze, and connect with top talent in minutes, not hours.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Start Recruiting Today
              </Button>
            </Link>
            <Link to="/chat">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Try Demo Chat
              </Button>
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-bg-card p-6 rounded-xl border border-border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">AI-Powered Search</h3>
              <p className="text-text-secondary">Natural language queries to find the perfect candidates instantly.</p>
            </div>

            <div className="bg-bg-card p-6 rounded-xl border border-border">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Smart Analytics</h3>
              <p className="text-text-secondary">Deep insights and analytics on candidate profiles and market trends.</p>
            </div>

            <div className="bg-bg-card p-6 rounded-xl border border-border">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Seamless Integration</h3>
              <p className="text-text-secondary">Connect with LinkedIn and export to your favorite ATS systems.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center text-text-muted">
            <p>&copy; 2024 Bond AI Clone. Built with React & AI.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing