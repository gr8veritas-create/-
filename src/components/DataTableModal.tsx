import React from 'react';
import { X, Download, Table as TableIcon } from 'lucide-react';
import { SCMResult } from '../types';

interface DataTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: SCMResult;
  metricName?: string;
  metricUnit?: string;
}

export const DataTableModal: React.FC<DataTableModalProps> = ({
  isOpen,
  onClose,
  result,
  metricName = '売上金額',
  metricUnit = '円',
}) => {
  if (!isOpen) return null;

  const { dates, actualValues, syntheticValues, gapValues, interventionIndex, targetUnit } = result;

  let cumSum = 0;
  const tableRows = dates.map((d, idx) => {
    const isPost = idx >= interventionIndex;
    const gap = gapValues[idx];
    if (isPost) {
      cumSum += gap;
    }
    return {
      date: d,
      isPost,
      actual: actualValues[idx],
      synthetic: syntheticValues[idx],
      gap,
      cumulative: isPost ? cumSum : null,
    };
  });

  const exportTableCSV = () => {
    const header = `日付,期間,実際の実績(${metricUnit}),合成対照(${metricUnit}),純増差分(${metricUnit}),累積効果(${metricUnit})\n`;
    const rows = tableRows
      .map(
        (r) =>
          `${r.date},${r.isPost ? '施策後' : '施策前'},${Math.round(r.actual)},${Math.round(r.synthetic)},${Math.round(r.gap)},${r.cumulative !== null ? Math.round(r.cumulative) : ''}`
      )
      .join('\n');
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), header + rows], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `impactsynth_${targetUnit}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatVal = (val: number) => {
    const rounded = Math.round(val);
    if (metricUnit === '円') {
      return `¥${rounded.toLocaleString('ja-JP')}`;
    }
    return `${rounded.toLocaleString('ja-JP')} ${metricUnit}`;
  };

  const formatGap = (val: number) => {
    const rounded = Math.round(val);
    const prefix = rounded >= 0 ? '+' : '';
    if (metricUnit === '円') {
      return `${prefix}¥${rounded.toLocaleString('ja-JP')}`;
    }
    return `${prefix}${rounded.toLocaleString('ja-JP')} ${metricUnit}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <TableIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                {targetUnit}：詳細データテーブル
              </h3>
              <p className="text-xs text-slate-500">全 {dates.length} 期間の測定数値一覧（{metricName}）</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportTableCSV}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 active:scale-98 transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSVダウンロード</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div className="p-4 overflow-y-auto flex-1">
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold sticky top-0">
                  <th className="py-2.5 px-3">日付</th>
                  <th className="py-2.5 px-3">区分</th>
                  <th className="py-2.5 px-3 text-right">実際の実績 ({metricUnit})</th>
                  <th className="py-2.5 px-3 text-right">合成対照 ({metricUnit})</th>
                  <th className="py-2.5 px-3 text-right">純増差分 ({metricUnit})</th>
                  <th className="py-2.5 px-3 text-right">累積効果 ({metricUnit})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tableRows.map((row, idx) => (
                  <tr
                    key={row.date}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      row.isPost ? 'bg-blue-50/20' : ''
                    } ${idx === interventionIndex ? 'border-t-2 border-blue-500' : ''}`}
                  >
                    <td className="py-2 px-3 font-mono text-slate-700 font-medium">
                      {row.date}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          row.isPost
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {row.isPost ? '施策後' : '施策前'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-900 font-semibold">
                      {formatVal(row.actual)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-600">
                      {formatVal(row.synthetic)}
                    </td>
                    <td
                      className={`py-2 px-3 text-right font-mono font-bold ${
                        row.gap >= 0 ? 'text-blue-700' : 'text-rose-600'
                      }`}
                    >
                      {formatGap(row.gap)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-800 font-semibold">
                      {row.cumulative !== null ? (
                        <span className="text-emerald-700">
                          {formatGap(row.cumulative)}
                        </span>
                      ) : (
                        <span className="text-slate-400">−</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>施策開始日: {result.interventionDate}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-medium"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
