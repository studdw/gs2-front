import L from 'leaflet'
import { useEffect, useRef } from 'react'
import type { Coordenada } from '../types'

export interface MarcadorMapa {
  id: string | number
  posicao: Coordenada
  /** Cor de fundo do marcador (hexadecimal) */
  cor: string
  /** Texto curto dentro do marcador (ex.: "A", "B", "!") */
  texto?: string
  /** Descrição lida por leitores de tela e mostrada ao passar o mouse */
  titulo: string
  aoClicar?: () => void
}

export interface LinhaMapa {
  id: string | number
  pontos: Coordenada[]
  cor: string
  /** Linha em destaque fica mais grossa e por cima das outras */
  destaque?: boolean
}

interface MapaProps {
  centro: Coordenada
  zoom?: number
  marcadores?: MarcadorMapa[]
  linhas?: LinhaMapa[]
  /** Quando muda, o mapa se ajusta para mostrar todos estes pontos */
  enquadrar?: Coordenada[]
  aoClicarNoMapa?: (posicao: Coordenada) => void
  /** Descrição do mapa para leitores de tela */
  descricao: string
  className?: string
}

/**
 * Mapa interativo (Leaflet + OpenStreetMap).
 * O Leaflet cuida do próprio HTML; o React só informa o que deve ser desenhado.
 */
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
  const elemento = useRef<HTMLDivElement>(null)
  const mapa = useRef<L.Map | null>(null)
  const camada = useRef<L.LayerGroup | null>(null)
  // Guarda sempre a versão mais nova da função de clique, sem recriar o mapa
  const cliqueAtual = useRef(aoClicarNoMapa)
  cliqueAtual.current = aoClicarNoMapa

  // Cria o mapa uma única vez
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Recentraliza quando o centro muda
  useEffect(() => {
    mapa.current?.setView(centro)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centro[0], centro[1]])

  // Redesenha linhas e marcadores
  useEffect(() => {
    const grupo = camada.current
    if (!grupo) return
    grupo.clearLayers()

    // Linhas comuns primeiro; a de destaque por último, para ficar por cima
    const ordenadas = [...linhas].sort((a, b) => Number(a.destaque ?? false) - Number(b.destaque ?? false))
    for (const linha of ordenadas) {
      L.polyline(linha.pontos, {
        color: linha.cor,
        weight: linha.destaque ? 7 : 4,
        opacity: linha.destaque ? 0.95 : 0.55,
      }).addTo(grupo)
    }

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

  // Ajusta o zoom para mostrar todos os pontos pedidos
  const chaveEnquadrar = enquadrar ? JSON.stringify(enquadrar) : ''
  useEffect(() => {
    if (!mapa.current || !enquadrar || enquadrar.length === 0) return
    if (enquadrar.length === 1) {
      mapa.current.setView(enquadrar[0], 17)
    } else {
      mapa.current.fitBounds(L.latLngBounds(enquadrar), { padding: [32, 32] })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
