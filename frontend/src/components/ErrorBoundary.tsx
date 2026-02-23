import React from "react";

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: unknown): State {
    const message =
      error instanceof Error ? error.message : String(error);
    return { hasError: true, message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            background: "#080C14",
            color: "#F0F4FF",
            fontFamily: "sans-serif",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
          <h1 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "8px" }}>
            アプリの読み込みに失敗しました
          </h1>
          <p style={{ color: "#8899B4", fontSize: "14px", marginBottom: "24px" }}>
            ページを再読み込みしてください
          </p>
          {this.state.message && (
            <pre
              style={{
                background: "#162033",
                border: "1px solid #1E2D47",
                borderRadius: "8px",
                padding: "12px",
                fontSize: "12px",
                color: "#EF4444",
                maxWidth: "400px",
                overflowX: "auto",
                textAlign: "left",
              }}
            >
              {this.state.message}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: "20px",
              padding: "12px 24px",
              background: "#7C3AED",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            再読み込み
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
