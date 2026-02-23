import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import { useQuiz } from "../context/QuizContext";

export default function WelcomePage() {
  const { quizInfo, quizStatus, userName, isConnected } = useQuiz();
  const navigate = useNavigate();

  // If already registered and quiz is active, go to quiz
  useEffect(() => {
    if (userName && quizStatus.status !== "waiting") {
      navigate("/quiz", { replace: true });
    }
  }, [userName, quizStatus.status, navigate]);

  const handleStart = () => {
    if (userName) {
      navigate("/quiz");
    } else {
      navigate("/register");
    }
  };

  if (!quizInfo) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-10 bg-[var(--color-primary)] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-5 bg-[var(--color-primary-light)] pointer-events-none" />

      <div className="relative w-full max-w-sm animate-slide-up">
        {/* Logo / Icon — larger, supports custom image */}
        <div className="flex justify-center mb-8">
          <div className="w-40 h-40 rounded-3xl gradient-primary flex items-center justify-center shadow-2xl glow-primary animate-pulse-glow overflow-hidden">
            {quizInfo.welcome_image ? (
              <img
                src={quizInfo.welcome_image}
                alt="welcome"
                className="w-full h-full object-contain"
              />
            ) : (
              <svg
                className="w-20 h-20 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
                />
              </svg>
            )}
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-black text-center mb-2 leading-tight">
          {quizInfo.title}
        </h1>
        <p className="text-muted text-center mb-2 text-sm">
          全 {quizInfo.total_questions} 問
        </p>

        {/* Connection status */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <div
            className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`}
          />
          <span className="text-xs text-muted">
            {isConnected ? "サーバー接続中" : "接続中..."}
          </span>
        </div>

        {/* Greeting if returning user */}
        {userName && (
          <div className="glass rounded-xl px-4 py-3 mb-6 text-center">
            <span className="text-muted text-sm">おかえり、</span>
            <span className="font-bold text-[var(--color-primary-light)]">
              {userName}
            </span>
            <span className="text-muted text-sm"> さん</span>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleStart}
          className="w-full py-5 rounded-2xl gradient-primary text-white text-xl font-black hover:opacity-90 active:scale-95 transition-all shadow-2xl glow-primary"
        >
          {userName ? "クイズに参加する" : "クイズをはじめる"}
        </button>

        <p className="text-center text-xs text-muted mt-8">
          管理者の方は{" "}
          <a
            href="/admin"
            className="text-[var(--color-primary-light)] hover:underline"
          >
            こちら
          </a>
        </p>
      </div>
    </div>
  );
}
