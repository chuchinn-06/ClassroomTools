import React, { useState, useId } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Shuffle, 
  Copy, 
  Download, 
  Check, 
  Crown, 
  AlertTriangle,
  MoveRight,
  ListOrdered,
  Sparkles,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';
import { Student, GroupResult } from '../types';
import { soundManager } from '../utils/sound';
import { REAL_CLASS_STUDENTS } from '../utils/parser';

interface GroupGeneratorProps {
  students: Student[];
  soundEnabled: boolean;
  onNavigateToRoster: () => void;
  onUpdateStudents?: (newStudents: Student[]) => void;
}

const GROUP_PALETTES = [
  { border: 'border-blue-200', bg: 'bg-blue-50/50', badge: 'bg-blue-600 text-white', text: 'text-blue-900', accent: 'bg-blue-100 text-blue-700' },
  { border: 'border-emerald-200', bg: 'bg-emerald-50/50', badge: 'bg-emerald-600 text-white', text: 'text-emerald-900', accent: 'bg-emerald-100 text-emerald-700' },
  { border: 'border-amber-200', bg: 'bg-amber-50/50', badge: 'bg-amber-600 text-white', text: 'text-amber-900', accent: 'bg-amber-100 text-amber-700' },
  { border: 'border-purple-200', bg: 'bg-purple-50/50', badge: 'bg-purple-600 text-white', text: 'text-purple-900', accent: 'bg-purple-100 text-purple-700' },
  { border: 'border-rose-200', bg: 'bg-rose-50/50', badge: 'bg-rose-600 text-white', text: 'text-rose-900', accent: 'bg-rose-100 text-rose-700' },
  { border: 'border-cyan-200', bg: 'bg-cyan-50/50', badge: 'bg-cyan-600 text-white', text: 'text-cyan-900', accent: 'bg-cyan-100 text-cyan-700' },
  { border: 'border-indigo-200', bg: 'bg-indigo-50/50', badge: 'bg-indigo-600 text-white', text: 'text-indigo-900', accent: 'bg-indigo-100 text-indigo-700' },
  { border: 'border-teal-200', bg: 'bg-teal-50/50', badge: 'bg-teal-600 text-white', text: 'text-teal-900', accent: 'bg-teal-100 text-teal-700' },
];

