import React, { useState, useMemo } from 'react';
import Plotly from 'plotly.js-dist-min';
import { PlotlyChart } from './PlotlyChart';
import { SafetyStockTutorialModal } from './SafetyStockTutorialModal';
import {
  Boxes,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Calculator,
  ArrowRight,
  PackageCheck,
  RotateCcw,
  Layers,
  Store,
  Factory,
  Utensils,
  ShoppingBag,
  Sparkle,
  HeartPulse,
  Scissors,
  Calendar,
  Info,
  BookOpen,
} from 'lucide-react';
import { BetaFeatureSurvey } from './BetaFeatureSurvey';

// Standard normal distribution z-values for service levels
const SERVICE_LEVELS = [
  { label: '90.0%（低単価・代替品がある日用品向け）', z: 1.2816, value: 90 },
  { label: '95.0%（★標準推奨・多くの小売やECの黄金比）', z: 1.6449, value: 95 },
  { label: '98.0%（高信頼性・欠品をかなり嫌う商品）', z: 2.0537, value: 98 },
  { label: '99.0%（欠品厳禁・重要機械パーツや主食）', z: 2.3263, value: 99 },
  { label: '99.9%（医療・極度重要・代替不可能な品）', z: 3.0902, value: 99.9 },
];

interface SafetyStockPreset {
  id: string;
  name: string;
  category: string;
  dailyDemand: number;
  demandStd: number;
  leadTimeDays: number;
  leadTimeStd: number;
  serviceLevel: number;
  unitCost: number;
  orderingCost: number;
  holdingCostRate: number; // % of unit cost per year
  description: string;
}

const PRESETS: SafetyStockPreset[] = [
  {
    id: 'cafe_restaurant',
    name: 'カフェ・飲食店（食材・牛乳・パン）',
    category: '飲食・フードサービス',
    dailyDemand: 120,
    demandStd: 25,
    leadTimeDays: 2,
    leadTimeStd: 0.3,
    serviceLevel: 98,
    unitCost: 350,
    orderingCost: 1200,
    holdingCostRate: 35, // High holding/perish risk
    description: '日持ちしない食材のためリードタイムは短め。来店客が注文できず帰ってしまう損失を防ぐモデル。',
  },
  {
    id: 'ec_fashion',
    name: 'ネット通販・EC（アパレル・雑貨）',
    category: '小売り・EC',
    dailyDemand: 45,
    demandStd: 18,
    leadTimeDays: 7,
    leadTimeStd: 1.5,
    serviceLevel: 95,
    unitCost: 3800,
    orderingCost: 2500,
    holdingCostRate: 20, // 20%/year
    description: 'セール日や週末に注文が大きく跳ね上がるEC・アパレル通販の標準的な需要変動モデル。',
  },
  {
    id: 'retail_convenience',
    name: '街の小売店・ドラッグストア（日用消耗品）',
    category: '実店舗・小売',
    dailyDemand: 80,
    demandStd: 15,
    leadTimeDays: 3,
    leadTimeStd: 0.5,
    serviceLevel: 95,
    unitCost: 680,
    orderingCost: 1500,
    holdingCostRate: 18,
    description: 'シャンプーや洗剤など、毎日安定して売れつつも連休等で多少の波がある日用消耗品モデル。',
  },
  {
    id: 'factory_parts',
    name: '製造業・町工場（重要機械パーツ・電子部品）',
    category: '製造・インダストリアル',
    dailyDemand: 15,
    demandStd: 4,
    leadTimeDays: 21,
    leadTimeStd: 3.0,
    serviceLevel: 99,
    unitCost: 18500,
    orderingCost: 8000,
    holdingCostRate: 15,
    description: '海外調達等で届くまでに3週間要し、1個欠品すると生産ラインが停止するため欠品厳禁（99%）のモデル。',
  },
  {
    id: 'event_seasonal',
    name: '季節限定品・イベント物販（クリスマス等）',
    category: '季節商材・イベント',
    dailyDemand: 60,
    demandStd: 35,
    leadTimeDays: 14,
    leadTimeStd: 2.0,
    serviceLevel: 92,
    unitCost: 2400,
    orderingCost: 3500,
    holdingCostRate: 40,
    description: 'ピーク期間が短く、売れ残ると翌年に持ち越せないため、あえてサービス率をやや抑えて廃棄を防ぐモデル。',
  },
  {
    id: 'medical_sanitary',
    name: '医療・衛生・防災用品（マスク・消毒液）',
    category: '医療・公共安全',
    dailyDemand: 100,
    demandStd: 40,
    leadTimeDays: 10,
    leadTimeStd: 2.5,
    serviceLevel: 99.9,
    unitCost: 850,
    orderingCost: 3000,
    holdingCostRate: 12,
    description: '感染症流行や災害時に注文が爆発し、絶対に切らしてはいけない最重要衛生資材モデル。',
  },
  {
    id: 'beauty_salon',
    name: '個人サロン・美容院（業務用ヘアケア・カラー剤）',
    category: 'サービス・サロン',
    dailyDemand: 12,
    demandStd: 3,
    leadTimeDays: 4,
    leadTimeStd: 0.8,
    serviceLevel: 96,
    unitCost: 1600,
    orderingCost: 1000,
    holdingCostRate: 15,
    description: '施術予約の数に応じて消費され、ストック場所が限られている個人店舗向けの小ロットモデル。',
  },
];

