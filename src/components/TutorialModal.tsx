import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  Table,
  AlertTriangle,
  ShieldCheck,
  Store,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { DataPoint } from '../types';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUnit: string;
  donorUnits: string[];
  interventionDate: string;
  metricName: string;
  metricUnit: string;
  unitTypeName: string;
  interventionName: string;
  samplePoints: DataPoint[];
}

const STORAGE_KEY = 'impactsynth_tutorial_off';

export const TutorialModal: React.FC<TutorialModalProps> = ({
  isOpen,
  onClose,
  targetUnit,
  donorUnits,
  interventionDate,
  metricName,
  metricUnit,
  unitTypeName,
  interventionName,
  samplePoints,
}) => {
  const [step, setStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === '1') {
        setDontShowAgain(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleClose = () => {
    try {
      localStorage.setItem(STORAGE_KEY, dontShowAgain ? '1' : '0');
    } catch {
      // ignore
    }
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const formatDateJa = (d: string) => {
    const parts = d.split('-');
    if (parts.length === 3) {
      return `${parseInt(parts[0], 10)}年${parseInt(parts[1], 10)}月${parseInt(parts[2], 10)}日`;
    }
    return d;
  };

  const formattedDate = formatDateJa(interventionDate || '2025-01-05');
  const cleanTarget = targetUnit.replace(/（.*?）/, '');
  const others = donorUnits.slice(0, 3).join('・') || '他の対象ユニット';
  const n1 = donorUnits[0] || '対照群A';
  const n2 = donorUnits[1] || '対照群B';

  // Filter sample points for targetUnit (show 5 points around intervention)
  const targetPoints = samplePoints.filter((p) => p.unit === targetUnit);
  const recentPreviewPoints = targetPoints.slice(
    Math.max(0, Math.floor(targetPoints.length * 0.6) - 3),
    Math.max(6, Math.floor(targetPoints.length * 0.6) + 3)
  );

  const steps = [
    {
      title: `あなたは、${cleanTarget}（${unitTypeName}）の施策担当者です`,
      content: (
        <>
          <p className="text-gray-700 leading-relaxed my-2 text-xs sm:text-sm">
            <strong className="text-blue-700 font-bold">{cleanTarget}</strong>のほか、
            <span className="font-semibold text-slate-800">{others}</span>など、複数の{unitTypeName}を管理・比較できる立場にあります。
          </p>
          <p className="text-gray-700 leading-relaxed my-2 text-xs sm:text-sm">
            <strong className="text-slate-900 bg-blue-50 px-1.5 py-0.5 rounded font-mono">{formattedDate}</strong>に、
            {cleanTarget}で<strong className="text-blue-700">「{interventionName}」</strong>を実施しました。
          </p>
          <p className="text-gray-700 leading-relaxed my-2 text-xs sm:text-sm">
            その後、{cleanTarget}の{metricName}に変化が現れました。さて、<strong className="text-amber-800">それは本当にこの施策のおかげ</strong>でしょうか？
          </p>
          <div className="mt-3 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            💡 本ツールはお店の売上だけでなく、Webマーケティング（登録者数）、自治体政策（電力消費・CO2削減）、人事（残業削減）など、A/Bテストができないあらゆる施策の測定に使えます。
          </div>
        </>
      ),
    },
    {
      title: `【生データ確認】あなたのお店のデータ（${metricName}）はこのようになっています`,
      content: (
        <>
          <p className="text-gray-700 leading-relaxed my-2 text-xs sm:text-sm">
            分析の出発点となるのは、以下の「日付・ユニット名・測定値」のシンプルな時系列データです。
          </p>
          <div className="my-3 border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
            <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between text-[11px] font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Table className="w-3.5 h-3.5 text-blue-600" />
                <span>{cleanTarget} の記録データ抜粋（デモデータ）</span>
              </span>
              <span className="font-normal text-slate-500">単位: {metricUnit}</span>
            </div>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-white text-slate-600 text-[11px]">
                  <th className="py-1.5 px-3">日付</th>
                  <th className="py-1.5 px-3">対象</th>
                  <th className="py-1.5 px-3 text-right">{metricName}</th>
                  <th className="py-1.5 px-3 text-center">施策区分</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 bg-white">
                {recentPreviewPoints.map((pt) => {
                  const isPost = pt.date >= interventionDate;
                  return (
                    <tr key={pt.date} className={isPost ? 'bg-blue-50/40' : ''}>
                      <td className="py-1.5 px-3 font-mono text-slate-700">{pt.date}</td>
                      <td className="py-1.5 px-3 font-medium text-slate-900">{pt.unit}</td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-800">
                        {pt.value.toLocaleString('ja-JP')} {metricUnit}
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                            isPost
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isPost ? '施策後' : '施策前'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-gray-700 leading-relaxed text-xs">
            ご自身のデータを分析するときも、これと同じ3列（日付・店舗等の名前・数値）のCSVやExcelをアップロードするだけで即座に測定できます。
          </p>
        </>
      ),
    },
    {
      title: '🏪【重要】1店舗しか持たない人はどうする？（ブラウザバック不要！）',
      content: (
        <>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 sm:p-4 my-2 text-xs leading-relaxed text-emerald-950">
            <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm mb-1.5">
              <Store className="w-4 h-4 text-emerald-600" />
              <span>「自分は1店舗しかないから使えない…」と諦める必要はありません！</span>
            </div>
            <p className="text-emerald-800">
              合成コントロール法の「比較対象（ドナー）」は、必ずしも別の支店や実店舗である必要はありません。<strong>「施策の影響を受けていない時系列データ」</strong>であれば何でも比較相手にできます。
            </p>
          </div>

          <div className="space-y-2.5 my-3 text-xs">
            <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
              <strong className="text-blue-700 block mb-0.5">① 自店内の「別カテゴリ・別商品群」をドナーにする</strong>
              <p className="text-slate-600">
                例：カフェで「モーニング施策」を打った場合、対象の「モーニング売上」に対して、施策をしなかった「ランチ売上」「テイクアウト売上」「ドリンク単品」をドナーとして並べます。
              </p>
            </div>

            <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
              <strong className="text-blue-700 block mb-0.5">② 「曜日や時間帯」で分割してドナーにする</strong>
              <p className="text-slate-600">
                例：平日限定キャンペーンを実施した場合、「平日売上」を測定対象にし、「土日祝売上」や「深夜帯売上」を比較対象にします。
              </p>
            </div>

            <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
              <strong className="text-blue-700 block mb-0.5">③ 無料の「公表オープンデータ」をドナーにする</strong>
              <p className="text-slate-600">
                例：自治体の商業統計、経産省のPOS動態データ、近隣エリアの通行量、あるいはGoogleトレンドの検索数推移などをCSVの1行として追加すれば、立派な比較対象として機能します！
              </p>
            </div>
          </div>
        </>
      ),
    },
    {
      title: '📊【必要データ量の目安】どれくらいのデータがあればモデルが良く動く？',
      content: (
        <>
          <p className="text-gray-700 leading-relaxed my-2 text-xs sm:text-sm">
            本ツールのアルゴリズム（二次計画法QP）が正確に対照群を合成するための、推奨データ量の目安です：
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3 text-xs">
            <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/60 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-blue-900">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>施策前の期間（Pre-period）</span>
              </div>
              <ul className="space-y-1 text-slate-700 text-[11px]">
                <li><strong className="text-emerald-700">◎ 理想：</strong> 15〜20時点以上（月次なら1.5年、週次なら4〜5ヶ月、日次なら1〜2ヶ月）</li>
                <li><strong className="text-blue-700">◯ 推奨：</strong> 8〜14時点（月次なら8ヶ月〜1年）</li>
                <li><strong className="text-amber-700">△ 最低限：</strong> 3〜7時点（最低2時点あれば計算自体は可能ですが、ブレを吸収しにくくなります）</li>
              </ul>
            </div>

            <div className="p-3 rounded-xl border border-purple-200 bg-purple-50/60 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-purple-900">
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                <span>比較対象（ドナー）の数</span>
              </div>
              <ul className="space-y-1 text-slate-700 text-[11px]">
                <li><strong className="text-emerald-700">◎ 理想：</strong> 3〜10個程度（多すぎると過剰適合、少なすぎると合成不能）</li>
                <li><strong className="text-blue-700">◯ 可能：</strong> 2〜15個</li>
                <li><strong className="text-slate-500">※ 注意：</strong> 施策対象と全く関係のない極端なトレンドを持つデータは除外すると精度が上がります。</li>
              </ul>
            </div>
          </div>

          <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            💡 施策「後」のデータ期間は<strong>最低1時点から測定可能</strong>です！期間が長くなるほど、効果が持続しているか減衰しているかが鮮明になります。
          </div>
        </>
      ),
    },
    {
      title: 'ふつうは「やった世界」と「やらなかった世界」を同時に比べられません',
      content: (
        <>
          <p className="text-gray-700 leading-relaxed my-2 text-xs sm:text-sm">
            ここで考えてみてください。通常は、<strong className="text-rose-700">施策を打った時とそうでない時を同時に比較することはできません</strong>（因果推論の根本問題）。
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-600 p-3 sm:p-4 rounded-r-lg my-3 text-xs sm:text-sm text-slate-800 leading-relaxed">
            同じ{cleanTarget}の同じ期間に、「施策をやった世界」と「何もしなかった世界」を同時に観測することは不可能だからです。
          </div>
          <p className="text-gray-700 leading-relaxed my-2 text-xs sm:text-sm">
            売上や数字は季節・天候・世の中の景気でも動きます。「前年より増えた＝施策のおかげ」と単純に判断すると、外部要因を施策効果と勘違いしてしまいます。
          </p>
        </>
      ),
    },
    {
      title: `そこで「もし何もしなかった${cleanTarget}」をつくります（合成コントロール）`,
      content: (
        <>
          <p className="text-gray-700 leading-relaxed my-2 text-xs sm:text-sm">
            施策をしなかった他のユニット（{others}など）の数値を、少しずつブレンドします。
            <strong className="text-blue-700">施策前の{cleanTarget}の動きにそっくり</strong>になる配合比率を、数理最適化（コンピュータ）が自動で見つけ出します。
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-600 p-3 sm:p-4 rounded-r-lg my-3 text-xs sm:text-sm text-slate-800 leading-relaxed">
            <span className="font-mono font-semibold">
              例：{n1} 38％ ＋ {n2} 34％ ＋ ほか 28％<br />
              ＝ 施策前の{cleanTarget}とほぼ完全に一致する仮想の比較対象
            </span>
          </div>
          <p className="text-gray-700 leading-relaxed my-2 text-xs sm:text-sm">
            その配合比率のまま施策後の期間も計算を続けることで、「もし施策をしなかったらどうなっていたか（反実仮想）」を再現します。
          </p>
        </>
      ),
    },
    {
      title: '青と赤の差が、施策の「真の純増効果」です',
      content: (
        <>
          <div className="my-2 bg-[#fafcff] border border-blue-100 rounded-lg p-2 overflow-hidden shadow-inner">
            <svg viewBox="0 0 320 125" className="w-full h-auto">
              <polygon
                points="190,58 230,50 270,44 310,38 310,14 270,22 230,34"
                fill="#2563eb"
                opacity="0.16"
              />
              <line
                x1="190"
                y1="8"
                x2="190"
                y2="108"
                stroke="#64748b"
                strokeDasharray="4 4"
                strokeWidth="1.5"
              />
              <path
                d="M10,80 L50,70 L90,74 L130,62 L190,58 L230,50 L270,44 L310,38"
                stroke="#ef4444"
                strokeWidth="2.5"
                fill="none"
                strokeDasharray="6 4"
              />
              <path
                d="M10,80 L50,71 L90,74 L130,61 L190,58 L230,34 L270,22 L310,14"
                stroke="#2563eb"
                strokeWidth="2.5"
                fill="none"
              />
              <text x="194" y="22" fontSize="9" fontWeight="bold" fill="#475569">
                施策開始
              </text>
              <rect x="6" y="106" width="8" height="8" rx="2" fill="#2563eb" />
              <text x="18" y="114" fontSize="9" fill="#1e293b" fontWeight="600">
                青：実際の実績
              </text>
              <rect x="116" y="106" width="8" height="8" rx="2" fill="#ef4444" />
              <text x="128" y="114" fontSize="9" fill="#1e293b" fontWeight="600">
                赤：何もしなかった場合（合成対照）
              </text>
              <text x="260" y="26" fontSize="9" fill="#1d4ed8" fontWeight="bold">
                ▲ 純増効果
              </text>
            </svg>
          </div>
          <p className="text-gray-700 leading-relaxed my-2 text-xs sm:text-sm">
            青い線（実績）が赤い破線（やらなかった場合）より<strong className="text-blue-700">上回っている面積</strong>が、世の中の景気や他店のトレンドと関係なく施策によって生み出された「真の純増効果」です。
          </p>
        </>
      ),
    },
    {
      title: '使い方の3ステップ＆作成背景・免責事項',
      content: (
        <>
          <div className="bg-blue-50 border-l-4 border-blue-600 p-3 rounded-r-lg my-2.5 text-xs text-slate-800 leading-relaxed space-y-1.5">
            <div>
              <strong className="text-blue-900 font-bold">① サンプルシナリオを選んで結果を眺める</strong>
              <div className="text-slate-600 text-[11px]">店舗売上、Web広告、自治体政策、残業削減など上部から切替可能。</div>
            </div>
            <div>
              <strong className="text-blue-900 font-bold">② 左側のスライダー（コストや除外）を動かしてみる</strong>
              <div className="text-slate-600 text-[11px]">施策コストを変えると即座にROI（収支）が再計算されます。</div>
            </div>
            <div>
              <strong className="text-blue-900 font-bold">③ 「数字の見方の目安（◎/△/×）」で結果の信頼性を確かめる</strong>
              <div className="text-slate-600 text-[11px]">適合度スコアやプラセボ偽薬検定で偶然ではないか確認できます。</div>
            </div>
          </div>

          {/* AI Disclosure Notice as explicitly requested */}
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold mb-1 text-amber-950">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>【重要】生成AIによる構築および利用上の免責事項</span>
            </div>
            <p className="text-[11px] text-amber-900 leading-relaxed">
              本サイトの数理ロジック・UI・解説文は<strong>生成AI（Gemini）を活用して作成</strong>されており、統計学や因果推論の学術専門家による個別監修を経たものではありません。実務の意思決定や施策検討の参考指標としてご活用いただき、重要判断の際は専門家へのご相談や多面的なデータ検証を併せて実施してください。
            </p>
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
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
              <HelpCircle className="w-3.5 h-3.5" />
            </span>
            <span className="text-blue-600 text-xs font-bold tracking-wider uppercase">
              はじめてのガイド · {step + 1} / {steps.length}
            </span>
          </div>
          <button
            onClick={handleClose}
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
                  idx === step ? 'bg-blue-600 w-5' : 'bg-slate-200 hover:bg-slate-300'
                }`}
                aria-label={`ステップ ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>次回から自動表示しない</span>
          </label>

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
                onClick={handleClose}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all"
              >
                分析をはじめる
              </button>
            ) : (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all flex items-center gap-1"
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
