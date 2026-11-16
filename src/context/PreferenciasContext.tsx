import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Coordenada, PerfilMobilidade } from '../types'
import { useAuth } from './AuthContext'

/* aqui no contexto a localização guarda o ponto e de onde ele veio (GPS ou clique no mapa) */
interface Localizacao {
  posicao: Coordenada
  /** "gps" veio do aparelho, "manual" a pessoa marcou no mapa */
  origem: 'gps' | 'manual'
}

/* aqui no contexto definimos o que ele entrega: perfil, localização e as funções do GPS */
interface PreferenciasContexto {
  /** perfil em uso: o da conta (se logado) ou o escolhido como visitante */
  perfil: PerfilMobilidade | null
  definirPerfilVisitante: (perfil: PerfilMobilidade) => void
  localizacao: Localizacao | null
  buscandoGps: boolean
  erroGps: string | null
  usarGps: () => void
  definirLocalizacaoManual: (posicao: Coordenada) => void
}

/* aqui no contexto criamos a "caixa" das preferências e a chave que salva o perfil do visitante */
const Contexto = createContext<PreferenciasContexto | null>(null)
const CHAVE_PERFIL = 'rpt.perfil'

/* aqui no contexto ficam as preferências que várias telas usam juntas (perfil e localização); visitante pode buscar rota sem conta (RN01), por isso o perfil dele fica salvo só no navegador */
export function PreferenciasProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth()
  /* estados do perfil do visitante (já lendo o que ficou salvo), da localização e do GPS */
  const [perfilVisitante, setPerfilVisitante] = useState<PerfilMobilidade | null>(
    () => localStorage.getItem(CHAVE_PERFIL) as PerfilMobilidade | null,
  )
  const [localizacao, setLocalizacao] = useState<Localizacao | null>(null)
  const [buscandoGps, setBuscandoGps] = useState(false)
  const [erroGps, setErroGps] = useState<string | null>(null)

  /** salva o perfil de quem não tem conta, no navegador e no estado */
  const definirPerfilVisitante = useCallback((perfil: PerfilMobilidade) => {
    localStorage.setItem(CHAVE_PERFIL, perfil)
    setPerfilVisitante(perfil)
  }, [])

  /** pede a localização pro GPS do aparelho e, se falhar, mostra uma mensagem amigável */
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

  /** usa o ponto que a pessoa tocou no mapa como a localização dela */
  const definirLocalizacaoManual = useCallback((posicao: Coordenada) => {
    setErroGps(null)
    setLocalizacao({ posicao, origem: 'manual' })
  }, [])

  /* monta o valor do contexto; se a pessoa estiver logada, o perfil da conta ganha do perfil de visitante */
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

/* hook pra qualquer tela pegar o perfil e a localização; dá erro se usar fora do PreferenciasProvider */
/* eslint-disable-next-line react-refresh/only-export-components */
export function usePreferencias(): PreferenciasContexto {
  const contexto = useContext(Contexto)
  if (!contexto) {
    throw new Error('usePreferencias deve ser usado dentro de <PreferenciasProvider>')
  }
  return contexto
}
