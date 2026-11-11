import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

type Variante = 'primario' | 'secundario' | 'perigo' | 'fantasma'

const BASE =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60'

const VARIANTES: Record<Variante, string> = {
  primario: 'bg-marca-700 text-white hover:bg-marca-800',
  secundario: 'bg-white text-marca-800 ring-1 ring-inset ring-slate-300 hover:bg-marca-50',
  perigo: 'bg-red-700 text-white hover:bg-red-800',
  fantasma: 'text-marca-800 hover:bg-marca-50',
}

interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  /** Mostra o indicador de carregamento e desabilita o botão */
  carregando?: boolean
  larguraTotal?: boolean
  children: ReactNode
}

/** Botão padrão do site. Altura mínima de 44 px para facilitar o toque (WCAG). */
export function Botao({
  variante = 'primario',
  carregando = false,
  larguraTotal = false,
  className = '',
  children,
  disabled,
  type = 'button',
  ...resto
}: BotaoProps) {
  return (
    <button
      type={type}
      disabled={disabled || carregando}
      aria-busy={carregando}
      className={`${BASE} ${VARIANTES[variante]} ${larguraTotal ? 'w-full' : ''} ${className}`}
      {...resto}
    >
      {carregando && (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  )
}

interface LinkBotaoProps extends LinkProps {
  variante?: Variante
  larguraTotal?: boolean
}

/** Link com a mesma aparência do botão, para navegação entre páginas. */
export function LinkBotao({ variante = 'primario', larguraTotal = false, className = '', ...resto }: LinkBotaoProps) {
  return <Link className={`${BASE} ${VARIANTES[variante]} ${larguraTotal ? 'w-full' : ''} ${className}`} {...resto} />
}
