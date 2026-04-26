import React, { useState } from 'react';
import { Search, Plus, Filter, Tag as TagIcon, LayoutGrid, Sparkles } from 'lucide-react';
import { Note } from '../types';
import { NoteCard } from './NoteCard';
import { cn } from '../lib/utils';

interface NoteListProps {
  notes: Note[];
  activeNoteId: string | null;
  onNoteSelect: (id: string) => void;
  onNewNote: () => void;
  onAiGenerate: () => void;
  isMobile?: boolean;
}

export const NoteList: React.FC<NoteListProps> = ({ notes, activeNoteId, onNoteSelect, onNewNote, onAiGenerate, isMobile }) => {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const categories = Array.from(new Set(notes.map(n => n.category))).filter(Boolean);

  const filteredNotes = notes.filter(note => {
    const matchesSearch = 
      note.title.toLowerCase().includes(search.toLowerCase()) || 
      note.content.toLowerCase().includes(search.toLowerCase()) ||
      note.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    
    const matchesFilter = !activeFilter || note.category === activeFilter;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div id="note-list-container" className={cn(
      "flex flex-col h-full bg-white border-r border-slate-200 shrink-0 transition-all",
      isMobile ? "w-full" : "w-80"
    )}>
      <div className="p-4 border-b border-slate-100 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Notes</h1>
          <div className="flex items-center gap-1.5">
            <button 
              onClick={onAiGenerate}
              title="Generate with AI"
              className="p-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 active:scale-95 transition-all shadow-sm"
            >
              <Sparkles size={18} />
            </button>
            <button 
              id="new-note-btn"
              onClick={onNewNote}
              className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setActiveFilter(null)}
            className={`px-3 py-1 border rounded text-[11px] font-semibold transition-all ${
              !activeFilter 
                ? 'bg-slate-900 text-white border-slate-900' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Latest
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-3 py-1 border rounded text-[11px] font-semibold transition-all ${
                activeFilter === cat 
                  ? 'bg-slate-900 text-white border-slate-900' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-200 space-y-px">
        {filteredNotes.length > 0 ? (
          filteredNotes.map(note => (
            <NoteCard 
              key={note.id} 
              note={note} 
              isActive={activeNoteId === note.id}
              onClick={() => onNoteSelect(note.id)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400 p-8 text-center bg-white">
            <LayoutGrid size={32} className="mb-2 opacity-10" />
            <p className="text-sm font-medium">No results found</p>
          </div>
        )}
      </div>
    </div>
  );
};
