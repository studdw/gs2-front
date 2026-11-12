import type { Coordenada, LocalEncontrado, RotaCandidata } from '../types'

/*
 * Serviços públicos e gratuitos do OpenStreetMap, usados como COMPLEMENTO da API Java:
 *  - Nominatim: transforma endereço em coordenada (e o contrário).
 *  - OSRM (perfil "a pé", servidor da comunidade OSM alemã): calcula o trajeto pelas ruas.
 * Eles só desenham o caminho. Quem decide se a rota é acessível é a API Java (/rotas/avaliacoes).
 */

const NOMINATIM = 'https://nominatim.openstreetmap.org'
const OSRM_A_PE = 'https://routing.openstreetmap.de/routed-foot/route/v1/foot'

/** Área de cobertura: município de São Paulo (oeste, norte, leste, sul). */
const CAIXA_SP = '-46.83,-23.35,-46.36,-24.01'

/** Centro padrão do mapa: região da Vila Mariana / Paraíso. */
export const CENTRO_PADRAO: Coordenada = [-23.5745, -46.6405]

/** Erro de um serviço de mapas, com mensagem pronta para a tela. */
export class MapaError extends Error {}

interface RespostaNominatim {
  display_name: string
  lat: string
  lon: string
  address?: Record<string, string>
}

function extrairBairro(endereco?: Record<string, string>): string | undefined {
  return endereco?.suburb ?? endereco?.neighbourhood ?? endereco?.city_district ?? endereco?.quarter
}

function resumirNome(item: RespostaNominatim): string {
  const e = item.address
  if (e?.road) {
    const numero = e.house_number ? `, ${e.house_number}` : ''
    const bairro = extrairBairro(e)
    return `${e.road}${numero}${bairro ? ` - ${bairro}` : ''}`
  }
  // Sem rua: usa as duas primeiras partes do nome completo
  return item.display_name.split(',').slice(0, 2).join(',')
}

/** Busca um endereço dentro de São Paulo. Devolve lista vazia quando não encontra. */
export async function buscarEndereco(texto: string, sinal?: AbortSignal): Promise<LocalEncontrado[]> {
  const consulta = new URLSearchParams({
    format: 'jsonv2',
    addressdetails: '1',
    limit: '5',
    countrycodes: 'br',
    viewbox: CAIXA_SP,
    bounded: '1',
    'accept-language': 'pt-BR',
    q: texto,
  })
  let resposta: Response
  try {
    resposta = await fetch(`${NOMINATIM}/search?${consulta}`, { signal: sinal })
  } catch (erro) {
    if (erro instanceof DOMException && erro.name === 'AbortError') throw erro
    throw new MapaError('Não conseguimos consultar o mapa agora. Tente de novo em instantes.')
  }
  if (!resposta.ok) {
    throw new MapaError('Não conseguimos consultar o mapa agora. Tente de novo em instantes.')
  }
  const itens = (await resposta.json()) as RespostaNominatim[]
  return itens.map((item) => ({
    nome: resumirNome(item),
    latitude: Number(item.lat),
    longitude: Number(item.lon),
    bairro: extrairBairro(item.address),
  }))
}

/** Descobre rua e bairro de um ponto do mapa. Devolve null se o serviço não responder. */
export async function buscarEnderecoDoPonto(
  latitude: number,
  longitude: number,
  sinal?: AbortSignal,
): Promise<{ endereco: string; bairro: string } | null> {
  const consulta = new URLSearchParams({
    format: 'jsonv2',
    addressdetails: '1',
    zoom: '18',
    'accept-language': 'pt-BR',
    lat: String(latitude),
    lon: String(longitude),
  })
  try {
    const resposta = await fetch(`${NOMINATIM}/reverse?${consulta}`, { signal: sinal })
    if (!resposta.ok) return null
    const item = (await resposta.json()) as RespostaNominatim
    if (!item.address) return null
    const numero = item.address.house_number ? `, ${item.address.house_number}` : ''
    return {
      endereco: item.address.road ? `${item.address.road}${numero}` : '',
      bairro: extrairBairro(item.address) ?? '',
    }
  } catch {
    return null
  }
}

