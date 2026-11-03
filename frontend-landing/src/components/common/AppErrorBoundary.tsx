import React from 'react';

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
      <h1>РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ СЃС‚СЂР°РЅРёС†Сѓ</h1>
      <p>РџСЂРѕРІРµСЂСЊС‚Рµ СЃРѕРµРґРёРЅРµРЅРёРµ Рё РїРѕРІС‚РѕСЂРёС‚Рµ Р·Р°РіСЂСѓР·РєСѓ.</p>
      <button type="button" onClick={() => window.location.reload()} className="rounded-lg bg-blue-600 px-5 py-3 text-white">РџРѕРІС‚РѕСЂРёС‚СЊ Р·Р°РіСЂСѓР·РєСѓ</button>
    </main>;
  }
}
