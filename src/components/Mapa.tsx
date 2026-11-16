import L from 'leaflet'
import { useEffect, useRef } from 'react'
import type { Coordenada } from '../types'

/** um marcador do mapa: posição, cor, texto e o que acontece ao clicar */
export interface MarcadorMapa {
  id: string | number
  posicao: Coordenada
  /** cor de fundo em hexadecimal */
  cor: string
  /** texto curtinho dentro do marcador (ex.: "A", "B", "!") */
  texto?: string
  /** lido pelo leitor de tela e mostrado ao passar o mouse */
  titulo: string
  aoClicar?: () => void
}

/** uma linha no mapa, que é o caminho de uma rota */
export interface LinhaMapa {
  id: string | number
  pontos: Coordenada[]
  cor: string
  /** linha mais grossa e por cima das outras (rota selecionada) */
  destaque?: boolean
}

/** tudo o que o componente Mapa recebe */
interface MapaProps {
  centro: Coordenada
  zoom?: number
  marcadores?: MarcadorMapa[]
  linhas?: LinhaMapa[]
  /** quando muda, o mapa dá zoom pra mostrar todos esses pontos */
  enquadrar?: Coordenada[]
  aoClicarNoMapa?: (posicao: Coordenada) => void
  /** descrição do mapa pro leitor de tela */
  descricao: string
  className?: string
}

/** serve como o mapa interativo do site (Leaflet + OpenStreetMap); o Leaflet cuida do próprio HTML e o React só diz o que desenhar */
export function Mapa({
  centro,
  zoom = 15,
  marcadores = [],
  linhas = [],
  enquadrar,
  aoClicarNoMapa,
  descricao,
  className = 'h-80',
}: MapaProps) {
  /* useRef guarda a div, o mapa do Leaflet e a camada de desenho sem causar re-render */
  const elemento = useRef<HTMLDivElement>(null)
  const mapa = useRef<L.Map | null>(null)
  const camada = useRef<L.LayerGroup | null>(null)
  /* guarda sempre a versão mais nova da função de clique, assim não precisa recriar o mapa */
  const cliqueAtual = useRef(aoClicarNoMapa)
  cliqueAtual.current = aoClicarNoMapa

  /* cria o mapa uma única vez e destrói quando a tela fecha */
  useEffect(() => {
    if (!elemento.current || mapa.current) return
    const novoMapa = L.map(elemento.current, { center: centro, zoom, scrollWheelZoom: false })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(novoMapa)
    novoMapa.on('click', (evento: L.LeafletMouseEvent) => {
      cliqueAtual.current?.([evento.latlng.lat, evento.latlng.lng])
    })
    camada.current = L.layerGroup().addTo(novoMapa)
    mapa.current = novoMapa
    return () => {
      novoMapa.remove()
      mapa.current = null
      camada.current = null
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [])

  /* se o centro mudar, o mapa recentraliza */
  useEffect(() => {
    mapa.current?.setView(centro)
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [centro[0], centro[1]])

  /* hook que redesenha linhas e marcadores sempre que a lista muda */
  useEffect(() => {
    const grupo = camada.current
    if (!grupo) return
    grupo.clearLayers()

    /* desenha as linhas comuns primeiro e a de destaque por último, pra ela ficar por cima */
    const ordenadas = [...linhas].sort((a, b) => Number(a.destaque ?? false) - Number(b.destaque ?? false))
    for (const linha of ordenadas) {
      L.polyline(linha.pontos, {
        color: linha.cor,
        weight: linha.destaque ? 7 : 4,
        opacity: linha.destaque ? 0.95 : 0.55,
      }).addTo(grupo)
    }

    /* cada marcador vira um ícone redondo, que abre com clique ou com Enter no teclado */
    for (const marcador of marcadores) {
      const tamanho = marcador.texto ? 30 : 18
      const icone = L.divIcon({
        className: '',
        iconSize: [tamanho, tamanho],
        iconAnchor: [tamanho / 2, tamanho / 2],
        html: `<div class="${marcador.texto ? 'marcador-relato' : 'marcador-ponto'}" style="background:${marcador.cor};width:${tamanho}px;height:${tamanho}px">${marcador.texto ?? ''}</div>`,
      })
      const item = L.marker(marcador.posicao, {
        icon: icone,
        title: marcador.titulo,
        alt: marcador.titulo,
        keyboard: true,
      }).addTo(grupo)
      if (marcador.aoClicar) {
        item.on('click', marcador.aoClicar)
        item.on('keypress', (evento: L.LeafletKeyboardEvent) => {
          if (evento.originalEvent.key === 'Enter') marcador.aoClicar?.()
        })
      }
    }
  }, [marcadores, linhas])

  /* ajusta o zoom pra caber todos os pontos; a chave em texto evita refazer quando a lista é a mesma */
  const chaveEnquadrar = enquadrar ? JSON.stringify(enquadrar) : ''
  useEffect(() => {
    if (!mapa.current || !enquadrar || enquadrar.length === 0) return
    if (enquadrar.length === 1) {
      mapa.current.setView(enquadrar[0], 17)
    } else {
      mapa.current.fitBounds(L.latLngBounds(enquadrar), { padding: [32, 32] })
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [chaveEnquadrar])

  return (
    <div
      ref={elemento}
      role="application"
      aria-label={descricao}
      className={`w-full overflow-hidden rounded-2xl border border-slate-200 ${className}`}
    />
  )
}
