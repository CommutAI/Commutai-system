import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn } from '@commutai/auth';
import { Bus } from 'lucide-react';
import { Button, Input } from '@commutai/ui';
import logo from './assets/logo.png';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { staff } = await signIn(email, password);
      if (staff.role !== 'cs_desk' && staff.role !== 'admin') {
        throw new Error('Access denied');
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
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
            src={logo} 
            alt="CommutAI Logo" 
            className="w-24 h-24 mb-4"
          />
          <h1 className="text-white text-2xl font-bold">CommutAI</h1>
          <p className="text-white/60 text-sm">Customer Service Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
            required
            placeholder="admin@commutai.com"
            className="bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-orange-500"
          />

          <Input
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="!bg-white/10 !border-white/20 text-white placeholder-white/40 focus:!border-orange-500"
          />

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 border border-orange-400"
          >
            {isLoading ? (
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
            Secure access to CommutAI customer service system
          </p>
        </div>
      </div>
    </div>
  );
}
