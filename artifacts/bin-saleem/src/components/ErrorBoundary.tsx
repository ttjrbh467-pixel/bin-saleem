import React from "react";

interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("App Error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100dvh",
            background: "#0A0A0A",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            fontFamily: "'Tajawal', sans-serif",
            direction: "rtl",
            color: "#fff",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>
            حدث خطأ غير متوقع
          </h2>
          <p style={{ color: "#666", fontSize: 14, marginBottom: 24 }}>
            {this.state.error?.message || "يرجى تحديث الصفحة والمحاولة مرة أخرى"}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "rgba(0,212,255,0.15)",
              border: "1px solid rgba(0,212,255,0.4)",
              color: "#00D4FF",
              padding: "12px 28px",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            تحديث الصفحة
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
