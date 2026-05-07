import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { auth, signIn, signOut } from '../firebase/config';
import { LogOut, LogIn, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AuthContext = React.createContext<{ user: User | null; loading: boolean }>({ user: null, loading: true });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const TopNav: React.FC = () => {
  const { user, loading } = React.useContext(AuthContext);

  return (
    <header className="relative z-10 flex items-center justify-between px-6 md:px-10 py-6 md:py-8 border-b border-white/10 shrink-0 bg-[#050505]">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-emerald-500 rounded-sm flex items-center justify-center font-bold text-black font-sans">G</div>
        <span className="text-xl font-light tracking-[0.3em] uppercase hidden sm:block">Gemini.Prompt</span>
      </div>

      <div className="flex items-center gap-4 sm:gap-8">
        <nav className="hidden md:flex gap-6 text-[11px] uppercase tracking-widest opacity-60 font-medium">
          <a href="#" className="hover:text-emerald-400 transition-colors">Models</a>
          <a href="#" className="hover:text-emerald-400 transition-colors">History</a>
          <a href="#" className="hover:text-emerald-400 transition-colors">Settings</a>
        </nav>
        {loading ? (
          <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
        ) : user ? (
          <div className="flex items-center gap-4">
            <span className="text-xs uppercase tracking-widest text-[#E0E0E0]/60 hidden lg:block">
              {user.displayName || user.email}
            </span>
            <button
              onClick={signOut}
              className="px-5 py-2.5 bg-white text-black text-[11px] uppercase tracking-tighter font-bold flex items-center gap-3 hover:bg-emerald-400 transition-all rounded-none"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
};

export const SignInScreen: React.FC = () => {
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signIn();
    } catch (e) {
      console.error(e);
      setIsSigningIn(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center pt-24 px-4 bg-transparent z-10 relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-sm flex flex-col items-center text-center shadow-2xl"
      >
        <div className="w-16 h-16 bg-emerald-500 rounded-sm flex items-center justify-center mb-6">
          <span className="text-4xl font-bold text-black font-sans">G</span>
        </div>
        <h1 className="text-3xl font-light uppercase tracking-widest text-white mb-3">Authenticate</h1>
        <p className="text-[#E0E0E0]/40 mb-8 max-w-sm text-[11px] uppercase tracking-widest leading-relaxed">
          Secure origin required to begin synthesis.
        </p>

        <button
          onClick={handleSignIn}
          disabled={isSigningIn}
          className="w-full bg-emerald-600 hover:bg-emerald-500 py-4 text-black font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 rounded-none disabled:opacity-50"
        >
          {isSigningIn ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google Auth
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
};
