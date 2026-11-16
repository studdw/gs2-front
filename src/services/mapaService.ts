import type { Coordenada, LocalEncontrado, RotaCandidata } from '../types'

/* aqui usamos serviços gratuitos do OpenStreetMap como complemento da API Java: o Nominatim transforma endereço em coordenada (e o contrário) e o OSRM calcula o trajeto a pé pelas ruas; eles só desenham o caminho, quem decide se a rota é acessível é a API Java (/rotas/avaliacoes) */

/** endereços dos dois serviços de mapa (Nominatim e OSRM a pé) */
const NOMINATIM = 'https://nominatim.openstreetmap.org'
const OSRM_A_PE = 'https://routing.openstreetmap.de/routed-foot/route/v1/foot'

/** limita a busca de endereços ao município de São Paulo (oeste, norte, leste, sul) */
const CAIXA_SP = '-46.83,-23.35,-46.36,-24.01'

/** centro padrão do mapa: Vila Mariana / Paraíso */
export const CENTRO_PADRAO: Coordenada = [-23.5745, -46.6405]

/** erro dos serviços de mapa, com mensagem pronta pra tela */
export class MapaError extends Error {}

/** o que o Nominatim devolve (só os campos que usamos) */
interface RespostaNominatim {
  display_name: string
  lat: string
  lon: string
  address?: Record<string, string>
}

/** acha o bairro no endereço do Nominatim, que pode vir com nomes diferentes */
function extrairBairro(endereco?: Record<string, string>): string | undefined {
  return endereco?.suburb ?? endereco?.neighbourhood ?? endereco?.city_district ?? endereco?.quarter
}

/** nome curto do lugar, tipo "Rua X, 123 - Bairro", em vez do endereço gigante */
function resumirNome(item: RespostaNominatim): string {
  const e = item.address
  if (e?.road) {
    const numero = e.house_number ? `, ${e.house_number}` : ''
    const bairro = extrairBairro(e)
    return `${e.road}${numero}${bairro ? ` - ${bairro}` : ''}`
  }
  /* sem rua, usa só as duas primeiras partes do nome completo */
  return item.display_name.split(',').slice(0, 2).join(',')
}

/** busca um endereço digitado dentro de SP; lista vazia se não achar */
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

/** descobre rua e bairro de um ponto clicado no mapa; null se o serviço não responder */
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

/** o que o OSRM devolve: rotas com distância e a linha do caminho */
interface RespostaOsrm {
  code: string
  routes?: { distance: number; geometry: { coordinates: [number, number][] } }[]
}

/** pede pro OSRM os trajetos a pé passando pelas paradas */
async function consultarOsrm(paradas: Coordenada[], alternativas: boolean, sinal?: AbortSignal): Promise<RotaCandidata[]> {
  /* atenção: o OSRM usa longitude,latitude, ao contrário do resto do projeto */
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

/** deixa no máximo ~1500 pontos por rota, pra requisição não ficar pesada */
function reduzirPontos(pontos: Coordenada[], maximo = 1500): Coordenada[] {
  if (pontos.length <= maximo) return pontos
  const passo = Math.ceil(pontos.length / maximo)
  const reduzidos = pontos.filter((_, indice) => indice % passo === 0)
  reduzidos.push(pontos[pontos.length - 1])
  return reduzidos
}

/** distância aproximada em metros entre dois pontos próximos */
export function distanciaMetros(a: Coordenada, b: Coordenada): number {
  const dLat = (b[0] - a[0]) * 111_320
  const dLng = (b[1] - a[1]) * 111_320 * Math.cos((a[0] * Math.PI) / 180)
  return Math.hypot(dLat, dLng)
}

/** serve para buscar até 3 trajetos a pé; além das alternativas do OSRM, tenta dois desvios (um pra cada lado do caminho direto) pra ter uma opção que contorne os obstáculos */
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

  /* se o OSRM trouxe menos de 3 rotas, forçamos desvios passando por um ponto ao lado do caminho */
  if (rotas.length < 3) {
    const reta = distanciaMetros(origem, destino)
    const desvio = Math.min(400, Math.max(120, reta * 0.2))
    const meio: Coordenada = [(origem[0] + destino[0]) / 2, (origem[1] + destino[1]) / 2]
    /* vetor perpendicular ao caminho direto, convertido de metros pra graus */
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
    /* o desvio só entra se não for repetido nem longo demais (até 80% maior que a mais curta) */
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