export const SafetyStockModule: React.FC = () => {
  const [presetId, setPresetId] = useState<string>('cafe_restaurant');
  const [dailyDemand, setDailyDemand] = useState<number>(120);
  const [demandStd, setDemandStd] = useState<number>(25);
  const [leadTimeDays, setLeadTimeDays] = useState<number>(2);
  const [leadTimeStd, setLeadTimeStd] = useState<number>(0.3);
  const [serviceLevel, setServiceLevel] = useState<number>(98);
  const [unitCost, setUnitCost] = useState<number>(350);
  const [orderingCost, setOrderingCost] = useState<number>(1200);
  const [holdingCostRate, setHoldingCostRate] = useState<number>(35);
  const [isExplainerOpen, setIsExplainerOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  // Apply preset
  const handleApplyPreset = (p: SafetyStockPreset) => {
    setPresetId(p.id);
    setDailyDemand(p.dailyDemand);
    setDemandStd(p.demandStd);
    setLeadTimeDays(p.leadTimeDays);
    setLeadTimeStd(p.leadTimeStd);
    setServiceLevel(p.serviceLevel);
    setUnitCost(p.unitCost);
    setOrderingCost(p.orderingCost);
    setHoldingCostRate(p.holdingCostRate);
  };

  // Math calculations
  const currentZ = useMemo(() => {
    const sl = SERVICE_LEVELS.find((s) => s.value === serviceLevel);
    return sl ? sl.z : 1.6449;
  }, [serviceLevel]);

  // Combined Variance during Lead Time: Var = L * sigma_d^2 + d^2 * sigma_L^2
  const { safetyStock, reorderPoint, leadTimeDemand, eoq, annualHoldingCostPerUnit, annualTotalCost, annualDemand } =
    useMemo(() => {
      const d = Math.max(0.1, dailyDemand);
      const s_d = Math.max(0, demandStd);
      const L = Math.max(0.1, leadTimeDays);
      const s_L = Math.max(0, leadTimeStd);

      const variance = L * Math.pow(s_d, 2) + Math.pow(d, 2) * Math.pow(s_L, 2);
      const combinedStd = Math.sqrt(variance);

      // Safety stock = z * combinedStd
      const ss = Math.ceil(currentZ * combinedStd);

      // Lead time average demand = d * L
      const ltDemand = Math.round(d * L);

      // Reorder Point = ltDemand + ss
      const rop = ltDemand + ss;

      // Economic Order Quantity (EOQ) = sqrt((2 * D * S) / H)
      const D = d * 365;
      const S = Math.max(1, orderingCost);
      const H = Math.max(0.01, unitCost * (holdingCostRate / 100));
      const calculatedEoq = Math.max(1, Math.round(Math.sqrt((2 * D * S) / H)));

      // Annual total cost = (D / EOQ) * S + (EOQ / 2 + ss) * H
      const annualOrdering = (D / calculatedEoq) * S;
      const annualHolding = (calculatedEoq / 2 + ss) * H;
      const totalCost = Math.round(annualOrdering + annualHolding);

      return {
        safetyStock: ss,
        reorderPoint: rop,
        leadTimeDemand: ltDemand,
        eoq: calculatedEoq,
        annualHoldingCostPerUnit: H,
        annualTotalCost: totalCost,
        annualDemand: Math.round(D),
      };
    }, [dailyDemand, demandStd, leadTimeDays, leadTimeStd, currentZ, orderingCost, unitCost, holdingCostRate]);

  // Sawtooth 60-day inventory simulation
  const simulationData = useMemo(() => {
    const days = 60;
    const inventoryLevel: number[] = [];
    const ordersPlaced: { day: number; level: number }[] = [];
    const ordersArrived: { day: number; level: number }[] = [];

    let currentInventory = reorderPoint + eoq;
    let pendingOrderArrivalDay = -1;
    let pendingOrderQuantity = 0;

    for (let day = 1; day <= days; day++) {
      if (day === pendingOrderArrivalDay) {
        currentInventory += pendingOrderQuantity;
        ordersArrived.push({ day, level: currentInventory });
        pendingOrderArrivalDay = -1;
        pendingOrderQuantity = 0;
      }

      const randomFactor = (Math.sin(day * 1.5) + Math.cos(day * 0.7)) * 0.5;
      const actualDemandToday = Math.max(0, Math.round(dailyDemand + demandStd * randomFactor));
      currentInventory = Math.max(0, currentInventory - actualDemandToday);

      if (currentInventory <= reorderPoint && pendingOrderArrivalDay === -1) {
        const delayedL = Math.max(1, Math.round(leadTimeDays + (Math.random() - 0.5) * leadTimeStd * 2));
        pendingOrderArrivalDay = day + delayedL;
        pendingOrderQuantity = eoq;
        ordersPlaced.push({ day, level: currentInventory });
      }

      inventoryLevel.push(currentInventory);
    }

    const dayLabels = Array.from({ length: days }, (_, i) => `${i + 1}日目`);
    return { dayLabels, inventoryLevel, ordersPlaced, ordersArrived };
  }, [dailyDemand, demandStd, leadTimeDays, leadTimeStd, reorderPoint, eoq]);

  // Traces for Sawtooth Chart
  const traceInventory: Plotly.Data = {
    x: simulationData.dayLabels,
    y: simulationData.inventoryLevel,
    type: 'scatter',
    mode: 'lines',
    name: '実在庫推移（個）',
    line: { color: '#10b981', width: 2.5 },
    hovertemplate: '%{x}: 在庫 <b>%{y} 個</b><extra></extra>',
  };

  const traceROPLine: Plotly.Data = {
    x: simulationData.dayLabels,
    y: new Array(60).fill(reorderPoint),
    type: 'scatter',
    mode: 'lines',
    name: `発注点 ROP (${reorderPoint}個)`,
    line: { color: '#f59e0b', width: 1.5, dash: 'dash' },
    hoverinfo: 'skip',
  };

  const traceSSLine: Plotly.Data = {
    x: simulationData.dayLabels,
    y: new Array(60).fill(safetyStock),
    type: 'scatter',
    mode: 'lines',
    name: `安全在庫 SS (${safetyStock}個)`,
    line: { color: '#ef4444', width: 1.5, dash: 'dot' },
    hoverinfo: 'skip',
  };

  const traceOrderTriggers: Plotly.Data = {
    x: simulationData.ordersPlaced.map((o) => `${o.day}日目`),
    y: simulationData.ordersPlaced.map((o) => o.level),
    type: 'scatter',
    mode: 'markers',
    name: '発注トリガー（手配完了）',
    marker: { symbol: 'diamond', size: 8, color: '#d97706' },
    hovertemplate: '%{x}に発注発動: 残在庫 %{y}個<extra></extra>',
  };

  const layoutSawtooth: Partial<Plotly.Layout> = {
    autosize: true,
    margin: { l: 50, r: 20, t: 25, b: 65, pad: 2 },
    xaxis: {
      title: { text: '経過日数（60日間シミュレーション）', font: { size: 10, color: '#64748b' } },
      gridcolor: '#e2e8f0',
      automargin: true,
      tickfont: { size: 9 },
      nticks: 10,
    },
    yaxis: {
      title: { text: '手元在庫量（個）', font: { size: 10, color: '#64748b' } },
      gridcolor: '#e2e8f0',
      automargin: true,
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

  // Service Level vs Safety Stock Trade-off Curve
  const tradeOffData = useMemo(() => {
    const sls = [85, 90, 92, 95, 96, 97, 98, 99, 99.5, 99.9];
    const zMap: Record<number, number> = {
      85: 1.036,
      90: 1.282,
      92: 1.405,
      95: 1.645,
      96: 1.751,
      97: 1.881,
      98: 2.054,
      99: 2.326,
      99.5: 2.576,
      99.9: 3.090,
    };

    const varianceDuringLeadTime =
      leadTimeDays * Math.pow(demandStd, 2) + Math.pow(dailyDemand, 2) * Math.pow(leadTimeStd, 2);
    const sigmaLT = Math.sqrt(varianceDuringLeadTime);

    const xVals = sls;
    const yStock = sls.map((sl) => Math.ceil(zMap[sl] * sigmaLT));
    const yCost = yStock.map((s) => Math.round(s * annualHoldingCostPerUnit));

    return { xVals, yStock, yCost };
  }, [leadTimeDays, demandStd, dailyDemand, leadTimeStd, annualHoldingCostPerUnit]);

  const traceTradeOffStock: Plotly.Data = {
    x: tradeOffData.xVals.map((v) => `${v}%`),
    y: tradeOffData.yStock,
    type: 'scatter',
    mode: 'lines+markers',
    name: '必要安全在庫量 (個)',
    line: { color: '#dc2626', width: 2.5 },
    marker: { size: 6, color: '#b91c1c' },
    hovertemplate: 'サービス率 %{x}: 安全在庫 <b>%{y} 個</b><extra></extra>',
  };

  const layoutTradeOff: Partial<Plotly.Layout> = {
    autosize: true,
    margin: { l: 50, r: 20, t: 25, b: 55, pad: 2 },
    xaxis: {
      title: { text: '目標サービス率（品切れを起こさない確率）', font: { size: 10, color: '#64748b' } },
      gridcolor: '#e2e8f0',
      automargin: true,
      tickfont: { size: 9 },
    },
    yaxis: {
      title: { text: '必要安全在庫量 (個)', font: { size: 10, color: '#64748b' } },
      gridcolor: '#e2e8f0',
      automargin: true,
      tickfont: { size: 9 },
    },
  };

  return (
    <div className="space-y-6">
      {/* Universal Business Notice Banner */}
      <div className="bg-linear-to-r from-emerald-600 via-teal-600 to-emerald-700 px-4 py-2.5 rounded-xl text-white text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse shrink-0" />
          <span className="font-extrabold text-[12px] text-amber-200">
            💡 あなたの業種・商品でもそのまま使えます！
          </span>
          <span className="text-[11px] text-emerald-100 hidden md:inline">
            下のプリセットは入力例に過ぎません。数値を自由に書き換えるだけで、フリーランス、小売、製造、サロン、飲食などあらゆる在庫ビジネスに100%対応します。
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
      <BetaFeatureSurvey featureId="safety_stock" featureName="安全在庫計算" />

      {/* Zero-Leak Security & Privacy Guarantee */}
      <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-xl px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-950 shadow-2xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold text-emerald-900">
            🔒【機密保持・完全クライアント完結】入力した原価・需要データは外部サーバーに送信・保存されません
          </span>
        </div>
        <div className="text-[11px] text-emerald-800">
          すべての在庫シミュレーションは<strong>お使いのブラウザ内部でのみ計算</strong>されます。社外秘の仕入れ値や需要予測が外部へ漏洩する心配はありません。
        </div>
      </div>

      {/* Intro Header & Preset Switcher */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Boxes className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                安全在庫計算 & 適正発注点（ROP）判定ツール
              </h2>
              <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                在庫最適化
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              「品切れしてお客さんを逃す恐怖」と「抱えすぎて資金繰りが悪化する恐怖」を、統計数学の力で解決します
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsTutorialOpen(true)}
              className="text-xs text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>超わかりやすい初心者ガイド</span>
            </button>

            <button
              onClick={() => setIsExplainerOpen(!isExplainerOpen)}
              className="text-xs text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>計算公式・数理の仕組み</span>
              {isExplainerOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Explainer Drawer */}
        {isExplainerOpen && (
          <div className="mt-4 p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-slate-700 leading-relaxed space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 font-bold text-emerald-950 text-sm">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>統計的在庫管理の3大重要公式（中身の仕組み）</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="bg-white p-3 rounded-lg border border-emerald-100 space-y-1">
                <strong className="text-slate-900 block font-bold text-xs">① 安全在庫 (Safety Stock: SS)</strong>
                <div className="font-mono text-[11px] text-emerald-900 font-bold bg-slate-50 p-1.5 rounded border border-slate-200">
                  SS ＝ z × √(L・σ_d² ＋ d²・σ_L²)
                </div>
                <p className="text-[11px] text-slate-600">
                  売れ行きの波（σ_d）と納期の遅れ（σ_L）を統計的に合算し、目標サービス率（z値）に応じたクッション量を算出します。
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-emerald-100 space-y-1">
                <strong className="text-slate-900 block font-bold text-xs">② 発注点 (Reorder Point: ROP)</strong>
                <div className="font-mono text-[11px] text-emerald-900 font-bold bg-slate-50 p-1.5 rounded border border-slate-200">
                  ROP ＝ (d × L) ＋ SS
                </div>
                <p className="text-[11px] text-slate-600">
                  発注してから届くまでに普通に売れる個数（d×L）に、安全在庫（SS）を足した値。「この残数になったら即注文」の基準です。
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-emerald-100 space-y-1">
                <strong className="text-slate-900 block font-bold text-xs">③ 経済的発注量 (EOQ)</strong>
                <div className="font-mono text-[11px] text-emerald-900 font-bold bg-slate-50 p-1.5 rounded border border-slate-200">
                  EOQ ＝ √(2・D・S ÷ H)
                </div>
                <p className="text-[11px] text-slate-600">
                  「1回注文するたびにかかる発注送料コスト」と「持っているだけでかかる保管コスト」が最も安く釣り合う1回あたり注文量です。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 7 Expanded Presets */}
        <div className="mt-3.5">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>業種・商材別プリセット（タップで数値を一発入力）:</span>
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
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-2xs font-bold ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                {p.id === 'cafe_restaurant' && <Utensils className="w-3.5 h-3.5 text-orange-600" />}
                {p.id === 'ec_fashion' && <Store className="w-3.5 h-3.5 text-blue-600" />}
                {p.id === 'retail_convenience' && <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />}
                {p.id === 'factory_parts' && <Factory className="w-3.5 h-3.5 text-slate-600" />}
                {p.id === 'event_seasonal' && <Calendar className="w-3.5 h-3.5 text-purple-600" />}
                {p.id === 'medical_sanitary' && <HeartPulse className="w-3.5 h-3.5 text-rose-600" />}
                {p.id === 'beauty_salon' && <Scissors className="w-3.5 h-3.5 text-indigo-600" />}
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
        {/* Card 1: Safety Stock */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                最低限残すべき予備
              </span>
              <span className="text-sm font-bold text-slate-800">推奨安全在庫量 (SS)</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 tracking-tight">
              {safetyStock.toLocaleString()} <span className="text-sm font-bold text-slate-500">個</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              入荷直前の底値でもこの個数だけはキープ
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            在庫拘束金額: 約 ¥{(safetyStock * unitCost).toLocaleString()}
          </div>
        </div>

        {/* Card 2: Reorder Point */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                この数になったら即注文！
              </span>
              <span className="text-sm font-bold text-slate-800">最適発注点 (ROP)</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 tracking-tight">
              {reorderPoint.toLocaleString()} <span className="text-sm font-bold text-slate-500">個</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              倉庫の棚がこの個数を割ったら発注合図
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            届く間の売上見込 ({leadTimeDemand}個) ＋ 安全在庫
          </div>
        </div>

        {/* Card 3: Economic Order Quantity */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                1回で頼むべき理想ロット
              </span>
              <span className="text-sm font-bold text-slate-800">経済的発注量 (EOQ)</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-700 tracking-tight">
              {eoq.toLocaleString()} <span className="text-sm font-bold text-slate-500">個 / 回</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              年間約 {Math.max(1, Math.round(annualDemand / eoq))} 回のペースで注文
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            送料と倉庫保管費用の合計が一番安くなる量
          </div>
        </div>

        {/* Card 4: Total Inventory Cost */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                年間にかかるコスト試算
              </span>
              <span className="text-sm font-bold text-slate-800">年間在庫総コスト</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Calculator className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              ¥{annualTotalCost.toLocaleString()}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              発注送料手数料 ＋ 在庫保管費用
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            1個あたり保管費: ¥{Math.round(annualHoldingCostPerUnit)}/年
          </div>
        </div>
      </div>

      {/* Main Grid: Controls Sidebar & Dynamic Plotly Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Parameters Form (Left Column, 5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-5">
          <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>入力パラメータ（数字を自由に変更できます）</span>
            </h3>
            <span className="text-[11px] text-slate-400">リアルタイム連動</span>
          </div>

          {/* Section A: Demand */}
          <div className="space-y-4 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-xs font-bold text-slate-800 block">
              【A. 売れ行きの設定】毎日どのくらい売れているか？
            </span>

            {/* Field 1: Daily Demand */}
            <div>
              <div className="flex justify-between items-baseline text-xs mb-1">
                <div>
                  <span className="font-bold text-slate-900">1日に売れる平均個数</span>
                  <span className="text-[10px] text-slate-500 ml-1">（日々の通常ペース）</span>
                </div>
                <span className="font-mono font-bold text-emerald-700 text-sm">{dailyDemand} 個/日</span>
              </div>
              <input
                type="range"
                min={1}
                max={500}
                step={1}
                value={dailyDemand}
                onChange={(e) => setDailyDemand(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">
                💡 普段の営業で、1日に何個（何着・何食）売れているかを入力します。
              </p>
            </div>

            {/* Field 2: Demand Std */}
            <div>
              <div className="flex justify-between items-baseline text-xs mb-1">
                <div>
                  <span className="font-bold text-slate-900">日々の売れ行きのブレ</span>
                  <span className="text-[10px] text-slate-500 ml-1">（需要の波・標準偏差）</span>
                </div>
                <span className="font-mono font-bold text-emerald-700 text-sm">±{demandStd} 個</span>
              </div>
              <input
                type="range"
                min={0}
                max={150}
                step={1}
                value={demandStd}
                onChange={(e) => setDemandStd(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">
                💡 よく分からない時は、<strong>平均個数の約20〜30%</strong>（100個なら±20個）を入れるのが実務上の標準です。
              </p>
            </div>
          </div>

          {/* Section B: Lead Time */}
          <div className="space-y-4 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-xs font-bold text-slate-800 block">
              【B. 仕入れ待ち時間の設定】注文してから何日で届くか？
            </span>

            {/* Field 3: Lead Time Days */}
            <div>
              <div className="flex justify-between items-baseline text-xs mb-1">
                <div>
                  <span className="font-bold text-slate-900">仕入れにかかる日数</span>
                  <span className="text-[10px] text-slate-500 ml-1">（発注リードタイム）</span>
                </div>
                <span className="font-mono font-bold text-blue-700 text-sm">{leadTimeDays} 日</span>
              </div>
              <input
                type="range"
                min={1}
                max={90}
                step={1}
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">
                💡 問屋や工場に発注ボタンを押してから、商品が手元に届いて販売可能になるまでの所要日数です。
              </p>
            </div>

            {/* Field 4: Lead Time Std */}
            <div>
              <div className="flex justify-between items-baseline text-xs mb-1">
                <div>
                  <span className="font-bold text-slate-900">配送が遅れるブレ幅</span>
                  <span className="text-[10px] text-slate-500 ml-1">（遅延リスク）</span>
                </div>
                <span className="font-mono font-bold text-blue-700 text-sm">±{leadTimeStd} 日</span>
              </div>
              <input
                type="range"
                min={0}
                max={15}
                step={0.5}
                value={leadTimeStd}
                onChange={(e) => setLeadTimeStd(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">
                💡 台風・連休・輸入関税などで遅れる日数。普段遅れがなければ「0〜0.5日」、海外調達なら「2〜4日」が目安。
              </p>
            </div>
          </div>

          {/* Section C: Service Level */}
          <div className="space-y-2 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
            <label className="text-xs font-bold text-slate-800 block">
              【C. 安全レベル】絶対に品切れさせたくない度合い（サービス率）
            </label>
            <select
              value={serviceLevel}
              onChange={(e) => setServiceLevel(Number(e.target.value))}
              className="w-full text-xs font-semibold p-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
            >
              {SERVICE_LEVELS.map((sl) => (
                <option key={sl.value} value={sl.value}>
                  {sl.label}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              💡 <strong>一般的なおすすめは「95%」</strong>です。99.9%にすると在庫を2〜3倍も抱えることになり倉庫代で赤字になるリスクがあります。
            </p>
          </div>

          {/* Section D: Cost Settings */}
          <div className="space-y-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-xs font-bold text-slate-800 block">
              【D. コスト設定】費用を最小化する計算用
            </span>

            <div>
              <div className="flex justify-between items-baseline text-xs mb-1">
                <span className="text-slate-700 font-medium">1個の仕入れ原価（円）</span>
                <span className="font-mono font-bold text-slate-900">¥{unitCost.toLocaleString()}</span>
              </div>
              <input
                type="number"
                min={1}
                value={unitCost}
                onChange={(e) => setUnitCost(Math.max(1, Number(e.target.value)))}
                className="w-full text-xs font-mono p-1.5 rounded-lg border border-slate-300 bg-white text-slate-900"
              />
            </div>

            <div>
              <div className="flex justify-between items-baseline text-xs mb-1">
                <span className="text-slate-700 font-medium">1回発注する際の手間・送料（円）</span>
                <span className="font-mono font-bold text-slate-900">¥{orderingCost.toLocaleString()}</span>
              </div>
              <input
                type="number"
                min={0}
                value={orderingCost}
                onChange={(e) => setOrderingCost(Math.max(0, Number(e.target.value)))}
                className="w-full text-xs font-mono p-1.5 rounded-lg border border-slate-300 bg-white text-slate-900"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">※ 送料、振込手数料、発注担当者の作業人件費など</p>
            </div>

            <div>
              <div className="flex justify-between items-baseline text-xs mb-1">
                <span className="text-slate-700 font-medium">年間在庫保管費用率（%）</span>
                <span className="font-mono font-bold text-slate-900">{holdingCostRate}% / 年</span>
              </div>
              <input
                type="range"
                min={5}
                max={50}
                step={1}
                value={holdingCostRate}
                onChange={(e) => setHoldingCostRate(Number(e.target.value))}
                className="w-full accent-slate-600 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">※ 倉庫保管料、劣化廃棄リスク、金利コスト。標準は15〜25%</p>
            </div>
          </div>
        </div>

        {/* Dynamic Plotly Charts (Right Column, 7 cols) */}
        <div className="lg:col-span-7 space-y-6 min-w-0">
          {/* Chart 1: Sawtooth Simulation */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
              <div>
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span>60日間の在庫推移（のこぎり波シミュレーション）</span>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    発注自動トリガー連動
                  </span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  日々売れて在庫が減り、橙の発注点（{reorderPoint}個）に触れると発注が飛び、入荷して回復するサイクル
                </p>
              </div>
            </div>

            <div className="w-full h-[280px] sm:h-[320px] overflow-hidden">
              <PlotlyChart
                data={[traceROPLine, traceSSLine, traceOrderTriggers, traceInventory]}
                layout={layoutSawtooth}
              />
            </div>

            <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs text-slate-600 space-y-1 border border-slate-100">
              <div className="font-bold text-slate-800 text-[11px]">💡 このグラフからわかること：</div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                <li><strong className="text-amber-700">橙色の点線（ROP={reorderPoint}個）</strong>：この在庫数を下回ったら、その日のうちに{eoq}個を即注文します。</li>
                <li><strong className="text-rose-700">赤色の点線（SS={safetyStock}個）</strong>：最も在庫が少なくなる入荷直前でも、この赤ラインを守ることで欠品（0個）を回避します。</li>
              </ul>
            </div>
          </div>

          {/* Chart 2: Service Level vs Stock Trade-off */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  サービス率 vs 必要安全在庫量のトレードオフ曲線
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  欠品ゼロ（100%）に近づけようとすると、安全在庫量と保管費用が指数関数的に急増する様子を示します
                </p>
              </div>
            </div>

            <div className="w-full h-[230px] sm:h-[260px] overflow-hidden">
              <PlotlyChart data={[traceTradeOffStock]} layout={layoutTradeOff} />
            </div>

            <div className="mt-2 text-[11px] text-slate-500 bg-amber-50/50 p-2.5 rounded-lg border border-amber-200/60">
              ⚠️ 右端の「99.9%」に向かって急激に跳ね上がっているのが分かります。多くの商品では、無理に99.9%を目指さず<strong>95%〜98%</strong>に抑えるのが最も手残り利益を最大化する経営判断です。
            </div>
          </div>
        </div>
      </div>

      {/* Safety Stock Tutorial Modal */}
      <SafetyStockTutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />
    </div>
  );
};
