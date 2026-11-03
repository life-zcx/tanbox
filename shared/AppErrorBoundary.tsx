import React from 'react';

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
      <h1>Не удалось загрузить страницу</h1>
      <p>Проверьте соединение и повторите загрузку.</p>
      <button type="button" onClick={() => window.location.reload()} className="rounded-lg bg-blue-600 px-5 py-3 text-white">Повторить загрузку</button>
    </main>;
  }
}
