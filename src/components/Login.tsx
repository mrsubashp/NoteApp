import React from 'react';
import { LogIn, StickyNote, ShieldCheck, Cloud } from 'lucide-react';
import { signInWithGoogle, signInWithApple, signInWithMicrosoft } from '../services/authService';

export const Login: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-blue-100/50 p-10 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-blue-500 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-blue-200 animate-bounce">
          <StickyNote size={40} className="text-white" />
        </div>
        
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">NotePro iOS</h1>
        <p className="text-gray-500 mb-10 leading-relaxed">
          Create, sync, and organize your thoughts with high-performance cloud tools.
        </p>
        
        <div className="grid grid-cols-3 gap-6 w-full mb-10">
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 bg-gray-50 rounded-2xl text-blue-500">
              <Cloud size={20} />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cloud Sync</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 bg-gray-50 rounded-2xl text-green-500">
              <ShieldCheck size={20} />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Secure</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 bg-gray-50 rounded-2xl text-orange-500">
              <StickyNote size={20} />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Minimal</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={signInWithGoogle}
            className="w-full bg-white text-gray-900 border border-slate-200 rounded-2xl py-3.5 font-semibold flex items-center justify-center gap-3 hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
          >
            <div className="w-5 h-5 flex items-center justify-center">
               <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/><path fill="none" d="M1 1h22v22H1z"/></svg>
            </div>
            Sign in with Google
          </button>

          <button
            onClick={signInWithMicrosoft}
            className="w-full bg-white text-gray-900 border border-slate-200 rounded-2xl py-3.5 font-semibold flex items-center justify-center gap-3 hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <svg viewBox="0 0 23 23" width="18" height="18"><path fill="#f3f3f3" d="M0 0h23v23H0z"/><path fill="#f35325" d="M1 1h10v10H1z"/><path fill="#81bc06" d="M12 1h10v10h-10z"/><path fill="#05a6f0" d="M1 12h10v10H1z"/><path fill="#ffba08" d="M12 12h10v10h-10z"/></svg>
            </div>
            Sign in with Microsoft
          </button>

          <button
            onClick={signInWithApple}
            className="w-full bg-black text-white rounded-2xl py-3.5 font-semibold flex items-center justify-center gap-3 hover:bg-gray-900 active:scale-95 transition-all shadow-lg"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.47-3.24 0-1.44.61-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.39 5.98.63 7.34-.63 1.5-1.45 2.97-2.68 3.87zM12.03 7.25c-.23-3.2 2.67-5.91 5.75-5.91-.12 3.14-3.32 5.91-5.75 5.91z"/></svg>
            </div>
            Sign in with Apple
          </button>
        </div>
        
        <p className="mt-8 text-xs text-gray-400">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};
