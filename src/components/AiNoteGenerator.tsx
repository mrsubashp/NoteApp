import React, { useState } from 'react';
import { Sparkles, Loader2, X } from 'lucide-react';
import { generateNoteContent } from '../services/geminiService';

interface AiNoteGeneratorProps {
  onGenerated: (title: string, content: string) => void;
  onClose: () => void;
}

export const AiNoteGenerator: React.FC<AiNoteGeneratorProps> = ({ onGenerated, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const { title, content } = await generateNoteContent(prompt);
      onGenerated(title, content);
      onClose();
    } catch (err) {
      console.error('Failed to generate note:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 tracking-tight">AI Note Generator</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Powered by Gemini</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleGenerate} className="p-8 space-y-6">
          <div className="space-y-4">
            <label className="text-sm font-bold text-slate-700 block ml-1">
              What should this note be about?
            </label>
            <textarea
              autoFocus
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A breakdown of a low-carb meal plan, Strategic goals for my new startup, or a summary of Roman history..."
              className="w-full h-32 p-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 focus:ring-0 resize-none transition-all text-slate-800 placeholder:text-slate-300"
            />
          </div>

          {error && (
            <div className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 px-6 rounded-2xl border-2 border-slate-100 text-slate-600 font-bold hover:bg-slate-50 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="flex-[2] py-4 px-6 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Generate Note
                </>
              )}
            </button>
          </div>

          <p className="text-center text-[10px] text-slate-400 font-medium leading-relaxed">
            AI can make mistakes. Please verify important information.
          </p>
        </form>
      </div>
    </div>
  );
};
