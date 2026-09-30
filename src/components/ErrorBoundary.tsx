import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public props: Props;
  public state: State = {
    hasError: false,
    error: null,
  };

  constructor(props: Props) {
    super(props);
    this.props = props;
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('cyclon_active_apt_id_v6');
      localStorage.removeItem('cyclon_previous_session_apt_id_v6');
    } catch (e) {
      // ignore
    }
    (this as any).setState({ hasError: false, error: null });
    window.location.href = window.location.pathname;
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-3xl">
              🌀
            </div>
            <h2 className="text-xl font-extrabold text-white">Что-то пошло не так</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Произошла непредвиденная ошибка интерфейса. Мы сохранили все данные в облаке, вы можете безопасно вернуться в холл дома.
            </p>
            {this.state.error && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-left font-mono text-[11px] text-rose-400 overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs cursor-pointer shadow-lg shadow-cyan-950/40 transition-all active:scale-95"
              >
                Вернуться в холл дома
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