interface RespostaOsrm {
  code: string
  routes?: { distance: number; geometry: { coordinates: [number, number][] } }[]
}

async function consultarOsrm(paradas: Coordenada[], alternativas: boolean, sinal?: AbortSignal): Promise<RotaCandidata[]> {
  // O OSRM usa a ordem longitude,latitude
  const caminho = paradas.map(([lat, lng]) => `${lng},${lat}`).join(';')
  const url = `${OSRM_A_PE}/${caminho}?overview=full&geometries=geojson&alternatives=${alternativas}`
  const resposta = await fetch(url, { signal: sinal })
  if (!resposta.ok) return []
  const dados = (await resposta.json()) as RespostaOsrm
  if (dados.code !== 'Ok' || !dados.routes) return []
  return dados.routes.map((rota) => ({
    distanciaMetros: rota.distance,
    pontos: reduzirPontos(rota.geometry.coordinates.map(([lng, lat]) => [lat, lng] as Coordenada)),
  }))
}

/** Mantém no máximo ~1500 pontos por rota para a requisição à API não ficar pesada. */
function reduzirPontos(pontos: Coordenada[], maximo = 1500): Coordenada[] {
  if (pontos.length <= maximo) return pontos
  const passo = Math.ceil(pontos.length / maximo)
  const reduzidos = pontos.filter((_, indice) => indice % passo === 0)
  reduzidos.push(pontos[pontos.length - 1])
  return reduzidos
}

/** Distância aproximada em metros entre dois pontos próximos. */
export function distanciaMetros(a: Coordenada, b: Coordenada): number {
  const dLat = (b[0] - a[0]) * 111_320
  const dLng = (b[1] - a[1]) * 111_320 * Math.cos((a[0] * Math.PI) / 180)
  return Math.hypot(dLat, dLng)
}

/**
 * Busca até 3 trajetos a pé diferentes entre origem e destino.
 * Além das alternativas do próprio OSRM, tenta dois desvios (um para cada lado do caminho direto),
 * para que exista uma opção que contorne os obstáculos relatados.
 */
export async function buscarTrajetos(origem: Coordenada, destino: Coordenada, sinal?: AbortSignal): Promise<RotaCandidata[]> {
  let rotas: RotaCandidata[]
  try {
    rotas = await consultarOsrm([origem, destino], true, sinal)
  } catch (erro) {
    if (erro instanceof DOMException && erro.name === 'AbortError') throw erro
    throw new MapaError('Não conseguimos calcular a rota agora. Tente de novo em instantes.')
  }
  if (rotas.length === 0) {
    throw new MapaError('Não encontramos um caminho a pé entre esses dois pontos.')
  }

  if (rotas.length < 3) {
    const reta = distanciaMetros(origem, destino)
    const desvio = Math.min(400, Math.max(120, reta * 0.2))
    const meio: Coordenada = [(origem[0] + destino[0]) / 2, (origem[1] + destino[1]) / 2]
    // Vetor perpendicular ao caminho direto, convertido de metros para graus
    const dLat = destino[0] - origem[0]
    const dLng = destino[1] - origem[1]
    const tamanho = Math.hypot(dLat, dLng) || 1
    const grausPorMetro = 1 / 111_320
    const lados = [1, -1].map(
      (lado): Coordenada => [
        meio[0] + ((lado * -dLng) / tamanho) * desvio * grausPorMetro,
        meio[1] + ((lado * dLat) / tamanho) * desvio * grausPorMetro,
      ],
    )
    const desvios = await Promise.all(
      lados.map((ponto) => consultarOsrm([origem, ponto, destino], false, sinal).catch(() => [])),
    )
    const maisCurta = Math.min(...rotas.map((rota) => rota.distanciaMetros))
    for (const candidata of desvios.flat()) {
      const repetida = rotas.some((rota) => Math.abs(rota.distanciaMetros - candidata.distanciaMetros) < 25)
      const longaDemais = candidata.distanciaMetros > maisCurta * 1.8
      if (!repetida && !longaDemais && rotas.length < 3) {
        rotas.push(candidata)
      }
    }
  }
  return rotas.slice(0, 3)
}
