import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, Loader2, Copy, Check, Terminal, Zap } from 'lucide-react';
import { AuthContext } from './AuthWrapper';
import { generateProfessionalPrompt } from '../lib/gemini';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { cn } from '../lib/utils';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface PromptRecord {
  id: string;
  original: string;
  enhanced: string;
}

export const PromptInterface: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<PromptRecord | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!input.trim() || !user) return;
    
    setIsGenerating(true);
    setError(null);
    setResult(null);
    setCopied(false);

    try {
      const enhancedPrompt = await generateProfessionalPrompt(input);
      
      // Save to Firebase
      const docRef = await addDoc(collection(db, 'prompts'), {
        userId: user.uid,
        originalPrompt: input,
        enhancedPrompt: enhancedPrompt,
        createdAt: serverTimestamp()
      });

      setResult({
        id: docRef.id,
        original: input,
        enhanced: enhancedPrompt
      });
      setInput('');
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'prompts');
      setError(e instanceof Error ? e.message : 'An error occurred while generating.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.enhanced);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col flex-1 pb-10">
      <main className="relative z-10 flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-1 px-6 md:px-10 py-10 max-w-[1600px] w-full mx-auto">
        
        {/* Input Column */}
        <section className="col-span-1 md:col-span-5 flex flex-col gap-6 h-full">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-500 font-bold">Step 01</span>
            <h2 className="text-4xl font-light leading-tight">Draft your <br/><span className="italic font-serif opacity-50">raw thought</span></h2>
          </div>
          <div className="flex-1 bg-white/5 border border-white/10 p-6 rounded-sm relative min-h-[300px] flex flex-col">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full flex-1 bg-transparent border-none resize-none outline-none text-lg leading-relaxed placeholder:text-white/20 text-white pb-6"
              placeholder="Enter your basic request here..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
            />
            <div className="absolute bottom-4 right-4 flex gap-2">
              <span className="text-[9px] uppercase tracking-widest opacity-40">Shift + Enter to generate</span>
            </div>
          </div>
          <button 
            onClick={handleGenerate}
            disabled={isGenerating || !input.trim()}
            className="w-full bg-emerald-600 hover:bg-emerald-500 py-6 text-black font-black uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed rounded-none shrink-0"
          >
            {isGenerating ? 'Synthesizing...' : 'Refine with Gemini'}
            {!isGenerating && (
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            )}
          </button>

          {error && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="w-full p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center shrink-0"
            >
              {error}
            </motion.div>
          )}
        </section>

        {/* Decorative Divider */}
        <div className="col-span-1 hidden md:flex items-center justify-center">
          <div className="h-full w-[1px] bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
        </div>

        {/* Output Column */}
        <section className="col-span-1 md:col-span-6 flex flex-col gap-6 h-full">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-500 font-bold">Step 02</span>
            <h2 className="text-4xl font-light leading-tight italic font-serif">Professional <span className="not-italic font-sans opacity-100">Output</span></h2>
          </div>
          
          <div className="flex-1 bg-emerald-500/5 border border-emerald-500/20 p-8 rounded-sm overflow-hidden relative group min-h-[300px] flex flex-col">
            {result ? (
               <>
                  <div className="font-mono text-sm leading-relaxed text-emerald-100/80 overflow-y-auto pb-16 flex-1">
                    <p className="mb-4"><span className="text-emerald-400">// SYSTEM_GENERATED_PROMPT</span></p>
                    <p className="whitespace-pre-wrap">{result.enhanced}</p>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-[#050505] to-transparent flex justify-between items-center">
                    <span className="text-[10px] font-mono text-emerald-500/50 uppercase tracking-widest hidden sm:block">Status: SYNC_COMPLETE</span>
                    <button 
                      onClick={handleCopy}
                      className="px-4 py-2 border border-emerald-500 text-emerald-500 text-[10px] uppercase font-bold hover:bg-emerald-500 hover:text-black transition-colors rounded-none ml-auto"
                    >
                      {copied ? 'Copied' : 'Copy Prompt'}
                    </button>
                  </div>
               </>
            ) : (
               <div className="flex-1 flex flex-col items-center justify-center opacity-20 font-mono text-sm uppercase tracking-widest text-center px-4">
                 {isGenerating ? 'Synthesizing output flow...' : 'Awaiting sequence initiation...'}
               </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer Info Bar */}
      <footer className="relative z-10 px-6 md:px-10 py-6 border-t border-white/5 bg-black/40 backdrop-blur-sm flex flex-col sm:flex-row justify-between items-center gap-6 mt-auto">
        <div className="flex gap-10">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest text-white/40 mb-1">Engine</span>
            <span className="text-xs font-mono">GEMINI-2.5-PRO</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest text-white/40 mb-1">Status</span>
            <span className="text-xs font-mono text-emerald-400">ONLINE</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest text-white/40 mb-1">Prompt Mode</span>
            <span className="text-xs font-mono">STRICT_LOGIC</span>
          </div>
        </div>
        <div className="text-[10px] opacity-20 uppercase tracking-widest">
          © {new Date().getFullYear()} CORE PROMPT SYSTEMS.
        </div>
      </footer>
    </div>
  );
};
