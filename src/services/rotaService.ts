import type { AvaliacaoRotas, PerfilMobilidade, RotaCandidata } from '../types'
import { requisitar } from './api'

/** serve para mandar os trajetos pra API Java e receber o índice de acessibilidade de cada um, calculado com os relatos ativos e o perfil (POST /rotas/avaliacoes) */
export function avaliarRotas(perfil: PerfilMobilidade, rotas: RotaCandidata[]): Promise<AvaliacaoRotas> {
  return requisitar<AvaliacaoRotas>('/rotas/avaliacoes', { metodo: 'POST', corpo: { perfil, rotas } })
}
