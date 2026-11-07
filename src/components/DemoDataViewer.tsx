import React, { useState } from 'react';
import { SCENARIOS } from '../utils/demoData';
import { DataPoint, ScenarioMeta } from '../types';
import {
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  Download,
  Filter,
  Info,
  Store,
  Globe,
  Landmark,
  Briefcase,
  Check,
  TrendingUp,
  Factory,
  HeartPulse,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { dataPointsToCSV } from '../utils/demoData';

interface DemoDataViewerProps {
  currentScenarioId: string;
  onSelectScenario: (scenario: ScenarioMeta) => void;
  dataPoints: DataPoint[];
  metricUnit: string;
}

export const DemoDataViewer: React.FC<DemoDataViewerProps> = ({
  currentScenarioId,
  onSelectScenario,
  dataPoints,
  metricUnit,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFormatGuide, setShowFormatGuide] = useState(false);

  const currentScenario =
    SCENARIOS.find((s) => s.id === currentScenarioId) || SCENARIOS[0];

  const uniqueUnits = Array.from(new Set(dataPoints.map((p) => p.unit)));

  const filteredPoints = dataPoints.filter((p) => {
    if (selectedUnitFilter !== 'all' && p.unit !== selectedUnitFilter) return false;
    if (searchQuery && !p.date.includes(searchQuery) && !p.unit.includes(searchQuery)) return false;
    return true;
  });

  const getScenarioIcon = (id: string) => {
    switch (id) {
      case 'retail':
        return <Store className="w-4 h-4 text-blue-600" />;
      case 'marketing':
        return <Globe className="w-4 h-4 text-emerald-600" />;
      case 'b2b_sales':
        return <TrendingUp className="w-4 h-4 text-indigo-600" />;
      case 'manufacturing':
        return <Factory className="w-4 h-4 text-amber-600" />;
      case 'healthcare':
        return <HeartPulse className="w-4 h-4 text-rose-600" />;
      case 'policy':
        return <Landmark className="w-4 h-4 text-teal-600" />;
      case 'efficiency':
        return <Briefcase className="w-4 h-4 text-purple-600" />;
      default:
        return <FileSpreadsheet className="w-4 h-4 text-blue-600" />;
    }
  };

  const downloadCurrentCSV = () => {
    const csv = dataPointsToCSV(dataPoints);
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csv], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `impactsynth_demo_${currentScenario.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all">
      {/* Universal Applicability Notice Banner */}
      <div className="bg-linear-to-r from-blue-600 via-indigo-600 to-blue-700 px-4 py-2 text-white text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse shrink-0" />
          <span className="font-extrabold text-[12px] tracking-wide text-amber-200">
            💡 あなたの業種・商材でもそのまま使えます！
          </span>
          <span className="text-[11px] text-blue-100 hidden md:inline">
            シナリオは入力例に過ぎません。日付と数字さえあれば、フリーランス・小売・教育・製造・農業・サロンなどあらゆる施策に100%対応します（1店舗でも分析可能）。
          </span>
        </div>
        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold shrink-0 self-end sm:self-auto">
          型に当てはまらないデータも大歓迎
        </span>
      </div>

      {/* Top Banner / Toggle Bar */}
      <div className="p-4 sm:px-6 bg-linear-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-900 text-sm sm:text-base">
                活用シナリオ選択＆デモデータ確認
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {currentScenario.title}
              </span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                全 {SCENARIOS.length} シナリオ
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              店舗売上、Web広告、B2B営業、製造工場IoT、医療費抑制、自治体脱炭素、残業削減など多様な現場に対応
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto shrink-0 flex-wrap">
          <button
            onClick={() => setShowFormatGuide(!showFormatGuide)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-all shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>データ形式の見本</span>
          </button>
          <button
            onClick={downloadCurrentCSV}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-all shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV取得</span>
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-all shadow-2xs"
          >
            <span>{isOpen ? 'データを閉じる' : 'データを見る・切替'}</span>
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Format Guide Box (Always available or togglable) */}
      {showFormatGuide && (
        <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-200 text-xs text-slate-700 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>自社データを用意する際の見本フォーマット（Excel / CSV）</span>
            </div>
            <button
              onClick={() => setShowFormatGuide(false)}
              className="text-slate-400 hover:text-slate-600 text-xs"
            >
              閉じる
            </button>
          </div>

          <p className="text-slate-600 text-xs leading-relaxed">
            合成コントロール法に必要なのは、以下の<strong>「日付・ユニット名・測定値」の3列だけ</strong>です。前年同月比などを計算しておく必要はなく、観測された生の実績値をそのまま縦に並べるだけで分析できます。
          </p>

          {/* Visual Spreadsheet Template Mockup */}
          <div className="overflow-x-auto rounded-lg border border-slate-300 bg-white shadow-2xs max-w-2xl">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-mono text-[11px] border-b border-slate-300">
                  <th className="py-1 px-2 border-r border-slate-200 text-center w-8 text-slate-400">#</th>
                  <th className="py-2 px-3 border-r border-slate-200 bg-blue-50/70 text-blue-900 font-bold">A: 日付</th>
                  <th className="py-2 px-3 border-r border-slate-200 bg-blue-50/70 text-blue-900 font-bold">B: 対象ユニット名</th>
                  <th className="py-2 px-3 bg-blue-50/70 text-blue-900 font-bold text-right">C: 目的変数（数値）</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[11px] text-slate-800">
                <tr>
                  <td className="py-1 px-2 border-r border-slate-200 text-center text-slate-400">1</td>
                  <td className="py-1.5 px-3 border-r border-slate-200">2024-01-07</td>
                  <td className="py-1.5 px-3 border-r border-slate-200">渋谷店（施策対象）</td>
                  <td className="py-1.5 px-3 text-right">3450000</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 border-r border-slate-200 text-center text-slate-400">2</td>
                  <td className="py-1.5 px-3 border-r border-slate-200">2024-01-07</td>
                  <td className="py-1.5 px-3 border-r border-slate-200">新宿店（対照群1）</td>
                  <td className="py-1.5 px-3 text-right">3750000</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 border-r border-slate-200 text-center text-slate-400">3</td>
                  <td className="py-1.5 px-3 border-r border-slate-200">2024-01-07</td>
                  <td className="py-1.5 px-3 border-r border-slate-200">池袋店（対照群2）</td>
                  <td className="py-1.5 px-3 text-right">3200000</td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="py-1 px-2 border-r border-slate-200 text-center text-slate-400">4</td>
                  <td className="py-1.5 px-3 border-r border-slate-200">2024-01-14</td>
                  <td className="py-1.5 px-3 border-r border-slate-200">渋谷店（施策対象）</td>
                  <td className="py-1.5 px-3 text-right">3420000</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-500">
            <span>※列名（ヘッダー）は「日付」「店舗名」「売上」など自然な日本語で自動認識されます。</span>
            <button
              onClick={downloadCurrentCSV}
              className="text-blue-600 hover:text-blue-800 underline font-semibold flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              <span>この見本テンプレートをCSVでダウンロードする</span>
            </button>
          </div>
        </div>
      )}

      {/* Expanded Content: Scenario Cards & Data Table */}
      {isOpen && (
        <div className="p-4 sm:p-6 space-y-5 bg-white border-t border-slate-100">
          {/* 1. Scenario Selector Grid (All 7 Domains) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                ① 用途・業界別シナリオを選択（全 {SCENARIOS.length} 種）
              </label>
              <span className="text-[11px] text-slate-500">クリックするとデータと設定が即座に切り替わります</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {SCENARIOS.map((sc) => {
                const isSelected = sc.id === currentScenarioId;
                return (
                  <button
                    key={sc.id}
                    onClick={() => onSelectScenario(sc)}
                    className={`text-left p-3.5 rounded-xl border transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 shadow-xs ring-1 ring-blue-600'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                          {sc.domain}
                        </span>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5 mb-1">
                        {getScenarioIcon(sc.id)}
                        <span>{sc.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                        {sc.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>対象: <b>{sc.targetUnit}</b></span>
                      <span>指標: {sc.metricUnit}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Raw Data Table Preview */}
          <div className="pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  ② 読み込まれている生データ一覧（全 {dataPoints.length} 行）
                </label>
                <p className="text-[11px] text-slate-500">
                  「日付・ユニット名・測定値」の3列で構成されています。
                </p>
              </div>

              {/* Filter controls */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg text-xs">
                  <Filter className="w-3 h-3 text-slate-400" />
                  <select
                    value={selectedUnitFilter}
                    onChange={(e) => setSelectedUnitFilter(e.target.value)}
                    className="bg-transparent border-none text-slate-700 text-xs font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="all">全ユニット表示</option>
                    {uniqueUnits.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Scrollable Mini Table */}
            <div className="max-h-60 overflow-y-auto rounded-lg border border-slate-200">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 text-slate-700 sticky top-0 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-2 px-3">日付 (YYYY-MM-DD)</th>
                    <th className="py-2 px-3">対象ユニット ({currentScenario.unitTypeName})</th>
                    <th className="py-2 px-3 text-right">
                      {currentScenario.metricName} ({metricUnit})
                    </th>
                    <th className="py-2 px-3">区分</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPoints.slice(0, 100).map((p, idx) => {
                    const isInterventionAfter = p.date >= currentScenario.interventionDate;
                    const isTarget = p.unit === currentScenario.targetUnit;
                    return (
                      <tr
                        key={`${p.unit}-${p.date}-${idx}`}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isTarget ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        <td className="py-1.5 px-3 font-mono text-slate-700">{p.date}</td>
                        <td className="py-1.5 px-3 font-medium text-slate-900">
                          {p.unit}
                          {isTarget && (
                            <span className="ml-1 text-[10px] text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded font-semibold">
                              施策対象
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono font-semibold text-slate-800">
                          {p.value.toLocaleString('ja-JP')} {metricUnit}
                        </td>
                        <td className="py-1.5 px-3">
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                              isInterventionAfter
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {isInterventionAfter ? '施策後' : '施策前'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
              <span>
                表示中: {Math.min(100, filteredPoints.length)} / {filteredPoints.length} 件
                {filteredPoints.length > 100 && '（スクロールでプレビュー）'}
              </span>
              <span className="text-slate-400">
                自社データを分析する際は、画面左上の枠に同様の形式のファイルを読み込ませてください。
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
