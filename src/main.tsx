import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import './index.css';

// Suppress benign third-party container teardown notices
window.addEventListener('unhandledrejection', (event) => {
  const reasonStr = event?.reason?.message || String(event?.reason || '');
  if (
    reasonStr.includes('Detected container element removed from DOM') ||
    reasonStr.includes('paypal')
  ) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </AuthProvider>
);
