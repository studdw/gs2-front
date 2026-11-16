import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { PreferenciasProvider } from './context/PreferenciasContext'

/** serve para ligar o React na div "root" do index.html, envolvendo o app com o roteador e os dois contextos (login e preferências) */
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
