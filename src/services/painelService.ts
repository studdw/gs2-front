import type { Gravidade, Indicadores, PontoCritico, TipoObstaculo } from '../types'
import { montarConsulta, requisitar } from './api'

/** GET /painel/indicadores */
export function buscarIndicadores(sinal?: AbortSignal): Promise<Indicadores> {
  return requisitar<Indicadores>('/painel/indicadores', { sinal })
}

/** GET /painel/ranking (com filtros opcionais) */
export function buscarRanking(
  filtros: { bairro?: string; tipo?: TipoObstaculo | ''; gravidade?: Gravidade | '' },
  sinal?: AbortSignal,
): Promise<PontoCritico[]> {
  return requisitar<PontoCritico[]>(`/painel/ranking${montarConsulta(filtros)}`, { sinal })
}
