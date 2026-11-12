import type { Gravidade, PerfilMobilidade, StatusRelato, TipoObstaculo, TipoVoto } from '../types'

// Textos exibidos na interface para cada valor vindo da API.
// Rótulos de perfil em 1ª pessoa, como definido no UX Writing do projeto.

export const PERFIS: { valor: PerfilMobilidade; rotulo: string; curto: string; emoji: string }[] = [
  { valor: 'CADEIRANTE', rotulo: 'Uso cadeira de rodas', curto: 'Cadeira de rodas', emoji: '🧑‍🦽' },
  { valor: 'IDOSO', rotulo: 'Sou uma pessoa idosa', curto: 'Pessoa idosa', emoji: '🧓' },
  { valor: 'GESTANTE', rotulo: 'Estou gestante', curto: 'Gestante', emoji: '🤰' },
  { valor: 'CARRINHO_BEBE', rotulo: 'Estou com carrinho de bebê', curto: 'Carrinho de bebê', emoji: '👶' },
  { valor: 'DEFICIENCIA_VISUAL', rotulo: 'Tenho deficiência visual', curto: 'Deficiência visual', emoji: '🦯' },
  { valor: 'MULETA_ANDADOR', rotulo: 'Uso muleta ou andador', curto: 'Muleta ou andador', emoji: '🩼' },
]

export function rotuloPerfil(perfil: PerfilMobilidade): string {
  return PERFIS.find((item) => item.valor === perfil)?.curto ?? perfil
}

export const TIPOS: Record<TipoObstaculo, string> = {
  BURACO: 'Buraco',
  DEGRAU: 'Degrau',
  SEM_RAMPA: 'Falta de rampa',
  CALCADA_IRREGULAR: 'Calçada irregular',
  OBSTRUCAO: 'Obstrução na calçada',
  ILUMINACAO_RUIM: 'Iluminação ruim',
  LOCAL_ISOLADO: 'Local isolado',
  TRAVESSIA_INSEGURA: 'Travessia sem semáforo sonoro',
}

export const GRAVIDADES: Record<Gravidade, string> = {
  BAIXA: 'Baixa',
  MEDIA: 'Média',
  ALTA: 'Alta',
  CRITICA: 'Crítica',
}

/** As mesmas 4 cores de gravidade em todo o site (consistência - heurística H4). */
export const CORES_GRAVIDADE: Record<Gravidade, { classe: string; hex: string }> = {
  BAIXA: { classe: 'bg-sky-100 text-sky-900 ring-sky-300', hex: '#0284c7' },
  MEDIA: { classe: 'bg-amber-100 text-amber-900 ring-amber-300', hex: '#d97706' },
  ALTA: { classe: 'bg-orange-100 text-orange-900 ring-orange-300', hex: '#ea580c' },
  CRITICA: { classe: 'bg-red-100 text-red-900 ring-red-300', hex: '#dc2626' },
}

export const STATUS: Record<StatusRelato, { rotulo: string; classe: string }> = {
  EM_MODERACAO: { rotulo: 'Em moderação', classe: 'bg-slate-100 text-slate-800 ring-slate-300' },
  PUBLICADO: { rotulo: 'Publicado', classe: 'bg-teal-50 text-teal-900 ring-teal-300' },
  CONFIRMADO: { rotulo: 'Confirmado', classe: 'bg-violet-100 text-violet-900 ring-violet-300' },
  EM_OBRA: { rotulo: 'Em obra', classe: 'bg-yellow-100 text-yellow-900 ring-yellow-400' },
  RESOLVIDO: { rotulo: 'Resolvido', classe: 'bg-emerald-100 text-emerald-900 ring-emerald-300' },
  REJEITADO: { rotulo: 'Rejeitado', classe: 'bg-rose-100 text-rose-900 ring-rose-300' },
  EXPIRADO: { rotulo: 'Expirado', classe: 'bg-slate-100 text-slate-600 ring-slate-300' },
}

export const VOTOS: Record<TipoVoto, string> = {
  AINDA_EXISTE: 'Ainda existe',
  FOI_RESOLVIDO: 'Foi resolvido',
  NAO_ENCONTREI: 'Não encontrei',
}

export function formatarData(iso?: string): string {
  if (!iso) return '-'
  // Datas sem hora (AAAA-MM-DD) são tratadas como data local, sem conversão de fuso
  const data = iso.length === 10 ? new Date(`${iso}T00:00:00`) : new Date(iso)
  return data.toLocaleDateString('pt-BR')
}

export function formatarDistancia(metros: number): string {
  return metros >= 1000 ? `${(metros / 1000).toFixed(1).replace('.', ',')} km` : `${Math.round(metros)} m`
}
