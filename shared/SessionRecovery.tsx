import React from 'react';

export const SessionRecovery: React.FC<{ retry: () => void; loading: boolean }> = ({ retry, loading }) => (
  <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
    <h1>Не удалось проверить подключение</h1>
    <p>Сессия сохранена. Повторите попытку после восстановления соединения.</p>
    <button type="button" disabled={loading} onClick={retry} className="rounded-lg bg-blue-600 px-5 py-3 text-white disabled:opacity-50">
      {loading ? 'Подключение…' : 'Повторить'}
    </button>
  </main>
);
