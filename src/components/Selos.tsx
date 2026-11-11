import { CORES_GRAVIDADE, GRAVIDADES, STATUS } from '../data/rotulos'
import type { Gravidade, StatusRelato } from '../types'

const BASE = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset'

/** Selo de gravidade: sempre cor + texto, nunca só cor. */
export function SeloGravidade({ gravidade }: { gravidade: Gravidade }) {
  return <span className={`${BASE} ${CORES_GRAVIDADE[gravidade].classe}`}>Gravidade {GRAVIDADES[gravidade].toLowerCase()}</span>
}

/** Selo com o status atual do relato. */
export function SeloStatus({ status }: { status: StatusRelato }) {
  return <span className={`${BASE} ${STATUS[status].classe}`}>{STATUS[status].rotulo}</span>
}

/** Nota de 0 a 100 em destaque, com cor e texto (índice de acessibilidade ou de impacto). */
export function Nota({ valor, rotulo, tom }: { valor: number; rotulo: string; tom: 'bom' | 'medio' | 'ruim' }) {
  const cores = {
    bom: 'bg-emerald-600',
    medio: 'bg-amber-500',
    ruim: 'bg-red-600',
  }
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex size-12 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white ${cores[tom]}`}
      >
        {valor}
      </span>
      <span className="text-sm font-semibold text-slate-800">{rotulo}</span>
    </div>
  )
}
