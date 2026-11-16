import type { ErroApi } from '../types'

/** endereço da API Java, vem do .env (VITE_API_URL) */
export const API_URL: string = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/$/, '')

/** chave onde o token de login fica salvo no navegador */
const CHAVE_TOKEN = 'rpt.token'

/** lê o token salvo */
export function lerToken(): string | null {
  return localStorage.getItem(CHAVE_TOKEN)
}

/** salva o token, ou apaga quando recebe null (no logout) */
export function salvarToken(token: string | null): void {
  if (token) {
    localStorage.setItem(CHAVE_TOKEN, token)
  } else {
    localStorage.removeItem(CHAVE_TOKEN)
  }
}

/** erro da API com o status HTTP e a mensagem já pronta pra tela */
export class ApiError extends Error {
  status: number
  /** campos inválidos que vêm no erro 400 do Bean Validation */
  campos: { campo: string; mensagem: string }[]

  constructor(status: number, mensagem: string, campos: { campo: string; mensagem: string }[] = []) {
    super(mensagem)
    this.name = 'ApiError'
    this.status = status
    this.campos = campos
  }
}

/** transforma a resposta de erro em ApiError; a API devolve dois formatos: o ErroResponseDto { erro, detalhe } e o de validação 400 { campo: mensagem } */
function criarErro(status: number, corpo: unknown): ApiError {
  if (corpo && typeof corpo === 'object') {
    const erro = corpo as Partial<ErroApi>
    if (typeof erro.detalhe === 'string') {
      return new ApiError(status, erro.detalhe)
    }
    if (status === 400) {
      const campos = Object.entries(corpo).map(([campo, mensagem]) => ({ campo, mensagem: String(mensagem) }))
      return new ApiError(400, 'Há campos inválidos. Confira os dados e tente de novo.', campos)
    }
  }
  return new ApiError(status, 'Algo deu errado. Tente de novo em instantes.')
}

/** opções de uma requisição: método HTTP, corpo e sinal de cancelamento */
interface OpcoesRequisicao {
  metodo?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  corpo?: unknown
  sinal?: AbortSignal
}

/** serve como função única pra falar com a API Java (Fetch API): envia o token se tiver, converte o JSON e transforma erro em ApiError */
export async function requisitar<T>(caminho: string, opcoes: OpcoesRequisicao = {}): Promise<T> {
  const cabecalhos: Record<string, string> = { Accept: 'application/json' }
  if (opcoes.corpo !== undefined) {
    cabecalhos['Content-Type'] = 'application/json'
  }
  const token = lerToken()
  if (token) {
    cabecalhos.Authorization = `Bearer ${token}`
  }

  let resposta: Response
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      method: opcoes.metodo ?? 'GET',
      headers: cabecalhos,
      body: opcoes.corpo !== undefined ? JSON.stringify(opcoes.corpo) : undefined,
      signal: opcoes.sinal,
    })
  } catch (erro) {
    if (erro instanceof DOMException && erro.name === 'AbortError') {
      throw erro
    }
    /* o fetch só falha assim quando nem consegue falar com o servidor (API fora do ar, sem internet...) */
    throw new ApiError(0, 'Não conseguimos falar com o servidor. Verifique sua conexão e tente de novo.')
  }

  /* 204 = deu certo mas sem conteúdo (ex.: DELETE), então não tem JSON pra ler */
  if (resposta.status === 204) {
    return undefined as T
  }

  const corpo: unknown = await resposta.json().catch(() => null)

  if (!resposta.ok) {
    throw criarErro(resposta.status, corpo)
  }
  return corpo as T
}

/** monta a query string "?a=1&b=2" a partir de um objeto, pulando os valores vazios */
export function montarConsulta(parametros: object): string {
  const consulta = new URLSearchParams()
  for (const [chave, valor] of Object.entries(parametros)) {
    if (valor !== undefined && valor !== null && valor !== '') {
      consulta.set(chave, String(valor))
    }
  }
  const texto = consulta.toString()
  return texto ? `?${texto}` : ''
}

/** tira uma mensagem amigável de qualquer erro pego num catch */
export function mensagemDeErro(erro: unknown): string {
  if (erro instanceof ApiError) {
    return erro.message
  }
  return 'Algo deu errado. Tente de novo em instantes.'
}
