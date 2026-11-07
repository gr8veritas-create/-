import React from 'react';
import { BookOpen, ShieldCheck, AlertTriangle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Academic Foundations */}
        <div>
          <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>学術的根拠（Academic Foundations）</span>
          </div>
          <p className="mt-1.5 text-slate-600 leading-relaxed font-serif">
            Abadie, A., Diamond, A., & Hainmueller, J. (2010). Synthetic Control Methods for
            Comparative Case Studies: Estimating the Effect of California’s Tobacco Control
            Program. <em>Journal of the American Statistical Association</em>, 105(490), 493-505.
          </p>
        </div>

        {/* Prominent AI Creation & Disclaimer Notice */}
        <div className="bg-amber-50/60 border border-amber-200/90 rounded-xl p-4 text-xs text-amber-950 leading-relaxed space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>【明記】ツールの作成背景・正確性および免責事項</span>
          </div>
          <p className="text-amber-900">
            本Webアプリケーション（サイト名はけんとうちゅうです）の数理アルゴリズム実装、UIデザイン、および解説文章は、<strong>生成AI（Gemini）を活用して作成</strong>されています。統計学や計量経済学、因果推論の専門家による公式な個別監修や学術認証を経たものではありません。
          </p>
          <p className="text-amber-800 text-[11px]">
            本ツールは現場の実務における意思決定や仮説検証の参考指標を提供することを目的としています。重要な経営判断、巨額の投資決定、法的手続きや学術論文での引用に際しては、統計の専門家への相談や多面的な追加データ検証を併せて実施してください。
          </p>
        </div>

        {/* License & Privacy Badges */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-slate-400">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              MIT License（オープンソース・商用利用フリー）
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-medium">
              100% ブラウザ内完結（データ外部送信ゼロ・安心のプライバシー保護）
            </span>
          </div>
          <p>© {new Date().getFullYear()} サイト名はけんとうちゅうです. Synthetic Control Method for Business Analytics.</p>
        </div>
      </div>
    </footer>
  );
};
