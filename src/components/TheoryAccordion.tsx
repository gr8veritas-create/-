import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ShieldCheck, AlertCircle, Info, BookOpen, AlertTriangle } from 'lucide-react';
import { SCMResult } from '../types';

interface TheoryAccordionProps {
  result: SCMResult | null;
  prePeriodCount: number;
  unitTypeName?: string;
}

export const TheoryAccordion: React.FC<TheoryAccordionProps> = ({
  result,
  prePeriodCount,
  unitTypeName = '店舗',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const hasShortPrePeriod = prePeriodCount < 8;
  const isPoorFit = result ? result.confidenceScore < 80 : false;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all">
      {/* Header button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 sm:px-6 py-3.5 bg-slate-50/80 hover:bg-slate-100/70 transition-colors flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-900 text-sm sm:text-base">
                理論的前提条件とガードレール
              </span>
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                Abadie et al. 2010 準拠
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              合成コントロール法を正しく使うための3大原則と現在のデータ適合チェック
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick status pill */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            {hasShortPrePeriod || isPoorFit ? (
              <span className="flex items-center gap-1 text-amber-700 font-medium bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5" />
                前提条件の確認を推奨
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                前提条件クリア
              </span>
            )}
          </div>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {/* Accordion Content */}
      {isOpen && (
        <div className="p-4 sm:p-6 border-t border-slate-200 space-y-4 bg-white text-xs sm:text-sm text-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Condition 1 */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2 font-bold text-slate-900">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center shrink-0">
                    1
                  </span>
                  <span>非干渉性（スピルオーバーなし）</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  施策対象で実施した取り組みの影響が、<strong>比較対象（ドナー）に漏れ出していないこと</strong>（SUTVA原則）。
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-500">
                例：対象店舗のセールにより隣接する他店舗の顧客が奪われたり（カニバリゼーション）、対象地域外にも広告が漏洩していると誤差が生じます。
              </div>
            </div>

            {/* Condition 2 */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2 font-bold text-slate-900">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span>凸結合（内挿の原則）</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  施策対象の数値規模やトレンドが、<strong>他ユニットの合成可能な範囲（凸包）の内側にあること</strong>。外挿（無理な引き伸ばし）を防ぐため重み合計は1、各重みは非負です。
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-500">
                例：他{unitTypeName}が数値200〜400なのに、対象だけが3,000のような極端な外れ値である場合、適切に合成できません。
              </div>
            </div>

            {/* Condition 3 */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2 font-bold text-slate-900">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center shrink-0">
                    3
                  </span>
                  <span>十分な事前期間</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  施策前のトレンドを正確に学習するため、<strong>施策前期間は最低8時点以上（推奨12〜52時点）</strong>必要です。
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-500">
                現在の事前期間: <strong className={hasShortPrePeriod ? 'text-rose-600' : 'text-emerald-700'}>{prePeriodCount}時点</strong>
                {hasShortPrePeriod ? '（警告: 8未満のため過学習の恐れあり）' : '（✓ 十分な期間が確保されています）'}
              </div>
            </div>
          </div>

          {/* AI Disclosure Banner */}
          <div className="bg-amber-50/80 rounded-xl p-3.5 border border-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-amber-950">
              <strong className="text-amber-900">【作成背景に関する重要事項】：</strong>
              <span>
                本ツールの数理ロジック・アルゴリズム設計・画面解説は<strong>生成AI（Gemini）を活用して実装</strong>されており、統計学や計量経済学の専門家による個別監修は受けておりません。実務での参考指標・探索的分析としてご活用いただき、重要判断時は追加の統計検証を行ってください。
              </span>
            </div>
          </div>

          {/* System Safety Guardrail status */}
          <div className="bg-blue-50/60 rounded-xl p-3.5 border border-blue-100 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-blue-900">
              <strong className="text-blue-950">本ツールの安全装置（ガードレール）：</strong>
              <span className="text-blue-800">
                入力データに対して「重みの非負制約（各重み &ge; 0）」と「合計1制約（&sum; w_i = 1）」を二次計画法で厳密に解いており、架空の無理な予測を防止しています。
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
