import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Download, 
  Trash2, 
  Plus, 
  Sparkles, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  AlertTriangle,
  FileSpreadsheet,
  Check,
  FilterX
} from 'lucide-react';
import { Student } from '../types';
import { 
  parsePastedText, 
  parseCSVContent, 
  exportRosterToCSV, 
  DEFAULT_STUDENTS,
  REAL_CLASS_STUDENTS,
  DUPLICATE_TEST_STUDENTS,
  analyzeDuplicates,
  removeDuplicateStudents
} from '../utils/parser';
import { SimulatedRosterModal } from './SimulatedRosterModal';

interface RosterManagerProps {
  students: Student[];
  onUpdateStudents: (newStudents: Student[]) => void;
  onNavigateToPicker: () => void;
  onNavigateToGroups: () => void;
}

export const RosterManager: React.FC<RosterManagerProps> = ({
  students,
  onUpdateStudents,
  onNavigateToPicker,
  onNavigateToGroups,
}) => {
  const [pasteInput, setPasteInput] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentSeat, setNewStudentSeat] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [showSimulatedModal, setShowSimulatedModal] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3800);
  };

  // Analyze duplicates in current students list
  const duplicateInfo = analyzeDuplicates(students);

  // Handle CSV file upload
  const handleFileProcess = (file: File) => {
    if (!file) return;
    const isCSVorText = file.name.endsWith('.csv') || file.name.endsWith('.txt') || file.type.includes('text') || file.type.includes('csv');
    if (!isCSVorText) {
      showNotification('請上傳 .csv 或 .txt 格式的名單檔案', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = parseCSVContent(content);
        if (parsed.length === 0) {
          showNotification('無法從檔案中解析出學生姓名，請確認格式', 'error');
          return;
        }

        const dupAnalysis = analyzeDuplicates(parsed);
        onUpdateStudents(parsed);

        if (dupAnalysis.duplicateTotalEntries > 0) {
          showNotification(
            `成功匯入 ${parsed.length} 位學生（⚠️ 偵測到 ${dupAnalysis.duplicateTotalEntries} 筆姓名重複，已為您在名單標記）`,
            'warning'
          );
        } else {
          showNotification(`成功匯入 ${parsed.length} 位學生！`);
        }
      } catch {
        showNotification('讀取檔案失敗，請檢查檔案內容格式', 'error');
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handlePastedSubmit = (mode: 'replace' | 'append') => {
    if (!pasteInput.trim()) {
      showNotification('請先在文字框中貼上學生名單', 'error');
      return;
    }
    const parsed = parsePastedText(pasteInput);
    if (parsed.length === 0) {
      showNotification('未偵測到有效的學生姓名', 'error');
      return;
    }

    if (mode === 'replace') {
      const dupAnalysis = analyzeDuplicates(parsed);
      onUpdateStudents(parsed);
      if (dupAnalysis.duplicateTotalEntries > 0) {
        showNotification(
          `已設定為新名單（共 ${parsed.length} 位學生，含 ${dupAnalysis.duplicateTotalEntries} 筆姓名重複）`,
          'warning'
        );
      } else {
        showNotification(`已設定為新名單（共 ${parsed.length} 位學生）`);
      }
    } else {
      const combined = [...students, ...parsed];
      const dupAnalysis = analyzeDuplicates(combined);
      onUpdateStudents(combined);
      if (dupAnalysis.duplicateTotalEntries > 0) {
        showNotification(
          `已追加 ${parsed.length} 位學生，現有共 ${combined.length} 位（⚠️ 包含重複姓名）`,
          'warning'
        );
      } else {
        showNotification(`已新增 ${parsed.length} 位學生，現有共 ${combined.length} 位`);
      }
    }
    setPasteInput('');
  };

  // Remove duplicate student names keeping the first occurrence
  const handleRemoveDuplicates = () => {
    if (duplicateInfo.duplicateTotalEntries === 0) {
      showNotification('目前名單中沒有重複的學生姓名');
      return;
    }
    const deduplicated = removeDuplicateStudents(students);
    const removedCount = students.length - deduplicated.length;
    onUpdateStudents(deduplicated);
    showNotification(`已一次性移除 ${removedCount} 筆重複學生姓名！名單現有 ${deduplicated.length} 人。`, 'success');
  };

  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    const newStudent: Student = {
      id: `student-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: newStudentName.trim(),
      seatNumber: newStudentSeat.trim() || String(students.length + 1).padStart(2, '0')
    };

    const nextList = [...students, newStudent];
    onUpdateStudents(nextList);
    setNewStudentName('');
    setNewStudentSeat('');

    if (students.some(s => s.name.trim() === newStudent.name)) {
      showNotification(`已加入學生「${newStudent.name}」（注意：與名單中既有學生姓名重複）`, 'warning');
    } else {
      showNotification(`已加入學生「${newStudent.name}」`);
    }
  };

  const handleDeleteStudent = (id: string) => {
    const target = students.find(s => s.id === id);
    onUpdateStudents(students.filter(s => s.id !== id));
    if (target) {
      showNotification(`已移除「${target.name}」`);
    }
  };

  const handleClearAll = () => {
    if (students.length === 0) return;
    if (window.confirm('確定要清空所有學生名單嗎？')) {
      onUpdateStudents([]);
      showNotification('已清空學生名單');
    }
  };

  const handleSelectPreset = (roster: Student[], title: string) => {
    onUpdateStudents(roster);
    const dup = analyzeDuplicates(roster);
    if (dup.duplicateTotalEntries > 0) {
      showNotification(`已載入「${title}」（共 ${roster.length} 人，內含重複姓名以供去重體驗）`, 'warning');
    } else {
      showNotification(`已載入「${title}」（共 ${roster.length} 人）`, 'success');
    }
  };

  const handleDownloadSampleCSV = () => {
    const csvContent = '\uFEFF學號,姓名\nD1387525,蘇盷蓉\nD1420473,黃子芸\nD1420490,張季茹\nD1420515,莫筑晴\nD1420532,陳慕希';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '課堂學生名單範例.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (students.length === 0) {
      showNotification('目前無學生名單可匯出', 'error');
      return;
    }
    const csvContent = exportRosterToCSV(students);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `班級學生名冊_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification('名單已成功匯出為 CSV 檔案');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-7">
      {/* Toast Notification */}
      {notification && (
        <div
          id="roster-toast"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md transition-all animate-bounceIn ${
            notification.type === 'success'
              ? 'bg-emerald-50/95 border-emerald-300 text-emerald-900'
              : notification.type === 'warning'
              ? 'bg-amber-50/95 border-amber-300 text-amber-900'
              : 'bg-rose-50/95 border-rose-300 text-rose-900'
          }`}
        >
          {notification.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
          {notification.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />}
          {notification.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Quick Simulation Banner */}
      <div className="bg-gradient-to-r from-indigo-500/10 via-indigo-500/5 to-transparent border border-indigo-200/80 rounded-2xl p-4.5 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-indigo-950 flex items-center gap-2">
              快速體驗「模擬名單」
              <span className="text-xs font-normal text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                免手動建檔
              </span>
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              可一鍵載入真實班級名單、中小學標準名單或重複測試名單，快速理解抽籤與分組功能。
            </p>
          </div>
        </div>

        {/* Preset quick buttons */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <button
            id="btn-load-real-64"
            type="button"
            onClick={() => handleSelectPreset(REAL_CLASS_STUDENTS, '真實大學班級名單 (64人)')}
            className="px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 hover:border-indigo-400"
          >
            <span>大學 64 人名單</span>
          </button>

          <button
            id="btn-load-std-24"
            type="button"
            onClick={() => handleSelectPreset(DEFAULT_STUDENTS, '中小學標準名單 (24人)')}
            className="px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 hover:border-indigo-400"
          >
            <span>標準 24 人名單</span>
          </button>

          <button
            id="btn-load-dup-test"
            type="button"
            onClick={() => handleSelectPreset(DUPLICATE_TEST_STUDENTS, '去重測試名單 (12人)')}
            className="px-3 py-1.5 bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 hover:border-amber-400"
            title="包含重複的陳雅婷、王小明等，方便測試重複標記與一鍵去重"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>重複去重測試</span>
          </button>

          <button
            id="btn-open-simulated-modal"
            type="button"
            onClick={() => setShowSimulatedModal(true)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>更多範本</span>
          </button>
        </div>
      </div>

      {/* Header Banner & Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            學生名單管理
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            上傳 CSV 檔案或直接貼上姓名，名單將自動儲存於本機瀏覽器。支援重複姓名自動標記與一鍵清理。
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-center min-w-[90px]">
            <span className="text-xs text-indigo-600 font-medium block">目前總人數</span>
            <span className="text-2xl font-bold text-indigo-700">{students.length}</span>
          </div>

          {students.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                id="btn-go-to-picker-top"
                type="button"
                onClick={onNavigateToPicker}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-xs sm:text-sm transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                前往隨機抽籤
              </button>
              <button
                id="btn-go-to-groups-top"
                type="button"
                onClick={onNavigateToGroups}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-medium text-xs sm:text-sm transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                前往自動分組
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Input Methods: Two Columns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Method 1: CSV File Upload */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                方式一：上傳 CSV 名單檔案
              </h3>
              <button
                id="btn-download-sample-csv"
                type="button"
                onClick={handleDownloadSampleCSV}
                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                下載 CSV 範本
              </button>
            </div>

            {/* Drag & Drop Area */}
            <div
              id="csv-dropzone"
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-7 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-50/50'
                  : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                id="csv-file-input"
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileProcess(e.target.files[0]);
                    e.target.value = '';
                  }
                }}
              />
              <div className="w-11 h-11 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-2.5">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                點擊選取或拖曳 CSV / TXT 檔案至此
              </p>
              <p className="text-xs text-slate-400 mt-1">
                支援「學號,姓名」或「座號,姓名」格式（如 D1387525,蘇盷蓉）
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>支援 UTF-8 編碼與 Excel 匯出檔</span>
            <button
              id="btn-load-demo-roster"
              type="button"
              onClick={() => handleSelectPreset(REAL_CLASS_STUDENTS, '真實大學名單 (64人)')}
              className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              載入 64 人示範名單
            </button>
          </div>
        </div>

        {/* Method 2: Paste Text Area */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                方式二：直接貼上姓名名單
              </h3>
              <span className="text-xs text-slate-400">支援每行一人、學號+姓名或逗號分隔</span>
            </div>

            <textarea
              id="textarea-paste-students"
              rows={5}
              value={pasteInput}
              onChange={(e) => setPasteInput(e.target.value)}
              placeholder="請貼上學生名單，例如：&#10;D1387525 蘇盷蓉&#10;D1420473 黃子芸&#10;或：王小明, 李美美, 張家豪&#10;或直接貼上包含學號與姓名的 CSV 文字"
              className="w-full p-3 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none font-mono"
            />
          </div>

          <div className="mt-4 pt-3 flex items-center justify-end gap-2.5">
            <button
              id="btn-append-pasted-roster"
              type="button"
              onClick={() => handlePastedSubmit('append')}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
            >
              追加到現有名單
            </button>
            <button
              id="btn-replace-pasted-roster"
              type="button"
              onClick={() => handlePastedSubmit('replace')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
            >
              取代為新名單
            </button>
          </div>
        </div>
      </div>

      {/* Current Roster Display Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-slate-900">
              目前班級名單 ({students.length} 人)
            </h3>
            {duplicateInfo.duplicateTotalEntries > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-xs font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                發現 {duplicateInfo.duplicateTotalEntries} 筆重複姓名
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {students.length > 0 && (
              <>
                <button
                  id="btn-export-csv"
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-medium text-slate-700 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  匯出名單 (CSV)
                </button>
                <button
                  id="btn-clear-roster"
                  type="button"
                  onClick={handleClearAll}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-lg text-xs font-medium cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  清空名單
                </button>
              </>
            )}
          </div>
        </div>

        {/* Duplicate Warning & One-Click Deduplication Banner */}
        {duplicateInfo.duplicateTotalEntries > 0 && (
          <div 
            id="banner-duplicate-warning"
            className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <h4 className="font-bold text-sm text-amber-900">
                  名單中偵測到重複學生姓名（共 {duplicateInfo.duplicateTotalEntries} 筆多餘資料）
                </h4>
              </div>
              <p className="text-xs text-amber-700">
                重複名單項目：
                {Array.from(duplicateInfo.duplicateNames).map((dupName, idx) => {
                  const count = students.filter(s => s.name.trim() === dupName).length;
                  return (
                    <span 
                      key={dupName} 
                      className="inline-block bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-md text-xs font-semibold mr-1.5 mb-1"
                    >
                      {dupName} ({count}次)
                    </span>
                  );
                })}
              </p>
              <p className="text-[11px] text-amber-600">
                下方名單已為您用黃色警示標記出所有重複項目。您可以點擊右方按鈕一鍵清理，將只保留每位學生的第一次出現。
              </p>
            </div>

            <button
              id="btn-remove-all-duplicates"
              type="button"
              onClick={handleRemoveDuplicates}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 self-end md:self-center shrink-0"
            >
              <FilterX className="w-4 h-4" />
              一鍵移除重複姓名
            </button>
          </div>
        )}

        {/* Quick add single student */}
        <form onSubmit={handleAddSingle} className="flex items-center gap-2 max-w-md">
          <input
            id="input-new-student-seat"
            type="text"
            placeholder="學號/座號 (選填)"
            value={newStudentSeat}
            onChange={(e) => setNewStudentSeat(e.target.value)}
            className="w-28 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <input
            id="input-new-student-name"
            type="text"
            placeholder="輸入新學生姓名"
            value={newStudentName}
            onChange={(e) => setNewStudentName(e.target.value)}
            className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            id="btn-add-single-student"
            type="submit"
            disabled={!newStudentName.trim()}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white text-xs font-medium rounded-lg cursor-pointer flex items-center gap-1 transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            新增
          </button>
        </form>

        {/* Student Chips/List */}
        {students.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-2 stroke-1 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">目前名單是空的</p>
            <p className="text-xs text-slate-400 mt-1">
              請從上方上傳 CSV、貼上名單，或點擊下方「載入模擬名單」立即體驗！
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                type="button"
                onClick={() => handleSelectPreset(REAL_CLASS_STUDENTS, '真實大學名單 (64人)')}
                className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-semibold cursor-pointer transition-all inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                載入大學 64 人模擬名單
              </button>
              <button
                type="button"
                onClick={() => setShowSimulatedModal(true)}
                className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition-all inline-flex items-center gap-1.5"
              >
                瀏覽所有模擬名單
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-2">
            {students.map((student, idx) => {
              const isDuplicate = duplicateInfo.duplicateNames.has(student.name.trim());
              return (
                <div
                  key={student.id}
                  id={`student-badge-${student.id}`}
                  className={`group flex items-center justify-between p-2 rounded-xl transition-all border ${
                    isDuplicate
                      ? 'bg-amber-50/90 border-amber-300 hover:border-amber-400 shadow-xs'
                      : 'bg-slate-50 hover:bg-indigo-50/70 border-slate-200/70 hover:border-indigo-200'
                  }`}
                  title={isDuplicate ? `⚠️ 重複姓名：${student.name}` : undefined}
                >
                  <div className="flex items-center gap-1.5 overflow-hidden min-w-0">
                    <span 
                      className={`w-6 h-6 rounded-md border flex items-center justify-center text-[11px] font-semibold shrink-0 ${
                        isDuplicate
                          ? 'bg-amber-100 border-amber-300 text-amber-800'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                      title={student.seatNumber || `座號 ${idx + 1}`}
                    >
                      {student.seatNumber ? (
                        student.seatNumber.length > 4 
                          ? student.seatNumber.slice(-3) 
                          : student.seatNumber
                      ) : idx + 1}
                    </span>
                    <span className={`text-xs sm:text-sm font-medium truncate ${isDuplicate ? 'text-amber-950 font-bold' : 'text-slate-800'}`}>
                      {student.name}
                    </span>
                    {isDuplicate && (
                      <span className="text-[10px] bg-amber-200/90 text-amber-900 px-1 py-0.2 rounded font-bold shrink-0">
                        重複
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteStudent(student.id)}
                    title={`移除 ${student.name}`}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-600 text-slate-400 rounded transition-all cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Simulated Roster Modal */}
      <SimulatedRosterModal
        isOpen={showSimulatedModal}
        onClose={() => setShowSimulatedModal(false)}
        onSelectRoster={handleSelectPreset}
        currentCount={students.length}
      />
    </div>
  );
};
