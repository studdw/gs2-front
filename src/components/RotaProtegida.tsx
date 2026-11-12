import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Carregando } from './Feedback'

/**
 * Só mostra o conteúdo para quem está logado.
 * Quem não está vai para o login e, depois de entrar, volta para a página que queria (RN01).
 */
export function RotaProtegida({ children }: { children: ReactNode }) {
  const { usuario, carregando } = useAuth()
  const local = useLocation()

  if (carregando) {
    return <Carregando texto="Conferindo sua sessão..." />
  }
  if (!usuario) {
    return <Navigate to="/entrar" replace state={{ voltarPara: local.pathname }} />
  }
  return <>{children}</>
}
