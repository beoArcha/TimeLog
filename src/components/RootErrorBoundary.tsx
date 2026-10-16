import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@components/ui/alert';
import { Button } from '@components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { translate } from '@common/i18n/translator';

export interface RootErrorBoundaryProps {
  children: React.ReactNode;
}

export interface RootErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

type ReactComponentConstructor<P, S> = new (props: P) => {
  props: P;
  state: S;
  setState(updater: Partial<S> | ((prevState: S) => Partial<S>)): void;
  componentDidCatch?(error: Error, errorInfo: unknown): void;
  render(): React.ReactNode;
};

const ReactComponent = React.Component as unknown as ReactComponentConstructor<
  RootErrorBoundaryProps,
  RootErrorBoundaryState
>;

export class RootErrorBoundary extends ReactComponent {
  static getDerivedStateFromError(error: Error): RootErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  constructor(props: RootErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: unknown): void {
    console.error('Unhandled application error caught by RootErrorBoundary:', error, errorInfo);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      const title = translate('en', 'app', 'AppCrashTitle');
      const desc = translate('en', 'app', 'AppCrashDesc');
      const reloadBtn = translate('en', 'app', 'RestartGui');

      return (
        <div
          data-testid="root-error-boundary-fallback"
          className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-background text-foreground select-text"
        >
          <div className="max-w-lg w-full space-y-4">
            <Alert variant="destructive" className="bg-card">
              <AlertTriangle className="size-5" />
              <AlertTitle className="text-base font-semibold">{title}</AlertTitle>
              <AlertDescription className="mt-1 text-sm text-muted-foreground">
                {desc}
              </AlertDescription>
            </Alert>

            {this.state.error && (
              <pre className="p-3 bg-muted rounded-md text-xs font-mono overflow-auto max-h-56 border border-border text-foreground">
                {this.state.error.message}
                {this.state.error.stack ? `\n\n${this.state.error.stack}` : ''}
              </pre>
            )}

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                onClick={this.handleReload}
                data-testid="root-error-reload-btn"
              >
                {reloadBtn}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

