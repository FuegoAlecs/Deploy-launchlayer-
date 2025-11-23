import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { BetaGate } from './components/auth/BetaGate.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <BetaGate>
        <App />
      </BetaGate>
    </AuthProvider>
  </React.StrictMode>,
)
