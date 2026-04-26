/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { subscribeToAuth, logout } from './services/authService';
import { subscribeToNotes, createNote, updateNote, deleteNote } from './services/noteService';
import { Note, UserProfile } from './types';
import { Login } from './components/Login';
import { NoteList } from './components/NoteList';
import { NoteEditor } from './components/NoteEditor';
import { CloudSyncSettings } from './components/CloudSyncSettings';
import { AiNoteGenerator } from './components/AiNoteGenerator';
import { LogOut, Bell, Settings, StickyNote as StickyNoteIcon, Cloud, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from './lib/firebase';
import { cn } from './lib/utils';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'notes' | 'settings'>('notes');
  const [isAiGeneratorOpen, setIsAiGeneratorOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((u) => {
      setUser(u);
      if (!u) {
        setLoading(false);
        setProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const unsubProfile = onSnapshot(doc(db, 'users', user.uid), (snap) => {
        if (snap.exists()) setProfile(snap.data() as UserProfile);
        setLoading(false);
      });
      
      const unsubscribe = subscribeToNotes(user.uid, user.email || '', (fetchedNotes) => {
        setNotes(fetchedNotes);
      });
      return () => {
        unsubProfile();
        unsubscribe();
      };
    }
  }, [user]);

  const handleUpdateSync = async (pref: UserProfile['syncPreference']) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid), { syncPreference: pref });
  };

  // Reminder Checker
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      notes.forEach(note => {
        if (note.reminder?.enabled && note.reminder.datetime) {
          const reminderTime = new Date(note.reminder.datetime);
          // Check if notification is within the last minute (to avoid missing it due to interval)
          if (reminderTime <= now && reminderTime > new Date(now.getTime() - 60000)) {
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification(`NotePro Reminder: ${note.title}`, {
                body: note.content.slice(0, 100),
                icon: '/vite.svg'
              });
            } else {
              alert(`Reminder: ${note.title}\n\n${note.content.slice(0, 50)}...`);
            }
            // Disable reminder after triggered to prevent repeats
            updateNote(note.id, { reminder: { ...note.reminder, enabled: false } });
          }
        }
      });
    };

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const interval = setInterval(checkReminders, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [notes]);

  const handleNewNote = async () => {
    if (!user) return;
    const newNoteId = await createNote({
      userId: user.uid,
      title: 'Untitled Note',
      content: '',
      tags: [],
      category: 'General',
      attachments: [],
      reminder: { datetime: new Date().toISOString(), enabled: false }
    });
    if (newNoteId) setActiveNoteId(newNoteId);
  };
  
  const handleAiNoteGenerated = async (title: string, content: string) => {
    if (!user) return;
    const newNoteId = await createNote({
      userId: user.uid,
      title: title,
      content: content,
      tags: ['AI Generated'],
      category: 'General',
      attachments: [],
      reminder: { datetime: new Date().toISOString(), enabled: false }
    });
    if (newNoteId) setActiveNoteId(newNoteId);
  };

  const handleUpdateNote = async (id: string, data: Partial<Note>) => {
    await updateNote(id, data);
    
    // Background Cloud Sync logic
    if (profile?.syncPreference && profile.syncPreference !== 'firebase') {
      const updatedNote = notes.find(n => n.id === id);
      if (updatedNote) {
        const fullNote = { ...updatedNote, ...data };
        
        // Dynamic import of sync services
        const { syncToICloud, syncToGoogleDrive, syncToOneDrive } = await import('./services/cloudSyncService');
        
        switch (profile.syncPreference) {
          case 'icloud':
            syncToICloud(fullNote);
            break;
          case 'gdrive':
            import('./services/authService').then(m => {
              const token = m.getAccessToken();
              if (token) syncToGoogleDrive(fullNote, token);
            });
            break;
          case 'onedrive':
            import('./services/authService').then(m => {
              const token = m.getAccessToken();
              if (token) syncToOneDrive(fullNote, token);
            });
            break;
        }
      }
    }
  };

  const handleDeleteNote = (id: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      deleteNote(id);
      setActiveNoteId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F2F2F7]">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }} 
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-12 h-12 bg-blue-500 rounded-xl"
        />
      </div>
    );
  }

  if (!user) return <Login />;

  const activeNote = notes.find(n => n.id === activeNoteId) || null;

  return (
    <div className="h-screen bg-white flex overflow-hidden font-sans text-slate-900 relative">
      {/* Mobile Header / Hamburger */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-100 flex items-center justify-between px-4 z-40">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <div className="w-5 h-0.5 bg-slate-600 mb-1"></div>
              <div className="w-5 h-0.5 bg-slate-600 mb-1"></div>
              <div className="w-5 h-0.5 bg-slate-600"></div>
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs">N</div>
              <span className="font-semibold text-sm tracking-tight">Noted</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <button 
               onClick={() => setIsAiGeneratorOpen(true)}
               className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
             >
               <Sparkles size={20} />
             </button>
          </div>
        </header>
      )}

      {/* Sidebar Nav */}
      <aside className={cn(
        "bg-slate-50 border-r border-slate-200 flex flex-col shrink-0 transition-all duration-300 z-50",
        isMobile 
          ? `fixed inset-y-0 left-0 w-64 shadow-2xl transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}` 
          : "w-64"
      )}>
        <div className="p-6 flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">N</div>
            <span className="font-semibold text-lg tracking-tight text-slate-900">Noted</span>
          </div>
          {isMobile && (
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-slate-400">
              <LogOut size={20} className="rotate-180" />
            </button>
          )}
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">Workspace</div>
          <button 
            onClick={() => {
              setCurrentView('notes');
              if (isMobile) {
                setIsSidebarOpen(false);
                setActiveNoteId(null);
              }
            }}
            className={`w-full flex items-center px-2 py-2 text-sm rounded-md font-medium transition-colors ${currentView === 'notes' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <StickyNoteIcon size={18} className="mr-3" />
            All Notes
          </button>
          <button 
            onClick={() => {
              setCurrentView('settings');
              if (isMobile) setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center px-2 py-2 text-sm rounded-md font-medium transition-colors ${currentView === 'settings' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Cloud size={18} className="mr-3" />
            Cloud & Backup
          </button>
        </nav>

        <div className="p-4 border-t border-slate-200 space-y-4">
          <button 
            onClick={logout}
            className="w-full flex items-center px-2 py-2 text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
          >
            <LogOut size={18} className="mr-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className={cn(
        "flex-1 flex overflow-hidden",
        isMobile && "pt-14"
      )}>
        {currentView === 'notes' ? (
          <>
            {/* Show NoteList if NOT on mobile OR if we don't have an active note selected on mobile */}
            {(!isMobile || !activeNoteId) && (
              <NoteList 
                notes={notes} 
                activeNoteId={activeNoteId} 
                onNoteSelect={setActiveNoteId} 
                onNewNote={handleNewNote}
                onAiGenerate={() => setIsAiGeneratorOpen(true)}
                isMobile={isMobile}
              />
            )}
            
            {/* Show NoteEditor if NOT on mobile OR if we have an active note selected on mobile */}
            {(!isMobile || activeNoteId) && (
              <main className="flex-1 overflow-hidden relative bg-white">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeNoteId || 'empty'}
                    initial={{ opacity: 0, x: isMobile ? 20 : 0 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isMobile ? -20 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                  >
                    <NoteEditor 
                      note={activeNote} 
                      onUpdate={handleUpdateNote} 
                      onDelete={handleDeleteNote}
                      onBack={isMobile ? () => setActiveNoteId(null) : undefined}
                    />
                  </motion.div>
                </AnimatePresence>
              </main>
            )}
          </>
        ) : (
          <main className="flex-1 overflow-y-auto bg-slate-50">
            <CloudSyncSettings 
              profile={profile} 
              onUpdateSync={handleUpdateSync} 
            />
          </main>
        )}
      </div>

      {isAiGeneratorOpen && (
        <AiNoteGenerator 
          onGenerated={handleAiNoteGenerated}
          onClose={() => setIsAiGeneratorOpen(false)}
        />
      )}
    </div>
  );
}

// Re-using icon helper
const StickyNote = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z" />
    <path d="M15 3v5h5" />
  </svg>
);
