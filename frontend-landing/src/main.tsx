import { AppErrorBoundary } from './components/common/AppErrorBoundary';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const root = document.getElementById('root')!;
const application = (
  <React.StrictMode>
    <AppErrorBoundary><App /></AppErrorBoundary>
  </React.StrictMode>
);
if (root.hasChildNodes()) ReactDOM.hydrateRoot(root, application);
else ReactDOM.createRoot(root).render(application);

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
