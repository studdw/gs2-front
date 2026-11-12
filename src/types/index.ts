// Tipos dos dados trocados com a API Java (espelham os DTOs do back-end)

export type Papel = 'CIDADAO' | 'GESTOR'

export type PerfilMobilidade =
  | 'CADEIRANTE'
  | 'IDOSO'
  | 'GESTANTE'
  | 'CARRINHO_BEBE'
  | 'DEFICIENCIA_VISUAL'
  | 'MULETA_ANDADOR'

export type TipoObstaculo =
  | 'BURACO'
  | 'DEGRAU'
  | 'SEM_RAMPA'
  | 'CALCADA_IRREGULAR'
  | 'OBSTRUCAO'
  | 'ILUMINACAO_RUIM'
  | 'LOCAL_ISOLADO'
  | 'TRAVESSIA_INSEGURA'

export type Gravidade = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA'

export type StatusRelato =
  | 'EM_MODERACAO'
  | 'PUBLICADO'
  | 'CONFIRMADO'
  | 'EM_OBRA'
  | 'RESOLVIDO'
  | 'REJEITADO'
  | 'EXPIRADO'

export type TipoVoto = 'AINDA_EXISTE' | 'FOI_RESOLVIDO' | 'NAO_ENCONTREI'

export interface Usuario {
  id: number
  nome: string
  email: string
  papel: Papel
  perfilMobilidade?: PerfilMobilidade | null
  dataCadastro: string
}

export interface UsuarioCadastro {
  nome: string
  email: string
  senha: string
  perfilMobilidade?: PerfilMobilidade | null
}

export interface UsuarioAtualizacao {
  nome: string
  email: string
  senha?: string
  perfilMobilidade?: PerfilMobilidade | null
}

export interface LoginResposta {
  token: string
  usuario: Usuario
}

export interface Relato {
  id: number
  protocolo: string
  tipo: TipoObstaculo
  gravidade: Gravidade
  descricao?: string | null
  endereco: string
  bairro: string
  latitude: number
  longitude: number
  confiancaIa: number
  status: StatusRelato
  possuiFoto: boolean
  foto?: string | null
  dataCriacao: string
  dataPrevisaoObra?: string | null
  dataResolucao?: string | null
  confirmacoes: number
  votosResolvido: number
  confirmacoesFaltantes: number
  meu: boolean
  distanciaMetros?: number | null
}

export interface RelatoEntrada {
  tipo: TipoObstaculo
  gravidade: Gravidade
  descricao?: string | null
  endereco: string
  bairro: string
  latitude: number
  longitude: number
  foto?: string | null
}

export interface FiltrosRelato {
  status?: StatusRelato
  bairro?: string
  tipo?: TipoObstaculo
  gravidade?: Gravidade
  latitude?: number
  longitude?: number
  raio?: number
}

export interface Classificacao {
  tipoSugerido: TipoObstaculo
  gravidadeSugerida: Gravidade
  confianca: number
  vaiParaModeracao: boolean
}

export interface Validacao {
  id: number
  relatoId: number
  voto: TipoVoto
  comentario?: string | null
  dataValidacao: string
  minha: boolean
}

export interface ValidacaoEntrada {
  voto: TipoVoto
  comentario?: string
  latitude: number
  longitude: number
}

/** Ponto no mapa: [latitude, longitude] */
export type Coordenada = [number, number]

export interface RotaCandidata {
  distanciaMetros: number
  pontos: Coordenada[]
}

export interface AlertaRota {
  relatoId: number
  tipo: TipoObstaculo
  gravidade: Gravidade
  status: StatusRelato
  endereco: string
  latitude: number
  longitude: number
  distanciaDaOrigemMetros: number
  penalidade: number
  bloqueia: boolean
}

export interface RotaAvaliada {
  posicaoOriginal: number
  distanciaMetros: number
  tempoMinutos: number
  indiceAcessibilidade: number
  classificacao: string
  bloqueada: boolean
  alertas: AlertaRota[]
}

export interface AvaliacaoRotas {
  perfil: PerfilMobilidade
  periodoNoturno: boolean
  existeRotaAcessivel: boolean
  aviso?: string | null
  rotas: RotaAvaliada[]
}

export interface IndicadorBairro {
  bairro: string
  total: number
  ativos: number
  resolvidos: number
  tempoMedioResolucaoDias?: number | null
}

export interface Indicadores {
  totalRelatos: number
  ativos: number
  emObra: number
  resolvidos: number
  tempoMedioResolucaoDias?: number | null
  atualizadoEm: string
  porBairro: IndicadorBairro[]
  porTipo: { tipo: TipoObstaculo; total: number }[]
}

export interface PontoCritico {
  posicao: number
  relato: Relato
  indiceImpacto: number
  composicao: {
    gravidade: number
    confirmacoes: number
    proximidade: number
    fluxoPedestres: number
  }
  equipamentoProximo: string
  distanciaEquipamentoMetros: number
}

/** Assuntos aceitos pelo POST /contatos */
export type AssuntoContato = 'DUVIDA' | 'PROBLEMA_SITE' | 'PARCERIA' | 'IMPRENSA' | 'OUTRO'

export type StatusContato = 'ABERTO' | 'RESPONDIDO' | 'ARQUIVADO'

/** Corpo do POST /contatos */
export interface ContatoEnvio {
  nome: string
  email: string
  assunto: AssuntoContato
  mensagem: string
}

/** Mensagem de contato devolvida pela API */
export interface Contato extends ContatoEnvio {
  id: number
  usuarioId: number | null
  status: StatusContato
  dataEnvio: string
}

/** Formato padrão de erro devolvido pela API Java (ErroResponseDto) */
export interface ErroApi {
  erro: string
  detalhe: string
}

/** Endereço encontrado pela busca do mapa (OpenStreetMap) */
export interface LocalEncontrado {
  nome: string
  latitude: number
  longitude: number
  bairro?: string
}

export interface Integrante {
  rm: string
  nome: string
  turma: string
  papel: string
  responsabilidades: string[]
  github?: string
  linkedin?: string
}
