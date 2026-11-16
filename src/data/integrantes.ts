import type { Integrante } from '../types'

/** dados da equipe que aparecem nas páginas de integrantes */
export const INTEGRANTES: Integrante[] = [
  {
    rm: '571302',
    nome: 'Lucas Kaftan',
    turma: '1TDSPV',
    papel: 'Rotas acessíveis e painel de gestão',
    responsabilidades: [
      'Épico E2 - Rotas Acessíveis (HU03, HU04)',
      'Épico E5 - Painel Público e Gestão (HU11)',
      'Classificação automática dos relatos (HU07)',
    ],
  },
  {
    rm: '571047',
    nome: 'Matheus Ruas',
    turma: '1TDSPV',
    papel: 'Conta, perfil de mobilidade e validação comunitária',
    responsabilidades: [
      'Épico E1 - Conta e Perfil de Mobilidade (HU01, HU02)',
      'Épico E4 - Validação Comunitária (HU09)',
      'Painel público por bairro (HU13)',
    ],
  },
  {
    rm: '568952',
    nome: 'João Carlos Lopes',
    turma: '1TDSPV',
    papel: 'Relatos e acompanhamento de obras',
    responsabilidades: [
      'Épico E3 - Relatos (HU06, HU08)',
      'Andamento das obras (HU12)',
      'Testes e documentação',
    ],
  },
  {
    rm: '573146',
    nome: 'Matheus Costa',
    turma: '1TDSPV',
    papel: 'Suporte e integração de sistemas',
    responsabilidades: [
      'Épico E3 - Relatos (HU06, HU08)',
      'Andamento das obras (HU12)',
      'Testes e documentação',
    ],
  },
]

/** pega as iniciais (primeiro e último nome) pro avatar */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/)
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}
