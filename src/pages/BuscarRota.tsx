import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Botao } from '../components/Botao'
import { Campo } from '../components/Campo'
import { Carregando, Mensagem } from '../components/Feedback'
import { Cartao, TituloPagina } from '../components/Layout'
import { Mapa, type LinhaMapa, type MarcadorMapa } from '../components/Mapa'
import { SeletorPerfil } from '../components/SeletorPerfil'
import { Nota, SeloGravidade } from '../components/Selos'
import { useAuth } from '../context/AuthContext'
import { usePreferencias } from '../context/PreferenciasContext'
import { CORES_GRAVIDADE, formatarDistancia, rotuloPerfil, TIPOS } from '../data/rotulos'
import { mensagemDeErro } from '../services/api'
import { buscarEndereco, buscarEnderecoDoPonto, buscarTrajetos, CENTRO_PADRAO, MapaError } from '../services/mapaService'
import { avaliarRotas } from '../services/rotaService'
import type { AvaliacaoRotas, Coordenada, PerfilMobilidade, RotaAvaliada, RotaCandidata } from '../types'

/** Um ponto da busca: o texto digitado e, quando já conhecida, a coordenada. */
interface Ponto {
  texto: string
  posicao: Coordenada | null
}

interface Resultado {
  trajetos: RotaCandidata[]
  avaliacao: AvaliacaoRotas
  origem: Coordenada
  destino: Coordenada
}

const PONTO_VAZIO: Ponto = { texto: '', posicao: null }

function tomDoIndice(rota: RotaAvaliada): 'bom' | 'medio' | 'ruim' {
  if (rota.bloqueada || rota.indiceAcessibilidade < 60) return 'ruim'
  return rota.indiceAcessibilidade >= 80 ? 'bom' : 'medio'
}

