import React from 'react';
import { AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';
import { SCMResult } from '../types';

interface GuideTableProps {
  result: SCMResult;
  cost: number;
  margin: number;
  metricName?: string;
  metricUnit?: string;
  unitTypeName?: string;
}

type VerdictType = 'good' | 'ok' | 'bad' | 'na';

interface VerdictResult {
  symbol: string;
  className: string;
  text: string;
}

function getVerdict(kind: VerdictType, text: string): VerdictResult {
  switch (kind) {
    case 'good':
      return { symbol: '◎', className: 'text-emerald-700 bg-emerald-50 border-emerald-200 font-bold', text };
    case 'ok':
      return { symbol: '△', className: 'text-amber-700 bg-amber-50 border-amber-200 font-bold', text };
    case 'bad':
      return { symbol: '×', className: 'text-rose-700 bg-rose-50 border-rose-200 font-bold', text };
    case 'na':
    default:
      return { symbol: '−', className: 'text-slate-500 bg-slate-50 border-slate-200', text };
  }
}

export const GuideTable: React.FC<GuideTableProps> = ({
  result,
  cost,
  margin,
  metricName = '売上',
  metricUnit = '円',
  unitTypeName = '店舗',
}) => {
  const { confidenceScore, placeboPValue, preRMSPE, averageIncrementalEffect, placeboResults } = result;

  // 1. Pre-fit score verdict
  let scoreVerdict: VerdictResult;
  if (confidenceScore === null || isNaN(confidenceScore)) {
    scoreVerdict = getVerdict('na', '算出できません');
  } else if (confidenceScore >= 90) {
    scoreVerdict = getVerdict('good', `高い（${confidenceScore.toFixed(0)}点）`);
  } else if (confidenceScore >= 80) {
    scoreVerdict = getVerdict('ok', `まずまず（${confidenceScore.toFixed(0)}点）`);
  } else {
    scoreVerdict = getVerdict('bad', `低い（${confidenceScore.toFixed(0)}点）`);
  }

  // 2. Placebo p-value verdict
  let pVerdict: VerdictResult;
  if (placeboPValue === null || isNaN(placeboPValue)) {
    pVerdict = getVerdict('na', '算出できません');
  } else if (placeboPValue <= 0.05) {
    pVerdict = getVerdict('good', `珍しい変化（p = ${placeboPValue.toFixed(3)}）`);
  } else if (placeboPValue <= 0.2) {
    pVerdict = getVerdict('ok', `参考程度（p = ${placeboPValue.toFixed(3)}）`);
  } else {
    pVerdict = getVerdict('bad', `よくある変化（p = ${placeboPValue.toFixed(3)}）`);
  }

  // 3. Effect size ratio (average gap / preRMSPE)
  const ratio = preRMSPE > 1e-9 ? Math.abs(averageIncrementalEffect) / preRMSPE : null;
  let efVerdict: VerdictResult;
  if (ratio === null || isNaN(ratio)) {
    efVerdict = getVerdict('na', '算出できません');
  } else if (ratio >= 2.0) {
    efVerdict = getVerdict('good', `差が目立つ（${ratio.toFixed(1)}倍）`);
  } else if (ratio >= 1.0) {
    efVerdict = getVerdict('ok', `判断しにくい（${ratio.toFixed(1)}倍）`);
  } else {
    efVerdict = getVerdict('bad', `ふだんのズレの範囲（${ratio.toFixed(1)}倍）`);
  }

  // 4. ROI
  const totalIncrementalProfit = result.totalIncrementalEffect * (margin / 100);
  const roi = cost > 0 ? ((totalIncrementalProfit - cost) / cost) * 100 : null;
  let roiVerdict: VerdictResult;
  if (roi === null || isNaN(roi)) {
    roiVerdict = getVerdict('na', cost === 0 ? '費用が0円のため算出なし' : '算出できません');
  } else if (roi >= 20) {
    roiVerdict = getVerdict('good', `黒字（+${roi.toFixed(0)}%）`);
  } else if (roi >= 0) {
    roiVerdict = getVerdict('ok', `黒字ぎりぎり（+${roi.toFixed(0)}%）`);
  } else {
    roiVerdict = getVerdict('bad', `赤字（${roi.toFixed(0)}%）`);
  }

  const minPossibleP = (1 / (placeboResults.length + 1)).toFixed(3);
  const showWarning = confidenceScore < 80;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>数字の見方の目安</span>
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              実務判断基準
            </span>
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            ◎ 信用しやすい ／ △ 慎重に判断 ／ × 信用しにくい
          </p>
        </div>
      </div>

      {showWarning && (
        <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm p-3.5 rounded-lg flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">注意：今回は「比較の似ている度合い」が低めです。</span>
            <p className="mt-0.5 text-xs text-amber-800">
              結果を判断する前に、比較する{unitTypeName}の選択を見直すか、施策開始日の設定が合っているか確認してください。
            </p>
          </div>
        </div>
      )}

      {/* Guide Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 mb-4">
        <table className="w-full text-xs sm:text-sm text-left border-collapse min-w-[620px]">
          <thead>
            <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 text-xs font-semibold">
              <th className="py-2.5 px-3.5 w-1/4">項目</th>
              <th className="py-2.5 px-3 w-1/5 text-emerald-800">◎ 信用しやすい</th>
              <th className="py-2.5 px-3 w-1/5 text-amber-800">△ 慎重に</th>
              <th className="py-2.5 px-3 w-1/5 text-rose-800">× 信用しにくい</th>
              <th className="py-2.5 px-3.5 w-1/4 bg-blue-50/60 text-blue-900">今回の結果</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {/* Row 1 */}
            <tr className="hover:bg-slate-50/50 transition-colors">
              <td className="py-3 px-3.5 align-top">
                <div className="font-bold text-slate-900">比較の似ている度合い</div>
                <div className="text-xs text-slate-500">（事前適合スコア）</div>
              </td>
              <td className="py-3 px-3 align-top text-xs text-slate-600">90点以上</td>
              <td className="py-3 px-3 align-top text-xs text-slate-600">80〜90点</td>
              <td className="py-3 px-3 align-top text-xs text-slate-600">
                80点未満<br />
                <span className="text-rose-600">（画面に警告表示）</span>
              </td>
              <td className="py-3 px-3.5 align-top bg-blue-50/30">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs ${scoreVerdict.className}`}>
                  <span>{scoreVerdict.symbol}</span>
                  <span>{scoreVerdict.text}</span>
                </span>
              </td>
            </tr>

            {/* Row 2 */}
            <tr className="hover:bg-slate-50/50 transition-colors">
              <td className="py-3 px-3.5 align-top">
                <div className="font-bold text-slate-900">ほかの{unitTypeName}と比べた珍しさ</div>
                <div className="text-xs text-slate-500">（プラセボp値）</div>
              </td>
              <td className="py-3 px-3 align-top text-xs text-slate-600">
                0.05以下<br />
                <span className="text-emerald-700">他{unitTypeName}ではめったにない</span>
              </td>
              <td className="py-3 px-3 align-top text-xs text-slate-600">
                0.05〜0.20<br />
                <span>参考程度</span>
              </td>
              <td className="py-3 px-3 align-top text-xs text-slate-600">
                0.20より大きい<br />
                <span>他でも起こりうる変化</span>
              </td>
              <td className="py-3 px-3.5 align-top bg-blue-50/30">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs ${pVerdict.className}`}>
                  <span>{pVerdict.symbol}</span>
                  <span>{pVerdict.text}</span>
                </span>
              </td>
            </tr>

            {/* Row 3 */}
            <tr className="hover:bg-slate-50/50 transition-colors">
              <td className="py-3 px-3.5 align-top">
                <div className="font-bold text-slate-900">変化の大きさ（効果比）</div>
                <div className="text-xs text-slate-500">（平均差 ÷ ふだんのズレ）</div>
              </td>
              <td className="py-3 px-3 align-top text-xs text-slate-600">
                2.0倍以上<br />
                <span className="text-emerald-700">差が目立つ</span>
              </td>
              <td className="py-3 px-3 align-top text-xs text-slate-600">
                1.0〜2.0倍<br />
                <span>判断しにくい</span>
              </td>
              <td className="py-3 px-3 align-top text-xs text-slate-600">
                1.0倍未満<br />
                <span>ふだんのブレの範囲</span>
              </td>
              <td className="py-3 px-3.5 align-top bg-blue-50/30">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs ${efVerdict.className}`}>
                  <span>{efVerdict.symbol}</span>
                  <span>{efVerdict.text}</span>
                </span>
              </td>
            </tr>

            {/* Row 4 */}
            <tr className="hover:bg-slate-50/50 transition-colors">
              <td className="py-3 px-3.5 align-top">
                <div className="font-bold text-slate-900">かけた費用に対する収支</div>
                <div className="text-xs text-slate-500">（ROI: 投資利益率）</div>
              </td>
              <td className="py-3 px-3 align-top text-xs text-slate-600">
                +20%以上<br />
                <span className="text-emerald-700">十分な黒字</span>
              </td>
              <td className="py-3 px-3 align-top text-xs text-slate-600">
                0〜+20%<br />
                <span>黒字ぎりぎり</span>
              </td>
              <td className="py-3 px-3 align-top text-xs text-slate-600">
                マイナス<br />
                <span className="text-rose-600">赤字（元本割れ）</span>
              </td>
              <td className="py-3 px-3.5 align-top bg-blue-50/30">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs ${roiVerdict.className}`}>
                  <span>{roiVerdict.symbol}</span>
                  <span>{roiVerdict.text}</span>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Explanatory notes */}
      <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 space-y-1.5 leading-relaxed">
        <p className="flex items-start gap-1.5">
          <span className="text-slate-400 font-bold">•</span>
          <span>
            <strong>実務上の目安：</strong>これは意思決定を助ける目安であり、統計学上の厳密合格ラインではありません。また、本ツールの作成には統計専門家の個別監修を経ずに生成AIを活用しているため、結果の解釈には多面的な検討を推奨します。
          </span>
        </p>
        <p className="flex items-start gap-1.5">
          <span className="text-slate-400 font-bold">•</span>
          <span>
            <strong>プラセボ検定のユニット数：</strong>「珍しさ（p値）」は比較する対象が少ないと数学的に小さくなれません。今回は対照群が{placeboResults.length}個のため、最小でも理論上 <strong>{minPossibleP}</strong> までです（0.05以下を達成するには19以上の対照群が必要です）。
          </span>
        </p>
        <p className="flex items-start gap-1.5">
          <span className="text-slate-400 font-bold">•</span>
          <span>
            <strong>収支の前提：</strong>収支（ROI）は、最初の2項目（適合スコア・p値）が「×」の場合、推定純増量自体の信憑性が低いため数字を鵜呑みにしないようご注意ください。
          </span>
        </p>
      </div>
    </div>
  );
};
