import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@components/ui/alert';
import { Button } from '@components/ui/button';
import { Code } from '@components/ui/code';
import { AlertTriangle } from 'lucide-react';
import { translate } from '@common/i18n/translator';
import { resolveSystemLocale } from '@common/i18n/locales';

export interface RootErrorBoundaryProps {
  children: ReactNode;
}

export interface RootErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class RootErrorBoundary extends Component<
  RootErrorBoundaryProps,
  RootErrorBoundaryState
> {
  declare props: RootErrorBoundaryProps;
  declare state: RootErrorBoundaryState;
  static getDerivedStateFromError(error: Error): RootErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  constructor(props: RootErrorBoundaryProps) {
    super(props);
    const triggerParam =
      typeof window !== 'undefined' &&
      window.location.search.includes('trigger-error=true');
    this.state = {
      hasError: triggerParam,
      error: triggerParam ? new Error('Simulated crash triggered via URL parameter') : null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Unhandled application error caught by RootErrorBoundary:', error, errorInfo);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const locale = resolveSystemLocale();
      const title = translate(locale, 'app', 'AppCrashTitle');
      const desc = translate(locale, 'app', 'AppCrashDesc');
      const reloadBtn = translate(locale, 'app', 'RestartGui');

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
              <Code block className="p-3 bg-muted rounded-md text-xs font-mono overflow-auto max-h-56 border border-border text-foreground">
                {this.state.error.message}
                {this.state.error.stack ? `\n\n${this.state.error.stack}` : ''}
              </Code>
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

