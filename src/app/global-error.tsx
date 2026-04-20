'use client';

/**
 * Ошибка в корневом `layout.tsx`: без неё Next не может отрендерить обычный `error.tsx`.
 * Должен оборачивать `<html>` и `<body>` (без родительского layout).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ru">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          padding: '1.5rem',
          background: '#09090b',
          color: '#fafafa',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '28rem' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.5rem' }}>
            Критическая ошибка
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.6, color: '#a1a1aa' }}>
            Не удалось отрисовать приложение. Обновите страницу или вернитесь позже.
          </p>
        </div>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            cursor: 'pointer',
            borderRadius: '0.5rem',
            border: '1px solid #52525b',
            background: '#27272a',
            color: '#fafafa',
            padding: '0.6rem 1.25rem',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          Попробовать снова
        </button>
        {process.env.NODE_ENV === 'development' && error.message ? (
          <pre
            style={{
              marginTop: '0.5rem',
              maxHeight: '8rem',
              overflow: 'auto',
              textAlign: 'left',
              fontSize: '0.75rem',
              color: '#fcd34d',
              background: '#18181b',
              padding: '0.75rem',
              borderRadius: '0.375rem',
              border: '1px solid #27272a',
              maxWidth: '100%',
            }}
          >
            {error.message}
          </pre>
        ) : null}
      </body>
    </html>
  );
}
