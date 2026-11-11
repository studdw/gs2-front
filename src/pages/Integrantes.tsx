import { Link } from 'react-router-dom'
import { TituloPagina } from '../components/Layout'
import { INTEGRANTES, iniciais } from '../data/integrantes'

export function Integrantes() {
  return (
    <div>
      <TituloPagina titulo="Integrantes">
        Equipe Passo Livre Tecnologia - 1º ano de Análise e Desenvolvimento de Sistemas, FIAP.
      </TituloPagina>

      <ul className="grid gap-4 md:grid-cols-3">
        {INTEGRANTES.map((integrante) => (
          <li key={integrante.rm} className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <span
              aria-hidden="true"
              className="mx-auto flex size-20 items-center justify-center rounded-full bg-marca-100 text-2xl font-bold text-marca-900"
            >
              {iniciais(integrante.nome)}
            </span>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">{integrante.nome}</h2>
            <p className="text-sm text-slate-600">
              RM {integrante.rm} - Turma {integrante.turma}
            </p>
            <p className="mt-2 text-sm text-slate-700">{integrante.papel}</p>
            {/* Rota com parâmetro: /integrantes/:rm */}
            <Link
              to={`/integrantes/${integrante.rm}`}
              className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-marca-800 hover:underline"
              aria-label={`Ver o perfil de ${integrante.nome}`}
            >
              Ver perfil →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
