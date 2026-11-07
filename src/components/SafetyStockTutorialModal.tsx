import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  Boxes,
  ShieldCheck,
  TrendingDown,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Store,
  DollarSign,
} from 'lucide-react';

interface SafetyStockTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SafetyStockTutorialModal: React.FC<SafetyStockTutorialModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const steps = [
    {
      title: '📦【なぜ必要？】勘で発注すると起こる「在庫の2大悲劇」',
      content: (
        <>
          <p className="text-gray-700 leading-relaxed my-2 text-xs sm:text-sm">
            在庫管理で一番難しいのは、<strong>「欠品（品切れ）」</strong>と<strong>「余剰在庫（売れ残り）」</strong>の板挟みです。
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3 text-xs">
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-950">
              <strong className="text-rose-700 block font-bold mb-1">😭 悲劇1：欠品による機会損失</strong>
              <p className="text-rose-900 leading-relaxed text-[11px]">
                「在庫がありません」とお客さんを帰してしまうと、その日の売上が消えるだけでなく、ライバル店にお客さんが乗り換えて二度と戻ってこなくなります。
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-950">
              <strong className="text-amber-800 block font-bold mb-1">😰 悲劇2：過剰在庫による資金ショート</strong>
              <p className="text-amber-900 leading-relaxed text-[11px]">
                「品切れが怖いから多めに買おう」と抱え込むと、倉庫代・賞味期限切れ・流行遅れの値下げ・資金繰り悪化で、利益が丸ごと吹き飛びます。
              </p>
            </div>
          </div>
          <div className="bg-blue-50 border-l-4 border-blue-600 p-2.5 rounded-r-lg text-xs text-slate-800">
            👉 このツールは、<strong>「確率統計（正規分布モデル）」</strong>を使って、最小限の在庫量で品切れを防ぐ『黄金のバランス』を自動計算します。
          </div>
        </>
      ),
    },
    {
      title: '🛡️【安全在庫とは？】普段売れる分ではなく「不測のブレ」を守るクッション',
      content: (
        <>
          <p className="text-gray-700 leading-relaxed my-2 text-xs sm:text-sm">
            発注した品物が届くまでのあいだ、毎日ぴったり平均通りに売れるとは限りません。
          </p>
          <div className="space-y-2.5 my-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">1</span>
                <span>売れ行きのブレ（需要のばらつき）</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                「いつもは1日10個なのに、雨の日に急に25個売れた」「SNSで話題になってバズった」という突発的な需要の山。
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">2</span>
                <span>納期のブレ（仕入れ日数の遅れ）</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                「いつもは3日で届くのに、台風や物流トラブルで5日かかった」という問屋・工場の納入遅延。
              </p>
            </div>
          </div>
          <p className="text-gray-700 leading-relaxed text-xs">
            この2つの不確実性を掛け合わせて計算した<strong>『いざという時の予備クッション』</strong>こそが「安全在庫」です。
          </p>
        </>
      ),
    },
    {
      title: '🎯【2つの最重要数字】「発注点 (ROP)」と「安全在庫」',
      content: (
        <>
          <p className="text-gray-700 leading-relaxed my-2 text-xs sm:text-sm">
            ツールが計算する4つの指標のうち、日々の現場で使うのは主にこの2つです：
          </p>
          <div className="space-y-3 my-3 text-xs">
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-600 text-white uppercase">
                日常のアクション基準
              </span>
              <h4 className="font-bold text-blue-950 text-sm">発注点（ROP：Reorder Point）</h4>
              <p className="text-slate-700 text-[11px] leading-relaxed">
                <strong>「倉庫の在庫がこの個数を下回ったら、その日のうちに即発注する！」</strong>というしきい値です。<br />
                ＝（仕入れ期間中に普通に売れる個数）＋（いざという時の安全在庫）
              </p>
            </div>

            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-600 text-white uppercase">
                いざという時の守り神
              </span>
              <h4 className="font-bold text-emerald-950 text-sm">安全在庫（Safety Stock）</h4>
              <p className="text-slate-700 text-[11px] leading-relaxed">
                発注品が届く直前の、在庫が最も少なくなった瞬間でも<strong>「この個数だけは手元に残しておくべき」</strong>最低防衛ラインです。
              </p>
            </div>
          </div>
        </>
      ),
    },
    {
      title: '📈【グラフの見方】のこぎり波シミュレーション',
      content: (
        <>
          <p className="text-gray-700 leading-relaxed my-2 text-xs sm:text-sm">
            画面右側のグラフは、日々の売れ行きと発注・補充を60日間にわたって再現したシミュレーションです：
          </p>
          <div className="space-y-2 my-3 text-xs">
            <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block">緑の波線（日々の手元在庫）</strong>
                <span className="text-slate-600 text-[11px]">
                  毎日売れると右肩下がりに減り、注文した荷物が届くと一気に回復して「ノコギリの歯」のような形になります。
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block">橙の点線（発注点 ROP）</strong>
                <span className="text-slate-600 text-[11px]">
                  緑の線がこの橙の線にタッチした瞬間に、次の発注（オレンジのひし形マーク）が自動でトリガーされます。
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block">赤の点線（安全在庫ライン）</strong>
                <span className="text-slate-600 text-[11px]">
                  緑の線が0個（欠品）に落ちる前に、この赤のラインあたりで次の入荷が滑り込みセーフで間に合います！
                </span>
              </div>
            </div>
          </div>
        </>
      ),
    },
    {
      title: '⚖️【サービス率の決め方】99.9%を目指すと破産する？トレードオフの真実',
      content: (
        <>
          <p className="text-gray-700 leading-relaxed my-2 text-xs sm:text-sm">
            「品切れを1回も出したくないから、100%欠品しないように設定したい」と思うかもしれません。しかしそれは危険です：
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 my-2 text-xs text-amber-950 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>指数関数的に跳ね上がる保管費用</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              サービス率を95%から99.9%に上げようとすると、安全在庫量は<strong>約2倍〜3倍</strong>に激増します。倉庫がパンクし、保管費用と資金拘束が利益を上回ってしまいます。
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 my-3 text-center text-xs">
            <div className="p-2 rounded-lg border border-slate-200 bg-white">
              <strong className="block text-slate-800 text-xs">90.0%</strong>
              <span className="text-[10px] text-slate-500">低単価・代替品あり（文具、消耗品等）</span>
            </div>
            <div className="p-2 rounded-lg border-2 border-emerald-500 bg-emerald-50/50">
              <strong className="block text-emerald-800 text-xs">95.0%（推奨）</strong>
              <span className="text-[10px] text-emerald-700 font-bold">一般的な小売・EC・飲食店の黄金比</span>
            </div>
            <div className="p-2 rounded-lg border border-slate-200 bg-white">
              <strong className="block text-slate-800 text-xs">99.0%〜</strong>
              <span className="text-[10px] text-slate-500">欠品でライン停止する工場部品・医薬品</span>
            </div>
          </div>
        </>
      ),
    },
  ];

  const currentStep = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
              <Boxes className="w-3.5 h-3.5" />
            </span>
            <span className="text-emerald-700 text-xs font-bold tracking-wider uppercase">
              安全在庫計算ガイド · {step + 1} / {steps.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-3 leading-snug">
            {currentStep.title}
          </h2>
          {currentStep.content}

          {/* Dots Indicator */}
          <div className="flex justify-center gap-1.5 mt-5 mb-1">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setStep(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === step ? 'bg-emerald-600 w-5' : 'bg-slate-200 hover:bg-slate-300'
                }`}
                aria-label={`ステップ ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-400">
            Escキーでいつでも閉じられます
          </span>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-200/70 transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>戻る</span>
              </button>
            )}

            {isLast ? (
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-all"
              >
                計算をはじめる
              </button>
            ) : (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-all flex items-center gap-1"
              >
                <span>次へ</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
