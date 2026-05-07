import React, { useContext } from 'react';
import { AuthProvider, AuthContext, SignInScreen, TopNav } from './components/AuthWrapper';
import { StarryBackground } from './components/StarryBackground';
import { PromptInterface } from './components/PromptInterface';
import { motion, AnimatePresence } from 'motion/react';

const AppContent: React.FC = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[#E0E0E0] bg-[#050505] relative font-sans flex flex-col overflow-hidden selection:bg-emerald-500/30 selection:text-emerald-200">
      <StarryBackground />
      <TopNav />
      <div className="relative z-10 flex flex-col flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {!user ? (
            <motion.div
              key="signin"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="w-full flex-1 flex flex-col min-h-0"
            >
              <SignInScreen />
            </motion.div>
          ) : (
            <motion.div
              key="app"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full flex flex-col"
            >
              <PromptInterface />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
