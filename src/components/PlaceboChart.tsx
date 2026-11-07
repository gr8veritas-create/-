import React, { useState } from 'react';
import Plotly from 'plotly.js-dist-min';
import { PlotlyChart } from './PlotlyChart';
import { SCMResult } from '../types';
import {
  ShieldAlert,
  BarChart,
  LineChart as LineIcon,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  Calculator,
  ArrowRight,
} from 'lucide-react';

interface PlaceboChartProps {
  result: SCMResult;
  metricUnit?: string;
  unitTypeName?: string;
}

export const PlaceboChart: React.FC<PlaceboChartProps> = ({
  result,
  metricUnit = '円',
  unitTypeName = '店舗',
}) => {
  const [tab, setTab] = useState<'lines' | 'ratio'>('lines');
  const [isExplainerOpen, setIsExplainerOpen] = useState(false);
  const [isMechanismOpen, setIsMechanismOpen] = useState(false);

  const {
    targetUnit,
    interventionDate,
    dates,
    gapValues,
    placeboResults,
    rmspeRatio,
    placeboPValue,
  } = result;

  // Tab 1: All gap lines
  const tracesLines: Plotly.Data[] = [];

  // Zero reference
  tracesLines.push({
    x: dates,
    y: new Array(dates.length).fill(0),
    type: 'scatter',
    mode: 'lines',
    name: '基準ライン (ズレ0)',
    line: { color: '#94a3b8', width: 1.5, dash: 'dot' },
    showlegend: false,
    hoverinfo: 'skip',
  });

  // Placebo lines (gray thin)
  for (const pl of placeboResults) {
    tracesLines.push({
      x: dates,
      y: pl.gaps,
      type: 'scatter',
      mode: 'lines',
      name: `${pl.unit} (偽薬)`,
      line: { color: 'rgba(148, 163, 184, 0.55)', width: 1.5 },
      hovertemplate: `${pl.unit} (偽薬): %{y:,.0f} ${metricUnit}<extra></extra>`,
    });
  }

  // Target store gap line (Bold blue)
  tracesLines.push({
    x: dates,
    y: gapValues,
    type: 'scatter',
    mode: 'lines',
    name: `${targetUnit} (実際の対象)`,
    line: { color: '#2563eb', width: 3.5 },
    hovertemplate: `<b>${targetUnit} (対象)</b>: %{y:,.0f} ${metricUnit}<extra></extra>`,
  });

  const layoutLines: Partial<Plotly.Layout> = {
    margin: { l: 65, r: 25, t: 25, b: 75 },
    shapes: [
      {
        type: 'line',
        xref: 'x',
        yref: 'paper',
        x0: interventionDate,
        y0: 0,
        x1: interventionDate,
        y1: 1,
        line: { color: '#475569', width: 2, dash: 'dashdot' },
      },
    ],
    xaxis: {
      title: { text: '日付', font: { size: 11, color: '#64748b' } },
      gridcolor: '#e2e8f0',
      automargin: true,
    },
    yaxis: {
      title: { text: `乖離金額 (${metricUnit})`, font: { size: 11, color: '#64748b' } },
      gridcolor: '#e2e8f0',
      tickformat: ',.0f',
      automargin: true,
    },
    legend: {
      orientation: 'h',
      x: 0.5,
      xanchor: 'center',
      y: -0.25,
      font: { size: 10 },
    },
  };

  // Tab 2: RMSPE Ratio comparison bar chart
  const allRatios = [
    { unit: `${targetUnit} (施策対象)`, ratio: rmspeRatio, isTarget: true },
    ...placeboResults.map((p) => ({
      unit: `${p.unit} (対照群)`,
      ratio: p.ratio,
      isTarget: false,
    })),
  ].sort((a, b) => b.ratio - a.ratio);

  const units = allRatios.map((r) => r.unit).reverse();
  const ratioVals = allRatios.map((r) => Math.round(r.ratio * 10) / 10).reverse();
  const barColors = allRatios.map((r) => (r.isTarget ? '#2563eb' : '#94a3b8')).reverse();

  const maxRatio = Math.max(...ratioVals, 5);

  const tracesRatio: Plotly.Data[] = [
    {
      x: ratioVals,
      y: units,
      type: 'bar',
      orientation: 'h',
      marker: { color: barColors },
      text: ratioVals.map((v) => `${v.toFixed(1)}倍`),
      textposition: 'outside',
      cliponaxis: false,
      hovertemplate: '%{y}: <b>%{x:.1f}倍</b><extra></extra>',
    },
  ];

  const layoutRatio: Partial<Plotly.Layout> = {
    margin: { l: 145, r: 50, t: 25, b: 40 },
    xaxis: {
      title: { text: '効果乖離比率 (倍率)', font: { size: 11, color: '#64748b' } },
      gridcolor: '#e2e8f0',
      range: [0, maxRatio * 1.25 + 1],
      automargin: true,
    },
    yaxis: {
      tickfont: { size: 11, color: '#1e293b' },
      automargin: true,
    },
  };

  const targetRank = allRatios.findIndex((r) => r.isTarget) + 1;
  const totalUnits = allRatios.length;

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
      <div className="min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-600" />
              <span>プラセボ偽薬検定（偶然性の排除）</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              何もしなかった他{unitTypeName}にもあえて同じ分析をかけ、「偶然ではないか」を医学の治験と同じ原理で検証
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsMechanismOpen(!isMechanismOpen)}
              className="text-xs text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-colors"
            >
              <Calculator className="w-3.5 h-3.5 text-indigo-600" />
              <span>効果乖離の仕組み</span>
              {isMechanismOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <button
              onClick={() => setIsExplainerOpen(!isExplainerOpen)}
              className="text-xs text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>偽薬検定とは？</span>
              {isExplainerOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <div className="inline-flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs">
              <button
                onClick={() => setTab('lines')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1 ${
                  tab === 'lines'
                    ? 'bg-white text-blue-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LineIcon className="w-3.5 h-3.5" />
                <span>推移比較</span>
              </button>
              <button
                onClick={() => setTab('ratio')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1 ${
                  tab === 'ratio'
                    ? 'bg-white text-blue-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart className="w-3.5 h-3.5" />
                <span>比率順位</span>
              </button>
            </div>
          </div>
        </div>

        {/* Detailed Explanation of 効果乖離比較の仕組み (Point 4 requested by user) */}
        {isMechanismOpen && (
          <div className="mb-4 bg-indigo-50/80 border border-indigo-200 rounded-xl p-4 text-xs text-slate-700 leading-relaxed space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-indigo-950 text-sm">
              <Calculator className="w-4 h-4 text-indigo-600" />
              <span>【徹底解説】効果乖離比較（RMSPE比率）の計算の仕組み</span>
            </div>
            <div className="bg-white p-3.5 rounded-lg border border-indigo-100 space-y-2">
              <div className="font-mono text-xs bg-slate-50 p-2 rounded border border-slate-200 text-slate-800 font-bold text-center">
                効果乖離比率 ＝ 施策後の乖離の大きさ（事後RMSPE） ÷ 施策前のモデル誤差（事前RMSPE）
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div>
                  <strong className="text-slate-900 block mb-1">
                    なぜ「施策前のズレ」で割り算するのか？
                  </strong>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    お店や地域によって、<strong>「もともと普段から天候や流行で売上が激しく乱高下する店」</strong>と、<strong>「普段から非常に安定している店」</strong>があります。単に「施策後のズレ金額」だけで比較すると、元々ブレやすい店が勝手に上位に来てしまい不公平です。
                  </p>
                </div>
                <div>
                  <strong className="text-slate-900 block mb-1">
                    「ふだんのズレの何倍ジャンプしたか」を比較
                  </strong>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    施策前の普段のブレ幅で割り算することで、全店舗のベースラインを均一に揃え、<strong>『普段のその店にとって、何倍あり得ないジャンプが起きたか』</strong>をフェアに比較できます。
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 text-[11px] text-indigo-900 flex items-center gap-1.5">
                <ArrowRight className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>
                  <strong>判断基準：</strong>施策対象の倍率が、他店舗を抑えてダントツで第1位（かつ他店の2倍以上）であれば、偶然ではなく施策による真の効果と数学的に証明されます。
                </span>
              </div>
            </div>
          </div>
        )}

        {/* General Analogy Explainer */}
        {isExplainerOpen && (
          <div className="mb-4 bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 leading-relaxed space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>プラセボ偽薬検定とは？（治験の例え）</span>
            </div>
            <p className="text-slate-600 text-[11px]">
              新薬の開発で「効き目のない偽薬（プラセボ）」を飲んだ人と本物の薬を飲んだ人を比べるのと同様に、<strong>「施策をやっていない他の{unitTypeName}」にもあえて同じ分析をかけます</strong>。もし他の店でも同じ時期に売上が急増していれば「単に世の中のブームや天候のせい」と見抜くことができます。
            </p>
          </div>
        )}

        <div className="w-full h-[250px] overflow-hidden">
          {tab === 'lines' ? (
            <PlotlyChart data={tracesLines} layout={layoutLines} />
          ) : (
            <PlotlyChart data={tracesRatio} layout={layoutRatio} />
          )}
        </div>
      </div>

      <div className="mt-4 bg-indigo-50/50 rounded-lg p-3 text-xs text-slate-700 border border-indigo-100">
        <div className="leading-relaxed">
          <span className="font-bold text-indigo-950">統計的解釈：</span>
          <span>
            全{totalUnits}{unitTypeName}中、<strong>{targetUnit}</strong>の効果乖離比率は <strong>第{targetRank}位（{rmspeRatio.toFixed(1)}倍）</strong>（p値 = {placeboPValue !== null ? placeboPValue.toFixed(3) : '−'}）です。
          </span>
          <span className="block mt-1 text-slate-600 text-[11px]">
            {targetRank === 1 ? (
              <span className="flex items-center gap-1.5 text-emerald-800 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>他のどの{unitTypeName}にも見られない特異な変化が{targetUnit}だけに生じており、偶然ではなく施策特有の成果である可能性が極めて高い状態です。</span>
              </span>
            ) : (
              <span>他の{unitTypeName}でも一定の自然変動が生じているため、外部要因の影響も視野に入れて総合的にご判断ください。</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
