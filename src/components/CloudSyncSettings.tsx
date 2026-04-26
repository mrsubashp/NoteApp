import React from 'react';
import { Cloud, Check, ChevronRight, Apple, Globe, LayoutGrid } from 'lucide-react';
import { UserProfile } from '../types';
import { cn } from '../lib/utils';

interface CloudSyncSettingsProps {
  profile: UserProfile | null;
  onUpdateSync: (pref: UserProfile['syncPreference']) => void;
}

export const CloudSyncSettings: React.FC<CloudSyncSettingsProps> = ({ profile, onUpdateSync }) => {
  const providers: { id: UserProfile['syncPreference'], name: string, icon: any, color: string }[] = [
    { id: 'firebase', name: 'NotePro Cloud (Firebase)', icon: Cloud, color: 'text-blue-500' },
    { id: 'icloud', name: 'iCloud / Apple Sync', icon: Apple, color: 'text-slate-900' },
    { id: 'gdrive', name: 'Google Drive Backup', icon: Globe, color: 'text-emerald-500' },
    { id: 'onedrive', name: 'Microsoft OneDrive', icon: LayoutGrid, color: 'text-blue-600' }
  ];

  const handleManualSync = async () => {
    if (!profile) return;
    alert(`Starting manual sync to ${profile.syncPreference}...`);
    // Logic to iterate all notes and push to cloud Sync Service
  };

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Cloud Sync & Storage</h2>
          <p className="text-slate-500 text-sm">Choose where your notes and data are securely synced across all your devices.</p>
        </div>
        {profile?.syncPreference && profile.syncPreference !== 'firebase' && (
          <button 
            onClick={handleManualSync}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
          >
            <Cloud size={16} />
            Sync All
          </button>
        )}
      </div>

      <div className="grid gap-4">
        {providers.map((provider) => (
          <button
            key={provider.id}
            onClick={() => onUpdateSync(provider.id)}
            className={cn(
              "flex items-center justify-between p-6 rounded-2xl border-2 transition-all duration-200 text-left",
              profile.syncPreference === provider.id
                ? "border-blue-600 bg-blue-50/50"
                : "border-slate-100 bg-white hover:border-slate-200"
            )}
          >
            <div className="flex items-center gap-4">
              <div className={cn("p-3 rounded-xl bg-white shadow-sm border border-slate-100", provider.color)}>
                <provider.icon size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">{provider.name}</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {provider.id === 'firebase' ? 'Real-time sync enabled' : 'Periodic automated backup'}
                </p>
              </div>
            </div>
            {profile.syncPreference === provider.id && (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <Check size={18} strokeWidth={3} />
              </div>
            )}
            {profile.syncPreference !== provider.id && (
              <ChevronRight size={20} className="text-slate-300" />
            )}
          </button>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3">
        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg h-fit">
          <Cloud size={18} />
        </div>
        <div className="space-y-1">
          <h5 className="text-sm font-bold text-amber-900">Multi-Cloud Notice</h5>
          <p className="text-xs text-amber-700 leading-relaxed">
            NotePro iOS uses Firebase as the primary real-time synchronization engine. Selecting an alternative provider will enable automated JSON/PDF exports to that service periodically.
          </p>
        </div>
      </div>
    </div>
  );
};
