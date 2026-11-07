import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Calendar,
  Layers,
  TrendingUp,
  Download,
  Copy,
  Check,
  AlertCircle,
  ArrowRight,
  Info,
} from 'lucide-react';
import { dataPointsToCSV } from '../utils/demoData';
import { DataPoint } from '../types';

interface CsvFormatGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  sampleDataPoints: DataPoint[];
}

export const CsvFormatGuideModal: React.FC<CsvFormatGuideModalProps> = ({
  isOpen,
  onClose,
  sampleDataPoints,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sampleCsvSnippet = `日付,店舗名,売上金額
2024-01-07,渋谷店,3450000
2024-01-07,新宿店,3750000
2024-01-07,池袋店,3200000
2024-01-07,横浜店,3100000
2024-01-14,渋谷店,3420000
2024-01-14,新宿店,3720000
2024-01-14,池袋店,3180000
2024-01-14,横浜店,3090000`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sampleCsvSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadSampleCSV = () => {
    const csv = dataPointsToCSV(sampleDataPoints);
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csv], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'impactsynth_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                CSV / Excel 入力データ形式ガイド
              </h2>
              <p className="text-xs text-slate-500">
                必要な3つの列と日付形式・並べ方の必須ルール
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs sm:text-sm text-slate-700">
          {/* Key Principle Banner */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-950 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-blue-900 block font-bold mb-0.5">
                基本ルール：必要なのは「日付・対象名・数値」の3列（縦持ち形式）だけです
              </strong>
              <span>
                余計な列（曜日やメモ列等）が含まれていても自動で判定されます。また、前年比や成長率などを事前計算する必要はなく、<strong>「観測された実績の生数値」をそのまま縦に並べるだけ</strong>で分析可能です。
              </span>
            </div>
          </div>

          {/* Visual Table Mockup */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                <span>① 正しいデータ配置イメージ（Excel / スプレッドシート）</span>
              </span>
              <span className="text-[11px] text-slate-500 font-mono">1行目: 列名ヘッダー</span>
            </div>

            <div className="rounded-xl border border-slate-300 overflow-hidden shadow-xs bg-white">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-mono text-[11px]">
                    <th className="py-2 px-2.5 text-center text-slate-400 w-8 border-r border-slate-200 bg-slate-200/50">#</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 bg-blue-50 text-blue-900 font-bold">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>A列: 日付 (Date)</span>
                      </div>
                    </th>
                    <th className="py-2.5 px-3 border-r border-slate-200 bg-emerald-50 text-emerald-900 font-bold">
                      <div className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-emerald-600" />
                        <span>B列: 対象ユニット名 (Unit)</span>
                      </div>
                    </th>
                    <th className="py-2.5 px-3 bg-amber-50 text-amber-900 font-bold text-right">
                      <div className="flex items-center justify-end gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                        <span>C列: 目的変数 (Value)</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-[11px] text-slate-800">
                  <tr className="hover:bg-slate-50/70">
                    <td className="py-1.5 px-2.5 text-center text-slate-400 border-r border-slate-200 bg-slate-50/50">1</td>
                    <td className="py-1.5 px-3 border-r border-slate-200 text-blue-950 font-semibold">2024-01-07</td>
                    <td className="py-1.5 px-3 border-r border-slate-200 text-emerald-950">
                      渋谷店 <span className="text-[10px] bg-blue-100 text-blue-800 px-1 py-0.2 rounded font-sans">施策店舗</span>
                    </td>
                    <td className="py-1.5 px-3 text-right font-bold text-amber-950">3450000</td>
                  </tr>
                  <tr className="hover:bg-slate-50/70">
                    <td className="py-1.5 px-2.5 text-center text-slate-400 border-r border-slate-200 bg-slate-50/50">2</td>
                    <td className="py-1.5 px-3 border-r border-slate-200 text-blue-950 font-semibold">2024-01-07</td>
                    <td className="py-1.5 px-3 border-r border-slate-200 text-slate-700">新宿店（対照群1）</td>
                    <td className="py-1.5 px-3 text-right font-bold text-amber-950">3750000</td>
                  </tr>
                  <tr className="hover:bg-slate-50/70">
                    <td className="py-1.5 px-2.5 text-center text-slate-400 border-r border-slate-200 bg-slate-50/50">3</td>
                    <td className="py-1.5 px-3 border-r border-slate-200 text-blue-950 font-semibold">2024-01-07</td>
                    <td className="py-1.5 px-3 border-r border-slate-200 text-slate-700">池袋店（対照群2）</td>
                    <td className="py-1.5 px-3 text-right font-bold text-amber-950">3200000</td>
                  </tr>
                  <tr className="hover:bg-slate-50/70 bg-slate-50/40">
                    <td className="py-1.5 px-2.5 text-center text-slate-400 border-r border-slate-200 bg-slate-50/50">4</td>
                    <td className="py-1.5 px-3 border-r border-slate-200 text-blue-950 font-semibold">2024-01-14</td>
                    <td className="py-1.5 px-3 border-r border-slate-200 text-emerald-950">
                      渋谷店 <span className="text-[10px] bg-blue-100 text-blue-800 px-1 py-0.2 rounded font-sans">施策店舗</span>
                    </td>
                    <td className="py-1.5 px-3 text-right font-bold text-amber-950">3420000</td>
                  </tr>
                  <tr className="hover:bg-slate-50/70 bg-slate-50/40">
                    <td className="py-1.5 px-2.5 text-center text-slate-400 border-r border-slate-200 bg-slate-50/50">5</td>
                    <td className="py-1.5 px-3 border-r border-slate-200 text-blue-950 font-semibold">2024-01-14</td>
                    <td className="py-1.5 px-3 border-r border-slate-200 text-slate-700">新宿店（対照群1）</td>
                    <td className="py-1.5 px-3 text-right font-bold text-amber-950">3720000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Column Rules */}
          <div>
            <span className="font-bold text-slate-800 text-xs sm:text-sm block mb-2">
              ② 各列のルールと自動認識されるヘッダー名
            </span>

            <div className="space-y-2.5">
              {/* Column 1 */}
              <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-950 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>第1列：日付（必須）</span>
                  </span>
                  <span className="text-[11px] font-mono text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                    推奨: YYYY-MM-DD
                  </span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  <strong>認識されるヘッダー名：</strong> <code>日付</code>, <code>date</code>, <code>週</code>, <code>年月</code>, <code>年月日</code> 等（大文字小文字問わず）
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] pt-1 border-t border-blue-100">
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> OK: <code>2024-01-07</code>, <code>2024/01/07</code>, <code>2024/1/7</code>
                  </span>
                  <span className="text-slate-500">
                    ※日次・週次・月次のいずれでもOKですが、全ユニットで周期を統一してください。
                  </span>
                </div>
              </div>

              {/* Column 2 */}
              <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    <span>第2列：対象ユニット名（必須）</span>
                  </span>
                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    テキスト形式
                  </span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  <strong>認識されるヘッダー名：</strong> <code>店舗名</code>, <code>店舗</code>, <code>ユニット</code>, <code>unit</code>, <code>地域</code>, <code>対象</code>, <code>部署</code>, <code>市</code> 等
                </p>
                <div className="text-[11px] pt-1 border-t border-emerald-100 text-slate-600">
                  施策を実施したユニット（1つ）と、実施しなかった比較対象ユニット（推奨5〜20以上）を同じ列に記録します。
                </div>
              </div>

              {/* Column 3 */}
              <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-950 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                    <span>第3列：目的変数 / 測定値（必須）</span>
                  </span>
                  <span className="text-[11px] font-mono text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                    半角数値
                  </span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  <strong>認識されるヘッダー名：</strong> <code>売上</code>, <code>売上金額</code>, <code>客数</code>, <code>登録数</code>, <code>数値</code>, <code>sales</code>, <code>value</code>, <code>時間</code> 等
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] pt-1 border-t border-amber-100 text-slate-600">
                  <span>カンマ付き（<code>3,450,000</code>）や円記号（<code>¥</code>）は自動でクレンジングされます。</span>
                </div>
              </div>
            </div>
          </div>

          {/* OK vs NG Structure Comparison */}
          <div>
            <span className="font-bold text-slate-800 text-xs sm:text-sm block mb-2">
              ③ よくある間違い：縦持ち（ロング形式）と横持ち（ワイド形式）
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/50">
                <div className="flex items-center gap-1.5 font-bold text-rose-800 mb-1">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>NGな例（横持ち形式）</span>
                </div>
                <div className="font-mono text-[10px] bg-white p-2 rounded border border-rose-200 text-slate-700 leading-relaxed">
                  日付, 渋谷店, 新宿店, 池袋店<br />
                  2024-01-07, 3450000, 3750000, 3200000
                </div>
                <p className="text-[11px] text-rose-700 mt-1.5">
                  各店舗を列ごとに横へ広げると正しく認識できません。
                </p>
              </div>

              <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>OKな例（縦持ち形式：推奨）</span>
                </div>
                <div className="font-mono text-[10px] bg-white p-2 rounded border border-emerald-200 text-slate-700 leading-relaxed">
                  日付, 店舗名, 売上<br />
                  2024-01-07, 渋谷店, 3450000<br />
                  2024-01-07, 新宿店, 3750000
                </div>
                <p className="text-[11px] text-emerald-700 mt-1.5">
                  「店舗名」列の中に店舗を並べ、行を縦に増やしてください。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopy}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>コピーしました！</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>見本テキストをコピー</span>
                </>
              )}
            </button>

            <button
              onClick={downloadSampleCSV}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-blue-500/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>見本CSVファイルをダウンロード</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-medium text-center"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
