import React, { useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Bus } from 'lucide-react';
import { useApp } from '../context/AppContext';
// import Logo from "../../components/Logo";
import { Button, Input, Toast, type ToastColor } from '@commutai/ui';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<ToastColor>('danger');
  const { signIn, profile } = useApp();
  const history = useHistory();

  // Navigate as soon as profile is set — works for both online and offline login
  React.useEffect(() => {
    if (profile) {
      history.push('/');
    }
  }, [profile, history]);

  function showNotification(message: string, color: 'success' | 'danger' | 'warning' = 'danger') {
    setToastMessage(message);
    setToastColor(color);
    setShowToast(true);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      showNotification('Please enter your email and password.', 'warning');
      return;
    }

    setLoading(true);

    try {
      const result = await signIn(email.trim(), password);
      setLoading(false);

      if (result.error) {
        showNotification(
          typeof result.error === 'string' ? result.error : 'Login failed. Please check your credentials.',
          'danger',
        );
      }
      // On success, the useEffect above handles navigation
    } catch (err) {
      setLoading(false);
      showNotification(err instanceof Error ? err.message : 'An unexpected error occurred', 'danger');
    }
  }

  return (
    <IonPage>
      <IonContent fullscreen className="app-page-bg" style={{
        backgroundImage: 'url("/background.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>

        {/* ── Full-screen centered layout ── */}
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 20px',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 0,
          }} />

          {/* ── Brand mark ── */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            style={{ textAlign: 'center', marginBottom: 32, position: 'relative', zIndex: 10 }}
          >
            {/* <Logo size="xl" /> */}
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 900,
              margin: '14px 0 4px',
              color: '#ffffff',
              letterSpacing: '-0.04em',
              lineHeight: 1,
            }}>
              CommutAI
            </h1>
            <p style={{
              margin: 0,
              fontSize: '0.9rem',
              color: 'rgba(255,255,255,0.75)',
              fontWeight: 500,
            }}>
              Conductor Portal
            </p>
          </motion.div>

          {/* ── Login card ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            style={{
              width: '100%',
              maxWidth: 400,
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(12px)',
              borderRadius: 24,
              padding: '28px 24px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
              position: 'relative',
              zIndex: 10,
            }}
          >
            <h2 style={{
              margin: '0 0 4px',
              fontSize: '1.3rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}>
              Welcome back
            </h2>
            <p style={{
              margin: '0 0 24px',
              fontSize: '0.88rem',
              color: 'var(--text-secondary)',
              fontWeight: 500,
            }}>
              Log in to start your shift
            </p>

            <form onSubmit={handleLogin} className="space-y-6">
              <Input
                label="Email Address"
                type="email"
                icon={Mail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="conductor@commutai.com"
                className="bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-orange-500"
              />
              <Input
                label="Password"
                type="password"
                icon={Lock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
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
                Secure access to CommutAI conductor system
              </p>
            </div>
          </motion.div>

        </div>

        <Toast
          isOpen={showToast}
          message={toastMessage}
          color={toastColor}
          onDismiss={() => setShowToast(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default LoginPage;
