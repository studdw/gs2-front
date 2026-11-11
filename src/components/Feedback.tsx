import type { ReactNode } from 'react'
import { Botao } from './Botao'

type TipoMensagem = 'sucesso' | 'erro' | 'aviso' | 'info'

const ESTILOS: Record<TipoMensagem, { classe: string; icone: string }> = {
  sucesso: { classe: 'border-emerald-300 bg-emerald-50 text-emerald-900', icone: '✓' },
  erro: { classe: 'border-red-300 bg-red-50 text-red-900', icone: '!' },
  aviso: { classe: 'border-amber-300 bg-amber-50 text-amber-900', icone: '!' },
  info: { classe: 'border-sky-300 bg-sky-50 text-sky-900', icone: 'i' },
}

/** Caixa de mensagem (sucesso, erro, aviso ou informação). Erros são anunciados por leitores de tela. */
export function Mensagem({ tipo, titulo, children }: { tipo: TipoMensagem; titulo?: string; children: ReactNode }) {
  const estilo = ESTILOS[tipo]
  return (
    <div
      role={tipo === 'erro' ? 'alert' : 'status'}
      className={`flex gap-3 rounded-xl border px-4 py-3 text-sm ${estilo.classe}`}
    >
      <span
        aria-hidden="true"
        className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-current/15 text-xs font-bold"
      >
        {estilo.icone}
      </span>
      <div className="min-w-0">
        {titulo && <p className="font-semibold">{titulo}</p>}
        <div className="break-words">{children}</div>
      </div>
    </div>
  )
}

/** Indicador de carregamento com texto. */
export function Carregando({ texto = 'Carregando...' }: { texto?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-10 text-slate-600">
      <span aria-hidden="true" className="size-5 animate-spin rounded-full border-2 border-marca-700 border-t-transparent" />
      <span>{texto}</span>
    </div>
  )
}

/** Estado de erro de uma busca na API, com botão para tentar de novo. */
export function ErroCarregamento({ mensagem, aoTentarDeNovo }: { mensagem: string; aoTentarDeNovo: () => void }) {
  return (
    <div className="space-y-3">
      <Mensagem tipo="erro" titulo="Não foi possível carregar">
        {mensagem}
      </Mensagem>
      <Botao variante="secundario" onClick={aoTentarDeNovo}>
        Tentar de novo
      </Botao>
    </div>
  )
}

/** Estado vazio: explica que não há dados e convida para uma ação. */
export function EstadoVazio({ titulo, children, acao }: { titulo: string; children?: ReactNode; acao?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
      <p className="text-base font-semibold text-slate-800">{titulo}</p>
      {children && <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">{children}</p>}
      {acao && <div className="mt-4 flex justify-center">{acao}</div>}
    </div>
  )
}
