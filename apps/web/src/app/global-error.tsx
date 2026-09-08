'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" data-theme="dark">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '16px',
          background: '#15141B',
          color: '#F5F1E8',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
          Something went wrong
        </h2>
        {error?.digest && (
          <p style={{ fontSize: '0.8rem', color: '#8E8A82', margin: 0 }}>
            Error ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          style={{
            padding: '8px 20px',
            background: '#4F8EF7',
            color: '#fff',
            border: '3px solid #F5F1E8',
            borderRadius: '8px',
            boxShadow: '3px 3px 0 0 #F5F1E8',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.9rem',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
