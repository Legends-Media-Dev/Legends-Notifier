import { useState, FormEvent, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Lock, User, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 300));

    const success = login(username.trim(), password);

    if (success) {
      navigate('/');
    } else {
      setError('Invalid username or password');
      setPassword('');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-ink-light rounded-2xl border border-ink-border p-8 sm:p-10 shadow-2xl">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-accent rounded-2xl mb-4 shadow-lg shadow-accent/30"
            >
              <Zap className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Legends Admin</h1>
            <p className="text-zinc-400 text-sm">Sign in to manage your app</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-zinc-500" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(''); }}
                  placeholder="Enter your username"
                  required
                  autoFocus
                  className="w-full pl-11 pr-4 py-3 bg-ink border border-ink-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent text-white placeholder:text-zinc-600 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-zinc-500" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-ink border border-ink-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent text-white placeholder:text-zinc-600 transition-all text-sm"
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading || !username.trim() || !password}
              className="w-full px-6 py-3 bg-accent text-white rounded-xl hover:bg-accent-hover transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent/20 text-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
