import React from 'react';
import { Cloud, Check, ChevronRight, Apple, Globe, LayoutGrid } from 'lucide-react';
import { UserProfile } from '../types';
import { cn } from '../lib/utils';

interface CloudSyncSettingsProps {
  profile: UserProfile | null;
  onUpdateSync: (pref: UserProfile['syncPreference']) => void;
}

interface Provider {
  id: UserProfile['syncPreference'];
  name: string;
  icon: React.ElementType;
  color: string;
  available: boolean;
  description: string;
}

const PROVIDERS: Provider[] = [
  {
    id: 'firebase',
    name: 'NotePro Cloud (Firebase)',
    icon: Cloud,
    color: 'text-blue-500',
    available: true,
    description: 'Real-time sync enabled',
  },
  {
    id: 'icloud',
    name: 'iCloud / Apple Sync',
    icon: Apple,
    color: 'text-slate-400',
    available: false,
    description: 'Coming soon',
  },
  {
    id: 'gdrive',
    name: 'Google Drive Backup',
    icon: Globe,
    color: 'text-slate-400',
    available: false,
    description: 'Coming soon',
  },
  {
    id: 'onedrive',
    name: 'Microsoft OneDrive',
    icon: LayoutGrid,
    color: 'text-slate-400',
    available: false,
    description: 'Coming soon',
  },
];

export const CloudSyncSettings: React.FC<CloudSyncSettingsProps> = ({ profile, onUpdateSync }) => {
  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Cloud Sync & Storage</h2>
        <p className="text-slate-500 text-sm">Choose where your notes are securely synced across all your devices.</p>
      </div>

      <div className="grid gap-4">
        {PROVIDERS.map((provider) => {
          const isActive = profile?.syncPreference === provider.id;
          const Icon = provider.icon;

          if (!provider.available) {
            return (
              <div
                key={provider.id}
                aria-disabled="true"
                className="flex items-center justify-between p-6 rounded-2xl border-2 border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-white shadow-sm border border-slate-100 text-slate-400">
                    <Icon size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-500">{provider.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{provider.description}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                  Soon
                </span>
              </div>
            );
          }

          return (
            <button
              key={provider.id}
              onClick={() => onUpdateSync(provider.id)}
              className={cn(
                'flex items-center justify-between p-6 rounded-2xl border-2 transition-all duration-200 text-left',
                isActive
                  ? 'border-blue-600 bg-blue-50/50'
                  : 'border-slate-100 bg-white hover:border-slate-200',
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn('p-3 rounded-xl bg-white shadow-sm border border-slate-100', provider.color)}>
                  <Icon size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{provider.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{provider.description}</p>
                </div>
              </div>
              {isActive ? (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                  <Check size={18} strokeWidth={3} />
                </div>
              ) : (
                <ChevronRight size={20} className="text-slate-300" />
              )}
            </button>
          );
        })}
      </div>

      <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3">
        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg h-fit">
          <Cloud size={18} />
        </div>
        <div className="space-y-1">
          <h5 className="text-sm font-bold text-amber-900">Firebase is the only active sync provider</h5>
          <p className="text-xs text-amber-700 leading-relaxed">
            iCloud, Google Drive, and OneDrive integrations are planned for future releases.
            Your notes are always backed up in real-time via NotePro Cloud.
          </p>
        </div>
      </div>
    </div>
  );
};
