"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
        <h2 className="mb-2 text-lg font-bold text-red-600">Error</h2>
        <p className="mb-4 text-sm text-gray-700">{error.message}</p>
        {error.digest && (
          <p className="mb-4 text-xs text-gray-400">Digest: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}