import React, { useState, useEffect } from 'react';
import {
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  FlaskConical,
  BarChart2,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { doc, onSnapshot, setDoc, getDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db, auth, ADMIN_EMAIL } from '../firebase/config';

interface BetaFeatureSurveyProps {
  featureId: 'safety_stock' | 'optimal_pricing';
  featureName: string;
}

export const BetaFeatureSurvey: React.FC<BetaFeatureSurveyProps> = ({
  featureId,
  featureName,
}) => {
  const storageKey = `impactsynth_beta_vote_${featureId}`;
  const [vote, setVote] = useState<'keep' | 'remove' | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Firestore aggregate live counts
  const [counts, setCounts] = useState<{ keepCount: number; removeCount: number }>({
    keepCount: 0,
    removeCount: 0,
  });

  // Admin status detection
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // 1. Load user's local vote
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === 'keep' || saved === 'remove') {
        setVote(saved);
      }
    } catch {
      // ignore
    }

    // 2. Real-time listener for Firestore vote tally
    const surveyDocRef = doc(db, 'surveys', featureId);
    const unsubscribeSnapshot = onSnapshot(
      surveyDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCounts({
            keepCount: Number(data.keepCount) || 0,
            removeCount: Number(data.removeCount) || 0,
          });
        }
      },
      (error) => {
        console.warn('Failed to fetch survey votes:', error);
      }
    );

    // 3. Admin status check
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        if (ADMIN_EMAIL && user.email === ADMIN_EMAIL && user.emailVerified) {
          setIsAdmin(true);
        } else {
          try {
            const adminDoc = await getDoc(doc(db, 'admins', user.uid));
            setIsAdmin(adminDoc.exists());
          } catch {
            setIsAdmin(false);
          }
        }
      } else {
        setIsAdmin(false);
      }
    });

    return () => {
      unsubscribeSnapshot();
      unsubscribeAuth();
    };
  }, [featureId, storageKey]);

  const handleVote = async (choice: 'keep' | 'remove') => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const prevVote = vote;
    setVote(choice);
    setShowThankYou(true);

    try {
      localStorage.setItem(storageKey, choice);
    } catch {
      // ignore
    }

    // Persist vote to Firestore
    try {
      const surveyDocRef = doc(db, 'surveys', featureId);
      const isKeep = choice === 'keep';

      // If user is switching their vote, adjust both counters
      if (prevVote && prevVote !== choice) {
        await setDoc(
          surveyDocRef,
          {
            keepCount: increment(isKeep ? 1 : -1),
            removeCount: increment(isKeep ? -1 : 1),
            lastVotedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } else if (!prevVote) {
        await setDoc(
          surveyDocRef,
          {
            keepCount: increment(isKeep ? 1 : 0),
            removeCount: increment(isKeep ? 0 : 1),
            lastVotedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
    } catch (err) {
      console.error('Failed to submit survey vote to Firestore:', err);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => {
        setShowThankYou(false);
      }, 4500);
    }
  };

  const totalVotes = counts.keepCount + counts.removeCount;
  const keepPercent = totalVotes > 0 ? Math.round((counts.keepCount / totalVotes) * 100) : 0;
  const removePercent = totalVotes > 0 ? Math.round((counts.removeCount / totalVotes) * 100) : 0;

  return (
    <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-3 sm:p-4 shadow-2xs text-xs text-amber-950 space-y-2.5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 font-extrabold text-[11px] px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 border border-amber-300">
              <FlaskConical className="w-3.5 h-3.5 text-amber-800" />
              試験公開中（削除・存続を検討中）
            </span>
            <span className="font-bold text-slate-900 text-xs sm:text-sm">
              【1タップ意思表示】この「{featureName}」機能は今後も必要ですか？
            </span>
          </div>
          <p className="text-[11px] text-amber-900/90 leading-relaxed max-w-3xl">
            本ページはユーザーニーズを検証するため試験的に掲載しています。役立った方・使いたい方は「必要」、不要だと感じる方は「不要」を教えてください。皆様の投票をもとに<strong>機能の正式継続またはページ削除</strong>を判断します。
          </p>
        </div>

        {/* 1-Click Voting Buttons */}
        <div className="flex items-center gap-2 shrink-0 self-start lg:self-center">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleVote('keep')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 ${
              vote === 'keep'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-500/30'
                : 'bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-300 hover:border-emerald-500'
            }`}
            title="この機能を今後も残してほしい場合に投票"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>👍 必要・残してほしい</span>
            {vote === 'keep' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />}
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleVote('remove')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 ${
              vote === 'remove'
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs ring-2 ring-rose-500/30'
                : 'bg-white hover:bg-rose-50 text-rose-800 border-rose-300 hover:border-rose-500'
            }`}
            title="この機能は不要・無くてもよい場合に投票"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
            <span>👎 不要・なくてもよい</span>
            {vote === 'remove' && <CheckCircle2 className="w-3.5 h-3.5 text-rose-200" />}
          </button>
        </div>
      </div>

      {/* Aggregate Results Bar (Visible to Admin or when votes exist) */}
      {(isAdmin || totalVotes > 0) && (
        <div className="pt-2 border-t border-amber-200/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
              <span>全ユーザー投票集計 ({totalVotes}票):</span>
            </span>
            <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-semibold border border-emerald-200">
              👍 必要: {counts.keepCount}票 ({keepPercent}%)
            </span>
            <span className="bg-rose-100 text-rose-900 px-2 py-0.5 rounded font-semibold border border-rose-200">
              👎 不要: {counts.removeCount}票 ({removePercent}%)
            </span>
          </div>

          {isAdmin && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
              <ShieldCheck className="w-3 h-3 text-blue-600" />
              管理者リアルタイム集計表示中
            </span>
          )}
        </div>
      )}

      {/* Confirmation feedback banner */}
      {showThankYou && (
        <div className="pt-1.5 text-[11px] font-bold text-emerald-800 flex items-center gap-1.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            意思表示ありがとうございます！「{vote === 'keep' ? '必要・残してほしい' : '不要・なくてもよい'}」としてクラウドに記録しました。今後のサイト構成の見直しに反映します（いつでも投票を変更できます）。
          </span>
        </div>
      )}
    </div>
  );
};
