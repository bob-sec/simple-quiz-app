import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyResults } from "../api/quiz";
import LoadingSpinner from "../components/LoadingSpinner";
import { useQuiz } from "../context/QuizContext";
import type { MyResults } from "../types";

export default function FinishedPage() {
  const { userId, userName, quizInfo, quizStatus } = useQuiz();
  const navigate = useNavigate();
  const [results, setResults] = useState<MyResults | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userName) {
      navigate("/", { replace: true });
      return;
    }
    getMyResults(userId)
      .then(setResults)
      .finally(() => setLoading(false));
  }, [userId, userName, navigate]);

  // If quiz gets reset, go back to welcome
  useEffect(() => {
    if (quizStatus.status === "waiting") {
      navigate("/", { replace: true });
    }
  }, [quizStatus.status, navigate]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const correct = results?.correct_count ?? 0;
  const total = results?.total_questions ?? quizInfo?.total_questions ?? 0;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

  const grade =
    percentage === 100
      ? { label: "パーフェクト！🎉", color: "text-yellow-400" }
      : percentage >= 80
      ? { label: "すごい！✨", color: "text-emerald-400" }
      : percentage >= 60
      ? { label: "よくできました！", color: "text-[var(--color-primary-light)]" }
      : percentage >= 40
      ? { label: "もう少し！", color: "text-amber-400" }
      : { label: "次回頑張ろう！", color: "text-muted" };

  return (
    <div className="flex-1 flex flex-col px-4 py-8 max-w-lg mx-auto w-full">
      {/* Background decoration */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-10 bg-[var(--color-primary)] pointer-events-none" />

      <div className="animate-slide-up">
        {/* Result header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 rounded-3xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-black mb-1">クイズ終了！</h1>
          <p className="text-muted text-sm">{quizInfo?.title}</p>
        </div>

        {/* Score card */}
        <div className="glass rounded-2xl p-6 mb-6 text-center">
          <p className="text-muted text-sm mb-3">
            {userName} さんのスコア
          </p>

          {/* Circular score */}
          <div className="relative w-36 h-36 mx-auto mb-4">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - percentage / 100)}`}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black">{correct}</span>
              <span className="text-muted text-xs">/ {total} 問</span>
            </div>
          </div>

          <p className={`text-2xl font-black mb-1 ${grade.color}`}>
            {grade.label}
          </p>
          <p className="text-muted text-sm">正解率 {percentage}%</p>
        </div>

        {/* Per-question breakdown */}
        {results && Object.keys(results.answers).length > 0 && (
          <div className="glass rounded-2xl p-4 mb-6">
            <h3 className="text-sm font-bold text-muted mb-3">問題別結果</h3>
            <div className="space-y-2">
              {Object.entries(results.answers)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([qId, ans]) => (
                  <div
                    key={qId}
                    className="flex items-center gap-3 py-2 border-b border-border last:border-0"
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        ans.is_correct
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {ans.is_correct ? "○" : "✗"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {ans.question_title || `問題 ${Number(qId) + 1}`}
                      </p>
                      <p className="text-xs text-muted">
                        あなたの回答:{" "}
                        <span
                          className={
                            ans.is_correct ? "text-emerald-400" : "text-red-400"
                          }
                        >
                          {ans.choice_id}
                        </span>
                        {!ans.is_correct && ans.correct_answer && (
                          <span className="text-muted">
                            {" "}
                            → 正解: {ans.correct_answer}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        <button
          onClick={() => navigate("/")}
          className="w-full py-4 rounded-xl border border-border text-muted hover:border-white/30 hover:text-white transition-colors font-medium"
        >
          トップに戻る
        </button>
      </div>
    </div>
  );
}