export const GroupGenerator: React.FC<GroupGeneratorProps> = ({
  students,
  soundEnabled,
  onNavigateToRoster,
  onUpdateStudents,
}) => {
  // Settings
  const [groupSizeMode, setGroupSizeMode] = useState<'bySize' | 'byCount'>('bySize');
  const [groupSize, setGroupSize] = useState<number>(4);
  const [groupCount, setGroupCount] = useState<number>(4);
  const [remainderPolicy, setRemainderPolicy] = useState<'distribute' | 'standalone'>('distribute');
  const [assignLeader, setAssignLeader] = useState<boolean>(false);
  const [namingStyle, setNamingStyle] = useState<'number' | 'color' | 'animal'>('number');

  // Results
  const [groups, setGroups] = useState<GroupResult[]>([]);
  const [groupLeaders, setGroupLeaders] = useState<Record<string, string>>({});
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Manual swap/move state
  const [selectedStudentToMove, setSelectedStudentToMove] = useState<{ student: Student; fromGroupId: string } | null>(null);

  const copyId = useId();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Color & Animal names
  const COLOR_NAMES = ['紅隊', '藍隊', '綠隊', '黃隊', '紫隊', '澄隊', '粉隊', '青隊', '金隊', '銀隊', '黑隊', '白隊'];
  const ANIMAL_NAMES = ['獵鷹組', '海豚組', '捷豹組', '靈狐組', '雄獅組', '巨鯨組', '白虎組', '神駒組', '蒼鷹組', '飛狼組'];

  const getGroupName = (index: number) => {
    if (namingStyle === 'color') {
      return COLOR_NAMES[index % COLOR_NAMES.length];
    }
    if (namingStyle === 'animal') {
      return ANIMAL_NAMES[index % ANIMAL_NAMES.length];
    }
    return `第 ${index + 1} 組`;
  };

  // Perform random grouping
  const handleGenerateGroups = () => {
    if (students.length === 0) return;

    setIsShuffling(true);
    if (soundEnabled) {
      soundManager.playShuffle();
    }

    // Shuffle student array randomly (Fisher-Yates)
    const shuffled = [...students];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    let calculatedGroupCount = 0;
    const resultGroups: GroupResult[] = [];

    if (groupSizeMode === 'bySize') {
      const size = Math.max(1, groupSize);
      if (remainderPolicy === 'distribute') {
        calculatedGroupCount = Math.max(1, Math.floor(shuffled.length / size));
        for (let i = 0; i < calculatedGroupCount; i++) {
          resultGroups.push({
            id: `group-${i + 1}`,
            groupNumber: i + 1,
            groupName: getGroupName(i),
            members: [],
          });
        }
        // Distribute round-robin so remainder is evenly spread
        shuffled.forEach((student, index) => {
          const targetGroupIndex = index % calculatedGroupCount;
          resultGroups[targetGroupIndex].members.push(student);
        });
      } else {
        // Standalone remainder group
        calculatedGroupCount = Math.ceil(shuffled.length / size);
        for (let i = 0; i < calculatedGroupCount; i++) {
          const chunk = shuffled.slice(i * size, (i + 1) * size);
          resultGroups.push({
            id: `group-${i + 1}`,
            groupNumber: i + 1,
            groupName: getGroupName(i),
            members: chunk,
          });
        }
      }
    } else {
      // By total group count
      calculatedGroupCount = Math.min(Math.max(1, groupCount), shuffled.length);
      for (let i = 0; i < calculatedGroupCount; i++) {
        resultGroups.push({
          id: `group-${i + 1}`,
          groupNumber: i + 1,
          groupName: getGroupName(i),
          members: [],
        });
      }
      shuffled.forEach((student, index) => {
        const targetGroupIndex = index % calculatedGroupCount;
        resultGroups[targetGroupIndex].members.push(student);
      });
    }

    // Assign leaders if requested
    const newLeaders: Record<string, string> = {};
    if (assignLeader) {
      resultGroups.forEach((g) => {
        if (g.members.length > 0) {
          const randomLeader = g.members[Math.floor(Math.random() * g.members.length)];
          newLeaders[g.id] = randomLeader.id;
        }
      });
    }

    setTimeout(() => {
      setGroups(resultGroups);
      setGroupLeaders(newLeaders);
      setIsShuffling(false);
      setSelectedStudentToMove(null);
    }, 250);
  };

  // Move a student to another group
  const handleMoveStudent = (targetGroupId: string) => {
    if (!selectedStudentToMove || selectedStudentToMove.fromGroupId === targetGroupId) {
      setSelectedStudentToMove(null);
      return;
    }

    const { student, fromGroupId } = selectedStudentToMove;

    setGroups((prevGroups) =>
      prevGroups.map((group) => {
        if (group.id === fromGroupId) {
          return {
            ...group,
            members: group.members.filter((m) => m.id !== student.id),
          };
        }
        if (group.id === targetGroupId) {
          return {
            ...group,
            members: [...group.members, student],
          };
        }
        return group;
      })
    );

    // If moved student was leader, clear or reassign
    if (groupLeaders[fromGroupId] === student.id) {
      setGroupLeaders((prev) => {
        const updated = { ...prev };
        delete updated[fromGroupId];
        return updated;
      });
    }

    setSelectedStudentToMove(null);
  };

  // Toggle leader status
  const handleToggleLeader = (groupId: string, studentId: string) => {
    setGroupLeaders((prev) => ({
      ...prev,
      [groupId]: prev[groupId] === studentId ? '' : studentId,
    }));
  };

  // Copy results as clean text
  const handleCopyResults = () => {
    if (groups.length === 0) return;

    let text = `【課堂分組結果】共 ${groups.length} 組、${students.length} 位學生\n\n`;
    groups.forEach((g) => {
      const leaderId = groupLeaders[g.id];
      const membersText = g.members
        .map((m) => {
          const isLeader = m.id === leaderId;
          const seat = m.seatNumber ? `[${m.seatNumber}] ` : '';
          return `${seat}${m.name}${isLeader ? ' (組長)' : ''}`;
        })
        .join('、');
      text += `● ${g.groupName} (${g.members.length}人)：${membersText}\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('分組名單已複製至剪貼簿');
    setTimeout(() => setCopied(false), 2000);
  };

  // Export grouping as CSV with UTF-8 BOM
  const handleExportGroupsCSV = () => {
    if (groups.length === 0) return;

    let csv = '\uFEFF組別編號,組名,學號/座號,姓名,角色\n';
    groups.forEach((g) => {
      const leaderId = groupLeaders[g.id];
      g.members.forEach((m) => {
        const role = m.id === leaderId ? '組長' : '組員';
        csv += `${g.groupNumber},"${g.groupName}","${m.seatNumber || ''}","${m.name}","${role}"\n`;
      });
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `課堂分組名冊_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`課堂分組名冊 CSV 下載完成！共 ${groups.length} 組、${students.length} 位學生。`);
  };

  if (students.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto text-amber-600">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">尚未建立學生名單</h2>
          <p className="text-sm text-slate-500">
            請先上傳 CSV、貼上名單，或點擊下方載入模擬名單直接體驗自動分組。
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
              id="btn-goto-roster-empty-groups"
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border bg-emerald-50/95 border-emerald-300 text-emerald-900 backdrop-blur-md animate-bounceIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Config Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              課堂自動分組設定
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              名單現有 <strong className="text-indigo-600">{students.length}</strong> 位學生，支援每組人數、組數限制與隨機指派組長。
            </p>
          </div>

          <button
            id="btn-generate-groups"
            type="button"
            onClick={handleGenerateGroups}
            disabled={isShuffling}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
          >
            <Shuffle className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} />
            <span>{isShuffling ? '正在隨機分組...' : '開始自動分組'}</span>
          </button>
        </div>

        {/* Setting Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Mode Selection */}
          <div className="space-y-1.5">
            <label className="text-slate-600 font-semibold block">分組依據方式</label>
            <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setGroupSizeMode('bySize')}
                className={`py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  groupSizeMode === 'bySize' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                依每組人數
              </button>
              <button
                type="button"
                onClick={() => setGroupSizeMode('byCount')}
                className={`py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  groupSizeMode === 'byCount' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                依預計總組數
              </button>
            </div>
          </div>

          {/* Group Size / Count Input */}
          <div className="space-y-1.5">
            <label className="text-slate-600 font-semibold block">
              {groupSizeMode === 'bySize' ? '每組預計人數' : '預計分為幾組'}
            </label>
            {groupSizeMode === 'bySize' ? (
              <div className="flex items-center gap-2">
                <input
                  id="input-group-size"
                  type="number"
                  min="2"
                  max={Math.max(2, students.length)}
                  value={groupSize}
                  onChange={(e) => setGroupSize(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold text-center"
                />
                <span className="text-slate-500 whitespace-nowrap">人 / 組</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  id="input-group-count"
                  type="number"
                  min="2"
                  max={Math.max(2, students.length)}
                  value={groupCount}
                  onChange={(e) => setGroupCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold text-center"
                />
                <span className="text-slate-500 whitespace-nowrap">組</span>
              </div>
            )}
          </div>

          {/* Remainder Policy (if bySize) */}
          {groupSizeMode === 'bySize' ? (
            <div className="space-y-1.5">
              <label className="text-slate-600 font-semibold block">餘數學生分配策略</label>
              <select
                id="select-remainder-policy"
                value={remainderPolicy}
                onChange={(e) => setRemainderPolicy(e.target.value as 'distribute' | 'standalone')}
                className="w-full p-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 text-slate-700"
              >
                <option value="distribute">均勻分散至各組 (推薦)</option>
                <option value="standalone">單獨自成一組 (人數較少)</option>
              </select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-slate-600 font-semibold block">預估各組人數</label>
              <div className="p-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-600 text-center font-medium">
                約 {Math.round(students.length / groupCount)} ~ {Math.ceil(students.length / groupCount)} 人 / 組
              </div>
            </div>
          )}

          {/* Naming Style */}
          <div className="space-y-1.5">
            <label className="text-slate-600 font-semibold block">小組命名風格</label>
            <select
              id="select-naming-style"
              value={namingStyle}
              onChange={(e) => setNamingStyle(e.target.value as 'number' | 'color' | 'animal')}
              className="w-full p-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 text-slate-700"
            >
              <option value="number">數字 (第 1 組、第 2 組...)</option>
              <option value="color">色彩 (紅隊、藍隊、綠隊...)</option>
              <option value="animal">動物 (獵鷹組、海豚組...)</option>
            </select>
          </div>

          {/* Group Leader Checkbox */}
          <div className="space-y-1.5 flex items-center md:col-span-2 lg:col-span-4 gap-2 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 font-medium">
              <input
                id="checkbox-assign-leader"
                type="checkbox"
                checked={assignLeader}
                onChange={(e) => setAssignLeader(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
              />
              <Crown className="w-4 h-4 text-amber-500 inline" />
              <span>各組隨機指派一位組長</span>
            </label>
          </div>
        </div>
      </div>

      {/* Manual Move Banner Notification */}
      {selectedStudentToMove && (
        <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl flex items-center justify-between text-xs text-indigo-800 animate-fadeIn">
          <div className="flex items-center gap-2">
            <MoveRight className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              已選取學生「<strong>{selectedStudentToMove.student.name}</strong>」，請點擊其他小組的「移至此組」按鈕完成調整。
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedStudentToMove(null)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer underline ml-2 shrink-0"
          >
            取消調整
          </button>
        </div>
      )}

      {/* Grouping Visual Result Cards */}
      {groups.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <ListOrdered className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">尚未產生分組</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            點擊上方「開始自動分組」按鈕，系統將自動為您隨機分配組員並呈現視覺化小組卡片。
          </p>
          <button
            type="button"
            onClick={handleGenerateGroups}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <Shuffle className="w-4 h-4" />
            開始自動分組
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Actions toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 text-xs shadow-xs">
            <div className="flex items-center gap-2 font-medium text-slate-600">
              <span>已分成 <strong className="text-indigo-600 font-bold">{groups.length}</strong> 組</span>
              <span className="text-slate-300">|</span>
              <span>總人數 {students.length} 人</span>
              <span className="text-slate-300">|</span>
              <span>每組約 {Math.round(students.length / groups.length)} 人</span>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                id={`btn-copy-groups-${copyId}`}
                type="button"
                onClick={handleCopyResults}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition-all cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? '已複製名單' : '複製名單文字'}</span>
              </button>

              {/* Outstanding Download CSV Button */}
              <button
                id="btn-export-groups-csv"
                type="button"
                onClick={handleExportGroupsCSV}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition-all cursor-pointer"
                title="下載包含組別、組名、座號/學號、姓名、角色的 CSV 檔案"
              >
                <Download className="w-4 h-4" />
                <FileSpreadsheet className="w-4 h-4" />
                <span>下載分組結果 (CSV)</span>
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {groups.map((group, gIdx) => {
              const palette = GROUP_PALETTES[gIdx % GROUP_PALETTES.length];
              const leaderId = groupLeaders[group.id];
              const isTargetMove = selectedStudentToMove && selectedStudentToMove.fromGroupId !== group.id;

              return (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: gIdx * 0.03 }}
                  className={`rounded-2xl border ${palette.border} bg-white shadow-xs overflow-hidden flex flex-col justify-between transition-all ${
                    isTargetMove ? 'ring-2 ring-indigo-400' : ''
                  }`}
                >
                  {/* Group Header */}
                  <div className={`px-4 py-3 border-b ${palette.border} ${palette.bg} flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${palette.badge}`}>
                        #{group.groupNumber}
                      </span>
                      <h4 className={`font-bold text-sm ${palette.text}`}>
                        {group.groupName}
                      </h4>
                    </div>

                    <span className="text-xs font-semibold text-slate-500">
                      {group.members.length} 人
                    </span>
                  </div>

                  {/* Members List */}
                  <div className="p-3.5 space-y-2 flex-1">
                    {group.members.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        目前此組暫無組員
                      </div>
                    ) : (
                      group.members.map((member) => {
                        const isLeader = member.id === leaderId;
                        const isSelected = selectedStudentToMove?.student.id === member.id;

                        return (
                          <div
                            key={member.id}
                            className={`flex items-center justify-between p-2 rounded-xl text-xs transition-all border ${
                              isSelected
                                ? 'bg-indigo-100 border-indigo-400 text-indigo-950 font-bold shadow-xs'
                                : isLeader
                                ? 'bg-amber-50/70 border-amber-200 text-slate-800'
                                : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200/70 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              <span 
                                className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-[10px] font-semibold text-slate-600 shrink-0"
                                title={member.seatNumber || '座號'}
                              >
                                {member.seatNumber ? (
                                  member.seatNumber.length > 4 
                                    ? member.seatNumber.slice(-3) 
                                    : member.seatNumber
                                ) : '—'}
                              </span>
                              <span className="font-medium truncate" title={member.name}>
                                {member.name}
                              </span>
                              {isLeader && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded-md font-bold shrink-0">
                                  <Crown className="w-3 h-3 text-amber-600" />
                                  組長
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {/* Toggle leader button */}
                              <button
                                type="button"
                                onClick={() => handleToggleLeader(group.id, member.id)}
                                title={isLeader ? '取消組長' : '設為組長'}
                                className={`p-1 rounded-md transition-all cursor-pointer ${
                                  isLeader ? 'text-amber-600 hover:bg-amber-100' : 'text-slate-300 hover:text-amber-500 hover:bg-slate-100'
                                }`}
                              >
                                <Crown className="w-3.5 h-3.5" />
                              </button>

                              {/* Select to move */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (selectedStudentToMove?.student.id === member.id) {
                                    setSelectedStudentToMove(null);
                                  } else {
                                    setSelectedStudentToMove({ student: member, fromGroupId: group.id });
                                  }
                                }}
                                title="換組 / 調組"
                                className={`p-1 rounded-md transition-all cursor-pointer ${
                                  isSelected ? 'text-indigo-600 bg-indigo-200' : 'text-slate-300 hover:text-indigo-600 hover:bg-slate-100'
                                }`}
                              >
                                <MoveRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Target move action button */}
                  {isTargetMove && (
                    <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
                      <button
                        type="button"
                        onClick={() => handleMoveStudent(group.id)}
                        className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all shadow-xs"
                      >
                        將學生移至此組
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Bottom Export Bar for ease of access on large classes */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 text-xs shadow-xs mt-6">
            <span className="text-slate-500 font-medium">
              分組完成！可將分組名冊直接下載為 CSV 檔，亦可貼至 Excel 或 Google 試算表存檔。
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyResults}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition-all cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? '已複製名單' : '複製名單'}</span>
              </button>

              <button
                id="btn-export-groups-csv-bottom"
                type="button"
                onClick={handleExportGroupsCSV}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <FileSpreadsheet className="w-4 h-4" />
                <span>下載分組結果 (CSV)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
