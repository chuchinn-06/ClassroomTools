import React from 'react';
import { Sparkles, Users, UserCheck, Volume2, VolumeX, BookOpen } from 'lucide-react';
import { ActiveTab } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  studentCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenSimulatedModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  studentCount,
  soundEnabled,
  onToggleSound,
  onOpenSimulatedModal,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Logo & Title */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
              課堂抽籤與自動分組
            </h1>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              老師的教學活動小幫手
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            id="nav-tab-picker"
            type="button"
            onClick={() => setActiveTab('picker')}
            className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'picker'
                ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <UserCheck className="w-4 h-4 shrink-0" />
            <span>隨機抽籤</span>
          </button>

          <button
            id="nav-tab-groups"
            type="button"
            onClick={() => setActiveTab('groups')}
            className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'groups'
                ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>自動分組</span>
          </button>

          <button
            id="nav-tab-roster"
            type="button"
            onClick={() => setActiveTab('roster')}
            className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'roster'
                ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>學生名單</span>
            <span className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[11px] font-semibold ${
              studentCount > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'
            }`}>
              {studentCount}
            </span>
          </button>
        </nav>

        {/* Quick Actions: Simulated Roster Button + Audio Switcher */}
        <div className="flex items-center gap-2">
          {onOpenSimulatedModal && (
            <button
              id="btn-nav-simulation"
              type="button"
              onClick={onOpenSimulatedModal}
              title="快速載入或切換模擬名單（大學64人、中小學24人、重複姓名去重測試）"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 hover:border-indigo-300 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>模擬名單</span>
            </button>
          )}

          <button
            id="btn-toggle-sound"
            type="button"
            onClick={onToggleSound}
            title={soundEnabled ? '點擊關閉音效' : '點擊開啟音效'}
            aria-label={soundEnabled ? '靜音' : '開啟音效'}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
            }`}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
