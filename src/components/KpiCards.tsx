import React from 'react';
import { TrendingUp, CheckCircle, Percent, DollarSign, Award, AlertTriangle } from 'lucide-react';
import { SCMResult } from '../types';

interface KpiCardsProps {
  result: SCMResult;
  cost: number;
  margin: number;
  metricName?: string;
  metricUnit?: string;
  unitTypeName?: string;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  result,
  cost,
  margin,
  metricName = '売上金額',
  metricUnit = '円',
  unitTypeName = '店舗',
}) => {
  const {
    totalIncrementalEffect,
    averageIncrementalEffect,
    confidenceScore,
    placeboPValue,
    interventionIndex,
    dates,
  } = result;

  const postLength = dates.length - interventionIndex;
  const isPositive = totalIncrementalEffect >= 0;

  // Format unit value
  const formatMetricValue = (val: number) => {
    const absVal = Math.abs(Math.round(val));
    const prefix = val >= 0 ? '+' : '-';
    if (metricUnit === '円') {
      return `${prefix}¥${absVal.toLocaleString('ja-JP')}`;
    }
    return `${prefix}${absVal.toLocaleString('ja-JP')} ${metricUnit}`;
  };

  // Format currency JPY for financial calculations
  const formatCurrency = (val: number) => {
    const absVal = Math.abs(Math.round(val));
    const prefix = val >= 0 ? '+' : '-';
    return `${prefix}¥${absVal.toLocaleString('ja-JP')}`;
  };

  // Confidence badge
  const isHighFit = confidenceScore >= 90;
  const isMediumFit = confidenceScore >= 80 && confidenceScore < 90;

  // Significance
  let significancePct = 0;
  if (placeboPValue !== null) {
    significancePct = Math.round((1 - placeboPValue) * 1000) / 10;
  }

  // Financial ROI
  // If metric is in JPY: incremental sales * margin% - cost
  // If metric is non-currency (users, hours, MWh): user provides cost and can evaluate unit return or savings
  const incrementalGrossProfit = totalIncrementalEffect * (margin / 100);
  const netProfit = incrementalGrossProfit - cost;
  const roi = cost > 0 ? (netProfit / cost) * 100 : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Incremental Effect */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            真の純増効果（推定合計）
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div>
          <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isPositive ? 'text-blue-700' : 'text-rose-600'}`}>
            {formatMetricValue(totalIncrementalEffect)}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 flex-wrap">
            <span>施策後 {postLength} 期間合計</span>
            <span>•</span>
            <span>平均 {formatMetricValue(averageIncrementalEffect)}/期</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
          「何もしなかった場合」との累積差分
        </div>
      </div>

      {/* Card 2: Model Confidence Score */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            モデル信頼度スコア
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {confidenceScore.toFixed(1)}
            </span>
            <span className="text-lg font-bold text-slate-500">点 / 100</span>
          </div>

          <div className="mt-1.5 flex items-center gap-1.5 text-xs">
            {isHighFit ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[11px]">
                <CheckCircle className="w-3 h-3" /> ◎ 適合度：高い
              </span>
            ) : isMediumFit ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold text-[11px]">
                △ 適合度：まずまず
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold text-[11px]">
                <AlertTriangle className="w-3 h-3" /> × 適合度：低い
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
          施策前期間のトレンド再現率
        </div>
      </div>

      {/* Card 3: Statistical Significance */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            統計的有意確率
          </span>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Percent className="w-4 h-4" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {placeboPValue !== null ? `${significancePct.toFixed(1)}%` : '−'}
            </span>
            <span className="text-xs text-slate-500">偶然ではない確率</span>
          </div>

          <div className="mt-1.5 text-xs text-slate-600 flex items-center gap-1">
            <span>プラセボ p値 = </span>
            <span className="font-mono font-bold text-slate-800">
              {placeboPValue !== null ? placeboPValue.toFixed(3) : '−'}
            </span>
            <span className="text-[11px] text-slate-400">
              {placeboPValue !== null && placeboPValue <= 0.05
                ? '（◎ 珍しい変化）'
                : placeboPValue !== null && placeboPValue <= 0.2
                ? '（△ 参考程度）'
                : '（× 一般的）'}
            </span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
          他{unitTypeName}とのプラセボ偽薬検定
        </div>
      </div>

      {/* Card 4: ROI / Payback */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            投資回収率（ROI）
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                roi === null
                  ? 'text-slate-500'
                  : roi >= 20
                  ? 'text-emerald-700'
                  : roi >= 0
                  ? 'text-amber-700'
                  : 'text-rose-600'
              }`}
            >
              {roi !== null ? `${roi >= 0 ? '+' : ''}${Math.round(roi)}%` : '費用0円'}
            </span>
          </div>

          <div className="mt-1.5 text-xs text-slate-600">
            {cost > 0 ? (
              <span className="flex items-center gap-1">
                <span>純利益: </span>
                <strong className={netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                  {formatCurrency(netProfit)}
                </strong>
                <span className="text-slate-400">（粗利{margin}%）</span>
              </span>
            ) : (
              <span className="text-slate-500">左のスライダーで費用を設定</span>
            )}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
          純増利益 ÷ 施策投下コスト
        </div>
      </div>
    </div>
  );
};