/** Busca de rota acessível (UC04 / HU03 e HU04). Não exige conta. */
export function BuscarRota() {
  const { usuario } = useAuth()
  const { perfil: perfilSalvo, definirPerfilVisitante, localizacao, usarGps, buscandoGps, erroGps } = usePreferencias()

  const [perfil, setPerfil] = useState<PerfilMobilidade | null>(perfilSalvo)
  const [trocandoPerfil, setTrocandoPerfil] = useState(false)
  const [origem, setOrigem] = useState<Ponto>(PONTO_VAZIO)
  const [destino, setDestino] = useState<Ponto>(PONTO_VAZIO)
  const [alvoDoClique, setAlvoDoClique] = useState<'origem' | 'destino'>('destino')
  const [erros, setErros] = useState<{ origem?: string; destino?: string; perfil?: string }>({})
  const [buscando, setBuscando] = useState(false)
  const [erroBusca, setErroBusca] = useState<string | null>(null)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [selecionada, setSelecionada] = useState(0)
  const tituloResultados = useRef<HTMLHeadingElement>(null)

  function escolherPerfil(novo: PerfilMobilidade) {
    setPerfil(novo)
    setTrocandoPerfil(false)
    setErros((atuais) => ({ ...atuais, perfil: undefined }))
    // Visitante: guarda a escolha no navegador para as próximas buscas
    if (!usuario) definirPerfilVisitante(novo)
  }

  // Quando o GPS responde, usa a posição como origem (UC04, passo 2)
  const posicaoGps = localizacao?.origem === 'gps' ? localizacao.posicao : null
  useEffect(() => {
    if (posicaoGps) setOrigem({ texto: 'Minha localização atual', posicao: posicaoGps })
  }, [posicaoGps])

  async function marcarNoMapa(posicao: Coordenada) {
    const definir = alvoDoClique === 'origem' ? setOrigem : setDestino
    definir({ texto: 'Ponto marcado no mapa', posicao })
    setErros((atuais) => ({ ...atuais, [alvoDoClique]: undefined }))
    // Depois de marcar a origem, o próximo clique naturalmente é o destino
    if (alvoDoClique === 'origem') setAlvoDoClique('destino')
    // Troca "Ponto marcado no mapa" pelo nome da rua, se o serviço de mapas responder
    const endereco = await buscarEnderecoDoPonto(posicao[0], posicao[1])
    if (endereco?.endereco) {
      definir((atual) => (atual.posicao === posicao ? { ...atual, texto: endereco.endereco } : atual))
    }
  }

  /** Transforma o texto digitado em coordenada. Devolve null se o endereço não existir. */
  async function resolver(ponto: Ponto): Promise<Coordenada | null> {
    if (ponto.posicao) return ponto.posicao
    const encontrados = await buscarEndereco(ponto.texto)
    return encontrados.length > 0 ? [encontrados[0].latitude, encontrados[0].longitude] : null
  }

  async function buscar(evento?: FormEvent) {
    evento?.preventDefault()
    const novos: typeof erros = {}
    if (!perfil) novos.perfil = 'Escolha como você se desloca para calcularmos a rota certa.'
    if (!origem.posicao && origem.texto.trim().length < 3) novos.origem = 'Informe de onde você vai sair.'
    if (!destino.posicao && destino.texto.trim().length < 3) novos.destino = 'Informe para onde você quer ir.'
    setErros(novos)
    setErroBusca(null)
    if (Object.keys(novos).length > 0 || !perfil) return

    setBuscando(true)
    setResultado(null)
    try {
      // 1. Endereços -> coordenadas (OpenStreetMap)
      const [posOrigem, posDestino] = await Promise.all([resolver(origem), resolver(destino)])
      const naoEncontrado = 'Não encontramos esse endereço. Confira o número ou escolha um ponto no mapa.'
      if (!posOrigem || !posDestino) {
        setErros({ origem: posOrigem ? undefined : naoEncontrado, destino: posDestino ? undefined : naoEncontrado })
        return
      }
      setOrigem((atual) => ({ ...atual, posicao: posOrigem }))
      setDestino((atual) => ({ ...atual, posicao: posDestino }))

      // 2. Trajetos a pé candidatos (OpenStreetMap) e 3. índice de acessibilidade (API Java)
      const trajetos = await buscarTrajetos(posOrigem, posDestino)
      const avaliacao = await avaliarRotas(perfil, trajetos)
      setResultado({ trajetos, avaliacao, origem: posOrigem, destino: posDestino })
      setSelecionada(avaliacao.rotas[0].posicaoOriginal)
      // Leva o foco para os resultados (ajuda quem usa leitor de tela)
      setTimeout(() => tituloResultados.current?.focus(), 0)
    } catch (erro) {
      setErroBusca(erro instanceof MapaError ? erro.message : mensagemDeErro(erro))
    } finally {
      setBuscando(false)
    }
  }

  const rotaSelecionada = resultado?.avaliacao.rotas.find((rota) => rota.posicaoOriginal === selecionada)

  // Desenho do mapa: linhas das rotas, pontos A/B e alertas da rota selecionada
  const linhas = useMemo<LinhaMapa[]>(() => {
    if (!resultado) return []
    return resultado.avaliacao.rotas.map((rota) => ({
      id: rota.posicaoOriginal,
      pontos: resultado.trajetos[rota.posicaoOriginal].pontos,
      cor: rota.posicaoOriginal === selecionada ? '#0f766e' : '#64748b',
      destaque: rota.posicaoOriginal === selecionada,
    }))
  }, [resultado, selecionada])

  const marcadores = useMemo<MarcadorMapa[]>(() => {
    const lista: MarcadorMapa[] = []
    if (origem.posicao) lista.push({ id: 'origem', posicao: origem.posicao, cor: '#0f766e', texto: 'A', titulo: 'Origem' })
    if (destino.posicao) lista.push({ id: 'destino', posicao: destino.posicao, cor: '#1e293b', texto: 'B', titulo: 'Destino' })
    for (const alerta of rotaSelecionada?.alertas ?? []) {
      lista.push({
        id: `alerta-${alerta.relatoId}`,
        posicao: [alerta.latitude, alerta.longitude],
        cor: CORES_GRAVIDADE[alerta.gravidade].hex,
        texto: '!',
        titulo: `${TIPOS[alerta.tipo]} a ${formatarDistancia(alerta.distanciaDaOrigemMetros)} da origem`,
      })
    }
    return lista
  }, [origem.posicao, destino.posicao, rotaSelecionada])

  const enquadrar = useMemo<Coordenada[] | undefined>(() => {
    if (resultado) return resultado.trajetos.flatMap((trajeto) => trajeto.pontos)
    const pontos = [origem.posicao, destino.posicao].filter((ponto): ponto is Coordenada => ponto !== null)
    return pontos.length > 0 ? pontos : undefined
  }, [resultado, origem.posicao, destino.posicao])

  return (
    <div>
      <TituloPagina titulo="Buscar rota">
        Informe origem e destino e compare os caminhos pelo índice de acessibilidade para o seu perfil.
      </TituloPagina>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Cartao>
            <form onSubmit={buscar} noValidate className="space-y-4">
              {/* Perfil ativo sempre visível (heurística H1) */}
              {perfil && !trocandoPerfil ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-marca-50 px-3 py-2">
                  <p className="text-sm text-marca-900">
                    Perfil: <strong>{rotuloPerfil(perfil)}</strong>
                  </p>
                  <Botao variante="fantasma" onClick={() => setTrocandoPerfil(true)} className="px-3">
                    Trocar
                  </Botao>
                </div>
              ) : (
                <div>
                  <SeletorPerfil valor={perfil} aoEscolher={escolherPerfil} nome="perfil-rota" />
                  {erros.perfil && (
                    <p role="alert" className="mt-1.5 text-sm font-medium text-red-700">
                      {erros.perfil}
                    </p>
                  )}
                </div>
              )}

              <div>
                <Campo
                  rotulo="Origem"
                  placeholder="Ex.: Rua Vergueiro, 1000"
                  value={origem.texto}
                  onChange={(e) => setOrigem({ texto: e.target.value, posicao: null })}
                  erro={erros.origem}
                  autoComplete="off"
                />
                <Botao variante="fantasma" onClick={usarGps} carregando={buscandoGps} className="mt-1 -ml-3 px-3">
                  Usar minha localização atual
                </Botao>
                {erroGps && <p className="text-sm text-slate-600">{erroGps}</p>}
              </div>

              <Campo
                rotulo="Destino"
                placeholder="Ex.: Hospital São Paulo"
                value={destino.texto}
                onChange={(e) => setDestino({ texto: e.target.value, posicao: null })}
                erro={erros.destino}
                autoComplete="off"
              />

              <fieldset>
                <legend className="text-sm font-medium text-slate-800">Ou toque no mapa para marcar:</legend>
                <div className="mt-1.5 flex gap-2">
                  {(['origem', 'destino'] as const).map((alvo) => (
                    <label
                      key={alvo}
                      className={`flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-xl border-2 px-3 text-sm font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-marca-700 ${
                        alvoDoClique === alvo ? 'border-marca-700 bg-marca-50 text-marca-900' : 'border-slate-200 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="alvo-do-clique"
                        className="sr-only"
                        checked={alvoDoClique === alvo}
                        onChange={() => setAlvoDoClique(alvo)}
                      />
                      {alvo === 'origem' ? 'A origem' : 'O destino'}
                    </label>
                  ))}
                </div>
              </fieldset>

              <Botao type="submit" carregando={buscando} larguraTotal>
                {buscando ? 'Calculando...' : 'Buscar rota'}
              </Botao>
            </form>
          </Cartao>

          {buscando && <Carregando texto="Calculando a rota mais segura..." />}

          {erroBusca && (
            <div className="space-y-3">
              <Mensagem tipo="erro">{erroBusca}</Mensagem>
              <Botao variante="secundario" onClick={() => buscar()}>
                Tentar de novo
              </Botao>
            </div>
          )}

          {resultado && (
            <section aria-labelledby="titulo-resultados" className="space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="titulo-resultados" ref={tituloResultados} tabIndex={-1} className="text-lg font-semibold text-slate-900">
                  {resultado.avaliacao.rotas.length === 1 ? '1 rota encontrada' : `${resultado.avaliacao.rotas.length} rotas encontradas`}
                </h2>
                <Link to="/sobre#titulo-indices" className="text-sm font-semibold text-marca-800 underline">
                  Como calculamos?
                </Link>
              </div>

              {resultado.avaliacao.aviso && (
                <Mensagem tipo="aviso" titulo="Nenhuma rota acessível encontrada">
                  {resultado.avaliacao.aviso}
                </Mensagem>
              )}
              {resultado.avaliacao.periodoNoturno && (
                <p className="text-sm text-slate-600">
                  Depois das 18h, trechos com pouca iluminação ou isolados pesam o dobro no índice.
                </p>
              )}

              <ul className="space-y-3">
                {resultado.avaliacao.rotas.map((rota, indice) => {
                  const ativa = rota.posicaoOriginal === selecionada
                  return (
                    <li key={rota.posicaoOriginal}>
                      <button
                        type="button"
                        aria-pressed={ativa}
                        onClick={() => setSelecionada(rota.posicaoOriginal)}
                        className={`w-full rounded-2xl border-2 bg-white p-4 text-left shadow-sm transition-colors ${
                          ativa ? 'border-marca-700' : 'border-slate-200 hover:border-marca-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <Nota valor={rota.indiceAcessibilidade} rotulo={rota.classificacao} tom={tomDoIndice(rota)} />
                          {indice === 0 && resultado.avaliacao.existeRotaAcessivel && (
                            <span className="rounded-full bg-marca-100 px-2.5 py-0.5 text-xs font-semibold text-marca-900">
                              Sugerida
                            </span>
                          )}
                        </div>
                        <p className="mt-3 text-sm text-slate-700">
                          <strong>{rota.tempoMinutos} min</strong> - {formatarDistancia(rota.distanciaMetros)} -{' '}
                          {rota.alertas.length === 0
                            ? 'nenhum ponto de atenção'
                            : rota.alertas.length === 1
                              ? '1 ponto de atenção'
                              : `${rota.alertas.length} pontos de atenção`}
                        </p>
                      </button>
                    </li>
                  )
                })}
              </ul>

              {/* Pontos de atenção da rota selecionada (UC05 / RF08) */}
              {rotaSelecionada && (
                <Cartao>
                  <h3 className="text-base font-semibold text-slate-900">Pontos de atenção desta rota</h3>
                  {rotaSelecionada.alertas.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-600">
                      Nenhum obstáculo relatado neste caminho. Se encontrar algum,{' '}
                      <Link to="/relatos/novo" className="font-semibold text-marca-800 underline">
                        reporte
                      </Link>
                      .
                    </p>
                  ) : (
                    <ul className="mt-3 divide-y divide-slate-200">
                      {rotaSelecionada.alertas.map((alerta) => (
                        <li key={alerta.relatoId} className="flex flex-wrap items-center justify-between gap-2 py-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900">
                              {TIPOS[alerta.tipo]}
                              {alerta.bloqueia && <span className="text-red-700"> - bloqueia a passagem</span>}
                            </p>
                            <p className="text-sm text-slate-600">
                              A {formatarDistancia(alerta.distanciaDaOrigemMetros)} da origem - {alerta.endereco}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <SeloGravidade gravidade={alerta.gravidade} />
                            <Link
                              to={`/relatos/${alerta.relatoId}`}
                              className="inline-flex min-h-11 items-center text-sm font-semibold text-marca-800 underline"
                              aria-label={`Ver relato: ${TIPOS[alerta.tipo]} em ${alerta.endereco}`}
                            >
                              Ver
                            </Link>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Cartao>
              )}
            </section>
          )}
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <Mapa
            centro={CENTRO_PADRAO}
            zoom={14}
            marcadores={marcadores}
            linhas={linhas}
            enquadrar={enquadrar}
            aoClicarNoMapa={marcarNoMapa}
            descricao="Mapa da rota. Toque para marcar a origem ou o destino."
            className="h-80 md:h-[28rem] lg:h-[calc(100vh-8rem)]"
          />
          <p className="mt-2 text-xs text-slate-600">
            A = origem, B = destino, ! = ponto de atenção. A rota selecionada aparece em verde.
          </p>
        </div>
      </div>
    </div>
  )
}
