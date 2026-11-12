import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Coordenada, PerfilMobilidade } from '../types'
import { useAuth } from './AuthContext'

interface Localizacao {
  posicao: Coordenada
  /** "gps" = veio do aparelho; "manual" = a pessoa marcou no mapa */
  origem: 'gps' | 'manual'
}

interface PreferenciasContexto {
  /** Perfil de mobilidade em uso: o da conta (se logado) ou o escolhido como visitante */
  perfil: PerfilMobilidade | null
  definirPerfilVisitante: (perfil: PerfilMobilidade) => void
  localizacao: Localizacao | null
  buscandoGps: boolean
  erroGps: string | null
  usarGps: () => void
  definirLocalizacaoManual: (posicao: Coordenada) => void
}

const Contexto = createContext<PreferenciasContexto | null>(null)
const CHAVE_PERFIL = 'rpt.perfil'

/**
 * Preferências compartilhadas entre as telas: perfil de mobilidade e localização atual.
 * Visitantes podem buscar rotas sem conta (RN01), então o perfil deles fica só no navegador.
 */
export function PreferenciasProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth()
  const [perfilVisitante, setPerfilVisitante] = useState<PerfilMobilidade | null>(
    () => localStorage.getItem(CHAVE_PERFIL) as PerfilMobilidade | null,
  )
  const [localizacao, setLocalizacao] = useState<Localizacao | null>(null)
  const [buscandoGps, setBuscandoGps] = useState(false)
  const [erroGps, setErroGps] = useState<string | null>(null)

  const definirPerfilVisitante = useCallback((perfil: PerfilMobilidade) => {
    localStorage.setItem(CHAVE_PERFIL, perfil)
    setPerfilVisitante(perfil)
  }, [])

  const usarGps = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setErroGps('Seu navegador não informa a localização. Marque o ponto no mapa.')
      return
    }
    setBuscandoGps(true)
    setErroGps(null)
    navigator.geolocation.getCurrentPosition(
      (posicao) => {
        setLocalizacao({ posicao: [posicao.coords.latitude, posicao.coords.longitude], origem: 'gps' })
        setBuscandoGps(false)
      },
      () => {
        setErroGps('Não conseguimos sua localização. Permita o acesso ou marque o ponto no mapa.')
        setBuscandoGps(false)
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }, [])

  const definirLocalizacaoManual = useCallback((posicao: Coordenada) => {
    setErroGps(null)
    setLocalizacao({ posicao, origem: 'manual' })
  }, [])

  const valor = useMemo<PreferenciasContexto>(
    () => ({
      perfil: usuario?.perfilMobilidade ?? perfilVisitante,
      definirPerfilVisitante,
      localizacao,
      buscandoGps,
      erroGps,
      usarGps,
      definirLocalizacaoManual,
    }),
    [usuario, perfilVisitante, definirPerfilVisitante, localizacao, buscandoGps, erroGps, usarGps, definirLocalizacaoManual],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePreferencias(): PreferenciasContexto {
  const contexto = useContext(Contexto)
  if (!contexto) {
    throw new Error('usePreferencias deve ser usado dentro de <PreferenciasProvider>')
  }
  return contexto
}
