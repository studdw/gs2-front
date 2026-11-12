import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Botao } from '../components/Botao'
import { Selecao } from '../components/Campo'
import { Carregando, ErroCarregamento, EstadoVazio, Mensagem } from '../components/Feedback'
import { Cartao, TituloPagina } from '../components/Layout'
import { Nota, SeloGravidade, SeloStatus } from '../components/Selos'
import { useAuth } from '../context/AuthContext'
import { formatarData, formatarDistancia, GRAVIDADES, TIPOS } from '../data/rotulos'
import { useRequisicao } from '../hooks/useRequisicao'
import { mensagemDeErro } from '../services/api'
import { buscarIndicadores, buscarRanking } from '../services/painelService'
import { alterarStatusRelato, listarRelatos } from '../services/relatoService'
import type { Gravidade, Indicadores, PontoCritico, Relato, TipoObstaculo } from '../types'

function tomDoImpacto(indice: number): 'bom' | 'medio' | 'ruim' {
  if (indice >= 70) return 'ruim'
  return indice >= 45 ? 'medio' : 'bom'
}

function rotuloDoImpacto(indice: number): string {
  if (indice >= 70) return 'Impacto alto'
  return indice >= 45 ? 'Impacto médio' : 'Impacto baixo'
}

/** Números gerais e por bairro: GET /painel/indicadores (HU13). */
function IndicadoresGerais({ dados }: { dados: Indicadores }) {
  const cartoes = [
    { rotulo: 'Relatos ativos', valor: String(dados.ativos) },
    { rotulo: 'Em obra', valor: String(dados.emObra) },
    { rotulo: 'Resolvidos', valor: String(dados.resolvidos) },
    {
      rotulo: 'Tempo médio até resolver',
      valor:
        dados.tempoMedioResolucaoDias != null
          ? `${String(dados.tempoMedioResolucaoDias).replace('.', ',')} dias`
          : '-',
    },
  ]
  const maiorTotal = Math.max(1, ...dados.porTipo.map((item) => item.total))

  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cartoes.map((cartao) => (
          <div key={cartao.rotulo} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <dt className="text-sm text-slate-600">{cartao.rotulo}</dt>
            <dd className="mt-1 text-2xl font-bold text-slate-900">{cartao.valor}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-6 lg:grid-cols-2">
        <Cartao>
          <h3 className="text-base font-semibold text-slate-900">Por bairro</h3>
          {/* A tabela rola dentro do cartão em telas estreitas, sem empurrar a página */}
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[26rem] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th scope="col" className="py-2 pr-3 font-medium">Bairro</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Ativos</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Resolvidos</th>
                  <th scope="col" className="py-2 pl-3 text-right font-medium">Tempo médio</th>
                </tr>
              </thead>
              <tbody>
                {dados.porBairro.map((bairro) => (
                  <tr key={bairro.bairro} className="border-b border-slate-100 last:border-0">
                    <th scope="row" className="py-2 pr-3 font-medium text-slate-900">{bairro.bairro}</th>
                    <td className="px-3 py-2 text-right tabular-nums">{bairro.ativos}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{bairro.resolvidos}</td>
                    <td className="py-2 pl-3 text-right tabular-nums">
                      {bairro.tempoMedioResolucaoDias != null
                        ? `${String(bairro.tempoMedioResolucaoDias).replace('.', ',')} dias`
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Cartao>

        <Cartao>
          <h3 className="text-base font-semibold text-slate-900">Por tipo de obstáculo</h3>
          <ul className="mt-3 space-y-3">
            {dados.porTipo.map((item) => (
              <li key={item.tipo}>
                <div className="flex justify-between gap-3 text-sm">
                  <span className="text-slate-800">{TIPOS[item.tipo]}</span>
                  <span className="font-semibold tabular-nums text-slate-900">{item.total}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-slate-100" aria-hidden="true">
                  <div className="h-2 rounded-full bg-marca-600" style={{ width: `${(item.total / maiorTotal) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Cartao>
      </div>

      <p className="text-xs text-slate-600">
        Dados atualizados em {new Date(dados.atualizadoEm).toLocaleString('pt-BR')}. O painel não exibe nenhum dado
        pessoal de quem reportou ou validou.
      </p>
    </div>
  )
}

/** Um ponto do ranking, com a composição do Índice de Impacto (RN19). */
function ItemDoRanking({ ponto }: { ponto: PontoCritico }) {
  const fatores = [
    { rotulo: 'Gravidade', peso: '40%', valor: ponto.composicao.gravidade },
    { rotulo: 'Confirmações', peso: '25%', valor: ponto.composicao.confirmacoes },
    { rotulo: 'Proximidade de equipamentos', peso: '20%', valor: ponto.composicao.proximidade },
    { rotulo: 'Fluxo de pedestres', peso: '15%', valor: ponto.composicao.fluxoPedestres },
  ]
  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{ponto.posicao}º lugar</p>
          <h3 className="text-base font-semibold text-slate-900">
            <Link to={`/relatos/${ponto.relato.id}`} className="hover:underline">
              {TIPOS[ponto.relato.tipo]}
            </Link>
          </h3>
          <p className="text-sm text-slate-600">
            {ponto.relato.endereco} - {ponto.relato.bairro}
          </p>
        </div>
        <Nota valor={ponto.indiceImpacto} rotulo={rotuloDoImpacto(ponto.indiceImpacto)} tom={tomDoImpacto(ponto.indiceImpacto)} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <SeloStatus status={ponto.relato.status} />
        <SeloGravidade gravidade={ponto.relato.gravidade} />
        <span className="text-xs text-slate-600">
          A {formatarDistancia(ponto.distanciaEquipamentoMetros)} de {ponto.equipamentoProximo}
        </span>
      </div>

      <details className="mt-3 text-sm">
        <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-marca-800">
          Como chegamos a essa nota
        </summary>
        <dl className="mt-1 space-y-1.5">
          {fatores.map((fator) => (
            <div key={fator.rotulo} className="flex justify-between gap-3">
              <dt className="text-slate-700">
                {fator.rotulo} <span className="text-slate-500">(peso {fator.peso})</span>
              </dt>
              <dd className="font-semibold tabular-nums text-slate-900">{fator.valor}</dd>
            </div>
          ))}
        </dl>
      </details>

      <Link
        to={`/relatos/${ponto.relato.id}`}
        className="mt-1 inline-flex min-h-11 items-center text-sm font-semibold text-marca-800 hover:underline"
        aria-label={`Abrir o relato ${ponto.relato.protocolo}`}
      >
        Abrir relato →
      </Link>
    </li>
  )
}

/** Fila de moderação do gestor: relatos com baixa confiança aguardando aprovação (RN11). */
function FilaDeModeracao({ aoModerar }: { aoModerar: () => void }) {
  const fila = useRequisicao((sinal) => listarRelatos({ status: 'EM_MODERACAO' }, sinal), [])
  const [emAndamento, setEmAndamento] = useState<number | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  async function moderar(relato: Relato, aprovar: boolean) {
    setEmAndamento(relato.id)
    setErro(null)
    try {
      await alterarStatusRelato(relato.id, aprovar ? 'PUBLICADO' : 'REJEITADO')
      fila.recarregar()
      aoModerar()
    } catch (falha) {
      setErro(mensagemDeErro(falha))
    } finally {
      setEmAndamento(null)
    }
  }

  return (
    <Cartao className="border-marca-200 bg-marca-50">
      <h2 className="text-lg font-semibold text-slate-900">Fila de moderação</h2>
      <p className="mb-3 mt-1 text-sm text-slate-600">Visível só para gestores. Relatos com baixa confiança na classificação.</p>
      {fila.carregando && !fila.dados && <Carregando texto="Buscando a fila..." />}
      {fila.erro && <ErroCarregamento mensagem={fila.erro} aoTentarDeNovo={fila.recarregar} />}
      {erro && <Mensagem tipo="erro">{erro}</Mensagem>}
      {fila.dados && fila.dados.length === 0 && <p className="text-sm text-slate-700">Nenhum relato aguardando moderação.</p>}
      {fila.dados && fila.dados.length > 0 && (
        <ul className="space-y-3">
          {fila.dados.map((relato) => (
            <li key={relato.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3">
              <div className="min-w-0">
                <Link to={`/relatos/${relato.id}`} className="text-sm font-semibold text-slate-900 hover:underline">
                  {TIPOS[relato.tipo]} - {relato.endereco}
                </Link>
                <p className="text-xs text-slate-600">
                  {relato.protocolo} - {formatarData(relato.dataCriacao)} - confiança {relato.confiancaIa}%
                </p>
              </div>
              <div className="flex gap-2">
                <Botao onClick={() => moderar(relato, true)} carregando={emAndamento === relato.id} disabled={emAndamento !== null}>
                  Aprovar
                </Botao>
                <Botao variante="secundario" onClick={() => moderar(relato, false)} disabled={emAndamento !== null}>
                  Rejeitar
                </Botao>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Cartao>
  )
}

/** Painel público (HU13) com ranking de pontos críticos por Índice de Impacto (HU11). */
export function Painel() {
  const { usuario } = useAuth()
  const [bairro, setBairro] = useState('')
  const [tipo, setTipo] = useState<TipoObstaculo | ''>('')
  const [gravidade, setGravidade] = useState<Gravidade | ''>('')

  const indicadores = useRequisicao((sinal) => buscarIndicadores(sinal), [])
  const ranking = useRequisicao((sinal) => buscarRanking({ bairro, tipo, gravidade }, sinal), [bairro, tipo, gravidade])

  function recarregarTudo() {
    indicadores.recarregar()
    ranking.recarregar()
  }

  return (
    <div className="space-y-10">
      <TituloPagina titulo="Painel público">
        Onde estão os problemas, o que já foi resolvido e quais pontos merecem obra primeiro. Aberto a qualquer pessoa,
        sem cadastro.
      </TituloPagina>

      {usuario?.papel === 'GESTOR' && <FilaDeModeracao aoModerar={recarregarTudo} />}

      <section aria-labelledby="titulo-indicadores">
        <h2 id="titulo-indicadores" className="mb-4 text-xl font-bold text-slate-900">
          Indicadores
        </h2>
        {indicadores.carregando && !indicadores.dados && <Carregando texto="Carregando indicadores..." />}
        {indicadores.erro && <ErroCarregamento mensagem={indicadores.erro} aoTentarDeNovo={indicadores.recarregar} />}
        {indicadores.dados && !indicadores.erro && indicadores.dados.totalRelatos === 0 && (
          <EstadoVazio titulo="Ainda não há relatos">Quando a comunidade começar a reportar, os números aparecem aqui.</EstadoVazio>
        )}
        {indicadores.dados && !indicadores.erro && indicadores.dados.totalRelatos > 0 && (
          <IndicadoresGerais dados={indicadores.dados} />
        )}
      </section>

      <section aria-labelledby="titulo-ranking">
        <h2 id="titulo-ranking" className="text-xl font-bold text-slate-900">
          Ranking de pontos críticos
        </h2>
        <p className="mb-4 mt-1 text-sm text-slate-600">
          Ordenado pelo Índice de Impacto (0 a 100): gravidade, confirmações, proximidade de equipamentos públicos e
          fluxo de pedestres.{' '}
          <Link to="/sobre#titulo-indices" className="font-semibold text-marca-800 underline">
            Como calculamos?
          </Link>
        </p>

        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <Selecao rotulo="Bairro" value={bairro} onChange={(e) => setBairro(e.target.value)}>
            <option value="">Todos os bairros</option>
            {(indicadores.dados?.porBairro ?? [])
              .map((item) => item.bairro)
              .sort((a, b) => a.localeCompare(b, 'pt-BR'))
              .map((nome) => (
                <option key={nome} value={nome}>
                  {nome}
                </option>
              ))}
          </Selecao>
          <Selecao rotulo="Tipo de obstáculo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoObstaculo | '')}>
            <option value="">Todos os tipos</option>
            {Object.entries(TIPOS).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </Selecao>
          <Selecao rotulo="Gravidade" value={gravidade} onChange={(e) => setGravidade(e.target.value as Gravidade | '')}>
            <option value="">Todas as gravidades</option>
            {Object.entries(GRAVIDADES).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </Selecao>
        </div>

        {ranking.carregando && <Carregando texto="Montando o ranking..." />}
        {ranking.erro && <ErroCarregamento mensagem={ranking.erro} aoTentarDeNovo={ranking.recarregar} />}
        {!ranking.carregando && !ranking.erro && ranking.dados?.length === 0 && (
          <EstadoVazio titulo="Nenhum ponto crítico com esses filtros">Tente outro bairro, tipo ou gravidade.</EstadoVazio>
        )}
        {!ranking.carregando && !ranking.erro && ranking.dados && ranking.dados.length > 0 && (
          <ol className="grid gap-4 lg:grid-cols-2">
            {ranking.dados.map((ponto) => (
              <ItemDoRanking key={ponto.relato.id} ponto={ponto} />
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
