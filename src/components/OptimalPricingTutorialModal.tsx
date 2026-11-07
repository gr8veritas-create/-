import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  Tag,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Sparkles,
  Percent,
  CheckCircle2,
  Scale,
} from 'lucide-react';

interface OptimalPricingTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OptimalPricingTutorialModal: React.FC<OptimalPricingTutorialModalProps> = ({
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
      title: '💡【衝撃の事実】「売上最大」と「利益最大」は全く違う！',
      content: (
        <>
          <p className="text-gray-700 leading-relaxed my-2 text-xs sm:text-sm">
            多くのビジネスでやってしまいがちな失敗が、<strong>「売上を伸ばすために安売りしてしまうこと」</strong>です。
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4 my-2.5 text-xs text-amber-950 leading-relaxed space-y-1.5">
            <strong className="text-amber-900 block font-bold text-sm">
              😱 原価がある商品を安売りすると、働けど働けど赤字になる
            </strong>
            <p className="text-[11px] text-amber-900">
              例えば原価300円の定食を500円から400円に値下げして客数が1.5倍になっても、1杯あたりの利益は200円から100円へ半減。忙しさは1.5倍なのに手元に残る利益は減ってしまいます！
            </p>
          </div>
          <div className="bg-indigo-50 border-l-4 border-indigo-600 p-2.5 rounded-r-lg text-xs text-slate-800">
            👉 このツールは、<strong>「仕入れ原価」</strong>と<strong>「お客さんの価格への敏感さ」</strong>を考慮して、会社・お店に『最も多くの手残り利益が残る適正価格』を算出します。
          </div>
        </>
      ),
    },
    {
      title: '📉【価格弾力性（ε）とは？】「10%値上げしたら何%のお客が逃げるか」',
      content: (
        <>
          <p className="text-gray-700 leading-relaxed my-2 text-xs sm:text-sm">
            値上げした時に、お客さんがどのくらい敏感に反応して購入をやめてしまうかを表す数値です：
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3 text-xs">
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-600 text-white">
                ε &lt; 1.0（非弾力的）＝ 値上げのチャンス！
              </span>
              <h4 className="font-bold text-emerald-950 text-xs">他で買えない・こだわり・必需品</h4>
              <p className="text-slate-700 text-[11px] leading-relaxed">
                10%値上げしても5%しかお客さんが減りません。客数が少し減っても客単価アップの効果が上回り、<strong>利益が急増します</strong>。（例：ファンがついたカフェ、独自技術のサロン、B2B業務システム）
              </p>
            </div>

            <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-600 text-white">
                ε &gt; 1.0（弾力的）＝ 値上げに要注意！
              </span>
              <h4 className="font-bold text-rose-950 text-xs">競合だらけ・どこでも買える日用品</h4>
              <p className="text-slate-700 text-[11px] leading-relaxed">
                10%値上げすると15%もお客さんがライバル店に逃げてしまいます。安易な値上げは販売数急減を招くため、付加価値をつけてから値上げする必要があります。
              </p>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200">
            💡 弾力性の目安が分からない時は、標準値の<strong>「0.8〜1.2」</strong>あたりからシミュレーションを試すのがおすすめです。
          </div>
        </>
      ),
    },
    {
      title: '👑【神の価格 (P*) とは？】山型グラフの頂点を目指す',
      content: (
        <>
          <p className="text-gray-700 leading-relaxed my-2 text-xs sm:text-sm">
            価格と利益の関係をグラフにすると、必ず<strong>「山型（上に凸の放物線）」</strong>になります：
          </p>
          <div className="space-y-2.5 my-3 text-xs">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <strong className="text-slate-800 block">安すぎる領域（左側）</strong>
              <span className="text-slate-600 text-[11px]">
                たくさん売れるけれど、1個あたりの粗利が薄すぎてトータルの利益が伸びません。
              </span>
            </div>
            <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg">
              <strong className="text-indigo-900 block font-bold">山の頂点（P*：最適価格）★</strong>
              <span className="text-indigo-800 text-[11px]">
                単価の高さと販売個数の掛け算が最大化され、<strong>最も多くの純利益が残るスイートスポット</strong>です！
              </span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <strong className="text-slate-800 block">高すぎる領域（右側）</strong>
              <span className="text-slate-600 text-[11px]">
                1個あたりの粗利は巨大ですが、高すぎて誰も買ってくれず、トータル利益が急落します。
              </span>
            </div>
          </div>
        </>
      ),
    },
    {
      title: '🛡️【最強の武器】「許容客数減少率」を知れば値上げが怖くない！',
      content: (
        <>
          <p className="text-gray-700 leading-relaxed my-2 text-xs sm:text-sm">
            値上げするときに経営者や店主が一番怯えるのは「お客さんが離れてしまうのではないか」という不安です。
          </p>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 sm:p-4 my-2.5 text-xs text-emerald-950 leading-relaxed space-y-1">
            <h4 className="font-bold text-emerald-900 text-sm">
              「客数が減っても、これ以内ならむしろ利益は増える！」限界ライン
            </h4>
            <p className="text-emerald-800 text-[11px]">
              例えば、ツールで「許容客数減少率: -18%」と出た場合、値上げによってお客さんが10%減ってしまっても、<strong>トータルの手残り利益は値上げ前より確実に増えています</strong>。
            </p>
          </div>
          <p className="text-gray-700 leading-relaxed text-xs">
            しかも、客数が減ることで「スタッフの労働負担が減る」「残業代が減る」「仕入れ廃棄ロスが減る」という大きな副次メリットも生まれます！
          </p>
        </>
      ),
    },
    {
      title: '🚀【実践の3ステップ】自分の商品にあてはめてみよう',
      content: (
        <>
          <p className="text-gray-700 leading-relaxed my-2 text-xs sm:text-sm">
            このページを使うときは、以下の3ステップで簡単にお試しいただけます：
          </p>
          <div className="space-y-2.5 my-3 text-xs">
            <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">1</span>
              <div>
                <strong className="text-slate-900 block">現在の価格・月間販売数・原価を入れる</strong>
                <span className="text-slate-600 text-[11px]">原価が分からない場合は、だいたいの仕入れ原価率（飲食なら30%、小売なら50〜60%）から逆算してOKです。</span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">2</span>
              <div>
                <strong className="text-slate-900 block">「10%〜15%値上げ」をシミュレーションしてみる</strong>
                <span className="text-slate-600 text-[11px]">「シミュレーション検証価格」に少し高めの価格を入れると、どのくらい利益が増えるかが即座にグラフに描かれます。</span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">3</span>
              <div>
                <strong className="text-slate-900 block">算出した最適価格（P*）を参考に価格改定を検討する</strong>
                <span className="text-slate-600 text-[11px]">一気に最適価格まで上げなくても、段階的に3%〜5%ずつ改定していく際の強い指針になります。</span>
              </div>
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
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
              <Tag className="w-3.5 h-3.5" />
            </span>
            <span className="text-indigo-700 text-xs font-bold tracking-wider uppercase">
              適正価格判定ガイド · {step + 1} / {steps.length}
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
                  idx === step ? 'bg-indigo-600 w-5' : 'bg-slate-200 hover:bg-slate-300'
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
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all"
              >
                価格判定をはじめる
              </button>
            ) : (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all flex items-center gap-1"
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
