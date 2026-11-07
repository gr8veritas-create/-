import React from 'react';
import Plotly from 'plotly.js-dist-min';
import { PlotlyChart } from './PlotlyChart';
import { SCMResult } from '../types';
import { PieChart, Info } from 'lucide-react';

interface WeightsChartProps {
  result: SCMResult;
  unitTypeName?: string;
}

export const WeightsChart: React.FC<WeightsChartProps> = ({
  result,
  unitTypeName = '店舗',
}) => {
  const { donorWeights, targetUnit } = result;

  const sortedWeights = [...donorWeights].sort((a, b) => b.weight - a.weight);
  const significantDonors = sortedWeights.filter((d) => d.weight >= 0.005);
  const zeroDonors = sortedWeights.filter((d) => d.weight < 0.005);

  const units = sortedWeights.map((d) => d.unit).reverse();
  const weightsPct = sortedWeights.map((d) => Math.round(d.weight * 1000) / 10).reverse();

  const colors = weightsPct.map((val) => (val > 10 ? '#2563eb' : val > 1 ? '#60a5fa' : '#cbd5e1'));

  const traces: Plotly.Data[] = [
    {
      x: weightsPct,
      y: units,
      type: 'bar',
      orientation: 'h',
      marker: {
        color: colors,
      },
      text: weightsPct.map((val) => (val > 0.1 ? `${val.toFixed(1)}%` : '')),
      textposition: 'outside',
      cliponaxis: false,
      hovertemplate: '%{y}: <b>%{x:.1f}%</b><extra></extra>',
    },
  ];

  const maxWeight = Math.max(...weightsPct, 10);

  const layout: Partial<Plotly.Layout> = {
    margin: { l: 120, r: 50, t: 25, b: 40 },
    xaxis: {
      title: { text: '重み比率 (%)', font: { size: 11, color: '#64748b' } },
      gridcolor: '#e2e8f0',
      range: [0, Math.min(100, maxWeight * 1.25 + 5)],
      automargin: true,
    },
    yaxis: {
      tickfont: { size: 11, color: '#1e293b' },
      automargin: true,
    },
  };

  const summaryParts = significantDonors
    .map((d) => `<b>${d.unit}</b> ${(d.weight * 100).toFixed(1)}%`)
    .join(' ＋ ');

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
      <div className="min-w-0">
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-blue-600" />
              <span>合成モデルの内訳（透明性の担保）</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              どの対照{unitTypeName}のトレンドを何%の比率でブレンドして架空の比較対象を作ったかを示します
            </p>
          </div>
        </div>

        <div className="w-full h-[230px] overflow-hidden">
          <PlotlyChart data={traces} layout={layout} />
        </div>
      </div>

      <div className="mt-4 bg-slate-50 rounded-lg p-3 text-xs text-slate-700 border border-slate-200">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-slate-900">配合レシピ：</span>
            <span
              className="text-slate-800"
              dangerouslySetInnerHTML={{
                __html:
                  significantDonors.length > 0
                    ? ` 施策前の${targetUnit}は、${summaryParts} をブレンドすることで最も自然に再現されました。`
                    : ` 均等な配分で合成されました。`,
              }}
            />
            {zeroDonors.length > 0 && (
              <span className="text-slate-500 block mt-1">
                ※ {zeroDonors.map((d) => d.unit).join('・')} の重みは0%（または1%未満）となり、合成には使われませんでした。
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
