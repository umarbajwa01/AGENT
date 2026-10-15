import { Component } from "react";
export class ErrorBoundary extends Component {
  state = {
    error: null,
  };
  static getDerivedStateFromError(error) {
    return {
      error,
    };
  }
  render() {
    return this.state.error ? (
      <div className="pad">
        <h1>Something went wrong</h1>
        <p>Please reload the page. Your saved orders remain in the database.</p>
        <button onClick={() => location.reload()}>Reload</button>
      </div>
    ) : (
      this.props.children
    );
  }
}
