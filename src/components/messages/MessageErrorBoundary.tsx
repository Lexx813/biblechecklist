import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props { children: ReactNode; }
interface State { error: Error | null; }

export class MessageErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[MessageErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted, #888)" }}>
          <p>Messages could not be loaded.</p>
          <button onClick={() => this.setState({ error: null })} style={{ marginTop: "0.5rem", fontSize: "0.85em" }}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
