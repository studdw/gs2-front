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

/** GET /relatos (com filtros opcionais) */
export function listarRelatos(filtros: FiltrosRelato = {}, sinal?: AbortSignal): Promise<Relato[]> {
  return requisitar<Relato[]>(`/relatos${montarConsulta(filtros)}`, { sinal })
}

/** GET /relatos/{id} */
export function buscarRelato(codigo: number, sinal?: AbortSignal): Promise<Relato> {
  return requisitar<Relato>(`/relatos/${codigo}`, { sinal })
}

/** POST /relatos */
export function criarRelato(dados: RelatoEntrada): Promise<Relato> {
  return requisitar<Relato>('/relatos', { metodo: 'POST', corpo: dados })
}

/** DELETE /relatos/{id} */
export function removerRelato(codigo: number): Promise<void> {
  return requisitar<void>(`/relatos/${codigo}`, { metodo: 'DELETE' })
}

/** PATCH /relatos/{id}/status (somente gestor) */
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

/** POST /relatos/classificacoes */
export function classificarRelato(descricao: string): Promise<Classificacao> {
  return requisitar<Classificacao>('/relatos/classificacoes', { metodo: 'POST', corpo: { descricao } })
}

/** GET /relatos/{id}/validacoes */
export function listarValidacoes(codigoRelato: number, sinal?: AbortSignal): Promise<Validacao[]> {
  return requisitar<Validacao[]>(`/relatos/${codigoRelato}/validacoes`, { sinal })
}

/** POST /relatos/{id}/validacoes */
export function validarRelato(codigoRelato: number, dados: ValidacaoEntrada): Promise<Validacao> {
  return requisitar<Validacao>(`/relatos/${codigoRelato}/validacoes`, { metodo: 'POST', corpo: dados })
}
