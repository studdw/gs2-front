import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { PreferenciasProvider } from './context/PreferenciasContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PreferenciasProvider>
          <App />
        </PreferenciasProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
