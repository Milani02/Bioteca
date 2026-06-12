import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white gap-6 p-8">
          <AlertTriangle className="w-16 h-16 text-destructive" />
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Algo deu errado</h1>
            <p className="text-white/60 max-w-md">
              {this.state.error?.message ?? 'Erro inesperado na aplicação.'}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-semibold hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
