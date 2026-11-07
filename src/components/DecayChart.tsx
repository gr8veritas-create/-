import React, { useState } from 'react';
import Plotly from 'plotly.js-dist-min';
import { PlotlyChart } from './PlotlyChart';
import { SCMResult, SimulationParams } from '../types';
import {
  Sliders,
  Sparkles,
  TrendingDown,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Calculator,
  Zap,
  Repeat,
  Shield,
  ArrowRight,
} from 'lucide-react';

interface DecayChartProps {
  result: SCMResult;
  params: SimulationParams;
  onParamsChange: (newParams: Partial<SimulationParams>) => void;
  metricName?: string;
  metricUnit?: string;
}

export const DecayChart: React.FC<DecayChartProps> = ({
  result,
  params,
  onParamsChange,
  metricName = '売上金額',
  metricUnit = '円',
}) => {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const { dates, actualValues, syntheticValues, averageIncrementalEffect } = result;
  const { monthlyDecayRate, forecastMonths } = params;

  const lastDateStr = dates[dates.length - 1];
  const lastActual = actualValues[actualValues.length - 1];
  const lastSynthetic = syntheticValues[syntheticValues.length - 1];
  const currentLift = Math.max(0, averageIncrementalEffect);

  const futureWeeks = forecastMonths * 4;
  const futureDates: string[] = [];
  const futureBaseline: number[] = [];
  const futureDecayed: number[] = [];

  const baseDate = new Date(lastDateStr);
  const weeklyRetention = Math.pow(Math.max(0.01, 1 - monthlyDecayRate / 100), 1 / 4);

  let cumulativeProjectedLift = 0;

  for (let w = 1; w <= futureWeeks; w++) {
    const fDate = new Date(baseDate);
    fDate.setUTCDate(baseDate.getUTCDate() + w * 7);
    const dateStr = fDate.toISOString().split('T')[0];
    futureDates.push(dateStr);

    const baseline = lastSynthetic;
    futureBaseline.push(baseline);

    const remainingLift = currentLift * Math.pow(weeklyRetention, w);
    cumulativeProjectedLift += remainingLift;
    futureDecayed.push(baseline + remainingLift);
  }

  const traceObservedActual: Plotly.Data = {
    x: dates.slice(-16),
    y: actualValues.slice(-16),
    type: 'scatter',
    mode: 'lines+markers',
    name: '実績（観測済み）',
    line: { color: '#2563eb', width: 2.5 },
    marker: { size: 4 },
  };

  const traceObservedSynthetic: Plotly.Data = {
    x: dates.slice(-16),
    y: syntheticValues.slice(-16),
    type: 'scatter',
    mode: 'lines',
    name: '合成対照（もし施策なし）',
    line: { color: '#ef4444', width: 2, dash: 'dash' },
  };

  const traceProjectedBaseline: Plotly.Data = {
    x: [lastDateStr, ...futureDates],
    y: [lastSynthetic, ...futureBaseline],
    type: 'scatter',
    mode: 'lines',
    name: '将来ベースライン（施策なし推移）',
    line: { color: '#94a3b8', width: 2, dash: 'dot' },
  };

  const traceProjectedDecayed: Plotly.Data = {
    x: [lastDateStr, ...futureDates],
    y: [lastActual, ...futureDecayed],
    type: 'scatter',
    mode: 'lines+markers',
    name: `将来予測（月${monthlyDecayRate}%減衰）`,
    line: { color: '#8b5cf6', width: 2.5, dash: 'dash' },
    marker: { size: 4, color: '#8b5cf6' },
  };

  const layout: Partial<Plotly.Layout> = {
    margin: { l: 65, r: 25, t: 30, b: 75 },
    shapes: [
      {
        type: 'line',
        xref: 'x',
        yref: 'paper',
        x0: lastDateStr,
        y0: 0,
        x1: lastDateStr,
        y1: 1,
        line: { color: '#6366f1', width: 1.5, dash: 'dash' },
      },
    ],
    annotations: [
      {
        x: lastDateStr,
        y: 0.95,
        xref: 'x',
        yref: 'paper',
        yanchor: 'top',
        text: '現在 (観測終了時点)',
        showarrow: false,
        font: { size: 10, color: '#4338ca' },
        bgcolor: 'rgba(224, 231, 255, 0.9)',
        bordercolor: '#c7d2fe',
        borderwidth: 1,
      },
    ],
    xaxis: {
      title: { text: '日付', font: { size: 11, color: '#64748b' } },
      gridcolor: '#e2e8f0',
      automargin: true,
    },
    yaxis: {
      title: { text: `${metricName} (${metricUnit})`, font: { size: 11, color: '#64748b' } },
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

  const formatUnitValue = (val: number) => {
    const rounded = Math.round(val);
    if (metricUnit === '円') {
      return `+¥${rounded.toLocaleString('ja-JP')}`;
    }
    return `+${rounded.toLocaleString('ja-JP')} ${metricUnit}`;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>効果減衰シミュレータ（What-if分析）</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            「施策終了後に効果が毎月〇%ずつ落ちていったら？」のシナリオを予測します
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsGuideOpen(!isGuideOpen)}
            className="text-xs text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
            <span>減衰率の決め方・計算方法</span>
            {isGuideOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <div className="bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5">
            <span className="text-purple-700 font-medium">今後{forecastMonths}ヶ月の予測純増:</span>
            <strong className="text-purple-900 font-bold font-mono">
              {formatUnitValue(cumulativeProjectedLift)}
            </strong>
          </div>
        </div>
      </div>

      {/* Guide on how to select or calculate decay rate (Point 5 requested by user) */}
      {isGuideOpen && (
        <div className="mb-4 bg-purple-50/70 border border-purple-200 rounded-xl p-4 text-xs text-slate-700 leading-relaxed space-y-3">
          <div className="flex items-center gap-2 font-bold text-purple-950 text-sm">
            <Calculator className="w-4 h-4 text-purple-600" />
            <span>【ガイド】減衰率の設定基準と過去データからの算出方法</span>
          </div>

          {/* Section 1: Industry / Use Case Presets */}
          <div>
            <span className="font-bold text-purple-900 block mb-1">
              1. 施策タイプ別の目安と推奨減衰率
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <div className="bg-white p-2.5 rounded-lg border border-purple-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-rose-700 mb-0.5">
                    <Zap className="w-3.5 h-3.5" />
                    <span>急速減衰（月30%〜50%）</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-tight">
                    <strong>対象：</strong>セール、割引クーポン、単発CM・インフルエンサー施策
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    値引き等のインセンティブが終わるとすぐに来店動機が失われる一過性施策。
                  </p>
                </div>
                <button
                  onClick={() => onParamsChange({ monthlyDecayRate: 40 })}
                  className="mt-2 text-[10px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 py-1 rounded text-center border border-rose-200 transition-colors"
                >
                  月40%減衰に設定
                </button>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-purple-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-amber-700 mb-0.5">
                    <Repeat className="w-3.5 h-3.5" />
                    <span>標準的減衰（月15%〜25%）</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-tight">
                    <strong>対象：</strong>新商品発売、ポイント制度改定、リピーター育成
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    一部がリピーターとして定着するが、時間の経過とともに他社へ緩やかに流出。
                  </p>
                </div>
                <button
                  onClick={() => onParamsChange({ monthlyDecayRate: 20 })}
                  className="mt-2 text-[10px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 py-1 rounded text-center border border-amber-200 transition-colors"
                >
                  月20%減衰に設定（標準）
                </button>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-purple-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-emerald-700 mb-0.5">
                    <Shield className="w-3.5 h-3.5" />
                    <span>定着・低減衰（月0%〜5%）</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-tight">
                    <strong>対象：</strong>業務改善ツール導入、店舗改装、省エネ設備投資
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    システムや設備、新しい業務習慣が定着するため効果が恒久的に持続。
                  </p>
                </div>
                <button
                  onClick={() => onParamsChange({ monthlyDecayRate: 0 })}
                  className="mt-2 text-[10px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 py-1 rounded text-center border border-emerald-200 transition-colors"
                >
                  月0%減衰（効果維持）に設定
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Mathematical formula to calculate decay rate from past data */}
          <div className="bg-white p-3 rounded-lg border border-purple-100 space-y-1.5">
            <span className="font-bold text-purple-900 block">
              2. 過去の施策実績から自分で減衰率を逆算する方法
            </span>
            <p className="text-[11px] text-slate-600">
              もし以前に類似キャンペーンを実施した実績があるなら、以下の手順で実測の減衰率を逆算できます：
            </p>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 font-mono text-[11px] text-slate-800 space-y-1">
              <div>・施策終了直後（1ヶ月目）の純増効果 ＝ <b>E₁</b></div>
              <div>・終了から m ヶ月後の純増効果 ＝ <b>E_m</b></div>
              <div className="text-purple-800 font-bold pt-1 border-t border-slate-200">
                月次残存率 R ＝ (E_m ÷ E₁)^(1 ÷ (m - 1))
              </div>
              <div className="text-purple-800 font-bold">
                月次減衰率 (%) ＝ (1 － R) × 100%
              </div>
            </div>
            <div className="text-[11px] text-slate-600 bg-purple-50/50 p-2 rounded">
              <span className="font-bold text-purple-950">具体例：</span>
              終了直後の純増が「+100万円」で、3ヶ月後（m=3）に「+64万円」まで落ちていた場合：
              <div className="font-mono text-xs text-purple-900 mt-0.5">
                (64 ÷ 100)^(1/2) ＝ √0.64 ＝ 0.80（残存率80%） → <strong>月次減衰率 20%</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sliders Area */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-purple-600" />
              <span>月次減衰率（効果が抜けていくペース）</span>
            </label>
            <span className="font-mono font-bold text-purple-700 text-sm">
              {monthlyDecayRate}% / 月
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={50}
            step={5}
            value={monthlyDecayRate}
            onChange={(e) => onParamsChange({ monthlyDecayRate: Number(e.target.value) })}
            className="w-full accent-purple-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
            <span>0%（定着・維持）</span>
            <span>20%（標準的）</span>
            <span>50%（急速減衰）</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-purple-600" />
              <span>予測ホライズン（先読み期間）</span>
            </label>
            <span className="font-mono font-bold text-purple-700 text-sm">
              {forecastMonths} ヶ月間
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={12}
            step={1}
            value={forecastMonths}
            onChange={(e) => onParamsChange({ forecastMonths: Number(e.target.value) })}
            className="w-full accent-purple-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
            <span>1ヶ月</span>
            <span>6ヶ月（半年）</span>
            <span>12ヶ月（1年）</span>
          </div>
        </div>
      </div>

      <div className="w-full h-[270px] overflow-hidden">
        <PlotlyChart
          data={[
            traceObservedActual,
            traceObservedSynthetic,
            traceProjectedBaseline,
            traceProjectedDecayed,
          ]}
          layout={layout}
        />
      </div>
    </div>
  );
};
