import React, { useRef, useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  UploadCloud,
  FileSpreadsheet,
  RotateCcw,
  Sliders,
  DollarSign,
  Percent,
  CheckSquare,
  Square,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Download,
  Calculator,
  Store,
  Utensils,
  Laptop,
  FileText,
  Info,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import { DataPoint, SimulationParams } from '../types';
import { dataPointsToCSV } from '../utils/demoData';

interface SidebarProps {
  availableUnits: string[];
  targetUnit: string;
  onTargetUnitChange: (unit: string) => void;
  availableDates: string[];
  interventionDate: string;
  onInterventionDateChange: (date: string) => void;
  allDonorUnits: string[];
  selectedDonors: string[];
  onToggleDonor: (unit: string) => void;
  onSelectAllDonors: () => void;
  onClearAllDonors: () => void;
  donorWeightsMap: Record<string, number>;
  params: SimulationParams;
  onParamsChange: (newParams: Partial<SimulationParams>) => void;
  onLoadDemoData: () => void;
  onCustomDataLoaded: (data: DataPoint[]) => void;
  currentDataPoints: DataPoint[];
  metricName: string;
  metricUnit: string;
  unitTypeName: string;
  totalIncrementalEffect: number;
  onOpenCsvGuideModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  availableUnits,
  targetUnit,
  onTargetUnitChange,
  availableDates,
  interventionDate,
  onInterventionDateChange,
  allDonorUnits,
  selectedDonors,
  onToggleDonor,
  onSelectAllDonors,
  onClearAllDonors,
  donorWeightsMap,
  params,
  onParamsChange,
  onLoadDemoData,
  onCustomDataLoaded,
  currentDataPoints,
  metricName,
  metricUnit,
  unitTypeName,
  totalIncrementalEffect,
  onOpenCsvGuideModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isRoiExplainerOpen, setIsRoiExplainerOpen] = useState(false);
  const [isFormatGuideOpen, setIsFormatGuideOpen] = useState(false);
  const [isDataBenchmarkOpen, setIsDataBenchmarkOpen] = useState(false);
  const [isSingleStoreOpen, setIsSingleStoreOpen] = useState(false);

  // Parse CSV or Excel files
  const handleFile = (file: File) => {
    setUploadError(null);
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processRawRows(results.data as Record<string, any>[]);
        },
        error: (err) => {
          setUploadError(`CSVの読み込みに失敗しました: ${err.message}`);
        },
      });
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(firstSheet) as Record<string, any>[];
          processRawRows(json);
        } catch (err: any) {
          setUploadError(`Excelの読み込みに失敗しました: ${err.message || ''}`);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setUploadError('CSVまたはExcel形式（.csv, .xlsx, .xls）のファイルを指定してください。');
    }
  };

  const processRawRows = (rows: Record<string, any>[]) => {
    if (!rows || rows.length === 0) {
      setUploadError('ファイル内にデータが見つかりませんでした。');
      return;
    }

    const firstRow = rows[0];
    const keys = Object.keys(firstRow);

    const dateKey = keys.find((k) => /date|日|週|年月/i.test(k)) || keys[0];
    const unitKey = keys.find((k) => /unit|shop|store|店|地域|対象|名|部署|市|所/i.test(k)) || keys[1];
    const valKey = keys.find((k) => /val|sales|売上|客|数|金額|outcome|消費|時間|件|指標/i.test(k)) || keys[2];

    const parsedPoints: DataPoint[] = [];

    for (const r of rows) {
      const rawDate = r[dateKey];
      const rawUnit = r[unitKey];
      const rawVal = r[valKey];

      if (rawDate && rawUnit && rawVal !== undefined) {
        let formattedDate = String(rawDate).trim();
        if (/^\d{4}\/\d{1,2}\/\d{1,2}/.test(formattedDate)) {
          formattedDate = formattedDate.replace(/\//g, '-');
        }
        const numVal = Number(String(rawVal).replace(/[,¥\s]/g, ''));
        if (!isNaN(numVal)) {
          parsedPoints.push({
            date: formattedDate,
            unit: String(rawUnit).trim(),
            value: numVal,
          });
        }
      }
    }

    if (parsedPoints.length < 10) {
      setUploadError('有効なデータ行が少なすぎます（日付、ユニット名、測定値の列を確認してください）。');
      return;
    }

    onCustomDataLoaded(parsedPoints);
  };

  const downloadSampleCSV = () => {
    const csv = dataPointsToCSV(currentDataPoints);
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'impactsynth_sample_data.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ROI calculations
  const grossProfitLift = totalIncrementalEffect * (params.grossMarginPercent / 100);
  const netProfit = grossProfitLift - params.interventionCost;
  const roi = params.interventionCost > 0 ? (netProfit / params.interventionCost) * 100 : null;

  return (
    <aside className="w-full lg:w-80 shrink-0 space-y-5">
      {/* 1. Data Source Card with Prominent Template Guide */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <span>1. データを用意する</span>
          </h2>
          <button
            onClick={onLoadDemoData}
            title="サンプルデータに戻す"
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold"
          >
            <RotateCcw className="w-3 h-3" />
            <span>デモデータ</span>
          </button>
        </div>

        {/* Zero-Leak Security & Privacy Guarantee */}
        <div className="mb-3 p-2.5 rounded-xl bg-emerald-50/90 border border-emerald-200 text-[11px] text-emerald-950 leading-relaxed shadow-2xs">
          <div className="flex items-center gap-1.5 font-bold text-emerald-900 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>🔒【完全ローカル処理・機密保持保証】</span>
          </div>
          <p className="text-emerald-800 text-[11px] leading-normal">
            アップロードした売上データやCSVは、<strong>お使いの端末（ブラウザ）内でのみ処理</strong>されます。外部サーバーへの送信・保存は一切行われないため、社外秘データが外部に漏洩する心配はありません。
          </p>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files?.[0]) {
              handleFile(e.dataTransfer.files[0]);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-3.5 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-blue-500 bg-blue-50/50'
              : 'border-slate-300 hover:border-blue-400 bg-slate-50/60'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files?.[0]) handleFile(e.target.files[0]);
            }}
            accept=".csv,.xlsx,.xls"
            className="hidden"
          />
          <UploadCloud className="w-7 h-7 mx-auto text-slate-400 mb-1.5" />
          <p className="text-xs font-semibold text-slate-700">
            CSV / Excelをドラッグ＆ドロップ
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            必要列：日付、対象名（店舗・地域等）、目的変数
          </p>
        </div>

        {uploadError && (
          <div className="mt-2 text-xs text-rose-600 bg-rose-50 p-2 rounded-md flex items-start gap-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Prominent Format Sample Guide Toggle (Visual Expandable Table & Modal Trigger) */}
        <div className="mt-2.5">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsFormatGuideOpen(!isFormatGuideOpen)}
              className="flex-1 py-1.5 px-2 bg-blue-50/90 hover:bg-blue-100/80 border border-blue-200 rounded-lg text-xs font-semibold text-blue-700 flex items-center justify-between transition-colors shadow-2xs"
            >
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>CSV形式の見本を展開</span>
              </span>
              {isFormatGuideOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {onOpenCsvGuideModal && (
              <button
                onClick={onOpenCsvGuideModal}
                title="詳しいガイドモーダルを開く"
                className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1 transition-colors"
              >
                <span>拡大</span>
              </button>
            )}
          </div>

          {isFormatGuideOpen && (
            <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-700 space-y-2.5 animate-in fade-in duration-100 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
                  <span>Excelでの入力イメージ</span>
                </span>
                <span className="text-[10px] text-blue-700 font-mono font-semibold">縦持ち3列形式</span>
              </div>

              {/* Visual Mini Table */}
              <div className="rounded-lg border border-slate-300 overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-[10px] text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 font-mono text-[9px]">
                      <th className="py-1 px-1.5 text-center text-slate-400 border-r border-slate-200 w-5">#</th>
                      <th className="py-1.5 px-2 border-r border-slate-200 bg-blue-50 text-blue-900 font-bold">A: 日付</th>
                      <th className="py-1.5 px-2 border-r border-slate-200 bg-emerald-50 text-emerald-900 font-bold">B: ユニット名</th>
                      <th className="py-1.5 px-2 bg-amber-50 text-amber-900 font-bold text-right">C: 測定値</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono text-[10px] text-slate-800">
                    <tr>
                      <td className="py-1 px-1.5 text-center text-slate-400 border-r border-slate-200">1</td>
                      <td className="py-1 px-2 border-r border-slate-200 font-semibold text-blue-950">2024-01-07</td>
                      <td className="py-1 px-2 border-r border-slate-200 text-emerald-950 font-medium">渋谷店</td>
                      <td className="py-1 px-2 text-right font-bold text-amber-950">3450000</td>
                    </tr>
                    <tr>
                      <td className="py-1 px-1.5 text-center text-slate-400 border-r border-slate-200">2</td>
                      <td className="py-1 px-2 border-r border-slate-200 font-semibold text-blue-950">2024-01-07</td>
                      <td className="py-1 px-2 border-r border-slate-200 text-slate-700">新宿店</td>
                      <td className="py-1 px-2 text-right font-bold text-amber-950">3750000</td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td className="py-1 px-1.5 text-center text-slate-400 border-r border-slate-200">3</td>
                      <td className="py-1 px-2 border-r border-slate-200 font-semibold text-blue-950">2024-01-14</td>
                      <td className="py-1 px-2 border-r border-slate-200 text-emerald-950 font-medium">渋谷店</td>
                      <td className="py-1 px-2 text-right font-bold text-amber-950">3420000</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Rules Checklist */}
              <div className="space-y-1 text-[10px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                <div className="flex items-start gap-1">
                  <span className="font-bold text-blue-700 shrink-0">・日付形式:</span>
                  <span><code>2024-01-07</code> または <code>2024/1/7</code>（週次または月次で統一）</span>
                </div>
                <div className="flex items-start gap-1">
                  <span className="font-bold text-emerald-700 shrink-0">・ユニット:</span>
                  <span>施策対象1つ＋比較対象（他店・他地域等）5〜20個を同じ列に縦並び</span>
                </div>
                <div className="flex items-start gap-1">
                  <span className="font-bold text-amber-700 shrink-0">・測定値:</span>
                  <span>半角数値（カンマや「円」は自動除去して読み込みます）</span>
                </div>
              </div>

              {onOpenCsvGuideModal && (
                <button
                  onClick={onOpenCsvGuideModal}
                  className="w-full text-center text-[10px] text-blue-600 hover:text-blue-800 font-semibold underline pt-0.5"
                >
                  さらに詳しい形式ガイドとNG例をモーダルで見る →
                </button>
              )}
            </div>
          )}
        </div>

        {/* 1.5 Essential Guide 1: How much data is needed? */}
        <div className="mt-2">
          <button
            onClick={() => setIsDataBenchmarkOpen(!isDataBenchmarkOpen)}
            className="w-full py-1.5 px-2 bg-indigo-50/80 hover:bg-indigo-100/70 border border-indigo-200/80 rounded-lg text-xs font-semibold text-indigo-900 flex items-center justify-between transition-colors shadow-2xs"
          >
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>どのくらいのデータ量が必要？（目安）</span>
            </span>
            {isDataBenchmarkOpen ? <ChevronUp className="w-3 h-3 text-indigo-600" /> : <ChevronDown className="w-3 h-3 text-indigo-600" />}
          </button>

          {isDataBenchmarkOpen && (
            <div className="mt-2 p-3 bg-indigo-50/40 border border-indigo-200 rounded-xl text-[11px] text-slate-700 space-y-2 animate-in fade-in duration-100">
              <strong className="text-indigo-950 block font-bold text-xs">
                統計モデルがブレを学習するための推奨データ量：
              </strong>
              <div className="space-y-1.5 text-[10px] leading-relaxed">
                <div className="bg-white p-2 rounded border border-indigo-100">
                  <span className="font-bold text-emerald-700">◎ 理想（高精度）：</span>
                  <span className="text-slate-700">施策前の期間が<strong>15〜20時点以上</strong>（月次なら1.5年、週次なら4〜5ヶ月、日次なら1〜2ヶ月）＋比較対象（ドナー）3〜10個</span>
                </div>
                <div className="bg-white p-2 rounded border border-indigo-100">
                  <span className="font-bold text-blue-700">◯ 推奨（十分機能）：</span>
                  <span className="text-slate-700">施策前の期間が<strong>8〜14時点</strong>（月次なら8ヶ月〜1年）＋比較対象2〜5個</span>
                </div>
                <div className="bg-white p-2 rounded border border-indigo-100">
                  <span className="font-bold text-amber-700">△ 最低限（算出可能）：</span>
                  <span className="text-slate-700">施策前の期間が<strong>3〜7時点</strong>（最低2時点あれば計算自体は動きますが、ふだんの癖を学習しきれず適合スコアが低めになります）</span>
                </div>
              </div>
              <p className="text-[10px] text-indigo-900 font-medium pt-1">
                ※ 施策「後」のデータは<strong>最低1時点から測定可能</strong>です！
              </p>
            </div>
          )}
        </div>

        {/* 1.6 Essential Guide 2: What if you only have 1 store/account? */}
        <div className="mt-2">
          <button
            onClick={() => setIsSingleStoreOpen(!isSingleStoreOpen)}
            className="w-full py-1.5 px-2 bg-emerald-50/80 hover:bg-emerald-100/70 border border-emerald-200/80 rounded-lg text-xs font-semibold text-emerald-950 flex items-center justify-between transition-colors shadow-2xs"
          >
            <span className="flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-emerald-600" />
              <span>1店舗しかない人はどうする？（代替ドナー）</span>
            </span>
            {isSingleStoreOpen ? <ChevronUp className="w-3 h-3 text-emerald-600" /> : <ChevronDown className="w-3 h-3 text-emerald-600" />}
          </button>

          {isSingleStoreOpen && (
            <div className="mt-2 p-3 bg-emerald-50/40 border border-emerald-200 rounded-xl text-[11px] text-slate-700 space-y-2 animate-in fade-in duration-100">
              <strong className="text-emerald-950 block font-bold text-xs">
                「自分は1店舗しかないから使えない…」と諦める必要はありません！
              </strong>
              <p className="text-[10px] text-slate-600 leading-relaxed">
                比較対象（ドナー）は、他店でなくても<strong>「施策の影響を受けていないデータ」</strong>であれば何でも代用できます：
              </p>
              <div className="space-y-1.5 text-[10px] leading-relaxed">
                <div className="bg-white p-2 rounded border border-emerald-100">
                  <strong className="text-emerald-800 block">① 店内の「別カテゴリ・別商品群」をドナーにする</strong>
                  <span className="text-slate-600">例：ケーキの割引施策なら、「焼き菓子売上」「ドリンク売上」「ギフト売上」をドナー列に入れる</span>
                </div>
                <div className="bg-white p-2 rounded border border-emerald-100">
                  <strong className="text-emerald-800 block">② 「時間帯や曜日」で分割してドナーにする</strong>
                  <span className="text-slate-600">例：平日ランチ限定施策なら、「休日売上」「ディナー売上」をドナー列に入れる</span>
                </div>
                <div className="bg-white p-2 rounded border border-emerald-100">
                  <strong className="text-emerald-800 block">③ 無料の「公表オープンデータ」をドナーにする</strong>
                  <span className="text-slate-600">例：近隣自治体の商業動態統計、経産省POS指数、Googleトレンドの検索数推移を1つのユニットとして取り込む</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
          <span>現在のデータ: {currentDataPoints.length} 行</span>
          <button
            onClick={downloadSampleCSV}
            className="text-slate-600 hover:text-blue-600 underline flex items-center gap-1 font-semibold"
          >
            <Download className="w-3 h-3" />
            <span>見本CSVダウンロード</span>
          </button>
        </div>
      </div>

      {/* 2. Target Unit & Date */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-800 block mb-1.5">
            2. 施策ユニット選択（{unitTypeName}）
          </label>
          <select
            value={targetUnit}
            onChange={(e) => onTargetUnitChange(e.target.value)}
            className="w-full text-xs sm:text-sm font-semibold rounded-lg border border-slate-300 bg-white p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availableUnits.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-400 mt-1">
            施策（キャンペーンや新制度等）を実施した本命の対象
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-800">
              3. 施策開始日
            </label>
            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              {interventionDate}
            </span>
          </div>
          <select
            value={interventionDate}
            onChange={(e) => onInterventionDateChange(e.target.value)}
            className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 bg-white p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availableDates.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-400 mt-1">
            この日を境に「施策前（学習）」と「施策後（検証）」に分割
          </p>
        </div>
      </div>

      {/* 3. Donor Pool Selection */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div>
            <label className="text-xs font-bold text-slate-800 block">
              4. 比較対象プール（ドナー）
            </label>
            <span className="text-[11px] text-slate-500">
              {selectedDonors.length} / {allDonorUnits.length} {unitTypeName}を採用中
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={onSelectAllDonors}
              className="text-blue-600 hover:underline font-semibold"
            >
              全選択
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={onClearAllDonors}
              className="text-slate-500 hover:underline"
            >
              解除
            </button>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-md mb-2 leading-tight">
          「改装中・特殊要因があった」ユニットのチェックを外すと、リアルタイムで再合成されます。
        </div>

        <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
          {allDonorUnits.map((u) => {
            const isSelected = selectedDonors.includes(u);
            const weight = donorWeightsMap[u] || 0;
            const weightPct = Math.round(weight * 1000) / 10;

            return (
              <div
                key={u}
                onClick={() => onToggleDonor(u)}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer border transition-all text-xs ${
                  isSelected
                    ? 'border-blue-200 bg-blue-50/40 text-slate-900'
                    : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-300 shrink-0" />
                  )}
                  <span className={isSelected ? 'font-medium' : 'line-through'}>{u}</span>
                </div>

                {isSelected && (
                  <span
                    className={`text-[11px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                      weightPct > 10
                        ? 'bg-blue-600 text-white'
                        : weightPct > 0.5
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {weightPct > 0 ? `${weightPct.toFixed(1)}%` : '0%'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Financial & ROI Parameters with Clear Educational Explanations */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-amber-600" />
            <span>5. 施策コスト・収支設定（ROI）</span>
          </h3>
          <button
            onClick={() => setIsRoiExplainerOpen(!isRoiExplainerOpen)}
            className="text-[11px] text-amber-800 hover:underline flex items-center gap-0.5 font-semibold"
          >
            <HelpCircle className="w-3 h-3" />
            <span>何のため？</span>
            {isRoiExplainerOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Why this section exists explainer */}
        {isRoiExplainerOpen && (
          <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-2.5 text-[11px] text-amber-950 leading-relaxed space-y-1.5">
            <div className="font-bold flex items-center gap-1 text-amber-900">
              <Calculator className="w-3.5 h-3.5 text-amber-700" />
              <span>なぜコストと粗利を設定するのか？</span>
            </div>
            <p className="text-amber-900">
              「売上が1,000万円増えた」としても、キャンペーンや広告に1,200万円使っていたら<strong>大赤字（元本割れ）</strong>です。
            </p>
            <p className="text-amber-900">
              施策の真の成否は、増えた売上から原価を引いた「手元利益」で施策費用を回収できたか（ROI）まで見て初めて判断できます。
            </p>
          </div>
        )}

        {/* Industry Presets */}
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            業種・用途別プリセット
          </span>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <button
              onClick={() => onParamsChange({ grossMarginPercent: 30, interventionCost: 500000 })}
              className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1"
            >
              <Store className="w-3 h-3 text-blue-600" />
              <span>小売・物販（粗利30%）</span>
            </button>
            <button
              onClick={() => onParamsChange({ grossMarginPercent: 65, interventionCost: 600000 })}
              className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1"
            >
              <Utensils className="w-3 h-3 text-orange-600" />
              <span>飲食・サービス（65%）</span>
            </button>
            <button
              onClick={() => onParamsChange({ grossMarginPercent: 80, interventionCost: 1000000 })}
              className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1"
            >
              <Laptop className="w-3 h-3 text-purple-600" />
              <span>Web・アプリ（80%）</span>
            </button>
            <button
              onClick={() => onParamsChange({ grossMarginPercent: 100, interventionCost: 0 })}
              className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1"
            >
              <Sliders className="w-3 h-3 text-emerald-600" />
              <span>費用ゼロ/社内施策</span>
            </button>
          </div>
        </div>

        {/* Cost Slider */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-700 font-medium">
              施策総コスト（円）
            </span>
            <span className="text-xs font-mono font-bold text-slate-900">
              ¥{params.interventionCost.toLocaleString('ja-JP')}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={3000000}
            step={50000}
            value={params.interventionCost}
            onChange={(e) => onParamsChange({ interventionCost: Number(e.target.value) })}
            className="w-full accent-amber-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
            <span>¥0 (無料)</span>
            <span>¥150万</span>
            <span>¥300万</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            チラシ・広告費、クーポン原資、システム導入費などの総額
          </p>
        </div>

        {/* Gross Margin Slider */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-700 font-medium">
              想定粗利率（%）
            </span>
            <span className="text-xs font-mono font-bold text-slate-900">
              {params.grossMarginPercent}%
            </span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={params.grossMarginPercent}
            onChange={(e) => onParamsChange({ grossMarginPercent: Number(e.target.value) })}
            className="w-full accent-amber-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
            <span>10% (薄利)</span>
            <span>50% (中程度)</span>
            <span>100% (純利益換算)</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            売上から仕入れ原価を引いて手元に残る利益の割合
          </p>
        </div>

        {/* Real-time Calculation Summary Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[11px] space-y-1">
          <div className="flex justify-between text-slate-600">
            <span>純増粗利 ({params.grossMarginPercent}%):</span>
            <span className="font-mono font-semibold text-slate-800">
              +¥{Math.round(grossProfitLift).toLocaleString('ja-JP')}
            </span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>施策コスト:</span>
            <span className="font-mono text-slate-800">
              -¥{params.interventionCost.toLocaleString('ja-JP')}
            </span>
          </div>
          <div className="pt-1 border-t border-slate-200 flex justify-between font-bold">
            <span className="text-slate-800">実質純利益:</span>
            <span className={netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
              {netProfit >= 0 ? '+' : ''}¥{Math.round(netProfit).toLocaleString('ja-JP')}
              {roi !== null && ` (${roi >= 0 ? '+' : ''}${Math.round(roi)}%)`}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
