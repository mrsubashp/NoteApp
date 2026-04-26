import React from 'react';
import { format } from 'date-fns';
import { Tag, Calendar, Paperclip, ChevronRight } from 'lucide-react';
import { Note } from '../types';
import { cn } from '../lib/utils';

interface NoteCardProps {
  note: Note;
  isActive: boolean;
  onClick: () => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, isActive, onClick }) => {
  return (
    <div
      id={`note-card-${note.id}`}
      onClick={onClick}
      className={cn(
        "p-5 cursor-pointer transition-all duration-200 border-b border-slate-100",
        isActive ? "bg-blue-50 border-l-4 border-l-blue-600" : "bg-white hover:bg-slate-50"
      )}
    >
      <div className="flex justify-between items-start mb-1">
        <h3 className={cn(
          "text-sm truncate flex-1 font-medium text-slate-900",
          isActive && "font-semibold"
        )}>
          {note.title || 'Untitled Note'}
        </h3>
        <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap ml-2">
          {format(new Date(note.updatedAt), 'h:mm a')}
        </span>
      </div>
      
      <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
        {note.content || 'Start writing your thoughts...'}
      </p>
      
      <div className="flex flex-wrap gap-2 items-center mt-3">
        {note.reminder?.enabled && (
          <div className="flex items-center gap-1 text-[10px] text-blue-600 font-medium">
            <Calendar size={12} strokeWidth={2.5} />
            <span>Reminder set</span>
          </div>
        )}
        
        {note.attachments.length > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium font-mono">
            <Paperclip size={10} />
            <span>{note.attachments.length}</span>
          </div>
        )}
      </div>
    </div>
  );
};
