import React, { useState, useMemo } from 'react';
import Plotly from 'plotly.js-dist-min';
import { PlotlyChart } from './PlotlyChart';
import { OptimalPricingTutorialModal } from './OptimalPricingTutorialModal';
import {
  Tag,
  TrendingUp,
  Percent,
  DollarSign,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Calculator,
  ArrowRight,
  Store,
  Laptop,
  Utensils,
  AlertCircle,
  Sliders,
  CheckCircle2,
  BookOpen,
  Scissors,
  ShoppingBag,
  Briefcase,
  FileText,
  Gift,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { BetaFeatureSurvey } from './BetaFeatureSurvey';

interface PricingPreset {
  id: string;
  name: string;
  category: string;
  currentPrice: number;
  currentQuantity: number;
  unitCost: number;
  elasticity: number;
  description: string;
}

const PRESETS: PricingPreset[] = [
  {
    id: 'cafe_menu',
    name: 'カフェ・飲食（ランチ・こだわりコーヒー）',
    category: '飲食・フードサービス',
    currentPrice: 580,
    currentQuantity: 2800,
    unitCost: 180,
    elasticity: 0.65, // Inelastic: customers don't leave easily for small price change
    description: '固定客が多く、日常の居心地や味で選ばれるため非弾力的（ε=0.65）。値上げしても客離れが少なく利益改善の余地が大きいモデル。',
  },
  {
    id: 'beauty_salon',
    name: '美容院・サロン（カット・カラー・施術料）',
    category: 'サービス・サロン',
    currentPrice: 6500,
    currentQuantity: 320,
    unitCost: 800, // Shampoo, color tubes
    elasticity: 0.55, // Inelastic: high switching barrier
    description: '担当スタイリストへの信頼と高いスイッチング障壁があり非弾力的（ε=0.55）。技術料に見合った値上げで粗利が大幅向上。',
  },
  {
    id: 'ec_cosmetics',
    name: 'EC・コスメ・雑貨（通販消耗品）',
    category: '小売り・EC通販',
    currentPrice: 3500,
    currentQuantity: 1200,
    unitCost: 1400,
    elasticity: 1.60, // Elastic: price sensitive with many competitors
    description: '他社製品との価格比較が容易で敏感（ε=1.60）。安易な値上げは販売数急減を招くため、セット売りや付加価値が必要なモデル。',
  },
  {
    id: 'b2b_consulting',
    name: 'B2B・士業・専門コンサルティング（月額顧問料）',
    category: 'B2B・専門職',
    currentPrice: 80000,
    currentQuantity: 35,
    unitCost: 5000, // Direct marginal cost
    elasticity: 0.40, // Highly inelastic: based on trust & business continuity
    description: '業務の基幹に関わり価格よりも信頼性が重視されるため極めて非弾力的（ε=0.40）。客数が減っても単価アップで利益が爆増。',
  },
  {
    id: 'digital_contents',
    name: 'オンライン講座・教材・電子コンテンツ',
    category: '教育・デジタル',
    currentPrice: 19800,
    currentQuantity: 150,
    unitCost: 300, // Near-zero marginal cost (server/payment fees)
    elasticity: 0.85,
    description: '複製コストがほぼゼロのモデル。値上げによる利益率の伸びが極めて大きく、価格設定がそのまま手残り純利に直結します。',
  },
  {
    id: 'regional_gift',
    name: '地域特産品・プレミアムギフト・伝統工芸',
    category: '食品・贈答品',
    currentPrice: 4200,
    currentQuantity: 650,
    unitCost: 1900,
    elasticity: 0.70,
    description: '「お中元・お歳暮・大切な人への贈り物」として買われるため、多少高くても高品質なものが選ばれやすいモデル。',
  },
  {
    id: 'subscription_service',
    name: 'サブスクリプション・月額会員制サービス',
    category: '会員制・ファンクラブ',
    currentPrice: 1980,
    currentQuantity: 1800,
    unitCost: 200,
    elasticity: 0.75,
    description: '継続課金モデル。一度加入した会員は毎月の小幅な改定では離脱しにくく、ストック収益の最大化が狙えます。',
  },
];

export const OptimalPricingModule: React.FC = () => {
  const [presetId, setPresetId] = useState<string>('cafe_menu');
  const [currentPrice, setCurrentPrice] = useState<number>(580);
  const [currentQuantity, setCurrentQuantity] = useState<number>(2800);
  const [unitCost, setUnitCost] = useState<number>(180);
  const [elasticity, setElasticity] = useState<number>(0.65);
  const [targetSimPrice, setTargetSimPrice] = useState<number>(650);
  const [isExplainerOpen, setIsExplainerOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  // Apply preset
  const handleApplyPreset = (p: PricingPreset) => {
    setPresetId(p.id);
    setCurrentPrice(p.currentPrice);
    setCurrentQuantity(p.currentQuantity);
    setUnitCost(p.unitCost);
    setElasticity(p.elasticity);
    // Default simulated price: ~12% higher
    setTargetSimPrice(Math.round(p.currentPrice * 1.12));
  };

  // Math: Linear demand curve calibrated at current point (P0, Q0) with slope b = elasticity * (Q0 / P0)
  // Q(P) = a - b * P, where b = eps * (Q0 / P0), and a = Q0 + b * P0 = Q0 * (1 + eps)
  const {
    slopeB,
    interceptA,
    optimalPriceProfit,
    optimalPriceRevenue,
    currentRevenue,
    currentProfit,
    simQuantity,
    simRevenue,
    simProfit,
    profitDiff,
    profitDiffPct,
    breakevenQuantityDropPct,
  } = useMemo(() => {
    const P0 = Math.max(1, currentPrice);
    const Q0 = Math.max(1, currentQuantity);
    const C = unitCost;
    const eps = Math.max(0.1, elasticity);

    // Linear demand curve slope and intercept
    const b = eps * (Q0 / P0);
    const a = Q0 * (1 + eps);

    // Profit-maximizing price: P* = (a/b + C) / 2 = (P0 * (1 + eps) / eps + C) / 2
    // Revenue-maximizing price: P_rev* = a / (2 * b) = (P0 * (1 + eps)) / (2 * eps)
    const optProfitP = Math.round((a / b + C) / 2);
    const optRevP = Math.round(a / (2 * b));

    // Current metrics
    const curRev = Math.round(P0 * Q0);
    const curProf = Math.round((P0 - C) * Q0);

    // Simulated target price metrics
    const simP = Math.max(1, targetSimPrice);
    const simQ = Math.max(0, Math.round(a - b * simP));
    const sRev = Math.round(simP * simQ);
    const sProf = Math.round((simP - C) * simQ);

    const diffProf = sProf - curProf;
    const diffProfPct = curProf > 0 ? (diffProf / curProf) * 100 : 0;

    // Breakeven quantity drop percentage: Drop% = 1 - (P0 - C) / (P_new - C)
    let beDrop = 0;
    if (simP > C && P0 > C) {
      beDrop = (1 - (P0 - C) / (simP - C)) * 100;
    }

    return {
      slopeB: b,
      interceptA: a,
      optimalPriceProfit: Math.max(C + 1, optProfitP),
      optimalPriceRevenue: Math.max(1, optRevP),
      currentRevenue: curRev,
      currentProfit: curProf,
      simQuantity: simQ,
      simRevenue: sRev,
      simProfit: sProf,
      profitDiff: diffProf,
      profitDiffPct: diffProfPct,
      breakevenQuantityDropPct: beDrop,
    };
  }, [currentPrice, currentQuantity, unitCost, elasticity, targetSimPrice]);

  // Generate range of prices for curves
  const curveData = useMemo(() => {
    const minP = Math.max(1, Math.round(unitCost * 0.8));
    const maxP = Math.round(Math.max(optimalPriceProfit * 1.5, currentPrice * 1.8));
    const step = Math.max(1, Math.round((maxP - minP) / 60));

    const prices: number[] = [];
    const quantities: number[] = [];
    const revenues: number[] = [];
    const profits: number[] = [];

    for (let p = minP; p <= maxP; p += step) {
      const q = Math.max(0, interceptA - slopeB * p);
      prices.push(p);
      quantities.push(Math.round(q));
      revenues.push(Math.round(p * q));
      profits.push(Math.round((p - unitCost) * q));
    }

    return { prices, quantities, revenues, profits };
  }, [unitCost, optimalPriceProfit, currentPrice, interceptA, slopeB]);

  // Traces for Price vs Profit / Revenue Chart
  const traceProfitCurve: Plotly.Data = {
    x: curveData.prices,
    y: curveData.profits,
    type: 'scatter',
    mode: 'lines',
    name: '月間粗利益カーブ',
    line: { color: '#059669', width: 3 },
    hovertemplate: '価格 ¥%{x:,.0f} → 粗利益 <b>¥%{y:,.0f}</b><extra></extra>',
  };

  const traceRevenueCurve: Plotly.Data = {
    x: curveData.prices,
    y: curveData.revenues,
    type: 'scatter',
    mode: 'lines',
    name: '月間売上高カーブ',
    line: { color: '#3b82f6', width: 2, dash: 'dash' },
    hovertemplate: '価格 ¥%{x:,.0f} → 売上高 <b>¥%{y:,.0f}</b><extra></extra>',
  };

  const traceCurrentMarker: Plotly.Data = {
    x: [currentPrice],
    y: [currentProfit],
    type: 'scatter',
    mode: 'markers+text',
    name: `現在価格 (¥${currentPrice.toLocaleString()})`,
    text: ['現在'],
    textposition: 'top center',
    marker: { size: 10, color: '#64748b' },
    hovertemplate: '現在価格 ¥%{x:,.0f}: 粗利益 ¥%{y:,.0f}<extra></extra>',
  };

  const traceOptimalMarker: Plotly.Data = {
    x: [optimalPriceProfit],
    y: [Math.max(...curveData.profits)],
    type: 'scatter',
    mode: 'markers+text',
    name: `利益最大化価格 P* (¥${optimalPriceProfit.toLocaleString()})`,
    text: ['最適頂点 P*'],
    textposition: 'top center',
    marker: { size: 12, color: '#10b981', symbol: 'star' },
    hovertemplate: '最適価格 ¥%{x:,.0f}: 最大粗利益 ¥%{y:,.0f}<extra></extra>',
  };

  const traceSimMarker: Plotly.Data = {
    x: [targetSimPrice],
    y: [simProfit],
    type: 'scatter',
    mode: 'markers+text',
    name: `検証価格 (¥${targetSimPrice.toLocaleString()})`,
    text: ['検証'],
    textposition: 'bottom center',
    marker: { size: 10, color: '#f59e0b', symbol: 'diamond' },
    hovertemplate: '検証価格 ¥%{x:,.0f}: 粗利益 ¥%{y:,.0f}<extra></extra>',
  };

  const layoutProfitCurve: Partial<Plotly.Layout> = {
    autosize: true,
    margin: { l: 60, r: 25, t: 30, b: 65, pad: 2 },
    xaxis: {
      title: { text: '販売価格 (円)', font: { size: 10, color: '#64748b' } },
      gridcolor: '#e2e8f0',
      automargin: true,
      tickformat: ',.0f',
      tickfont: { size: 9 },
    },
    yaxis: {
      title: { text: '月間金額 (円)', font: { size: 10, color: '#64748b' } },
      gridcolor: '#e2e8f0',
      automargin: true,
      tickformat: ',.0f',
      tickfont: { size: 9 },
    },
    legend: {
      orientation: 'h',
      x: 0.5,
      xanchor: 'center',
      y: -0.22,
      font: { size: 9.5 },
    },
    hovermode: 'x unified',
  };

  // Demand Curve Trace
  const traceDemandCurve: Plotly.Data = {
    x: curveData.prices,
    y: curveData.quantities,
    type: 'scatter',
    mode: 'lines',
    name: '推定需要曲線 Q(P)',
    line: { color: '#6366f1', width: 2.5 },
    hovertemplate: '価格 ¥%{x:,.0f} → 月間販売数 <b>%{y:,.0f} 個</b><extra></extra>',
  };

  const layoutDemandCurve: Partial<Plotly.Layout> = {
    autosize: true,
    margin: { l: 50, r: 20, t: 25, b: 55, pad: 2 },
    xaxis: {
      title: { text: '販売価格 (円)', font: { size: 10, color: '#64748b' } },
      gridcolor: '#e2e8f0',
      automargin: true,
      tickformat: ',.0f',
      tickfont: { size: 9 },
    },
    yaxis: {
      title: { text: '月間販売個数 (個)', font: { size: 10, color: '#64748b' } },
      gridcolor: '#e2e8f0',
      automargin: true,
      tickfont: { size: 9 },
    },
  };

  return (
    <div className="space-y-6">
      {/* Universal Business Notice Banner */}
      <div className="bg-linear-to-r from-indigo-600 via-blue-600 to-indigo-700 px-4 py-2.5 rounded-xl text-white text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse shrink-0" />
          <span className="font-extrabold text-[12px] text-amber-200">
            💡 あなたの業種・商材でもそのまま使えます！
          </span>
          <span className="text-[11px] text-indigo-100 hidden md:inline">
            下のプリセットは入力例に過ぎません。数値を自由に書き換えるだけで、飲食店、サロン、ネット通販、B2B、個人開発、特産品など、あらゆる価格設定に100%対応します。
          </span>
        </div>
        <button
          onClick={() => setIsTutorialOpen(true)}
          className="text-[11px] bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 shrink-0 self-end sm:self-auto transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-300" />
          <span>はじめてガイドを読む</span>
        </button>
      </div>

      {/* Experimental Feature Survey (1-Click Vote for Keep/Prune) */}
      <BetaFeatureSurvey featureId="optimal_pricing" featureName="適正価格判定" />

      {/* Zero-Leak Security & Privacy Guarantee */}
      <div className="bg-indigo-50/90 border border-indigo-200/90 rounded-xl px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-indigo-950 shadow-2xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="font-bold text-indigo-900">
            🔒【機密保持・完全クライアント完結】入力した価格・原価データは外部サーバーに送信・保存されません
          </span>
        </div>
        <div className="text-[11px] text-indigo-800">
          すべての価格弾力性シミュレーションは<strong>お使いのブラウザ内部でのみ計算</strong>されます。社外秘の原価や販売数が外部へ漏洩する心配はありません。
        </div>
      </div>

      {/* Intro Header & Preset Switcher */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <Tag className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                適正価格判定 & 価格弾力性シミュレーター
              </h2>
              <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full border border-indigo-200">
                利益最大化モデル
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              「売上を追って安売りして疲弊する」のをやめ、手元に最も多くの純利益が残る『黄金価格』を導出します
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsTutorialOpen(true)}
              className="text-xs text-indigo-800 hover:text-indigo-950 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>超わかりやすい初心者ガイド</span>
            </button>

            <button
              onClick={() => setIsExplainerOpen(!isExplainerOpen)}
              className="text-xs text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>価格弾力性と最適価格の公式</span>
              {isExplainerOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Explainer Drawer */}
        {isExplainerOpen && (
          <div className="mt-4 p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs text-slate-700 leading-relaxed space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 font-bold text-indigo-950 text-sm">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>適正価格判定の数理メカニズム（なぜ利益が増えるのか？）</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="bg-white p-3 rounded-lg border border-indigo-100 space-y-1">
                <strong className="text-slate-900 block font-bold text-xs">① 価格弾力性（ε）とは？</strong>
                <div className="font-mono text-[11px] text-indigo-900 font-bold bg-slate-50 p-1.5 rounded border border-slate-200">
                  ε ＝ － (需要の変化率 %) ÷ (価格の変化率 %)
                </div>
                <p className="text-[11px] text-slate-600">
                  価格を1%上げたとき、需要が何%減るかの比率。<strong>ε &lt; 1 なら「非弾力的（値上げしても減りにくい）」</strong>で、値上げによる利益増の大チャンスです。
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-indigo-100 space-y-1">
                <strong className="text-slate-900 block font-bold text-xs">② 粗利益最大化価格 (P*)</strong>
                <div className="font-mono text-[11px] text-indigo-900 font-bold bg-slate-50 p-1.5 rounded border border-slate-200">
                  P* ＝ (需要上限/傾き ＋ 原価) ÷ 2
                </div>
                <p className="text-[11px] text-slate-600">
                  「価格を上げると1個あたり粗利が増える」一方で「販売個数は減る」というトレードオフの積が極大になる頂点を微分方程式で算出します。
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-indigo-100 space-y-1">
                <strong className="text-slate-900 block font-bold text-xs">③ 損益分岐販売数ダウン許容量</strong>
                <div className="font-mono text-[11px] text-indigo-900 font-bold bg-slate-50 p-1.5 rounded border border-slate-200">
                  許容減 ＝ 1 － (旧価格－原価) ÷ (新価格－原価)
                </div>
                <p className="text-[11px] text-slate-600">
                  値上げした際に「販売個数が何%まで落ちても利益がトントンで済むか」の安全マージン。想像以上に客数が減っても黒字を維持できます。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 7 Expanded Presets */}
        <div className="mt-3.5">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>業種・商品モデル別プリセット（タップで数値を一発入力）:</span>
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              ※ 選んだ後、ご自身の数字に自由に書き換えて使えます
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => handleApplyPreset(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                  presetId === p.id
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-2xs font-bold ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                {p.id === 'cafe_menu' && <Utensils className="w-3.5 h-3.5 text-orange-600" />}
                {p.id === 'beauty_salon' && <Scissors className="w-3.5 h-3.5 text-indigo-600" />}
                {p.id === 'ec_cosmetics' && <ShoppingBag className="w-3.5 h-3.5 text-rose-600" />}
                {p.id === 'b2b_consulting' && <Briefcase className="w-3.5 h-3.5 text-slate-700" />}
                {p.id === 'digital_contents' && <Laptop className="w-3.5 h-3.5 text-blue-600" />}
                {p.id === 'regional_gift' && <Gift className="w-3.5 h-3.5 text-amber-600" />}
                {p.id === 'subscription_service' && <RefreshCw className="w-3.5 h-3.5 text-teal-600" />}
                <span>{p.name}</span>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
            <strong>選択中モデルの前提：</strong> {PRESETS.find((p) => p.id === presetId)?.description}
          </p>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Optimal Price */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                粗利が一番残るスイートスポット
              </span>
              <span className="text-sm font-bold text-slate-800">利益最大化価格 (P*)</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight">
              ¥{optimalPriceProfit.toLocaleString()}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs">
              <span className="text-slate-500">現在価格より</span>
              <strong className={optimalPriceProfit >= currentPrice ? 'text-emerald-700' : 'text-rose-600'}>
                {optimalPriceProfit >= currentPrice ? '+' : ''}¥{(optimalPriceProfit - currentPrice).toLocaleString()}
              </strong>
              <span>({optimalPriceProfit >= currentPrice ? '値上げ推奨' : '値下げ推奨'})</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            売上最大価格: ¥{optimalPriceRevenue.toLocaleString()}
          </div>
        </div>

        {/* Card 2: Price Elasticity */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                客離れの敏感さ度合い
              </span>
              <span className="text-sm font-bold text-slate-800">価格弾力性 (ε)</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-700 tracking-tight">
              {elasticity.toFixed(2)}
            </div>
            <p className="mt-1 text-xs text-slate-600 font-medium">
              {elasticity < 1.0 ? (
                <span className="text-emerald-700 font-bold">◎ 非弾力的（値上げ大チャンス！）</span>
              ) : elasticity === 1.0 ? (
                <span className="text-slate-600">◯ 単位弾力的（標準的なバランス）</span>
              ) : (
                <span className="text-rose-600 font-bold">△ 弾力的（競合多数・慎重に）</span>
              )}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            10%値上げで客数が約 {(elasticity * 10).toFixed(1)}% 減少する推計
          </div>
        </div>

        {/* Card 3: Simulated Profit Impact */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                ¥{targetSimPrice.toLocaleString()} にしたときの損益
              </span>
              <span className="text-sm font-bold text-slate-800">検証価格での利益変化</span>
            </div>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${profitDiff >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${profitDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {profitDiff >= 0 ? '+' : ''}¥{profitDiff.toLocaleString()}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              月間粗利の増減: <strong>{profitDiffPct >= 0 ? '+' : ''}{profitDiffPct.toFixed(1)}%</strong>
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            月間販売数見込: {simQuantity.toLocaleString()} 個（現在比 {simQuantity - currentQuantity >= 0 ? '+' : ''}{simQuantity - currentQuantity}個）
          </div>
        </div>

        {/* Card 4: Breakeven Drop Tolerance */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                客数が減っても大丈夫な限界
              </span>
              <span className="text-sm font-bold text-slate-800">許容客数減少率</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 tracking-tight">
              {breakevenQuantityDropPct > 0 ? `-${breakevenQuantityDropPct.toFixed(1)}%` : '0%'}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              ここまで客数が減っても利益は黒字維持
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            販売数 {Math.round(currentQuantity * (1 - breakevenQuantityDropPct / 100))} 個まで落ちてもトントン
          </div>
        </div>
      </div>

      {/* Main Grid: Controls Form & Dynamic Plotly Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Parameters Form (Left Column, 5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-5">
          <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>入力パラメータ（数字を自由に変更できます）</span>
            </h3>
            <span className="text-[11px] text-slate-400">リアルタイム連動</span>
          </div>

          {/* Section A: Current Status */}
          <div className="space-y-4 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-xs font-bold text-slate-800 block">
              【A. いまの実績】現在の価格・販売数・原価
            </span>

            {/* Field 1: Current Price */}
            <div>
              <div className="flex justify-between items-baseline text-xs mb-1">
                <div>
                  <span className="font-bold text-slate-900">現在の販売価格</span>
                  <span className="text-[10px] text-slate-500 ml-1">（税込または税抜）</span>
                </div>
                <span className="font-mono font-bold text-slate-900 text-sm">¥{currentPrice.toLocaleString()}</span>
              </div>
              <input
                type="number"
                min={1}
                value={currentPrice}
                onChange={(e) => setCurrentPrice(Math.max(1, Number(e.target.value)))}
                className="w-full text-xs font-mono p-1.5 rounded-lg border border-slate-300 bg-white text-slate-900"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">
                💡 現在お客さんに請求している単品価格や平均利用客単価を入力します。
              </p>
            </div>

            {/* Field 2: Current Quantity */}
            <div>
              <div className="flex justify-between items-baseline text-xs mb-1">
                <div>
                  <span className="font-bold text-slate-900">月間の販売個数・利用客数</span>
                  <span className="text-[10px] text-slate-500 ml-1">（現在の月間ボリューム）</span>
                </div>
                <span className="font-mono font-bold text-slate-900 text-sm">{currentQuantity.toLocaleString()} 個</span>
              </div>
              <input
                type="number"
                min={1}
                value={currentQuantity}
                onChange={(e) => setCurrentQuantity(Math.max(1, Number(e.target.value)))}
                className="w-full text-xs font-mono p-1.5 rounded-lg border border-slate-300 bg-white text-slate-900"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">
                💡 1ヶ月あたりに売れているおおよその個数・注文件数・客数を入力します。
              </p>
            </div>

            {/* Field 3: Unit Cost */}
            <div>
              <div className="flex justify-between items-baseline text-xs mb-1">
                <div>
                  <span className="font-bold text-slate-900">1個あたりの仕入れ原価・変動費</span>
                  <span className="text-[10px] text-slate-500 ml-1">（原価）</span>
                </div>
                <span className="font-mono font-bold text-slate-900 text-sm">¥{unitCost.toLocaleString()}</span>
              </div>
              <input
                type="number"
                min={0}
                value={unitCost}
                onChange={(e) => setUnitCost(Math.max(0, Number(e.target.value)))}
                className="w-full text-xs font-mono p-1.5 rounded-lg border border-slate-300 bg-white text-slate-900"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">
                💡 売れた時にだけ発生する仕入れ代・材料費・送料など。（家賃や人件費等の固定費は除外）
              </p>
            </div>
          </div>

          {/* Section B: Elasticity */}
          <div className="space-y-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
            <div className="flex justify-between items-baseline text-xs mb-1">
              <div>
                <span className="font-bold text-slate-900">【B. お客の敏感さ】価格弾力性 (ε)</span>
              </div>
              <span className="font-mono font-bold text-indigo-700 text-sm">ε = {elasticity.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.2}
              max={2.5}
              step={0.05}
              value={elasticity}
              onChange={(e) => setElasticity(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>0.20 (他で買えない)</span>
              <span>1.00 (中立)</span>
              <span>2.50 (競合だらけ)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-indigo-100 text-[11px] leading-relaxed">
              <span className="font-bold text-slate-800">直感理解：</span>
              {elasticity < 1.0 ? (
                <span className="text-emerald-800">
                  「10%値上げしても{(elasticity * 10).toFixed(1)}%しか客が逃げない」ため、<strong>値上げすればするほど粗利益が増加するボーナス状態</strong>です！
                </span>
              ) : (
                <span className="text-rose-800">
                  「10%値上げすると{(elasticity * 10).toFixed(1)}%も客が離れる」ため、安易な値上げは避け、差別化やセット売りで弾力性を下げてから値上げを検討すべきです。
                </span>
              )}
            </div>
          </div>

          {/* Section C: Target Simulated Price */}
          <div className="space-y-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-xs font-bold text-slate-800 block">
              【C. 検証シミュレーション】もしこの価格にしたら？
            </span>

            <div>
              <div className="flex justify-between items-baseline text-xs mb-1">
                <div>
                  <span className="font-bold text-slate-900">シミュレーション検証価格</span>
                  <span className="text-[10px] text-slate-500 ml-1">（試したい新価格）</span>
                </div>
                <span className="font-mono font-bold text-amber-700 text-sm">¥{targetSimPrice.toLocaleString()}</span>
              </div>
              <input
                type="number"
                min={1}
                value={targetSimPrice}
                onChange={(e) => setTargetSimPrice(Math.max(1, Number(e.target.value)))}
                className="w-full text-xs font-mono p-1.5 rounded-lg border border-slate-300 bg-white text-slate-900"
              />
              <div className="flex items-center gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => setTargetSimPrice(Math.round(currentPrice * 1.05))}
                  className="px-2 py-0.5 rounded text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold"
                >
                  +5%値上げ
                </button>
                <button
                  type="button"
                  onClick={() => setTargetSimPrice(Math.round(currentPrice * 1.10))}
                  className="px-2 py-0.5 rounded text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold"
                >
                  +10%値上げ
                </button>
                <button
                  type="button"
                  onClick={() => setTargetSimPrice(optimalPriceProfit)}
                  className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold"
                >
                  最適価格(P*)を一発反映
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Plotly Charts (Right Column, 7 cols) */}
        <div className="lg:col-span-7 space-y-6 min-w-0">
          {/* Chart 1: Price vs Profit Curve (The Hill) */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
              <div>
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span>価格 vs 粗利益 & 売上高シミュレーション曲線</span>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    山の頂点＝最適価格
                  </span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  緑の山型カーブの最も高い頂点（★マーク）が、会社に最も多くの純利益を残す最適価格 P* です
                </p>
              </div>
            </div>

            <div className="w-full h-[280px] sm:h-[320px] overflow-hidden">
              <PlotlyChart
                data={[traceRevenueCurve, traceProfitCurve, traceCurrentMarker, traceSimMarker, traceOptimalMarker]}
                layout={layoutProfitCurve}
              />
            </div>

            <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs text-slate-600 space-y-1 border border-slate-100">
              <div className="font-bold text-slate-800 text-[11px]">💡 グラフの見どころ：</div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                <li><strong className="text-blue-600">青の破線（売上高）</strong>：安売りしても売上は伸びますが、原価がかかるため粗利益（緑の実線）は急激に落ち込みます。</li>
                <li><strong className="text-emerald-700">緑の実線（粗利益）</strong>：頂点の<strong>¥{optimalPriceProfit.toLocaleString()}</strong>が理論上最も儲かる価格です。</li>
              </ul>
            </div>
          </div>

          {/* Chart 2: Estimated Demand Curve */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  推定需要曲線 Q(P)：価格を上げると販売個数はどう減るか？
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  弾力性 ε={elasticity.toFixed(2)} に基づいて計算された価格と売れ行きの右肩下がりの関係
                </p>
              </div>
            </div>

            <div className="w-full h-[230px] sm:h-[260px] overflow-hidden">
              <PlotlyChart data={[traceDemandCurve]} layout={layoutDemandCurve} />
            </div>

            <div className="mt-2 text-[11px] text-slate-500 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-200/60">
              🛡️ 検証価格（¥{targetSimPrice.toLocaleString()}）に改定した場合、月間販売数は現在の {currentQuantity.toLocaleString()} 個から約 <strong>{simQuantity.toLocaleString()} 個</strong>へと変動する見込みです。
            </div>
          </div>
        </div>
      </div>

      {/* Optimal Pricing Tutorial Modal */}
      <OptimalPricingTutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />
    </div>
  );
};
