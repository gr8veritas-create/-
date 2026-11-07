import React, { useState, useEffect } from 'react';
import Plotly from 'plotly.js-dist-min';
import { PlotlyChart } from './PlotlyChart';
import { SCMResult } from '../types';
import { BarChart2, Layers, HelpCircle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface MainChartProps {
  result: SCMResult;
  metricName?: string;
  metricUnit?: string;
  unitTypeName?: string;
}

export const MainChart: React.FC<MainChartProps> = ({
  result,
  metricName = '売上金額',
  metricUnit = '円',
  unitTypeName = '店舗',
}) => {
  const [viewMode, setViewMode] = useState<'levels' | 'gap'>('levels');
  const [isExplainerOpen, setIsExplainerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const {
    targetUnit,
    interventionDate,
    interventionIndex,
    dates,
    actualValues,
    syntheticValues,
    gapValues,
  } = result;

  const postDates = dates.slice(interventionIndex);
  const postActual = actualValues.slice(interventionIndex);
  const postSynthetic = syntheticValues.slice(interventionIndex);

  // Construct Plotly Traces
  let traces: Plotly.Data[] = [];

  if (viewMode === 'levels') {
    // 1. Synthetic line (Counterfactual - Red Dashed)
    const traceSynthetic: Plotly.Data = {
      x: dates,
      y: syntheticValues,
      type: 'scatter',
      mode: 'lines',
      name: isMobile ? '合成対照' : `合成対照（もし施策なし）`,
      line: {
        color: '#ef4444',
        width: isMobile ? 2 : 2.5,
        dash: 'dash',
      },
      hovertemplate: `合成対照: %{y:,.0f} ${metricUnit}<extra></extra>`,
    };

    // 2. Post-intervention fill area (shaded between actual and synthetic)
    const traceFillBaseline: Plotly.Data = {
      x: postDates,
      y: postSynthetic,
      type: 'scatter',
      mode: 'lines',
      line: { color: 'transparent', width: 0 },
      showlegend: false,
      hoverinfo: 'skip',
    };

    const traceFillArea: Plotly.Data = {
      x: postDates,
      y: postActual,
      type: 'scatter',
      mode: 'lines',
      fill: 'tonexty',
      fillcolor: 'rgba(37, 99, 235, 0.16)',
      line: { color: 'transparent', width: 0 },
      name: '推定純増エリア',
      hoverinfo: 'skip',
    };

    // 3. Actual line (Real observed data - Blue Solid)
    const traceActual: Plotly.Data = {
      x: dates,
      y: actualValues,
      type: 'scatter',
      mode: 'lines+markers',
      marker: { size: isMobile ? 3 : 4, color: '#2563eb' },
      name: isMobile ? `${targetUnit}実績` : `${targetUnit}（実際の実績）`,
      line: {
        color: '#2563eb',
        width: isMobile ? 2.5 : 3,
      },
      hovertemplate: `実際の実績: %{y:,.0f} ${metricUnit}<extra></extra>`,
    };

    traces = [traceFillBaseline, traceFillArea, traceSynthetic, traceActual];
  } else {
    // Gap view (Actual - Synthetic)
    const traceZero: Plotly.Data = {
      x: dates,
      y: new Array(dates.length).fill(0),
      type: 'scatter',
      mode: 'lines',
      name: '基準 (0)',
      line: { color: '#94a3b8', width: 1.5, dash: 'dot' },
      hoverinfo: 'skip',
    };

    const traceGapPre: Plotly.Data = {
      x: dates.slice(0, interventionIndex),
      y: gapValues.slice(0, interventionIndex),
      type: 'scatter',
      mode: 'lines+markers',
      name: isMobile ? '施策前ズレ' : '施策前のズレ (モデル誤差)',
      line: { color: '#64748b', width: 2 },
      marker: { size: isMobile ? 3 : 4 },
      hovertemplate: `施策前のズレ: %{y:,.0f} ${metricUnit}<extra></extra>`,
    };

    const traceGapPost: Plotly.Data = {
      x: postDates,
      y: gapValues.slice(interventionIndex),
      type: 'scatter',
      mode: 'lines+markers',
      fill: 'tozeroy',
      fillcolor: 'rgba(37, 99, 235, 0.18)',
      name: isMobile ? '純増差分' : '施策後効果 (純増差分の山)',
      line: { color: '#2563eb', width: isMobile ? 2.5 : 3 },
      marker: { size: isMobile ? 4 : 5, color: '#1d4ed8' },
      hovertemplate: `純増差分: %{y:,.0f} ${metricUnit}<extra></extra>`,
    };

    traces = [traceZero, traceGapPre, traceGapPost];
  }

  const interventionShape: Partial<Plotly.Shape> = {
    type: 'line',
    xref: 'x',
    yref: 'paper',
    x0: interventionDate,
    y0: 0,
    x1: interventionDate,
    y1: 1,
    line: {
      color: '#475569',
      width: isMobile ? 1.5 : 2,
      dash: 'dashdot',
    },
  };

  const layout: Partial<Plotly.Layout> = {
    autosize: true,
    margin: isMobile
      ? { l: 48, r: 15, t: 28, b: 75, pad: 2 }
      : { l: 65, r: 25, t: 35, b: 70, pad: 4 },
    shapes: [interventionShape],
    annotations: [
      {
        x: interventionDate,
        y: 0.98,
        xref: 'x',
        yref: 'paper',
        yanchor: 'top',
        text: isMobile ? `<b>施策 (${interventionDate})</b>` : `<b>施策開始 (${interventionDate})</b>`,
        showarrow: false,
        font: { size: isMobile ? 9 : 10, color: '#334155' },
        bgcolor: 'rgba(241, 245, 249, 0.92)',
        bordercolor: '#cbd5e1',
        borderwidth: 1,
        borderpad: 2,
      },
    ],
    xaxis: {
      title: {
        text: '日付',
        font: { size: isMobile ? 10 : 11, color: '#64748b' },
        standoff: isMobile ? 6 : 10,
      },
      gridcolor: '#e2e8f0',
      showgrid: true,
      zeroline: false,
      automargin: true,
      tickfont: { size: isMobile ? 9 : 10 },
      nticks: isMobile ? 5 : 10,
    },
    yaxis: {
      title: {
        text: isMobile ? `${metricUnit}` : `${metricName} (${metricUnit})`,
        font: { size: isMobile ? 10 : 11, color: '#64748b' },
        standoff: isMobile ? 6 : 10,
      },
      gridcolor: '#e2e8f0',
      showgrid: true,
      tickformat: ',.0f',
      automargin: true,
      tickfont: { size: isMobile ? 9 : 10 },
    },
    legend: {
      orientation: 'h',
      x: 0.5,
      xanchor: 'center',
      y: isMobile ? -0.26 : -0.20,
      font: { size: isMobile ? 9 : 10 },
    },
    hovermode: 'x unified',
  };

  return (
    <div className="main-chart-container w-full min-w-0 max-w-full bg-white rounded-xl border border-slate-200 p-3 sm:p-5 shadow-xs overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100 min-w-0">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
              メイン分析チャート：{targetUnit}
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
              {viewMode === 'levels' ? '実績 vs 合成対照' : '純増差分 (Gap)'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 sm:line-clamp-1">
            {viewMode === 'levels'
              ? `青の実績線と赤の破線（もし施策をしなかった場合の推定）の乖離を可視化しています`
              : `外部要因（季節・天候等）を相殺した「施策そのものによる純増差分」の推移です`}
          </p>
        </div>

        {/* View toggle & explainer button */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => setIsExplainerOpen(!isExplainerOpen)}
            className="text-xs text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>差分とは？</span>
            {isExplainerOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <div className="inline-flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('levels')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                viewMode === 'levels'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>実績比較</span>
            </button>
            <button
              onClick={() => setViewMode('gap')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                viewMode === 'gap'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>純増差分</span>
            </button>
          </div>
        </div>
      </div>

      {/* Explainer Accordion for 純増差分 (Gap) */}
      {isExplainerOpen && (
        <div className="mb-4 bg-blue-50/70 border border-blue-200 rounded-xl p-3 sm:p-4 text-xs text-slate-700 leading-relaxed space-y-2 overflow-hidden">
          <div className="flex items-center gap-2 font-bold text-blue-950 text-sm">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span>【直感解説】純増差分（Gap）は何を示しているのか？</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="bg-white p-3 rounded-lg border border-blue-100">
              <strong className="text-slate-900 block mb-1">① 引き算で外部要因を消し去る仕組み</strong>
              <p className="text-slate-600">
                「実際の実績 － 合成対照（やらなかった場合の推測）」の単純な引き算です。世の中の景気や天候、季節の波は合成対照側にも同じように反映されるため、引き算することで<strong>『施策そのものの純粋な力』だけが残ります</strong>。
              </p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-blue-100">
              <strong className="text-slate-900 block mb-1">② グラフの見分け方（2つの期間）</strong>
              <ul className="text-slate-600 list-disc list-inside space-y-0.5">
                <li><strong className="text-slate-800">施策前（左側）：</strong>0の周りに平らにはりついているほど「モデルが元の癖を忠実に学習できている」証拠です。</li>
                <li><strong className="text-blue-700">施策後（右側）：</strong>0のラインより上に大きく突き出ている面積が、施策が生み出した真の純増効果です。</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Chart container with strict width & overflow constraints */}
      <div className="w-full min-w-0 max-w-full h-[320px] xs:h-[350px] sm:h-[400px] md:h-[420px] overflow-hidden relative">
        <PlotlyChart data={traces} layout={layout} className="w-full h-full" />
      </div>
    </div>
  );
};
