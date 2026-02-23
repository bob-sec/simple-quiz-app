import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { getQuizInfo, getQuizStatus } from "../api/quiz";
import type { QuizInfo, QuizStatus, QuizStatusType, WsMessage } from "../types";
import { applyTheme } from "../theme";

// ─────────────────────────────────────────────────────────────
//  Context shape
// ─────────────────────────────────────────────────────────────

interface QuizContextValue {
  quizInfo: QuizInfo | null;
  quizStatus: QuizStatus;
  isConnected: boolean;
  // Participant identity
  userId: string;
  userName: string | null;
  setUserName: (name: string) => void;
  // Answered tracking
  answeredQuestions: Set<number>;
  markAnswered: (questionId: number) => void;
}

const QuizContext = createContext<QuizContextValue | null>(null);

// ─────────────────────────────────────────────────────────────
//  User ID (persisted in localStorage)
// ─────────────────────────────────────────────────────────────

function generateUUID(): string {
  // crypto.randomUUID() requires a secure context (HTTPS or localhost).
  // Fall back to crypto.getRandomValues() which works over plain HTTP too.
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant bits
    return [...bytes]
      .map((b, i) => {
        const h = b.toString(16).padStart(2, "0");
        return [4, 6, 8, 10].includes(i) ? `-${h}` : h;
      })
      .join("");
  }
  // Last-resort fallback (Math.random based)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function getOrCreateUserId(): string {
  let id = localStorage.getItem("quiz_user_id");
  if (!id) {
    id = generateUUID();
    localStorage.setItem("quiz_user_id", id);
  }
  return id;
}

// ─────────────────────────────────────────────────────────────
//  Provider
// ─────────────────────────────────────────────────────────────

export function QuizProvider({ children }: { children: React.ReactNode }) {
  const userId = getOrCreateUserId();

  const [quizInfo, setQuizInfo] = useState<QuizInfo | null>(null);
  const [quizStatus, setQuizStatus] = useState<QuizStatus>({
    status: "waiting",
    current_question: null,
  });
  const [isConnected, setIsConnected] = useState(false);
  const [userName, setUserNameState] = useState<string | null>(
    localStorage.getItem("quiz_user_name")
  );
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(
    new Set()
  );

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Set user name ──────────────────────────────────────────
  const setUserName = useCallback((name: string) => {
    setUserNameState(name);
    localStorage.setItem("quiz_user_name", name);
  }, []);

  // ── Mark a question as answered ────────────────────────────
  const markAnswered = useCallback((questionId: number) => {
    setAnsweredQuestions((prev) => new Set([...prev, questionId]));
  }, []);

  // ── Fetch quiz info (once) ─────────────────────────────────
  useEffect(() => {
    getQuizInfo()
      .then((info) => {
        setQuizInfo(info);
        applyTheme(info.theme_color);
      })
      .catch(() => {
        // Backend not ready yet; default theme stays
      });

    getQuizStatus()
      .then(setQuizStatus)
      .catch(() => {
        // Keep default "waiting" status
      });
  }, []);

  // ── WebSocket connection ───────────────────────────────────
  const connectWs = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${protocol}://${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => {
      setIsConnected(false);
      reconnectTimeoutRef.current = setTimeout(connectWs, 3000);
    };
    ws.onerror = () => ws.close();

    ws.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data as string);
        if (msg.type === "quiz_state") {
          setQuizStatus({
            status: msg.status as QuizStatusType,
            current_question: msg.current_question,
          });
        }
      } catch {
        // ignore parse errors
      }
    };
  }, []);

  useEffect(() => {
    connectWs();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [connectWs]);

  return (
    <QuizContext.Provider
      value={{
        quizInfo,
        quizStatus,
        isConnected,
        userId,
        userName,
        setUserName,
        answeredQuestions,
        markAnswered,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────
//  Hook
// ─────────────────────────────────────────────────────────────

export function useQuiz(): QuizContextValue {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error("useQuiz must be used within QuizProvider");
  return ctx;
}
