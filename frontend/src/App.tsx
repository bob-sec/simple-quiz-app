import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { QuizProvider } from "./context/QuizContext";
import AdminPage from "./pages/AdminPage";
import FinishedPage from "./pages/FinishedPage";
import QuizPage from "./pages/QuizPage";
import RegisterPage from "./pages/RegisterPage";
import WelcomePage from "./pages/WelcomePage";

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <QuizProvider>
          <div className="min-h-dvh flex flex-col">
            <Routes>
              <Route path="/" element={<WelcomePage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/quiz" element={<QuizPage />} />
              <Route path="/finished" element={<FinishedPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </QuizProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
