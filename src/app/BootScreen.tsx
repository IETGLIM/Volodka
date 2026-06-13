interface BootErrorProps {
  message: string;
  onRetry?: () => void;
}

export function BootSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black font-mono text-sm tracking-[0.2em] text-[rgb(var(--cyber-cyan-rgb)/0.7)]">
      ЗАГРУЗКА...
    </div>
  );
}

export function BootError({ message, onRetry }: BootErrorProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black p-6 text-center font-mono text-red-400">
      <div>
        <div className="mb-3 text-2xl">⚠</div>
        <div className="mb-2">Не удалось загрузить данные игры</div>
        <div className="mx-auto mb-4 max-w-[420px] text-xs text-slate-400">{message}</div>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="border border-red-400/40 px-4 py-2 text-xs tracking-[0.15em] uppercase text-red-400/80 transition-colors hover:border-red-400 hover:text-red-400"
          >
            Повторить
          </button>
        ) : null}
      </div>
    </div>
  );
}

interface BootScreenProps {
  error?: string;
  onRetry?: () => void;
}

export function BootScreen({ error, onRetry }: BootScreenProps) {
  if (error) {
    return <BootError message={error} onRetry={onRetry} />;
  }

  return <BootSpinner />;
}
