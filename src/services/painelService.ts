import type { Gravidade, Indicadores, PontoCritico, TipoObstaculo } from '../types'
import { montarConsulta, requisitar } from './api'

/** números gerais do painel público (GET /painel/indicadores) */
export function buscarIndicadores(sinal?: AbortSignal): Promise<Indicadores> {
  return requisitar<Indicadores>('/painel/indicadores', { sinal })
}

/** ranking de pontos críticos, com filtros opcionais de bairro, tipo e gravidade (GET /painel/ranking) */
export function buscarRanking(
  filtros: { bairro?: string; tipo?: TipoObstaculo | ''; gravidade?: Gravidade | '' },
  sinal?: AbortSignal,
): Promise<PontoCritico[]> {
  return requisitar<PontoCritico[]>(`/painel/ranking${montarConsulta(filtros)}`, { sinal })
}
