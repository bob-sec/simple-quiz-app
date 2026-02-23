import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api/quiz";
import { useQuiz } from "../context/QuizContext";

export default function RegisterPage() {
  const { userId, setUserName, quizInfo } = useQuiz();
  const [inputName, setInputName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = inputName.trim();
    if (!name) {
      setError("名前を入力してください");
      return;
    }
    if (name.length > 20) {
      setError("名前は20文字以内で入力してください");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      await registerUser(userId, name);
      setUserName(name);
      navigate("/quiz", { replace: true });
    } catch {
      setError("登録に失敗しました。もう一度お試しください。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
      {/* Background decoration */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-3xl opacity-10 bg-[var(--color-primary)] pointer-events-none" />

      <div className="w-full max-w-sm animate-slide-up">
        {/* Back button */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted hover:text-white transition-colors mb-8"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">戻る</span>
        </button>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-xl">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black mb-1">参加者登録</h1>
          <p className="text-muted text-sm">
            {quizInfo?.title ?? "クイズ"} に参加します
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted mb-2">
              お名前
            </label>
            <input
              type="text"
              value={inputName}
              onChange={(e) => {
                setInputName(e.target.value);
                setError("");
              }}
              placeholder="名前を入力してください"
              maxLength={20}
              autoFocus
              className={[
                "w-full px-4 py-4 rounded-xl bg-card border text-white",
                "placeholder:text-muted focus:outline-none transition-colors",
                "text-lg font-medium",
                error
                  ? "border-red-500 focus:border-red-400"
                  : "border-border focus:border-[var(--color-primary)]",
              ].join(" ")}
            />
            {error && (
              <p className="mt-2 text-sm text-red-400">{error}</p>
            )}
            <p className="mt-1 text-xs text-muted text-right">
              {inputName.length}/20
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || !inputName.trim()}
            className="w-full py-4 rounded-xl gradient-primary text-white text-lg font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xl mt-6"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                登録中...
              </span>
            ) : (
              "参加する"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
