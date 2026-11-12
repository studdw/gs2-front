import { PERFIS } from '../data/rotulos'
import type { PerfilMobilidade } from '../types'

interface SeletorPerfilProps {
  valor: PerfilMobilidade | null
  aoEscolher: (perfil: PerfilMobilidade) => void
  /** Nome do grupo de opções (precisa ser único na página) */
  nome?: string
}

/**
 * Escolha do perfil de mobilidade com cartões grandes (tela T1 do projeto).
 * É um grupo de radio buttons de verdade, então funciona com teclado e leitor de tela.
 */
export function SeletorPerfil({ valor, aoEscolher, nome = 'perfil-mobilidade' }: SeletorPerfilProps) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-slate-800">Como você se desloca?</legend>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {PERFIS.map((perfil) => {
          const marcado = valor === perfil.valor
          return (
            <label
              key={perfil.valor}
              className={`flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 px-3 py-3 text-center text-sm font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-marca-700 ${
                marcado
                  ? 'border-marca-700 bg-marca-50 text-marca-900'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-marca-200'
              }`}
            >
              <input
                type="radio"
                name={nome}
                value={perfil.valor}
                checked={marcado}
                onChange={() => aoEscolher(perfil.valor)}
                className="sr-only"
              />
              <span aria-hidden="true" className="text-2xl">
                {perfil.emoji}
              </span>
              {perfil.rotulo}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
