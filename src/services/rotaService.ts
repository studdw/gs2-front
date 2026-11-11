import type { AvaliacaoRotas, PerfilMobilidade, RotaCandidata } from '../types'
import { requisitar } from './api'

/**
 * POST /rotas/avaliacoes
 * Envia os trajetos candidatos e recebe o índice de acessibilidade de cada um,
 * calculado pela API Java com os relatos ativos e o perfil de mobilidade.
 */
export function avaliarRotas(perfil: PerfilMobilidade, rotas: RotaCandidata[]): Promise<AvaliacaoRotas> {
  return requisitar<AvaliacaoRotas>('/rotas/avaliacoes', { metodo: 'POST', corpo: { perfil, rotas } })
}
