import type {
  Classificacao,
  FiltrosRelato,
  Relato,
  RelatoEntrada,
  StatusRelato,
  Validacao,
  ValidacaoEntrada,
} from '../types'
import { montarConsulta, requisitar } from './api'

/** lista os relatos, com filtros opcionais (GET /relatos) */
export function listarRelatos(filtros: FiltrosRelato = {}, sinal?: AbortSignal): Promise<Relato[]> {
  return requisitar<Relato[]>(`/relatos${montarConsulta(filtros)}`, { sinal })
}

/** busca um relato pelo código (GET /relatos/{id}) */
export function buscarRelato(codigo: number, sinal?: AbortSignal): Promise<Relato> {
  return requisitar<Relato>(`/relatos/${codigo}`, { sinal })
}

/** cria um relato novo (POST /relatos) */
export function criarRelato(dados: RelatoEntrada): Promise<Relato> {
  return requisitar<Relato>('/relatos', { metodo: 'POST', corpo: dados })
}

/** remove um relato (DELETE /relatos/{id}) */
export function removerRelato(codigo: number): Promise<void> {
  return requisitar<void>(`/relatos/${codigo}`, { metodo: 'DELETE' })
}

/** o gestor muda o status; a previsão da obra vai junto quando for "em obra" (PATCH /relatos/{id}/status) */
export function alterarStatusRelato(
  codigo: number,
  status: StatusRelato,
  dataPrevisaoObra?: string,
): Promise<Relato> {
  return requisitar<Relato>(`/relatos/${codigo}/status`, {
    metodo: 'PATCH',
    corpo: { status, dataPrevisaoObra: dataPrevisaoObra || undefined },
  })
}

/** pede pra API sugerir tipo e gravidade a partir da descrição (POST /relatos/classificacoes) */
export function classificarRelato(descricao: string): Promise<Classificacao> {
  return requisitar<Classificacao>('/relatos/classificacoes', { metodo: 'POST', corpo: { descricao } })
}

/** votos da comunidade de um relato (GET /relatos/{id}/validacoes) */
export function listarValidacoes(codigoRelato: number, sinal?: AbortSignal): Promise<Validacao[]> {
  return requisitar<Validacao[]>(`/relatos/${codigoRelato}/validacoes`, { sinal })
}

/** registra o voto de quem está perto do local (POST /relatos/{id}/validacoes) */
export function validarRelato(codigoRelato: number, dados: ValidacaoEntrada): Promise<Validacao> {
  return requisitar<Validacao>(`/relatos/${codigoRelato}/validacoes`, { metodo: 'POST', corpo: dados })
}
