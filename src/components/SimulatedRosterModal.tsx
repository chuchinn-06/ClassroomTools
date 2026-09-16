import React from 'react';
import { Sparkles, Users, AlertTriangle, GraduationCap, School, Check } from 'lucide-react';
import { Student } from '../types';
import { REAL_CLASS_STUDENTS, DEFAULT_STUDENTS, DUPLICATE_TEST_STUDENTS } from '../utils/parser';

interface SimulatedRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRoster: (students: Student[], name: string) => void;
  currentCount: number;
}

export const SimulatedRosterModal: React.FC<SimulatedRosterModalProps> = ({
  isOpen,
  onClose,
  onSelectRoster,
  currentCount,
}) => {
  if (!isOpen) return null;

  const presets = [
    {
      id: 'real-college',
      title: '真實大學/高中名單範本 (64人)',
      subtitle: '包含學號 (如 D1387525) 與真實學生姓名，適合大班課堂、通識課或專案分組',
      badge: '熱門推薦',
      badgeColor: 'bg-indigo-100 text-indigo-700',
      icon: GraduationCap,
      count: REAL_CLASS_STUDENTS.length,
      data: REAL_CLASS_STUDENTS,
      previewNames: '蘇盷蓉、黃子芸、張季茹、莫筑晴、陳慕希、蘇芯怡...',
    },
    {
      id: 'standard-class',
      title: '中小學標準班級名單 (24人)',
      subtitle: '標準 01~24 座號編排，適合國小、國中平日課堂抽問、隨機小組討論',
      badge: '標準小班',
      badgeColor: 'bg-emerald-100 text-emerald-700',
      icon: School,
      count: DEFAULT_STUDENTS.length,
      data: DEFAULT_STUDENTS,
      previewNames: '王小明、李美美、張家豪、陳雅婷、林志偉、黃詩涵...',
    },
    {
      id: 'duplicates-test',
      title: '重複姓名檢驗測試名單 (12人)',
      subtitle: '包含多次出現的「陳雅婷」、「王小明」、「張家豪」，專門用來測試重複姓名標記與一鍵去重',
      badge: '測試去重專用',
      badgeColor: 'bg-amber-100 text-amber-800',
      icon: AlertTriangle,
      count: DUPLICATE_TEST_STUDENTS.length,
      data: DUPLICATE_TEST_STUDENTS,
      previewNames: '陳雅婷(x3)、王小明(x2)、張家豪(x2)、林志偉...',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-7 space-y-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                載入模擬名單（快速體驗）
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                選擇以下任一預先準備的課堂名單，免去手動輸入時間，立即開始抽籤或分組！
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>

        {/* Presets List */}
        <div className="space-y-3.5">
          {presets.map((preset) => {
            const Icon = preset.icon;
            return (
              <div
                key={preset.id}
                className="group p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 bg-slate-50/60 hover:bg-indigo-50/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-indigo-600 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-slate-800">
                        {preset.title}
                      </h4>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${preset.badgeColor}`}>
                        {preset.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {preset.subtitle}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono mt-1">
                      名單預覽：{preset.previewNames}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onSelectRoster(preset.data, preset.title);
                    onClose();
                  }}
                  className="px-4 py-2 bg-white hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-200 hover:border-indigo-600 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer whitespace-nowrap self-end sm:self-center shrink-0 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  載入此名單
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>目前已有 {currentCount} 位學生</span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
          >
            關閉視窗
          </button>
        </div>
      </div>
    </div>
  );
};
