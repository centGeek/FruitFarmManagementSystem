import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css' // <-- To jest KLUCZOWE! Musi być zaimportowany
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)