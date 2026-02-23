import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyResults } from "../api/quiz";
import LoadingSpinner from "../components/LoadingSpinner";
import { useQuiz } from "../context/QuizContext";
import type { MyResults } from "../types";

export default function FinishedPage() {
  const { userId, userName, quizInfo } = useQuiz();
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

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const correct = results?.correct_count ?? 0;
  const total = results?.total_questions ?? quizInfo?.total_questions ?? 0;

  // Build full question list: use API-returned list if available,
  // otherwise fall back to numbered placeholders
  const questionList =
    results?.questions ??
    Array.from({ length: total }, (_, i) => ({ id: i, title: `問題 ${i + 1}` }));

  return (
    <div className="flex-1 flex flex-col px-4 py-8 max-w-lg mx-auto w-full">
      {/* Background decoration */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-10 bg-[var(--color-primary)] pointer-events-none" />

      <div className="animate-slide-up">
        {/* Result header */}
        <div className="text-center mb-8">
          {/* Icon — larger, supports custom image */}
          <div className="w-36 h-36 rounded-3xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-2xl overflow-hidden">
            {quizInfo?.finished_image ? (
              <img
                src={quizInfo.finished_image}
                alt="finished"
                className="w-full h-full object-contain"
              />
            ) : (
              <svg
                className="w-20 h-20 text-white"
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
            )}
          </div>

          <h1 className="text-3xl font-black mb-1">クイズ終了！</h1>
          <p className="text-muted text-sm">{quizInfo?.title}</p>
        </div>

        {/* Score card */}
        <div className="glass rounded-2xl p-6 mb-6 text-center">
          <p className="text-muted text-sm mb-4">{userName} さんのスコア</p>
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-6xl font-black text-[var(--color-primary-light)]">
              {correct}
            </span>
            <span className="text-2xl text-muted font-medium">/ {total} 問</span>
          </div>
          <p className="text-muted text-sm mt-2">正解</p>
        </div>

        {/* Per-question breakdown — all questions shown, including unanswered */}
        {questionList.length > 0 && (
          <div className="glass rounded-2xl p-4">
            <h3 className="text-sm font-bold text-muted mb-3">問題別結果</h3>
            <div className="space-y-0">
              {questionList.map((q) => {
                const ans = results?.answers[String(q.id)];
                const answered = ans !== undefined;
                return (
                  <div
                    key={q.id}
                    className="flex items-center gap-3 py-2.5 border-b border-border last:border-0"
                  >
                    {/* Result badge */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        !answered
                          ? "bg-white/10 text-muted"
                          : ans.is_correct
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {!answered ? "—" : ans.is_correct ? "○" : "✗"}
                    </div>

                    {/* Question info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{q.title}</p>
                      <p className="text-xs text-muted">
                        {!answered ? (
                          <span className="text-white/30">未回答</span>
                        ) : (
                          <>
                            あなたの回答:{" "}
                            <span
                              className={
                                ans.is_correct
                                  ? "text-emerald-400"
                                  : "text-red-400"
                              }
                            >
                              {ans.choice_id}
                            </span>
                            {!ans.is_correct && ans.correct_answer && (
                              <span> → 正解: {ans.correct_answer}</span>
                            )}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
