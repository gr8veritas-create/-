import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { signInWithPopup, signOut, User } from 'firebase/auth';
import {
  db,
  auth,
  googleProvider,
  ADMIN_EMAIL,
  ADMIN_UID,
  handleFirestoreError,
  OperationType,
} from '../firebase/config';
import {
  MessageSquare,
  Lock,
  ShieldCheck,
  Send,
  LogIn,
  LogOut,
  UserCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Trash2,
  Edit3,
  Filter,
  Eye,
  MessageCircle,
  Search,
  Check,
  Tag,
  Inbox,
  AlertTriangle,
  BarChart3,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';

export interface FeedbackItem {
  id: string;
  authorId: string;
  authorEmail: string;
  authorName: string;
  authorPhotoUrl?: string;
  title: string;
  content: string;
  category: 'feature_request' | 'bug_report' | 'praise' | 'question' | 'other';
  targetModule: 'scm' | 'safety_stock' | 'optimal_pricing' | 'general';
  status: 'open' | 'in_review' | 'resolved' | 'archived';
  adminNote?: string;
  createdAt: any;
  updatedAt: any;
}

const CATEGORY_MAP = {
  feature_request: { label: '機能追加・改善', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  bug_report: { label: '不具合・表示崩れ', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  praise: { label: '応援・感想', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  question: { label: '質問・使い方', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  other: { label: 'その他', color: 'bg-slate-50 text-slate-700 border-slate-200' },
};

const MODULE_MAP = {
  scm: '施策効果測定 (因果推論)',
  safety_stock: '安全在庫計算',
  optimal_pricing: '適正価格判定',
  general: '全体・その他',
};

const STATUS_MAP = {
  open: { label: '受付完了', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  in_review: { label: '確認中・検討中', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  resolved: { label: '対応・反映完了', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  archived: { label: 'アーカイブ済', color: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export const UserVoiceModule: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<FeedbackItem['category']>('feature_request');
  const [targetModule, setTargetModule] = useState<FeedbackItem['targetModule']>('general');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Admin / Filter State
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editingAdminNoteId, setEditingAdminNoteId] = useState<string | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [safetyVotes, setSafetyVotes] = useState({ keep: 0, remove: 0 });
  const [pricingVotes, setPricingVotes] = useState({ keep: 0, remove: 0 });
  const [isAnalyticsGuideOpen, setIsAnalyticsGuideOpen] = useState(false);

  // Listen to survey votes in real-time
  useEffect(() => {
    const unsubSafety = onSnapshot(doc(db, 'surveys', 'safety_stock'), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setSafetyVotes({ keep: Number(d.keepCount) || 0, remove: Number(d.removeCount) || 0 });
      }
    });
    const unsubPricing = onSnapshot(doc(db, 'surveys', 'optimal_pricing'), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setPricingVotes({ keep: Number(d.keepCount) || 0, remove: Number(d.removeCount) || 0 });
      }
    });
    return () => {
      unsubSafety();
      unsubPricing();
    };
  }, []);

  // Listen to Auth state changes and determine admin role
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (user) {
        if (
          (ADMIN_EMAIL && user.email === ADMIN_EMAIL && user.emailVerified) ||
          (ADMIN_UID && user.uid === ADMIN_UID)
        ) {
          setIsAdmin(true);
        } else {
          try {
            const adminSnap = await getDoc(doc(db, 'admins', user.uid));
            setIsAdmin(adminSnap.exists());
          } catch {
            setIsAdmin(false);
          }
        }
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to Firestore feedbacks
  useEffect(() => {
    if (!currentUser) {
      setFeedbacks([]);
      setLoadingFeedbacks(false);
      return;
    }

    setLoadingFeedbacks(true);
    setFeedbackError(null);

    const collectionPath = 'feedbacks';
    let q;

    try {
      if (isAdmin) {
        // Admin: View all user submissions
        q = query(collection(db, collectionPath), orderBy('createdAt', 'desc'));
      } else {
        // Regular user: ONLY view submissions where authorId === currentUser.uid
        q = query(
          collection(db, collectionPath),
          where('authorId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, collectionPath);
      return;
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: FeedbackItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push({
            id: docSnap.id,
            ...(docSnap.data() as Omit<FeedbackItem, 'id'>),
          });
        });
        setFeedbacks(items);
        setLoadingFeedbacks(false);
      },
      (error) => {
        setLoadingFeedbacks(false);
        setFeedbackError('データの取得中にエラーが発生しました。');
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      }
    );

    return () => unsubscribe();
  }, [currentUser, isAdmin]);

  // Handle Google Login
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Login error:', err);
      alert('ログインに失敗しました: ' + (err.message || String(err)));
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  // Handle Admin Zero-Trust Setup (Brute-force proof)
  const handleShowAdminInfo = () => {
    if (!currentUser) return;
    navigator.clipboard?.writeText(currentUser.uid);
    alert(
      `【Google UIDをクリップボードにコピーしました】\nUID: ${currentUser.uid}\n\n総当たり攻撃（ブルートフォース）を完全に防ぐため、Web画面からのパスコード設定は無効化されています。\n\n管理者モードを有効化する方法（いずれか1つ）：\n1. Firebaseコンソール（Firestore）の「admins」コレクションにこのUIDでドキュメントを追加する\n2. または非公開の .env ファイルに VITE_ADMIN_UID="${currentUser.uid}" を記述して再起動する`
    );
  };

  // Handle Submit Feedback
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert('ご意見を送信するにはログインが必要です。');
      return;
    }

    if (title.trim().length < 2 || title.trim().length > 100) {
      alert('件名は2文字以上100文字以内で入力してください。');
      return;
    }

    if (content.trim().length < 5 || content.trim().length > 2000) {
      alert('内容は5文字以上2000文字以内で入力してください。');
      return;
    }

    setSubmitting(true);
    const newDocId = 'fb_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    const docPath = `feedbacks/${newDocId}`;

    const newFeedbackPayload = {
      authorId: currentUser.uid,
      authorEmail: currentUser.email || 'anonymous@user.com',
      authorName: currentUser.displayName || 'ユーザー',
      authorPhotoUrl: currentUser.photoURL || '',
      title: title.trim(),
      content: content.trim(),
      category,
      targetModule,
      status: 'open',
      adminNote: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, 'feedbacks', newDocId), newFeedbackPayload);
      setTitle('');
      setContent('');
      setCategory('feature_request');
      setTargetModule('general');
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 6000);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, docPath);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Feedback
  const handleDelete = async (item: FeedbackItem) => {
    if (!currentUser) return;
    if (!window.confirm('この投稿を削除しますか？この操作は取り消せません。')) return;

    const docPath = `feedbacks/${item.id}`;
    try {
      await deleteDoc(doc(db, 'feedbacks', item.id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, docPath);
    }
  };

  // Handle Admin Status Update
  const handleUpdateStatus = async (item: FeedbackItem, newStatus: FeedbackItem['status']) => {
    if (!isAdmin) return;
    setUpdatingStatusId(item.id);
    const docPath = `feedbacks/${item.id}`;

    try {
      await updateDoc(doc(db, 'feedbacks', item.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, docPath);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Handle Admin Note Save
  const handleSaveAdminNote = async (item: FeedbackItem) => {
    if (!isAdmin) return;
    const docPath = `feedbacks/${item.id}`;

    try {
      await updateDoc(doc(db, 'feedbacks', item.id), {
        adminNote: adminNoteInput.trim(),
        updatedAt: serverTimestamp(),
      });
      setEditingAdminNoteId(null);
      setAdminNoteInput('');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, docPath);
    }
  };

  // Filtered feedbacks
  const filteredFeedbacks = feedbacks.filter((fb) => {
    if (statusFilter !== 'all' && fb.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && fb.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1. Header Banner & Security Guarantee */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                ユーザーの声・プライベートご意見箱
              </h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                厳格アクセス制御
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
              本ツールに関する機能のご要望・不具合報告・使い勝手の感想をお寄せください。
              <strong className="text-slate-800">
                送信した内容は投稿者本人とサイト管理者（運営者）のみが閲覧でき
              </strong>
              、他の利用者に漏れることは一切ありません。
            </p>
          </div>

          {/* User Auth Card */}
          <div className="shrink-0 bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-3.5 flex items-center gap-3">
            {authLoading ? (
              <div className="text-xs text-slate-400">認証情報を確認中...</div>
            ) : currentUser ? (
              <div className="flex items-center gap-3">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Avatar'}
                    className="w-9 h-9 rounded-full border border-slate-200 object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                    {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-900 line-clamp-1 max-w-[140px]">
                      {currentUser.displayName || currentUser.email}
                    </span>
                    {isAdmin ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                        管理者
                      </span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                          一般
                        </span>
                        <button
                          type="button"
                          onClick={handleShowAdminInfo}
                          className="text-[10px] text-blue-600 hover:text-blue-800 underline font-medium"
                          title="管理者設定（UIDコピー）を表示"
                        >
                          (UID確認)
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-[11px] text-slate-500 hover:text-red-600 font-medium inline-flex items-center gap-1 mt-0.5"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>ログアウト</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-xs active:scale-98 transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Googleでログインして投稿</span>
              </button>
            )}
          </div>
        </div>

        {/* Security Rule Explanation Badge */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
            <Lock className="w-3.5 h-3.5 text-blue-600" />
            閲覧セキュリティ：
          </span>
          <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
            一般ユーザー：自分が投稿した声のみ表示・管理可能
          </span>
          <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
            管理者：すべての投稿を確認し、進捗状況や返信メモを更新可能
          </span>
        </div>
      </div>

      {/* Admin Special Analytics & Survey Dashboard */}
      {isAdmin && (
        <div className="bg-linear-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-700/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/60">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-amber-400 text-slate-900 flex items-center justify-center font-black">
                👑
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                  <span>サイト管理者専用ダッシュボード</span>
                  <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-bold">
                    管理者認証済
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  フィードバックの集計・試験機能の投票結果・アクセス解析の管理がここで行えます
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsAnalyticsGuideOpen(!isAnalyticsGuideOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-slate-200 border border-white/20 transition-all self-start sm:self-auto cursor-pointer"
            >
              <BarChart3 className="w-3.5 h-3.5 text-blue-300" />
              <span>アクセス解析（アナリティクス）確認ガイド</span>
              {isAnalyticsGuideOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* 3 Analytics Cards: Feedback Count, Safety Stock Votes, Optimal Pricing Votes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Card 1: User Voice Submissions */}
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-white/10 space-y-2">
              <span className="text-[11px] font-bold text-slate-300 block">
                💬 ユーザーの声（届いた意見）
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">{feedbacks.length}</span>
                <span className="text-xs text-slate-300">件</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-300 pt-1 border-t border-white/10">
                <span className="text-amber-300 font-semibold">
                  未対応: {feedbacks.filter((f) => f.status === 'open').length}
                </span>
                <span>•</span>
                <span className="text-emerald-300 font-semibold">
                  対応済: {feedbacks.filter((f) => f.status === 'resolved').length}
                </span>
              </div>
            </div>

            {/* Card 2: Safety Stock Votes */}
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-white/10 space-y-2">
              <span className="text-[11px] font-bold text-emerald-300 block">
                📦 安全在庫計算（試験公開投票）
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">
                  {safetyVotes.keep + safetyVotes.remove}
                </span>
                <span className="text-xs text-slate-300">票</span>
                {safetyVotes.keep + safetyVotes.remove > 0 && (
                  <span className="text-xs font-bold text-emerald-400">
                    （必要率 {Math.round((safetyVotes.keep / (safetyVotes.keep + safetyVotes.remove)) * 100)}%）
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[10px] pt-1 border-t border-white/10">
                <span className="text-emerald-300 font-semibold">
                  👍 必要: {safetyVotes.keep}票
                </span>
                <span>•</span>
                <span className="text-rose-300 font-semibold">
                  👎 不要: {safetyVotes.remove}票
                </span>
              </div>
            </div>

            {/* Card 3: Optimal Pricing Votes */}
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-white/10 space-y-2">
              <span className="text-[11px] font-bold text-indigo-300 block">
                🏷️ 適正価格判定（試験公開投票）
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">
                  {pricingVotes.keep + pricingVotes.remove}
                </span>
                <span className="text-xs text-slate-300">票</span>
                {pricingVotes.keep + pricingVotes.remove > 0 && (
                  <span className="text-xs font-bold text-indigo-300">
                    （必要率 {Math.round((pricingVotes.keep / (pricingVotes.keep + pricingVotes.remove)) * 100)}%）
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[10px] pt-1 border-t border-white/10">
                <span className="text-emerald-300 font-semibold">
                  👍 必要: {pricingVotes.keep}票
                </span>
                <span>•</span>
                <span className="text-rose-300 font-semibold">
                  👎 不要: {pricingVotes.remove}票
                </span>
              </div>
            </div>
          </div>

          {/* Expandable Analytics Guide */}
          {isAnalyticsGuideOpen && (
            <div className="bg-slate-950/70 border border-slate-700 rounded-xl p-4 text-xs text-slate-300 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-white text-sm">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <span>アクセス解析・閲覧者数（アナリティクス）を確認する方法</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300 text-xs">
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1.5">
                  <strong className="text-white block font-bold text-xs flex items-center gap-1.5">
                    <span>1. Google Analytics 4 (GA4) で本格解析</span>
                  </strong>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    無料のGoogle Analyticsで「測定ID（G-XXXXXXXXXX）」を発行し設定すると、日々の訪問者数、ページビュー数、滞在時間、アクセス地域がリアルタイムで閲覧できます。
                  </p>
                </div>
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1.5">
                  <strong className="text-white block font-bold text-xs flex items-center gap-1.5">
                    <span>2. Firebase Console (生データ直接確認)</span>
                  </strong>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Firestoreデータベースに届いた生データ（feedbacks, surveys）は、GoogleアカウントでログインしたFirebaseコンソールからも閲覧・一括削除が可能です。
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Main Content Grid: New Submission Form + Submission List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Submission Form (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm">新しい声を投稿する</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">ログイン必須</span>
          </div>

          {!currentUser ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1.5">
                投稿にはログインが必要です
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Googleログインを行ってから投稿してください。
              </p>
              <button
                onClick={handleLogin}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Googleでログインする</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {submitSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    ご意見を送信しました！あなたと管理者のみに安全に保管されています。
                  </span>
                </div>
              )}

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  カテゴリ種別
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {(Object.keys(CATEGORY_MAP) as FeedbackItem['category'][]).map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all text-left ${
                        category === cat
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {CATEGORY_MAP[cat].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Module */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  対象の機能・モジュール
                </label>
                <select
                  value={targetModule}
                  onChange={(e) => setTargetModule(e.target.value as FeedbackItem['targetModule'])}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="general">全体・その他（使い勝手や要望全般）</option>
                  <option value="scm">施策効果測定 (因果推論・合成コントロール法)</option>
                  <option value="safety_stock">安全在庫計算 (需要変動・リードタイム)</option>
                  <option value="optimal_pricing">適正価格判定 (価格弾力性・利益最大化)</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700">件名・見出し</label>
                  <span className="text-[11px] text-slate-400">{title.length}/100文字</span>
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例：安全在庫計算で欠品コストも考慮できるようにしてほしい"
                  maxLength={100}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>

              {/* Content */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700">詳細なご意見・内容</label>
                  <span className="text-[11px] text-slate-400">{content.length}/2000文字</span>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  placeholder="具体的な状況、欲しい機能、操作中に気になった点などをご自由にお書きください。"
                  maxLength={2000}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"
                  required
                />
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-500 flex items-start gap-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  送信者（{currentUser.displayName || currentUser.email}）と管理者のみに暗号化保存されます。
                </span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm active:scale-98 transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <span>送信中...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>ご意見を非公開で送信する</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Submission History & Admin Review (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {isAdmin ? '全ユーザーの投稿一覧（管理者モード）' : 'あなたの投稿履歴'}
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {filteredFeedbacks.length}件
                </span>
              </div>

              {/* Status & Category Filters */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-medium text-slate-700"
                >
                  <option value="all">全ステータス</option>
                  <option value="open">受付完了</option>
                  <option value="in_review">確認中</option>
                  <option value="resolved">対応完了</option>
                  <option value="archived">アーカイブ</option>
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-medium text-slate-700"
                >
                  <option value="all">全カテゴリ</option>
                  <option value="feature_request">機能追加</option>
                  <option value="bug_report">不具合</option>
                  <option value="praise">感想</option>
                  <option value="question">質問</option>
                  <option value="other">その他</option>
                </select>
              </div>
            </div>

            {/* List State */}
            {!currentUser ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                ログインすると過去に送信した投稿のステータスや管理者からの返信を確認できます。
              </div>
            ) : loadingFeedbacks ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                投稿データを読み込み中...
              </div>
            ) : filteredFeedbacks.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <MessageCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-700 text-xs mb-1">
                  表示できる投稿はありません
                </p>
                <p className="text-[11px] text-slate-500">
                  左のフォームから最初のご意見・ご要望をお寄せください。
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredFeedbacks.map((item) => {
                  const catMeta = CATEGORY_MAP[item.category] || CATEGORY_MAP.other;
                  const statMeta = STATUS_MAP[item.status] || STATUS_MAP.open;
                  const isAuthor = currentUser?.uid === item.authorId;
                  const dateStr = item.createdAt?.toDate
                    ? item.createdAt.toDate().toLocaleString('ja-JP', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '送信直後';

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white transition-all space-y-2.5 shadow-2xs"
                    >
                      {/* Top Row: Category, Module, Status & Delete */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catMeta.color}`}
                          >
                            {catMeta.label}
                          </span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            {MODULE_MAP[item.targetModule]}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statMeta.color}`}
                          >
                            {statMeta.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {dateStr}
                          </span>
                          {(isAuthor || isAdmin) && (
                            <button
                              onClick={() => handleDelete(item)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                              title="この投稿を削除"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>

                      {/* Content */}
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {item.content}
                      </p>

                      {/* Author Info (visible to Admin) */}
                      {isAdmin && (
                        <div className="text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg flex items-center justify-between">
                          <span>
                            投稿者: <strong>{item.authorName}</strong> ({item.authorEmail})
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            UID: {item.authorId.substring(0, 8)}...
                          </span>
                        </div>
                      )}

                      {/* Admin Note / Response Box */}
                      {item.adminNote && (
                        <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3 text-xs space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-blue-900 text-[11px]">
                            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                            <span>管理者からの返信・進捗状況</span>
                          </div>
                          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {item.adminNote}
                          </p>
                        </div>
                      )}

                      {/* Admin Controls (Update Status & Admin Note) */}
                      {isAdmin && (
                        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="text-slate-500 font-medium">ステータス変更:</span>
                              {(['open', 'in_review', 'resolved', 'archived'] as FeedbackItem['status'][]).map(
                                (st) => (
                                  <button
                                    key={st}
                                    onClick={() => handleUpdateStatus(item, st)}
                                    disabled={updatingStatusId === item.id}
                                    className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-all ${
                                      item.status === st
                                        ? 'bg-slate-800 text-white border-slate-800'
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                    }`}
                                  >
                                    {STATUS_MAP[st].label}
                                  </button>
                                )
                              )}
                            </div>

                            <button
                              onClick={() => {
                                setEditingAdminNoteId(
                                  editingAdminNoteId === item.id ? null : item.id
                                );
                                setAdminNoteInput(item.adminNote || '');
                              }}
                              className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>{item.adminNote ? '返信メモを編集' : '返信メモを追加'}</span>
                            </button>
                          </div>

                          {/* Editing Admin Note Form */}
                          {editingAdminNoteId === item.id && (
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2 animate-in fade-in">
                              <label className="block text-[11px] font-bold text-slate-700">
                                ユーザーに表示される管理者返信・対応メモ
                              </label>
                              <textarea
                                value={adminNoteInput}
                                onChange={(e) => setAdminNoteInput(e.target.value)}
                                rows={3}
                                maxLength={1000}
                                placeholder="例：ご要望ありがとうございます。次回アップデート（v1.2）にて対応予定です。"
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-800"
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingAdminNoteId(null)}
                                  className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-800"
                                >
                                  キャンセル
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveAdminNote(item)}
                                  className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700"
                                >
                                  返信を保存
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
