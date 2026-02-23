import { useCallback, useEffect, useRef, useState } from "react";
import {
  adminGetResults,
  adminGotoQuestion,
  adminLogin,
  adminNextQuestion,
  adminPauseQuiz,
  adminPrevQuestion,
  adminResetQuiz,
  adminResumeQuiz,
  adminStartQuiz,
} from "../api/quiz";
import LoadingSpinner from "../components/LoadingSpinner";
import { useQuiz } from "../context/QuizContext";
import type { AdminResults } from "../types";

const ADMIN_TOKEN_KEY = "quiz_admin_token";

// ─────────────────────────────────────────────────────────────
//  Main Admin Page
// ─────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem(ADMIN_TOKEN_KEY)
  );

  const handleLogin = (t: string) => {
    localStorage.setItem(ADMIN_TOKEN_KEY, t);
    setToken(t);
  };

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setToken(null);
  };

  if (!token) return <LoginScreen onLogin={handleLogin} />;
  return <AdminDashboard token={token} onLogout={handleLogout} />;
}

// ─────────────────────────────────────────────────────────────
//  Login Screen
// ─────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await adminLogin(password);
      onLogin(res.token);
    } catch {
      setError("パスワードが正しくありません");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-3xl opacity-10 bg-[var(--color-primary)] pointer-events-none" />
      <div className="w-full max-w-sm animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black">管理者ログイン</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            placeholder="パスワードを入力"
            autoFocus
            className={[
              "w-full px-4 py-4 rounded-xl bg-card border text-white placeholder:text-muted",
              "focus:outline-none transition-colors text-lg",
              error ? "border-red-500" : "border-border focus:border-[var(--color-primary)]",
            ].join(" ")}
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={isLoading || !password}
            className="w-full py-4 rounded-xl gradient-primary text-white text-lg font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-40"
          >
            {isLoading ? "ログイン中..." : "ログイン"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-muted hover:text-white transition-colors">
            ← トップに戻る
          </a>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Dashboard
// ─────────────────────────────────────────────────────────────

function AdminDashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const { quizStatus, quizInfo } = useQuiz();
  const [results, setResults] = useState<AdminResults | null>(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchResults = useCallback(async () => {
    setLoadingResults(true);
    try {
      const data = await adminGetResults(token);
      setResults(data);
      setError("");
    } catch (e: unknown) {
      if (
        typeof e === "object" && e !== null && "response" in e &&
        (e as { response?: { status?: number } }).response?.status === 401
      ) {
        onLogout();
      } else {
        setError("結果の取得に失敗しました");
      }
    } finally {
      setLoadingResults(false);
    }
  }, [token, onLogout]);

  // Poll results every 3 seconds
  useEffect(() => {
    fetchResults();
    pollRef.current = setInterval(fetchResults, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchResults]);

  const doAction = async (
    label: string,
    fn: () => Promise<unknown>
  ) => {
    setActionLoading(label);
    setError("");
    try {
      await fn();
    } catch {
      setError(`操作に失敗しました: ${label}`);
    } finally {
      setActionLoading(null);
    }
  };

  const status = quizStatus.status;
  const currentQ = quizStatus.current_question;
  const total = quizInfo?.total_questions ?? 0;
  const isActive = status === "active";
  const isPaused = status === "paused";
  const isWaiting = status === "waiting";
  const isFinished = status === "finished";
  const isRunning = isActive || isPaused;

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="px-4 py-4 border-b border-border flex items-center justify-between sticky top-0 z-10 bg-[#080C14]/90 backdrop-blur-md">
        <div>
          <h1 className="font-black text-lg">管理者パネル</h1>
          {quizInfo && <p className="text-xs text-muted">{quizInfo.title}</p>}
        </div>
        <button
          onClick={onLogout}
          className="text-xs text-muted hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-border hover:border-white/30"
        >
          ログアウト
        </button>
      </header>

      <div className="flex-1 px-4 py-5 space-y-5 pb-10">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Quiz Status */}
        <StatusCard status={status} currentQ={currentQ} total={total} />

        {/* Controls */}
        <div className="glass rounded-2xl p-4">
          <h2 className="text-sm font-bold text-muted mb-3">クイズ操作</h2>

          {/* Start */}
          {isWaiting && (
            <button
              onClick={() => doAction("start", () => adminStartQuiz(token))}
              disabled={actionLoading !== null}
              className="w-full py-4 rounded-xl gradient-primary text-white font-bold text-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
            >
              {actionLoading === "start" ? <BtnSpinner /> : "▶ クイズ開始"}
            </button>
          )}

          {/* Running controls */}
          {isRunning && (
            <div className="space-y-3">
              {/* Pause / Resume */}
              <div className="flex gap-3">
                {isActive ? (
                  <button
                    onClick={() => doAction("pause", () => adminPauseQuiz(token))}
                    disabled={actionLoading !== null}
                    className="flex-1 py-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold hover:bg-amber-500/30 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === "pause" ? <BtnSpinner /> : "⏸ 一時停止"}
                  </button>
                ) : (
                  <button
                    onClick={() => doAction("resume", () => adminResumeQuiz(token))}
                    disabled={actionLoading !== null}
                    className="flex-1 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === "resume" ? <BtnSpinner /> : "▶ 再開"}
                  </button>
                )}
              </div>

              {/* Prev / Next */}
              <div className="flex gap-3">
                <button
                  onClick={() => doAction("prev", () => adminPrevQuestion(token))}
                  disabled={actionLoading !== null || currentQ === 0}
                  className="flex-1 py-3 rounded-xl bg-card border border-border text-white font-bold hover:border-white/30 transition-colors disabled:opacity-30"
                >
                  {actionLoading === "prev" ? <BtnSpinner /> : "← 前の問題"}
                </button>
                <button
                  onClick={() => doAction("next", () => adminNextQuestion(token))}
                  disabled={actionLoading !== null}
                  className="flex-1 py-3 rounded-xl gradient-primary text-white font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                >
                  {actionLoading === "next" ? (
                    <BtnSpinner />
                  ) : currentQ !== null && currentQ + 1 >= total ? (
                    "終了 →"
                  ) : (
                    "次の問題 →"
                  )}
                </button>
              </div>

              {/* Jump to question */}
              {total > 1 && (
                <div>
                  <p className="text-xs text-muted mb-2">問題へジャンプ</p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: total }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => doAction(`goto_${i}`, () => adminGotoQuestion(token, i))}
                        disabled={actionLoading !== null}
                        className={[
                          "w-10 h-10 rounded-lg text-sm font-bold transition-colors disabled:opacity-50",
                          currentQ === i
                            ? "gradient-primary text-white"
                            : "bg-card border border-border text-muted hover:border-white/30 hover:text-white",
                        ].join(" ")}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Finished state */}
          {isFinished && (
            <div className="text-center py-2">
              <p className="text-emerald-400 font-bold mb-3">クイズが終了しました</p>
            </div>
          )}

          {/* Reset */}
          {!isWaiting && (
            <ResetButton
              onReset={() => doAction("reset", () => adminResetQuiz(token))}
              isLoading={actionLoading === "reset"}
              disabled={actionLoading !== null}
            />
          )}
        </div>

        {/* Leaderboard */}
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-muted">参加者一覧</h2>
            <div className="flex items-center gap-2">
              {loadingResults && <LoadingSpinner size="sm" />}
              <span className="text-xs text-muted">
                {results?.participants.length ?? 0} 人
              </span>
            </div>
          </div>

          {results && results.participants.length > 0 ? (
            <Leaderboard results={results} />
          ) : (
            <p className="text-center text-muted text-sm py-6">
              まだ参加者がいません
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Sub-components
// ─────────────────────────────────────────────────────────────

function StatusCard({
  status,
  currentQ,
  total,
}: {
  status: string;
  currentQ: number | null;
  total: number;
}) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    waiting: { label: "待機中", color: "text-muted", bg: "bg-white/5" },
    active: { label: "回答受付中", color: "text-emerald-400", bg: "bg-emerald-500/10" },
    paused: { label: "一時停止中", color: "text-amber-400", bg: "bg-amber-500/10" },
    finished: { label: "終了", color: "text-[var(--color-primary-light)]", bg: "bg-[var(--color-primary)]/10" },
  };
  const c = config[status] ?? config.waiting;

  return (
    <div className={`rounded-2xl p-4 border border-white/5 ${c.bg}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted mb-1">クイズ状態</p>
          <p className={`text-xl font-black ${c.color}`}>{c.label}</p>
        </div>
        {currentQ !== null && total > 0 && (
          <div className="text-right">
            <p className="text-xs text-muted mb-1">現在の問題</p>
            <p className="text-2xl font-black">
              <span className={c.color}>{currentQ + 1}</span>
              <span className="text-muted text-base"> / {total}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ResetButton({
  onReset,
  isLoading,
  disabled,
}: {
  onReset: () => void;
  isLoading: boolean;
  disabled: boolean;
}) {
  const [confirm, setConfirm] = useState(false);

  if (confirm) {
    return (
      <div className="mt-3 glass rounded-xl p-3 border border-red-500/30">
        <p className="text-sm text-center text-red-400 mb-3">
          全回答データがリセットされます。本当によろしいですか？
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setConfirm(false)}
            className="flex-1 py-2 rounded-lg border border-border text-muted text-sm hover:text-white transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={() => { setConfirm(false); onReset(); }}
            disabled={disabled}
            className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? <BtnSpinner /> : "リセット実行"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      disabled={disabled}
      className="w-full mt-3 py-2 rounded-xl border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition-colors disabled:opacity-30"
    >
      リセット
    </button>
  );
}

function Leaderboard({ results }: { results: AdminResults }) {
  const { participants, total_questions, questions } = results;

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full text-sm min-w-max">
        <thead>
          <tr className="border-b border-border">
            <th className="py-2 pr-2 text-left text-xs text-muted font-medium sticky left-0 bg-transparent">
              #
            </th>
            <th className="py-2 pr-4 text-left text-xs text-muted font-medium sticky left-6 bg-transparent min-w-[80px]">
              名前
            </th>
            {questions.map((q) => (
              <th
                key={q.id}
                className="py-2 px-2 text-center text-xs text-muted font-medium"
                title={q.title}
              >
                Q{q.id + 1}
              </th>
            ))}
            <th className="py-2 pl-2 text-center text-xs text-muted font-medium">
              正解
            </th>
          </tr>
        </thead>
        <tbody>
          {participants.map((p, idx) => (
            <tr
              key={p.user_id}
              className={[
                "border-b border-border/50 last:border-0",
                idx === 0 ? "bg-yellow-500/5" : "",
              ].join(" ")}
            >
              {/* Rank */}
              <td className="py-2 pr-2 sticky left-0">
                <RankBadge rank={idx + 1} />
              </td>
              {/* Name */}
              <td className="py-2 pr-4 font-medium text-white max-w-[100px] truncate sticky left-6">
                {p.name}
              </td>
              {/* Answers per question */}
              {questions.map((q) => {
                const ans = p.answers[String(q.id)];
                return (
                  <td key={q.id} className="py-2 px-2 text-center">
                    {ans ? (
                      <span
                        className={`inline-flex w-6 h-6 rounded-full items-center justify-center text-xs font-bold ${
                          ans.is_correct
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {ans.is_correct ? "○" : "✗"}
                      </span>
                    ) : (
                      <span className="text-white/15">—</span>
                    )}
                  </td>
                );
              })}
              {/* Total */}
              <td className="py-2 pl-2 text-center">
                <span
                  className={`font-black ${
                    p.correct_count === total_questions
                      ? "text-yellow-400"
                      : p.correct_count > total_questions / 2
                      ? "text-emerald-400"
                      : "text-white"
                  }`}
                >
                  {p.correct_count}
                  <span className="text-muted font-normal text-xs">
                    /{total_questions}
                  </span>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return <span className="text-yellow-400 font-black text-base">🥇</span>;
  if (rank === 2)
    return <span className="text-gray-300 font-black text-base">🥈</span>;
  if (rank === 3)
    return <span className="text-amber-600 font-black text-base">🥉</span>;
  return <span className="text-muted text-xs font-medium">{rank}</span>;
}

function BtnSpinner() {
  return (
    <span className="flex items-center justify-center">
      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
    </span>
  );
}
