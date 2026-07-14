import { createRoot } from 'react-dom/client';
import { setBaseUrl } from '@workspace/api-client-react';

import App from './App';

import './index.css';

// In production (Vercel), VITE_API_BASE_URL points to the deployed FastAPI
// backend (e.g. https://your-app.onrender.com).
// In development (Replit), no env var is set and the API is served from the
// same origin under /api — so setBaseUrl is intentionally left uncalled.
const apiBase = import.meta.env.VITE_API_BASE_URL;
if (apiBase) {
  setBaseUrl(apiBase);
}

createRoot(document.getElementById('root')!).render(<App />);
