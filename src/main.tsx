import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { CrmProvider } from './context/CrmContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <CrmProvider>
        <App />
      </CrmProvider>
    </BrowserRouter>
  </StrictMode>,
)
