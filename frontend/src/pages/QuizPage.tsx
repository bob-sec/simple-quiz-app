import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getQuestion, submitAnswer } from "../api/quiz";
import ChoiceCard from "../components/ChoiceCard";
import ConfirmDialog from "../components/ConfirmDialog";
import LoadingSpinner from "../components/LoadingSpinner";
import { useQuiz } from "../context/QuizContext";
import type { Question } from "../types";

export default function QuizPage() {
  const {
    quizStatus,
    userId,
    userName,
    quizInfo,
    answeredQuestions,
    markAnswered,
  } = useQuiz();
  const navigate = useNavigate();

  const [question, setQuestion] = useState<Question | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Guard: must be registered
  useEffect(() => {
    if (!userName) {
      navigate("/register", { replace: true });
    }
  }, [userName, navigate]);

  // Navigate on quiz finished
  useEffect(() => {
    if (quizStatus.status === "finished") {
      navigate("/finished", { replace: true });
    }
  }, [quizStatus.status, navigate]);

  // Load question whenever current_question changes
  const loadQuestion = useCallback(async () => {
    const qId = quizStatus.current_question;
    if (qId === null || qId === undefined) {
      setQuestion(null);
      return;
    }
    setLoadingQuestion(true);
    try {
      const q = await getQuestion(qId);
      setQuestion(q);
    } catch {
      setQuestion(null);
    } finally {
      setLoadingQuestion(false);
    }
  }, [quizStatus.current_question]);

  useEffect(() => {
    if (
      quizStatus.status === "active" ||
      quizStatus.status === "paused"
    ) {
      loadQuestion();
    }
  }, [quizStatus.status, quizStatus.current_question, loadQuestion]);

  const hasAnswered =
    question !== null && answeredQuestions.has(question.id);
  const isAccepting =
    question?.available && question.accepting_answers && !hasAnswered;

  const handleChoiceSelect = (choiceId: string) => {
    if (!isAccepting) return;
    setSelectedChoice(choiceId);
    setDialogOpen(true);
  };

  const handleConfirm = async () => {
    if (!selectedChoice || !question) return;
    setIsSubmitting(true);
    try {
      await submitAnswer(userId, question.id, selectedChoice);
      markAnswered(question.id);
      setDialogOpen(false);
      setSelectedChoice(null);
    } catch (err: unknown) {
      // Already answered on server but not locally tracked
      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        (err as { response?: { status?: number } }).response?.status === 409
      ) {
        markAnswered(question.id);
      }
      setDialogOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setDialogOpen(false);
    setSelectedChoice(null);
  };

  // ── Render states ──────────────────────────────────────────

  if (!userName) return null;

  // Waiting for quiz to start
  if (quizStatus.status === "waiting") {
    return <WaitingScreen quizInfo={quizInfo} />;
  }

  // Loading question
  if (loadingQuestion) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // No question available yet (between questions)
  if (!question || !question.available) {
    return <WaitingScreen quizInfo={quizInfo} message="次の問題をお待ちください..." />;
  }

  const selectedChoiceData = question.choices.find(
    (c) => c.id === selectedChoice
  );

  return (
    <div className="flex-1 flex flex-col min-h-dvh">
      {/* Header */}
      <div className="px-4 pt-safe-top pt-6 pb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted font-medium">{quizInfo?.title}</span>
          <span className="text-xs text-muted font-medium">
            {userName} さん
          </span>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold shrink-0 text-[var(--color-primary-light)]">
            {question.question_number}/{question.total_questions}
          </span>
          <div className="flex-1 h-2 bg-card rounded-full overflow-hidden">
            <div
              className="h-full rounded-full gradient-primary transition-all duration-500"
              style={{
                width: `${(question.question_number / question.total_questions) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="px-4 mb-5">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold gradient-primary text-white">
              {question.title}
            </span>
            {/* Status badge */}
            {quizStatus.status === "paused" && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                回答停止中
              </span>
            )}
            {hasAnswered && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                回答済み
              </span>
            )}
          </div>
          <p className="text-lg font-bold leading-snug">{question.body}</p>
        </div>
      </div>

      {/* Disabled overlay message */}
      {!isAccepting && !hasAnswered && (
        <div className="px-4 mb-3">
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-center">
            <span className="text-amber-400 text-sm font-medium">
              {quizStatus.status === "paused"
                ? "現在回答を受け付けていません"
                : "回答を受け付けていません"}
            </span>
          </div>
        </div>
      )}

      {hasAnswered && (
        <div className="px-4 mb-3">
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-center">
            <span className="text-emerald-400 text-sm font-medium">
              ✓ 回答を送信しました。次の問題をお待ちください。
            </span>
          </div>
        </div>
      )}

      {/* Choices grid */}
      <div className="px-4 pb-8 flex-1">
        <div className="grid grid-cols-2 gap-3">
          {question.choices.map((choice) => (
            <ChoiceCard
              key={choice.id}
              choice={choice}
              selected={selectedChoice === choice.id}
              disabled={!isAccepting}
              onSelect={handleChoiceSelect}
            />
          ))}
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={dialogOpen}
        choiceLabel={selectedChoiceData?.label ?? ""}
        choiceImage={selectedChoiceData?.image}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────

function WaitingScreen({
  quizInfo,
  message = "クイズが始まるまでお待ちください...",
}: {
  quizInfo: { title: string } | null;
  message?: string;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-3xl opacity-10 bg-[var(--color-primary)] pointer-events-none" />

      <div className="text-center animate-fade-in">
        {/* Animated ring */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-2 border-[var(--color-primary)]/30 animate-ping" />
          <div className="absolute inset-2 rounded-full border-2 border-[var(--color-primary)]/50 animate-ping animation-delay-150" />
          <div className="w-full h-full rounded-full gradient-primary flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
        </div>

        {quizInfo && (
          <h2 className="text-2xl font-black mb-3">{quizInfo.title}</h2>
        )}
        <p className="text-muted">{message}</p>
      </div>
    </div>
  );
}
