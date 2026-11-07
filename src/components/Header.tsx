import React, { useState, useEffect, useRef } from 'react';
import {
  HelpCircle,
  Layers,
  Download,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Boxes,
  Tag,
  EyeOff,
  MessageSquare,
  Lock,
  LogIn,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleProvider, ADMIN_EMAIL, ADMIN_UID } from '../firebase/config';

export type AppTab = 'scm' | 'safety_stock' | 'optimal_pricing' | 'user_voice';

interface HeaderProps {
  onOpenTutorial: () => void;
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onExportReport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenTutorial,
  activeTab,
  onTabChange,
  onExportReport,
}) => {
  // State for scroll-based auto-hide and manual collapse
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [autoHideOnScroll, setAutoHideOnScroll] = useState(true);
  const lastScrollYRef = useRef(0);

  // User auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setCurrentUser(u);
    });
    return () => unsub();
  }, []);

  const isAdmin = Boolean(
    (ADMIN_EMAIL && currentUser?.email === ADMIN_EMAIL && currentUser?.emailVerified === true) ||
    (ADMIN_UID && currentUser?.uid === ADMIN_UID)
  );

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Login error:', err);
      alert('ログインに失敗しました: ' + (err.message || String(err)));
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  // Detect downward scroll to tuck header away, and upward scroll to reveal
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY;
          const diff = currentY - lastScrollYRef.current;

          // When scrolled past top (60px) and scrolling downward
          if (autoHideOnScroll) {
            if (currentY > 70 && diff > 8) {
              setIsScrolledDown(true);
            } else if (diff < -6 || currentY < 30) {
              // Scrolling upward or back to top
              setIsScrolledDown(false);
            }
          }

          lastScrollYRef.current = currentY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [autoHideOnScroll]);

  const isHidden = autoHideOnScroll && isScrolledDown;

  return (
    <>
      {/* Floating reveal pill when header is tucked away / hidden during scroll */}
      {isHidden && (
        <div className="fixed top-2.5 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <button
            onClick={() => {
              setIsScrolledDown(false);
              setIsCollapsed(false);
            }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-white/95 backdrop-blur-md text-slate-800 border border-slate-300 shadow-lg hover:bg-slate-50 hover:text-blue-600 hover:border-blue-400 active:scale-95 transition-all group"
            title="ヘッダーを展開してメニューや設定を表示します"
          >
            <span className="w-2 h-2 rounded-full bg-blue-600 group-hover:scale-125 transition-transform" />
            <span className="font-extrabold text-blue-700">サイト名はけんとうちゅうです</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600 font-medium">
              {activeTab === 'scm' && '因果推論・施策効果測定'}
              {activeTab === 'safety_stock' && '安全在庫計算'}
              {activeTab === 'optimal_pricing' && '適正価格判定'}
              {activeTab === 'user_voice' && 'ユーザーの声・ご意見箱'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-blue-600 group-hover:translate-y-0.5 transition-transform" />
            <span className="text-[11px] text-blue-600 font-bold ml-0.5 bg-blue-50 px-1.5 py-0.5 rounded">
              ヘッダーを表示
            </span>
          </button>
        </div>
      )}

      {/* Main Header Container with smooth slide transition */}
      <header
        className={`border-b border-slate-200 bg-white sticky top-0 z-40 shadow-xs transition-transform duration-300 ease-in-out ${
          isHidden ? '-translate-y-full pointer-events-none' : 'translate-y-0 pointer-events-auto'
        }`}
      >
        {/* AI Implementation Transparency Notice Banner (hidden in compact mode) */}
        {!isCollapsed && (
          <div className="bg-amber-50/90 border-b border-amber-200/80 px-4 py-1.5 text-center text-[11px] text-amber-900 flex items-center justify-center gap-1.5 flex-wrap">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="font-bold">生成AI構築ツールに関する明記：</span>
            <span>
              本ツールの数理ロジック・解説は生成AI（Gemini）を活用して作成されており、統計学専門家による個別監修は経ていません。実務の意思決定における参考指標としてご活用ください。
            </span>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top bar: Brand & Actions (collapsible for compact mode) */}
          {!isCollapsed ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2.5 sm:py-3 gap-2.5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm sm:text-base shadow-sm shadow-blue-500/30 shrink-0">
                  検
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                      サイト名はけんとうちゅうです
                    </h1>
                    <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      因果推論・合成コントロール法
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 hidden md:inline-flex">
                      完全0円運用・統計最適化
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>完全ローカル計算・外部送信なし（機密保持）</span>
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 hidden xs:block">
                    A/Bテストができない店舗・地域・チャネル・自治体施策の「真の純増効果」を特定
                  </p>
                </div>
              </div>

              {/* Action buttons & collapse toggle */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto flex-wrap">
                {/* User Auth pill in Header */}
                {currentUser ? (
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                    {currentUser.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt="User"
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                        {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <span className="text-slate-800 font-medium max-w-[100px] truncate hidden md:inline">
                      {currentUser.displayName || currentUser.email}
                    </span>
                    {isAdmin && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                        管理者
                      </span>
                    )}
                    <button
                      onClick={handleLogout}
                      className="text-slate-400 hover:text-rose-600 ml-1"
                      title="ログアウト"
                    >
                      <LogOut className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleLogin}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 active:scale-98 transition-all shadow-2xs"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>ログイン</span>
                  </button>
                )}

                {/* Auto-hide indicator/toggle pill */}
                <button
                  onClick={() => setAutoHideOnScroll(!autoHideOnScroll)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    autoHideOnScroll
                      ? 'bg-blue-50/70 border-blue-200 text-blue-700'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700'
                  }`}
                  title="下にスクロールした時にヘッダーを自動でしまって画面を広く使います"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">
                    {autoHideOnScroll ? 'スクロール自動格納: ON' : 'スクロール自動格納: OFF'}
                  </span>
                  <span className="lg:hidden">自動格納</span>
                </button>

                {/* Compact/Collapse toggle button */}
                <button
                  onClick={() => setIsCollapsed(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 active:scale-98 transition-all"
                  title="ヘッダーを折りたたんでグラフの表示領域を最大化します"
                >
                  <ChevronUp className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden sm:inline">画面を広く使う (折りたたむ)</span>
                  <span className="sm:hidden">折りたたむ</span>
                </button>

                <button
                  onClick={onOpenTutorial}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 active:scale-98 transition-all"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                  <span>使い方ガイド</span>
                </button>

                {activeTab === 'scm' && (
                  <button
                    onClick={onExportReport}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 active:scale-98 transition-all"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>結果CSV</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Ultra-Compact Bar when manually collapsed */
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-linear-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  検
                </div>
                <span className="font-extrabold text-sm text-slate-900">サイト名はけんとうちゅうです</span>
                <span className="text-xs text-slate-400 hidden sm:inline">|</span>
                <span className="text-xs text-slate-600 font-medium hidden sm:inline">
                  {activeTab === 'scm' && '因果推論・施策効果測定'}
                  {activeTab === 'safety_stock' && '安全在庫計算'}
                  {activeTab === 'optimal_pricing' && '適正価格判定'}
                  {activeTab === 'user_voice' && 'ユーザーの声・ご意見箱'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCollapsed(false)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-all"
                >
                  <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
                  <span>ヘッダーを展開</span>
                </button>

                {currentUser ? (
                  <button
                    onClick={handleLogout}
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-600 transition-colors"
                    title="ログアウト"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleLogin}
                    className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                    title="ログイン"
                  >
                    <LogIn className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={onOpenTutorial}
                  className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                  title="使い方ガイド"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Navigation Tabs (4 tabs: SCM, Safety Stock, Optimal Pricing, User Voice) */}
          <div className="flex items-center gap-1 overflow-x-auto text-xs sm:text-sm no-scrollbar py-1">
            <button
              onClick={() => onTabChange('scm')}
              className={`px-3 sm:px-4 py-2 font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'scm'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Layers className="w-4 h-4 text-blue-600" />
              <span>施策効果測定 (因果推論)</span>
            </button>

            <button
              onClick={() => onTabChange('safety_stock')}
              className={`px-3 sm:px-4 py-2 font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'safety_stock'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Boxes className="w-4 h-4 text-emerald-600" />
              <span>安全在庫計算 (在庫最適化)</span>
            </button>

            <button
              onClick={() => onTabChange('optimal_pricing')}
              className={`px-3 sm:px-4 py-2 font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'optimal_pricing'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Tag className="w-4 h-4 text-indigo-600" />
              <span>適正価格判定 (利益最大化)</span>
            </button>

            <button
              onClick={() => onTabChange('user_voice')}
              className={`px-3 sm:px-4 py-2 font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'user_voice'
                  ? 'border-purple-600 text-purple-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-purple-600" />
              <span>ユーザーの声 (ご意見箱)</span>
              <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                <Lock className="w-2.5 h-2.5" />
                非公開
              </span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
};
