import axios from "axios";
import type {
  AdminResults,
  MyResults,
  Question,
  QuizInfo,
  QuizStatus,
} from "../types";

const api = axios.create({ baseURL: "/api" });

// ── Public ─────────────────────────────────────────────────────

export const getQuizInfo = (): Promise<QuizInfo> =>
  api.get("/quiz/info").then((r) => r.data);

export const getQuizStatus = (): Promise<QuizStatus> =>
  api.get("/quiz/status").then((r) => r.data);

export const registerUser = (userId: string, name: string): Promise<void> =>
  api.post("/quiz/register", { user_id: userId, name }).then((r) => r.data);

export const getQuestion = (questionId: number): Promise<Question> =>
  api.get(`/quiz/question/${questionId}`).then((r) => r.data);

export const submitAnswer = (
  userId: string,
  questionId: number,
  choiceId: string
): Promise<{ success: boolean; is_correct: boolean }> =>
  api
    .post("/quiz/answer", {
      user_id: userId,
      question_id: questionId,
      choice_id: choiceId,
    })
    .then((r) => r.data);

export const getMyResults = (userId: string): Promise<MyResults> =>
  api.get(`/quiz/my-results?user_id=${userId}`).then((r) => r.data);

// ── Admin ──────────────────────────────────────────────────────

const adminApi = (token: string) =>
  axios.create({
    baseURL: "/api",
    headers: { "X-Admin-Token": token },
  });

export const adminLogin = (
  password: string
): Promise<{ success: boolean; token: string }> =>
  api.post("/admin/login", { password }).then((r) => r.data);

export const adminStartQuiz = (token: string) =>
  adminApi(token).post("/admin/quiz/start").then((r) => r.data);

export const adminPauseQuiz = (token: string) =>
  adminApi(token).post("/admin/quiz/pause").then((r) => r.data);

export const adminResumeQuiz = (token: string) =>
  adminApi(token).post("/admin/quiz/resume").then((r) => r.data);

export const adminNextQuestion = (token: string) =>
  adminApi(token).post("/admin/quiz/next").then((r) => r.data);

export const adminPrevQuestion = (token: string) =>
  adminApi(token).post("/admin/quiz/prev").then((r) => r.data);

export const adminGotoQuestion = (token: string, questionId: number) =>
  adminApi(token).post(`/admin/quiz/goto/${questionId}`).then((r) => r.data);

export const adminResetQuiz = (token: string) =>
  adminApi(token).post("/admin/quiz/reset").then((r) => r.data);

export const adminGetResults = (token: string): Promise<AdminResults> =>
  adminApi(token).get("/admin/results").then((r) => r.data);
