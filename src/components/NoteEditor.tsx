import React, { useState, useEffect, useRef } from 'react';
import { 
  Tag as TagIcon, 
  Calendar, 
  Paperclip, 
  Trash2, 
  Download, 
  X, 
  Plus, 
  Clock,
  Check,
  FileText,
  File as FileIcon,
  Users,
  UserPlus,
  Sparkles,
  Loader2,
  RefreshCw,
  CloudCheck,
  CloudUpload
} from 'lucide-react';
import { Note, Attachment } from '../types';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { shareNote, unshareNote } from '../services/noteService';
import { createCalendarEvent } from '../services/calendarService';
import { summarizeNote, improveNote, suggestTags, suggestTitle } from '../services/geminiService';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface NoteEditorProps {
  note: Note | null;
  onUpdate: (id: string, data: Partial<Note>) => void;
  onDelete: (id: string) => void;
  onBack?: () => void;
}

const QUILL_MODULES = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'list': 'check' }],
    ['clean']
  ],
};

export const NoteEditor: React.FC<NoteEditorProps> = ({ note, onUpdate, onDelete, onBack }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [category, setCategory] = useState('');
  const [reminder, setReminder] = useState<{ datetime: string, enabled: boolean } | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (note) {
      isInitialMount.current = true;
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags);
      setCategory(note.category);
      setReminder(note.reminder || null);
      setSaveStatus('saved');
      
      // Reset mount flag after setting initial values
      setTimeout(() => {
        isInitialMount.current = false;
      }, 100);
    } else {
      setTitle('');
      setContent('');
      setTags([]);
      setCategory('');
      setReminder(null);
      setSaveStatus('idle');
    }
  }, [note?.id]); // Only reset on actual note change

  const handleSave = () => {
    if (!note || isInitialMount.current) return;
    
    setSaveStatus('saving');
    onUpdate(note.id, {
      title,
      content,
      tags,
      category,
      reminder: reminder || undefined
    });
    
    // Simulate/Acknowledge save completion
    setTimeout(() => setSaveStatus('saved'), 1000);
  };

  // Auto-save logic
  useEffect(() => {
    if (isInitialMount.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveStatus('idle'); // Status between edits

    saveTimeoutRef.current = setTimeout(() => {
      handleSave();
    }, 2000); // 2 seconds of inactivity

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [title, content, tags, category, reminder]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        handleSave();
      }
    };
  }, []);

  const handleShare = async () => {
    if (!note || !inviteEmail.trim()) return;
    await shareNote(note.id, inviteEmail.trim());
    setInviteEmail('');
    setShowInvite(false);
  };

  const handleRemoveCollaborator = async (email: string) => {
    if (!note) return;
    await unshareNote(note.id, email);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      if (!tags.includes(tagInput.trim())) {
        const newTags = [...tags, tagInput.trim()];
        setTags(newTags);
        if (note) onUpdate(note.id, { tags: newTags });
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(t => t !== tagToRemove);
    setTags(newTags);
    if (note) onUpdate(note.id, { tags: newTags });
  };

  const exportAsPDF = () => {
    if (!note) return;
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text(title || 'Untitled Note', 20, 30);
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Created: ${format(new Date(note.createdAt), 'PPP p')}`, 20, 40);
    doc.text(`Category: ${category || 'None'}`, 20, 47);
    doc.text(`Tags: ${tags.join(', ')}`, 20, 54);
    doc.line(20, 60, 190, 60);
    doc.setTextColor(0);
    doc.setFontSize(14);
    const contentLines = doc.splitTextToSize(content, 170);
    doc.text(contentLines, 20, 75);
    doc.save(`${title || 'note'}.pdf`);
  };

  const exportAsText = () => {
    if (!note) return;
    const plainText = content.replace(/<[^>]*>?/gm, '');
    const blob = new Blob([`Title: ${title}\nCategory: ${category}\nTags: ${tags.join(', ')}\n\n${plainText}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'note'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !note) return;
    
    // In a real app we'd upload to Firebase Storage
    // Here we'll simulate an attachment
    const newAttachment: Attachment = {
      name: file.name,
      url: '#', // Placeholder
      type: file.type,
      size: file.size
    };
    
    const newAttachments = [...(note.attachments || []), newAttachment];
    onUpdate(note.id, { attachments: newAttachments });
  };

  const handleAiSummarize = async () => {
    if (!content || isAiLoading) return;
    setIsAiLoading(true);
    try {
      const summary = await summarizeNote(content);
      if (summary) setContent(prev => `${prev}\n\n<strong>AI Summary:</strong>\n${summary}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAiImprove = async () => {
    if (!content || isAiLoading) return;
    setIsAiLoading(true);
    try {
      const improved = await improveNote(content);
      if (improved) {
        setContent(improved);
        if (note) onUpdate(note.id, { content: improved });
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAiSuggestTags = async () => {
    if (!content || isAiLoading) return;
    setIsAiLoading(true);
    try {
      const suggested = await suggestTags(title, content);
      if (suggested && suggested.length > 0) {
        const uniqueTags = Array.from(new Set([...tags, ...suggested]));
        setTags(uniqueTags);
        if (note) onUpdate(note.id, { tags: uniqueTags });
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAiSuggestTitle = async () => {
    if (!content || isAiLoading) return;
    setIsAiLoading(true);
    try {
      const suggested = await suggestTitle(content);
      if (suggested) {
        setTitle(suggested);
        if (note) onUpdate(note.id, { title: suggested });
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  const scrollToReminder = () => {
    const reminderRow = document.getElementById('reminder-row');
    if (reminderRow) {
      reminderRow.scrollIntoView({ behavior: 'smooth' });
      // Toggle it on if it's off
      if (!reminder?.enabled) {
        setReminder({ datetime: reminder?.datetime || new Date().toISOString(), enabled: true });
        if (note) onUpdate(note.id, { reminder: { datetime: reminder?.datetime || new Date().toISOString(), enabled: true } });
      }
    }
  };

  const taskStats = (() => {
    const total = (content.match(/data-list="(checked|unchecked)"/g) || []).length;
    const completed = (content.match(/data-list="checked"/g) || []).length;
    return { total, completed, percent: total > 0 ? (completed / total) * 100 : 0 };
  })();

  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white h-full">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mb-4">
          <FileText size={32} />
        </div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Select a note</h2>
        <p className="text-sm text-slate-400">Choose a note from the list or create a new one.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      {/* Header Info Bar */}
      <header className="h-16 px-4 sm:px-8 flex items-center justify-between border-b border-slate-100 shrink-0 sticky top-0 bg-white z-10">
        <div className="flex items-center space-x-1 sm:space-x-2">
            {onBack && (
              <button 
                onClick={onBack}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg mr-1"
              >
                <RefreshCw size={20} className="-rotate-90" />
              </button>
            )}
            <button 
             onClick={exportAsText}
             title="Export as Text"
             className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
           >
             <FileIcon size={20} />
           </button>
           <button 
             onClick={() => onDelete(note.id)}
             title="Delete Note"
             className="p-2 text-slate-400 hover:text-red-600 transition-colors"
           >
             <Trash2 size={20} />
           </button>
           <div className="h-6 w-[1px] bg-slate-100 mx-1 sm:mx-2" />
           <div className="hidden sm:flex items-center space-x-1">
             <button 
                onClick={handleAiSummarize}
                disabled={isAiLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 disabled:opacity-50 transition-all border border-purple-100"
             >
                {isAiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                Summarize
             </button>
             <button 
                onClick={handleAiImprove}
                disabled={isAiLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 disabled:opacity-50 transition-all border border-emerald-100"
             >
                {isAiLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                Clarify
             </button>
             <button 
                onClick={handleAiSuggestTags}
                disabled={isAiLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-all border border-blue-100"
             >
                {isAiLoading ? <Loader2 size={12} className="animate-spin" /> : <TagIcon size={12} />}
                Auto-Tag
             </button>
             <button 
                onClick={scrollToReminder}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 transition-all border border-slate-200"
             >
                <Clock size={12} />
                Reminder
             </button>
           </div>
           
           {/* Mobile AI Menu */}
           <div className="flex sm:hidden items-center">
              <button 
                onClick={handleAiSummarize}
                disabled={isAiLoading}
                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
              >
                <Sparkles size={20} />
              </button>
           </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center gap-2 mr-4 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
             {saveStatus === 'saving' ? (
               <>
                 <Loader2 size={12} className="animate-spin text-blue-500" />
                 <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Saving</span>
               </>
             ) : saveStatus === 'saved' ? (
               <>
                 <Check size={12} className="text-emerald-500" />
                 <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Saved</span>
               </>
             ) : (
               <>
                 <RefreshCw size={12} className="text-slate-300" />
                 <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Idle</span>
               </>
             )}
          </div>
          <button 
            onClick={exportAsPDF}
            className="hidden sm:block px-4 py-2 bg-white border border-slate-200 text-sm font-medium rounded-lg hover:bg-slate-50 transition shadow-sm"
          >
            Export PDF
          </button>
          
          <button 
            onClick={() => setShowInvite(!showInvite)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-100"
          >
            <UserPlus size={18} />
            <span className="hidden sm:inline">Collaborate</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-0">
        <div className="max-w-3xl mx-auto py-8 sm:py-12">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center space-x-3">
                {reminder?.enabled && (
                  <span className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full font-medium flex items-center">
                    <Calendar size={12} className="mr-1.5" />
                    {format(new Date(reminder.datetime as string), 'MMM d, p')}
                  </span>
                )}
                <span className="text-slate-400 text-xs">Updated {format(new Date(note.updatedAt as string), 'MMM d, yyyy')}</span>
              </div>
              
              {taskStats.total > 0 && (
                <div className="flex items-center gap-3 w-48">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-500" 
                      style={{ width: `${taskStats.percent}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                    {taskStats.completed}/{taskStats.total} Tasks
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex -space-x-2 overflow-hidden">
               {note.sharedWith?.map((email, idx) => (
                 <div key={email} title={email} className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500 uppercase">
                    {email[0]}
                 </div>
               ))}
               <button 
                onClick={() => setShowInvite(!showInvite)}
                className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
               >
                 <UserPlus size={12} />
               </button>
            </div>
          </div>

          <AnimatePresence>
            {showInvite && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mb-8 overflow-hidden"
              >
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Share with collaborator</h4>
                  <div className="flex gap-2">
                    <input 
                      type="email" 
                      placeholder="email@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                    <button 
                      onClick={handleShare}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                    >
                      Invite
                    </button>
                  </div>
                  {note.sharedWith && note.sharedWith.length > 0 && (
                    <div className="pt-2 space-y-1">
                      {note.sharedWith.map(email => (
                        <div key={email} className="flex justify-between items-center text-xs text-slate-600 px-1">
                          <span>{email}</span>
                          <button onClick={() => handleRemoveCollaborator(email)} className="text-red-400 hover:text-red-600">Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative group">
            <input 
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSave}
              placeholder="Project Phoenix Strategy"
              className="text-2xl sm:text-4xl font-bold text-slate-900 border-none p-0 focus:ring-0 placeholder:text-slate-200 w-full mb-4 pr-10"
            />
            <button 
              onClick={handleAiSuggestTitle}
              disabled={isAiLoading}
              title="Suggest AI Title"
              className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-purple-400 hover:text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
            >
              {isAiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            </button>
          </div>
          
          <div className="flex items-center space-x-2 mb-8">
            {tags.map(tag => (
              <span key={tag} className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] uppercase tracking-wider font-bold rounded flex items-center gap-1 group">
                {tag}
                <button onClick={() => removeTag(tag)} className="opacity-40 group-hover:opacity-100">×</button>
              </span>
            ))}
            <div className="relative">
              <input 
                type="text"
                placeholder="+"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="w-6 h-6 flex items-center justify-center rounded-full border border-dashed border-slate-300 text-slate-400 text-[10px] focus:ring-0 focus:border-slate-400 text-center transition-all bg-transparent"
              />
            </div>
          </div>

          <div className="prose prose-slate max-w-none editor-container">
            <ReactQuill 
              theme="snow"
              value={content}
              onChange={setContent}
              onBlur={handleSave}
              modules={QUILL_MODULES}
              placeholder="Objective: Scaling the primary container cluster..."
            />
          </div>

          {/* Footer Metadata */}
          <div className="mt-12 pt-8 border-t border-slate-100 space-y-8">
            {/* Reminder Toggle */}
            <div id="reminder-row" className={cn(
              "flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-2xl border transition-all duration-300",
              reminder?.enabled 
                ? "bg-blue-50 border-blue-100 shadow-sm ring-1 ring-blue-100" 
                : "bg-slate-50 border-slate-200"
            )}>
               <div className="flex items-center gap-4 mb-4 sm:mb-0">
                 <div className={cn(
                   "p-3 rounded-xl transition-all shadow-sm", 
                   reminder?.enabled ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-400"
                 )}>
                    <Calendar size={20} />
                 </div>
                 <div className="space-y-1">
                    <div className="flex items-center gap-2">
                       <h4 className="text-sm font-bold text-slate-800">Note Reminder</h4>
                       {reminder?.enabled && (
                         <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded">Active</span>
                       )}
                    </div>
                    {reminder?.enabled ? (
                       <div className="flex flex-col">
                          <input 
                            type="datetime-local" 
                            value={reminder.datetime.slice(0, 16)} 
                            onChange={async (e) => {
                              const newDt = new Date(e.target.value).toISOString();
                              const newRem = { ...reminder, datetime: newDt };
                              setReminder(newRem);
                              onUpdate(note.id, { reminder: newRem });
                              await createCalendarEvent(title, "From NotePro Notes", newDt);
                            }}
                            className="bg-transparent border-none p-0 text-sm font-semibold text-blue-600 focus:ring-0 cursor-pointer"
                          />
                          <p className="text-[10px] text-blue-400 font-medium flex items-center gap-1">
                            <Check size={10} /> Auto-Syncing with Google Calendar
                          </p>
                       </div>
                    ) : (
                      <p className="text-xs text-slate-500 font-medium">Notifications are currently disabled</p>
                    )}
                 </div>
               </div>
               
               <div className="flex items-center gap-4 self-end sm:self-center">
                 {reminder?.enabled && (
                    <button 
                      onClick={() => {
                        const newRem = { ...reminder, enabled: false };
                        setReminder(newRem);
                        onUpdate(note.id, { reminder: newRem });
                      }}
                      className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest"
                    >
                      Clear
                    </button>
                 )}
                 <button 
                    onClick={async () => {
                      const nextEnabled = !reminder?.enabled;
                      const dt = reminder?.datetime || new Date().toISOString();
                      const newRem = { datetime: dt, enabled: nextEnabled };
                      setReminder(newRem);
                      onUpdate(note.id, { reminder: newRem });
                      if (nextEnabled) {
                        await createCalendarEvent(title, "From NotePro Notes", dt);
                      }
                    }}
                    className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none ${reminder?.enabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                  >
                    <span className={`${reminder?.enabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm`} />
                  </button>
               </div>
            </div>

            {/* Attachments */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Attachments</h4>
                <label className="cursor-pointer text-blue-600 font-medium text-xs hover:underline">
                  Upload file
                  <input type="file" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>

              {note.attachments?.length > 0 ? (
                <div className="space-y-2">
                   {note.attachments.map((file, idx) => (
                     <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between group">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center text-slate-500 mr-4">
                            <FileIcon size={20} />
                          </div>
                          <div>
                            <div className="text-sm font-semibold truncate max-w-[180px]">{file.name}</div>
                            <div className="text-[11px] text-slate-400">{(file.size / 1024).toFixed(1)} KB · Document</div>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            const updated = note.attachments.filter((_, i) => i !== idx);
                            onUpdate(note.id, { attachments: updated });
                          }}
                          className="text-slate-400 hover:text-red-500 text-xs font-medium"
                        >
                          Remove
                        </button>
                      </div>
                   ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No files attached yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <footer className="p-6 border-t border-slate-50 flex items-center justify-between bg-white">
         <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
           CHARS: {content.length} · WORDS: {content.split(/\s+/).filter(Boolean).length}
         </div>
         <div className="flex items-center">
            <div className="w-6 h-6 rounded-full bg-slate-200 border border-white ring-2 ring-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase">
              {note.userId.slice(0, 2)}
            </div>
            <span className="ml-2 text-xs font-medium text-slate-600">Syncing with iCloud...</span>
         </div>
      </footer>
    </div>
  );
};
