import { AppErrorBoundary } from './components/common/AppErrorBoundary';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary><App /></AppErrorBoundary>
  </React.StrictMode>,
);

// Gracefully dismiss initial splash overlay once React is ready
requestAnimationFrame(() => {
  const splash = document.getElementById('app-splash');
  if (splash) {
    splash.style.opacity = '0';
    splash.style.pointerEvents = 'none';
    setTimeout(() => {
      if (splash.parentNode) {
        splash.parentNode.removeChild(splash);
      }
    }, 220);
  }
});
