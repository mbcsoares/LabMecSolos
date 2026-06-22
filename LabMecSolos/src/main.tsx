import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initDatabase } from './services/DatabaseService';
import { ThemeProvider } from './contexts/ThemeContext';

const container = document.getElementById('root');
const root = createRoot(container!);

initDatabase()
  .catch((err) => {
    console.error('Database initialization failed:', err);
  })
  .finally(() => {
    root.render(
      <React.StrictMode>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </React.StrictMode>
    );
  });