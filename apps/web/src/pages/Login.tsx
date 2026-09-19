import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn } from '@commutai/auth'
import { Bus } from 'lucide-react'
import { Button, Input } from '@commutai/ui'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { staff } = await signIn(email, password)
      
      // Redirect based on role
      switch (staff.role) {
        case 'operator':
          navigate('/operator')
          break
        case 'cs_desk':
          navigate('/customer-service')
          break
        case 'admin':
          navigate('/admin')
          break
        case 'conductor':
          navigate('/conductor')
          break
        default:
          throw new Error('Invalid role')
      }
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: 'url("/background.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/70" />
      <div className="glass-card p-8 rounded-2xl w-full max-w-md mx-auto bg-black/80 backdrop-blur-md relative z-10">
        <div className="flex flex-col items-center mb-8 text-center">
          <img 
            src="/logo.png" 
            alt="CommutAI Logo" 
            className="w-24 h-24 mb-4"
          />
          <h1 className="text-white text-2xl font-bold">CommutAI</h1>
          <p className="text-white/60 text-sm">Transportation Management System</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Email input */}
          <div className="mb-4">
            <Input
              type="email"
              label="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              className="bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-orange-500"
            />
          </div>

          {/* Password input */}
          <div className="mb-4">
            <Input
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-orange-500"
            />
          </div>


          {/* Submit button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 border border-orange-400"
          >
            {loading ? (
              <>
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Logging in...
              </>
            ) : (
              <>
                <Bus size={20} />
                Login
              </>
            )}
          </Button>

        </form>

        <div className="mt-6 text-center">
          <p className="text-white/40 text-xs">
            Secure access to CommutAI system
          </p>
        </div>
      </div>
    </div>
  )
}
