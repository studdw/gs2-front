import type { ErroApi } from '../types'

/** Endereço da API Java. Vem do arquivo .env (VITE_API_URL). */
export const API_URL: string = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/$/, '')

const CHAVE_TOKEN = 'rpt.token'

export function lerToken(): string | null {
  return localStorage.getItem(CHAVE_TOKEN)
}

export function salvarToken(token: string | null): void {
  if (token) {
    localStorage.setItem(CHAVE_TOKEN, token)
  } else {
    localStorage.removeItem(CHAVE_TOKEN)
  }
}

/** Erro de uma chamada à API, já com a mensagem pronta para mostrar na tela. */
export class ApiError extends Error {
  status: number
  /** Campos inválidos (erro 400 do Bean Validation) */
  campos: { campo: string; mensagem: string }[]

  constructor(status: number, mensagem: string, campos: { campo: string; mensagem: string }[] = []) {
    super(mensagem)
    this.name = 'ApiError'
    this.status = status
    this.campos = campos
  }
}

/**
 * A API Java devolve dois formatos de erro:
 *  - ErroResponseDto: { "erro": "Not Found", "detalhe": "Relato não encontrado" }
 *  - validação (400): { "email": "Informe um e-mail válido.", "senha": "..." }
 */
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

interface OpcoesRequisicao {
  metodo?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  corpo?: unknown
  sinal?: AbortSignal
}

/**
 * Função única para falar com a API Java usando a Fetch API.
 * Envia o token (se houver), converte o JSON e transforma erros em ApiError.
 */
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
    // fetch só rejeita quando não consegue falar com o servidor (API fora do ar, sem internet...)
    throw new ApiError(0, 'Não conseguimos falar com o servidor. Verifique sua conexão e tente de novo.')
  }

  if (resposta.status === 204) {
    return undefined as T
  }

  const corpo: unknown = await resposta.json().catch(() => null)

  if (!resposta.ok) {
    throw criarErro(resposta.status, corpo)
  }
  return corpo as T
}

/** Monta "?a=1&b=2" ignorando valores vazios. */
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

/** Mensagem amigável a partir de qualquer erro capturado em um catch. */
export function mensagemDeErro(erro: unknown): string {
  if (erro instanceof ApiError) {
    return erro.message
  }
  return 'Algo deu errado. Tente de novo em instantes.'
}
