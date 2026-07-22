import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './styles/globals.css'

// Após um novo deploy, chunks lazy antigos deixam de existir no servidor (404).
// O Vite dispara "vite:preloadError" nesse caso; recarregamos para buscar o
// index.html novo com os hashes atualizados. Guard por tempo evita loop de
// reload caso o chunk realmente não exista (build quebrado).
window.addEventListener('vite:preloadError', () => {
  const last = Number(sessionStorage.getItem('vite-preload-reloaded-at') || 0)
  if (Date.now() - last < 10_000) return
  sessionStorage.setItem('vite-preload-reloaded-at', String(Date.now()))
  window.location.reload()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
