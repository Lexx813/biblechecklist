import { Component, type ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

export class MessageErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted, #888)" }}>
          <p>Messages could not be loaded.</p>
          <button onClick={() => this.setState({ hasError: false })} style={{ marginTop: "0.5rem", fontSize: "0.85em" }}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
