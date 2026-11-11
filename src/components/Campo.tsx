import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

const ESTILO_CONTROLE =
  'block w-full min-h-11 rounded-xl border bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-marca-600 focus:outline-none focus:ring-2 focus:ring-marca-200'

interface PropsComuns {
  rotulo: string
  /** Mensagem de erro de validação do campo */
  erro?: string
  /** Texto de ajuda exibido abaixo do campo */
  dica?: string
  /** Marca visualmente o campo como opcional */
  opcional?: boolean
}

function Moldura({
  id,
  rotulo,
  erro,
  dica,
  opcional,
  children,
}: PropsComuns & { id: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-800">
        {rotulo} {opcional && <span className="font-normal text-slate-500">(opcional)</span>}
      </label>
      {children}
      {dica && !erro && (
        <p id={`${id}-dica`} className="mt-1.5 text-sm text-slate-600">
          {dica}
        </p>
      )}
      {erro && (
        <p id={`${id}-erro`} role="alert" className="mt-1.5 text-sm font-medium text-red-700">
          {erro}
        </p>
      )}
    </div>
  )
}

function descricaoAria(id: string, erro?: string, dica?: string): string | undefined {
  if (erro) return `${id}-erro`
  if (dica) return `${id}-dica`
  return undefined
}

/** Campo de texto com rótulo, dica e mensagem de erro ligados por aria-describedby. */
export function Campo({ rotulo, erro, dica, opcional, className = '', ...resto }: PropsComuns & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  return (
    <Moldura id={id} rotulo={rotulo} erro={erro} dica={dica} opcional={opcional}>
      <input
        id={id}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descricaoAria(id, erro, dica)}
        className={`${ESTILO_CONTROLE} ${erro ? 'border-red-600' : 'border-slate-300'} ${className}`}
        {...resto}
      />
    </Moldura>
  )
}

/** Campo de texto longo. */
export function AreaTexto({
  rotulo,
  erro,
  dica,
  opcional,
  className = '',
  ...resto
}: PropsComuns & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId()
  return (
    <Moldura id={id} rotulo={rotulo} erro={erro} dica={dica} opcional={opcional}>
      <textarea
        id={id}
        rows={3}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descricaoAria(id, erro, dica)}
        className={`${ESTILO_CONTROLE} ${erro ? 'border-red-600' : 'border-slate-300'} ${className}`}
        {...resto}
      />
    </Moldura>
  )
}

/** Lista de opções. */
export function Selecao({
  rotulo,
  erro,
  dica,
  opcional,
  className = '',
  children,
  ...resto
}: PropsComuns & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId()
  return (
    <Moldura id={id} rotulo={rotulo} erro={erro} dica={dica} opcional={opcional}>
      <select
        id={id}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descricaoAria(id, erro, dica)}
        className={`${ESTILO_CONTROLE} ${erro ? 'border-red-600' : 'border-slate-300'} ${className}`}
        {...resto}
      >
        {children}
      </select>
    </Moldura>
  )
}
