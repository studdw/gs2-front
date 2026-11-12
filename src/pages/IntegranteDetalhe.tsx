import { useParams } from 'react-router-dom'
import { LinkBotao } from '../components/Botao'
import { EstadoVazio } from '../components/Feedback'
import { Cartao } from '../components/Layout'
import { INTEGRANTES, iniciais } from '../data/integrantes'

/** Página de um integrante. O RM vem do parâmetro da rota (/integrantes/:rm). */
export function IntegranteDetalhe() {
  const { rm } = useParams<{ rm: string }>()
  const integrante = INTEGRANTES.find((item) => item.rm === rm)

  if (!integrante) {
    return (
      <EstadoVazio
        titulo="Integrante não encontrado"
        acao={<LinkBotao to="/integrantes">Ver todos os integrantes</LinkBotao>}
      >
        Não existe integrante com o RM {rm} nesta equipe.
      </EstadoVazio>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <LinkBotao to="/integrantes" variante="fantasma" className="-ml-3 mb-4">
        ← Todos os integrantes
      </LinkBotao>
      <Cartao>
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <span
            aria-hidden="true"
            className="flex size-24 shrink-0 items-center justify-center rounded-full bg-marca-100 text-3xl font-bold text-marca-900"
          >
            {iniciais(integrante.nome)}
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{integrante.nome}</h1>
            <p className="text-sm text-slate-600">
              RM {integrante.rm} - Turma {integrante.turma}
            </p>
            <p className="mt-1 text-sm text-slate-700">{integrante.papel}</p>
          </div>
        </div>

        <h2 className="mt-6 text-base font-semibold text-slate-900">Responsabilidades no projeto</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {integrante.responsabilidades.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        {(integrante.github || integrante.linkedin) && (
          <div className="mt-6 flex flex-wrap gap-3">
            {integrante.github && (
              <a
                href={integrante.github}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold text-marca-800 ring-1 ring-inset ring-slate-300 hover:bg-marca-50"
              >
                GitHub (abre em nova aba)
              </a>
            )}
            {integrante.linkedin && (
              <a
                href={integrante.linkedin}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold text-marca-800 ring-1 ring-inset ring-slate-300 hover:bg-marca-50"
              >
                LinkedIn (abre em nova aba)
              </a>
            )}
          </div>
        )}
      </Cartao>
    </div>
  )
}
