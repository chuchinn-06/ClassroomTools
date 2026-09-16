import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { RandomPicker } from './components/RandomPicker';
import { GroupGenerator } from './components/GroupGenerator';
import { RosterManager } from './components/RosterManager';
import { SimulatedRosterModal } from './components/SimulatedRosterModal';
import { Student, ActiveTab } from './types';
import { DEFAULT_STUDENTS } from './utils/parser';
import { soundManager } from './utils/sound';

export default function App() {
  // Load students from localStorage or fallback to default sample students
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem('classroom_roster_students');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return DEFAULT_STUDENTS;
  });

  // Sound enabled state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('classroom_sound_enabled');
      if (saved !== null) {
        return saved === 'true';
      }
    } catch {}
    return true;
  });

  // Active tab state
  const [activeTab, setActiveTab] = useState<ActiveTab>('picker');
  const [showSimulatedModal, setShowSimulatedModal] = useState<boolean>(false);

  // Sync sound manager enabled
  useEffect(() => {
    soundManager.enabled = soundEnabled;
    try {
      localStorage.setItem('classroom_sound_enabled', String(soundEnabled));
    } catch {}
  }, [soundEnabled]);

  // Sync students to localStorage
  const handleUpdateStudents = (newStudents: Student[]) => {
    setStudents(newStudents);
    try {
      localStorage.setItem('classroom_roster_students', JSON.stringify(newStudents));
    } catch {}
  };

  const handleToggleSound = () => {
    setSoundEnabled(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        studentCount={students.length}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenSimulatedModal={() => setShowSimulatedModal(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'picker' && (
          <RandomPicker
            students={students}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
            onNavigateToRoster={() => setActiveTab('roster')}
            onUpdateStudents={handleUpdateStudents}
          />
        )}

        {activeTab === 'groups' && (
          <GroupGenerator
            students={students}
            soundEnabled={soundEnabled}
            onNavigateToRoster={() => setActiveTab('roster')}
            onUpdateStudents={handleUpdateStudents}
          />
        )}

        {activeTab === 'roster' && (
          <RosterManager
            students={students}
            onUpdateStudents={handleUpdateStudents}
            onNavigateToPicker={() => setActiveTab('picker')}
            onNavigateToGroups={() => setActiveTab('groups')}
          />
        )}
      </main>

      {/* Global Simulated Roster Modal */}
      <SimulatedRosterModal
        isOpen={showSimulatedModal}
        onClose={() => setShowSimulatedModal(false)}
        onSelectRoster={(presetList) => {
          handleUpdateStudents(presetList);
        }}
        currentCount={students.length}
      />

      {/* Clean Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-4 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>課堂抽籤與自動分組小工具・專為教學活動與班級經營設計</span>
          <span>支援 CSV / TXT 匯入・重複姓名標記與一鍵去重・分組結果 CSV 匯出</span>
        </div>
      </footer>
    </div>
  );
}
