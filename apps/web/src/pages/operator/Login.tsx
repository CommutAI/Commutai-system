import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn } from '@commutai/auth';
import { Bus } from 'lucide-react';
import { Button, Input } from '@commutai/ui';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { user, staff } = await signIn(email, password);

      console.log('Login successful:', user);
      
      // Check if user has operator role
      if (staff.role !== 'operator') {
        throw new Error('Access denied. Operator role required.');
      }
      
      // Navigate to home/dashboard on successful login
      navigate('/');
    } catch (error: any) {
      console.error('Login failed:', error);
      setError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

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
          <p className="text-white/60 text-sm">Operator Dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <Input
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="operator@commutai.com"
            required
            className="bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-orange-500"
          />

          <Input
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-orange-500"
          />

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 border border-orange-400"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <Bus size={20} />
                Sign In
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-white/40 text-xs">
            Secure access to CommutAI operator system
          </p>
        </div>
      </div>
    </div>
  );
}
