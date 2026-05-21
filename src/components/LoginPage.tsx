import { useState } from 'react'

interface LoginPageProps {
  onLogin: () => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.')
      return
    }

    setLoading(true)

    // Simulate a brief auth delay for UX polish
    setTimeout(() => {
      if (username === 'admin' && password === 'admin123') {
        onLogin()
      } else {
        setError('Invalid username or password. Try admin / admin123')
        setLoading(false)
      }
    }, 600)
  }

  return (
    <div className="login-page">
      <div className="bg-gradient-canvas" />

      <div className="login-container animate-fade-in">
        {/* Brand Header */}
        <div className="login-brand">
          <span className="login-icon">🌐</span>
          <h1 className="login-title">Ethos Academic Directory</h1>
          <p className="login-subtitle">Sign in to access the tenant dashboard</p>
        </div>

        {/* Login Card */}
        <form className="login-card glass-card" onSubmit={handleSubmit} noValidate>
          {error && <div className="login-error">{error}</div>}

          <div className="login-field">
            <label htmlFor="username" className="login-label">Username</label>
            <input
              id="username"
              type="text"
              className="input-field login-input"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className="login-field">
            <label htmlFor="password" className="login-label">Password</label>
            <input
              id="password"
              type="password"
              className="input-field login-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary login-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-small" /> Signing in…
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}