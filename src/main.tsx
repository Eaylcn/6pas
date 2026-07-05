import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/playfair-display/700.css';
import '@fontsource/playfair-display/900.css';
import '@fontsource/archivo-narrow/500.css';
import '@fontsource/archivo-narrow/700.css';
import '@fontsource/source-sans-3/400.css';
import '@fontsource/source-sans-3/600.css';
import './index.css';
import { App } from './app/App';
import { initTheme } from './app/theme';
import { applyRealModeNames, isRealModeEnabled } from './data/realMode';

initTheme();
if (isRealModeEnabled()) applyRealModeNames();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
