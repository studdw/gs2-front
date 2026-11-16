import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Carregando } from './Feedback'

/** serve para só deixar entrar quem está logado; quem não está vai pro login e depois volta pra página que queria (RN01) */
export function RotaProtegida({ children }: { children: ReactNode }) {
  /* pega do contexto se tem alguém logado e de qual página a pessoa veio */
  const { usuario, carregando } = useAuth()
  const local = useLocation()

  /* enquanto confere a sessão salva, mostra o carregando, senão mandaria a pessoa pro login à toa */
  if (carregando) {
    return <Carregando texto="Conferindo sua sessão..." />
  }
  if (!usuario) {
    return <Navigate to="/entrar" replace state={{ voltarPara: local.pathname }} />
  }
  return <>{children}</>
}
