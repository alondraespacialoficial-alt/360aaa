import React, { Component } from 'react';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: Error };

export default class ErrorBoundary extends Component<Props, State> {
  // FIX: Reverted to using a constructor for state initialization. The class property
  // approach was causing a TypeScript error where `this.props` was not recognized.
  // Using a constructor ensures the component is initialized correctly and props are available.
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <pre style={{ padding: 16, background: '#fee', color: '#a00', whiteSpace: 'pre-wrap' }}>
{String(this.state.error?.stack || this.state.error || 'Unknown error')}
        </pre>
      );
    }
    return this.props.children;
  }
}
