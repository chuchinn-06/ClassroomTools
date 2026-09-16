import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Dices, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  History, 
  Sparkles, 
  Maximize2, 
  Minimize2, 
  Undo2,
  AlertTriangle,
  Flame
} from 'lucide-react';
import { Student, DrawHistoryItem } from '../types';
import { soundManager } from '../utils/sound';
import { REAL_CLASS_STUDENTS } from '../utils/parser';

interface RandomPickerProps {
  students: Student[];
  soundEnabled: boolean;
  onToggleSound: () => void;
  onNavigateToRoster: () => void;
  onUpdateStudents?: (newStudents: Student[]) => void;
}

export const RandomPicker: React.FC<RandomPickerProps> = ({
  students,
  soundEnabled,
  onToggleSound,
  onNavigateToRoster,
  onUpdateStudents,
}) => {
  // Settings
  const [allowDuplicates, setAllowDuplicates] = useState<boolean>(false);
  const [durationSetting, setDurationSetting] = useState<number>(3000); // 3000ms

  // State
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [displayedStudent, setDisplayedStudent] = useState<Student | null>(null);
  const [currentWinner, setCurrentWinner] = useState<Student | null>(null);
  const [drawHistory, setDrawHistory] = useState<DrawHistoryItem[]>([]);
  const [drawnStudentIds, setDrawnStudentIds] = useState<Set<string>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Determine available pool of students
  const availablePool = React.useMemo(() => {
    if (allowDuplicates) return students;
    return students.filter(s => !drawnStudentIds.has(s.id));
  }, [students, allowDuplicates, drawnStudentIds]);

  // Set default initial displayed student
  useEffect(() => {
    if (!displayedStudent && students.length > 0) {
      setDisplayedStudent(students[0]);
    }
  }, [students, displayedStudent]);

  // Trigger confetti burst
  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#4f46e5', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'],
    });
  };

  // Perform the random pick with animation and sound
  const handleStartDraw = useCallback(() => {
    if (isDrawing || students.length === 0) return;

    if (!allowDuplicates && availablePool.length === 0) {
      return;
    }

    setIsDrawing(true);
    setCurrentWinner(null);

    // Target pool for selecting the final winner
    const pool = allowDuplicates ? students : availablePool;
    const finalWinnerIndex = Math.floor(Math.random() * pool.length);
    const chosenStudent = pool[finalWinnerIndex];

    const startTime = performance.now();
    const duration = durationSetting;
    let lastTickTime = 0;
    let tickCount = 0;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Deceleration curve (ease-out cubic)
      // Interval between names grows as progress -> 1
      const currentInterval = 50 + Math.pow(progress, 3) * 350;

      if (currentTime - lastTickTime > currentInterval) {
        lastTickTime = currentTime;
        tickCount++;

        // Pick a random candidate from total students to flash on screen
        const randomCandidate = students[Math.floor(Math.random() * students.length)];
        setDisplayedStudent(randomCandidate);

        // Sound effect: tick with pitch variation
        if (soundEnabled) {
          const pitch = 0.9 + (tickCount % 5) * 0.08;
          soundManager.playTick(pitch);
        }
      }

      // Drumroll sound in the last 400ms
      if (duration - elapsed < 400 && duration - elapsed > 350 && soundEnabled) {
        soundManager.playDrumRoll();
      }

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // FINISH DRAW
        setIsDrawing(false);
        setDisplayedStudent(chosenStudent);
        setCurrentWinner(chosenStudent);

        // Celebratory sound and confetti
        if (soundEnabled) {
          soundManager.playSuccessFanfare();
        }
        triggerConfetti();

        // Record history
        const newHistoryItem: DrawHistoryItem = {
          id: `draw-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          student: chosenStudent,
          timestamp: Date.now(),
        };
        setDrawHistory(prev => [newHistoryItem, ...prev]);

        // If duplicate not allowed, mark as drawn
        if (!allowDuplicates) {
          setDrawnStudentIds(prev => new Set(prev).add(chosenStudent.id));
        }
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [isDrawing, students, allowDuplicates, availablePool, durationSetting, soundEnabled]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Keyboard shortcut: Spacebar or Enter to trigger draw
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isDrawing) {
        // Prevent page scroll when pressing space
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          handleStartDraw();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleStartDraw, isDrawing]);

  // Reset draw pool
  const handleResetPool = () => {
    setDrawnStudentIds(new Set());
    setCurrentWinner(null);
  };

  // Put a single student back into the pool
  const handlePutBack = (studentId: string) => {
    setDrawnStudentIds(prev => {
      const updated = new Set(prev);
      updated.delete(studentId);
      return updated;
    });
    setDrawHistory(prev => prev.filter(h => h.student.id !== studentId));
  };

  // Toggle full screen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  if (students.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto text-amber-600">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">尚未建立學生名單</h2>
          <p className="text-sm text-slate-500">
            請先上傳 CSV、貼上名單，或載入模擬名單立即開始體驗隨機抽籤。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {onUpdateStudents && (
              <button
                type="button"
                onClick={() => onUpdateStudents(REAL_CLASS_STUDENTS)}
                className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-xs sm:text-sm transition-all shadow-xs cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                載入大學 64 人模擬名單
              </button>
            )}
            <button
              id="btn-goto-roster-empty"
              type="button"
              onClick={onNavigateToRoster}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs sm:text-sm transition-all cursor-pointer inline-flex items-center justify-center gap-2"
            >
              前往名單管理
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isPoolExhausted = !allowDuplicates && availablePool.length === 0;

  return (
    <div 
      ref={containerRef}
      className={`max-w-6xl mx-auto px-4 py-6 space-y-6 ${isFullscreen ? 'bg-slate-900 text-white min-h-screen p-8' : ''}`}
    >
      {/* Controls & Mode Settings Panel */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
        isFullscreen 
          ? 'bg-slate-800/90 border-slate-700 text-slate-200' 
          : 'bg-white border-slate-200/80 shadow-xs'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Mode Switch: Duplicate vs Non-Duplicate */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              抽籤模式：
            </span>
            <div className="inline-flex bg-slate-100 p-1 rounded-xl">
              <button
                id="btn-mode-no-duplicate"
                type="button"
                onClick={() => setAllowDuplicates(false)}
                disabled={isDrawing}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  !allowDuplicates
                    ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                不重複抽取 (抽過排除)
              </button>
              <button
                id="btn-mode-allow-duplicate"
                type="button"
                onClick={() => setAllowDuplicates(true)}
                disabled={isDrawing}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  allowDuplicates
                    ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                可重複抽取 (每次皆全班)
              </button>
            </div>
          </div>

          {/* Speed / Duration and Tool buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Speed selection */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>動畫速度:</span>
              <select
                id="select-duration"
                value={durationSetting}
                onChange={(e) => setDurationSetting(Number(e.target.value))}
                disabled={isDrawing}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2 py-1 focus:outline-none"
              >
                <option value={1800}>快速 (1.8秒)</option>
                <option value={3000}>標準 (3秒)</option>
                <option value={4800}>懸疑刺激 (5秒)</option>
              </select>
            </div>

            {/* Sound toggle button */}
            <button
              id="btn-picker-sound"
              type="button"
              onClick={onToggleSound}
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 cursor-pointer transition-all ${
                soundEnabled
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{soundEnabled ? '音效開' : '靜音'}</span>
            </button>

            {/* Fullscreen Button */}
            <button
              id="btn-toggle-fullscreen"
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? '結束全螢幕' : '全螢幕投影展示'}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs flex items-center gap-1 cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{isFullscreen ? '退出全螢幕' : '投影展示'}</span>
            </button>
          </div>
        </div>

        {/* Pool status banner */}
        {!allowDuplicates && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>
                待抽籤池：<strong className="text-slate-800 font-semibold">{availablePool.length}</strong> / {students.length} 人
              </span>
              <span className="text-slate-400">|</span>
              <span>
                已抽出：<strong className="text-indigo-600 font-semibold">{drawnStudentIds.size}</strong> 人
              </span>
            </div>

            {drawnStudentIds.size > 0 && (
              <button
                id="btn-reset-pool"
                type="button"
                onClick={handleResetPool}
                disabled={isDrawing}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                重置抽籤池 (恢復全員)
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Lottery Stage */}
      <div className={`relative overflow-hidden rounded-3xl border transition-all text-center p-8 sm:p-14 ${
        isFullscreen
          ? 'bg-radial from-slate-800 to-slate-900 border-slate-700 shadow-2xl min-h-[60vh] flex flex-col justify-center'
          : 'bg-gradient-to-b from-white to-slate-50/80 border-slate-200/90 shadow-md min-h-[420px] flex flex-col justify-center'
      }`}>
        {/* Background decorative flare */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-purple-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Display Area: Rolling or Winner Display */}
        <div className="relative z-10 my-auto py-6">
          {isPoolExhausted ? (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800">全班學生均已抽出完畢！</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                目前的「不重複抽取」名單池已空，您可以重置抽籤池再次進行抽籤，或切換為可重複抽取模式。
              </p>
              <button
                id="btn-pool-exhausted-reset"
                type="button"
                onClick={handleResetPool}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                立即重置抽籤池
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Status Header */}
              <div className="flex items-center justify-center gap-2">
                {isDrawing ? (
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100/90 text-amber-800 text-xs sm:text-sm font-semibold animate-pulse">
                    <Flame className="w-4 h-4 text-amber-600 animate-spin" />
                    正在緊張隨機抽籤中...
                  </span>
                ) : currentWinner ? (
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-semibold">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    恭喜抽中！
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs sm:text-sm font-medium">
                    <Dices className="w-4 h-4" />
                    點擊下方按鈕或按空白鍵開始抽籤
                  </span>
                )}
              </div>

              {/* Central Name Card */}
              <div className="max-w-md mx-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isDrawing ? displayedStudent?.id || 'rolling' : currentWinner?.id || 'idle'}
                    initial={{ scale: isDrawing ? 0.96 : 0.8, opacity: isDrawing ? 0.8 : 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.04, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    className={`py-8 px-6 rounded-3xl border transition-all ${
                      currentWinner && !isDrawing
                        ? 'bg-white border-indigo-300 shadow-xl shadow-indigo-100/50 ring-4 ring-indigo-500/10'
                        : isDrawing
                        ? 'bg-indigo-50/60 border-indigo-200'
                        : 'bg-white/80 border-slate-200 shadow-sm'
                    }`}
                  >
                    {/* Seat number badge */}
                    <div className="mb-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${
                        currentWinner && !isDrawing
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-200/80 text-slate-600'
                      }`}>
                        座號 {displayedStudent?.seatNumber || '00'}
                      </span>
                    </div>

                    {/* Student Name */}
                    <div className={`text-4xl sm:text-6xl font-black tracking-wider transition-colors ${
                      currentWinner && !isDrawing
                        ? 'text-indigo-600'
                        : isDrawing
                        ? 'text-slate-700'
                        : 'text-slate-800'
                    }`}>
                      {displayedStudent ? displayedStudent.name : '準備開始'}
                    </div>

                    {/* Winner sub-note */}
                    {currentWinner && !isDrawing && (
                      <p className="text-xs sm:text-sm font-medium text-emerald-600 mt-3 flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        已順利抽籤決定
                      </p>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Big Draw CTA Button */}
              <div className="pt-2">
                <button
                  id="btn-draw-student"
                  type="button"
                  disabled={isDrawing || isPoolExhausted}
                  onClick={handleStartDraw}
                  className={`relative px-10 py-4 rounded-2xl text-lg sm:text-xl font-bold shadow-lg transition-all cursor-pointer select-none active:scale-95 ${
                    isDrawing
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:shadow-indigo-300'
                  }`}
                >
                  <span className="flex items-center justify-center gap-3">
                    <Dices className={`w-6 h-6 ${isDrawing ? 'animate-spin' : ''}`} />
                    <span>{isDrawing ? '抽籤中...' : '開始隨機抽籤'}</span>
                  </span>
                </button>
                <p className="text-xs text-slate-400 mt-2">
                  提示：可直接按鍵盤 <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-600 font-mono">Space</kbd> 空白鍵啟動抽籤
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History & Pool Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Draw History */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              抽籤歷史記錄 ({drawHistory.length})
            </h3>
            {drawHistory.length > 0 && (
              <button
                id="btn-clear-draw-history"
                type="button"
                onClick={() => setDrawHistory([])}
                className="text-xs text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              >
                清空記錄
              </button>
            )}
          </div>

          {drawHistory.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              目前尚無抽籤紀錄，抽出的學生將顯示於此。
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
              {drawHistory.map((item, index) => {
                const orderNum = drawHistory.length - index;
                const timeString = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                return (
                  <div
                    key={item.id}
                    id={`history-item-${item.id}`}
                    className="py-2.5 flex items-center justify-between text-sm hover:bg-slate-50 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
                        {orderNum}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {item.student.name}
                      </span>
                      <span className="text-xs text-slate-400">
                        座號 {item.student.seatNumber || '--'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                        {timeString}
                      </span>
                      {!allowDuplicates && (
                        <button
                          type="button"
                          onClick={() => handlePutBack(item.student.id)}
                          title="將該學生放回抽籤池"
                          className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium cursor-pointer"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                          <span>放回抽籤池</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pool Status Preview */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">
              {!allowDuplicates ? `待抽籤學生 (${availablePool.length})` : `全班名冊 (${students.length})`}
            </h3>
            <span className="text-xs text-slate-400">
              {!allowDuplicates ? '抽中者會即時劃記' : '全員皆可抽'}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-72 overflow-y-auto pr-1">
            {students.map((student) => {
              const isDrawn = !allowDuplicates && drawnStudentIds.has(student.id);
              return (
                <span
                  key={student.id}
                  className={`text-xs px-2.5 py-1 rounded-lg transition-all ${
                    isDrawn
                      ? 'bg-slate-100 text-slate-400 line-through opacity-60'
                      : 'bg-indigo-50/70 text-indigo-700 font-medium'
                  }`}
                >
                  {student.name}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
