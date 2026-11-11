import { Link } from 'react-router-dom'
import { formatarData, formatarDistancia, TIPOS } from '../data/rotulos'
import type { Relato } from '../types'
import { SeloGravidade, SeloStatus } from './Selos'

/** Cartão resumido de um relato. Usado em "Relatos", "Meus relatos" e no painel. */
export function CartaoRelato({ relato, destaque }: { relato: Relato; destaque?: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-wrap items-center gap-2">
        <SeloStatus status={relato.status} />
        <SeloGravidade gravidade={relato.gravidade} />
        {relato.meu && (
          <span className="rounded-full bg-marca-100 px-2.5 py-0.5 text-xs font-semibold text-marca-900">Meu relato</span>
        )}
      </div>

      <h3 className="mt-3 text-base font-semibold text-slate-900">
        <Link to={`/relatos/${relato.id}`} className="hover:underline">
          {TIPOS[relato.tipo]}
        </Link>
      </h3>
      <p className="text-sm text-slate-600">
        {relato.endereco} - {relato.bairro}
      </p>
      {relato.descricao && <p className="mt-2 line-clamp-2 text-sm text-slate-700">{relato.descricao}</p>}

      <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
        <div className="flex gap-1">
          <dt>Protocolo:</dt>
          <dd className="font-medium text-slate-800">{relato.protocolo}</dd>
        </div>
        <div className="flex gap-1">
          <dt>Criado em:</dt>
          <dd className="font-medium text-slate-800">{formatarData(relato.dataCriacao)}</dd>
        </div>
        {relato.distanciaMetros != null && (
          <div className="flex gap-1">
            <dt>Distância:</dt>
            <dd className="font-medium text-slate-800">{formatarDistancia(relato.distanciaMetros)}</dd>
          </div>
        )}
      </dl>

      {relato.status === 'PUBLICADO' && relato.confirmacoesFaltantes > 0 && (
        <p className="mt-3 text-sm font-medium text-marca-800">
          {relato.confirmacoesFaltantes === 1
            ? 'Falta 1 confirmação'
            : `Faltam ${relato.confirmacoesFaltantes} confirmações`}
        </p>
      )}
      {destaque && <p className="mt-3 text-sm font-medium text-slate-800">{destaque}</p>}

      <Link
        to={`/relatos/${relato.id}`}
        className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-marca-800 hover:underline"
        aria-label={`Ver detalhes do relato ${relato.protocolo}: ${TIPOS[relato.tipo]}`}
      >
        Ver detalhes →
      </Link>
    </article>
  )
}
