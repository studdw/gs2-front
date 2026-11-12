import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Botao, LinkBotao } from '../components/Botao'
import { AreaTexto, Campo, Selecao } from '../components/Campo'
import { Carregando, Mensagem } from '../components/Feedback'
import { Cartao, TituloPagina } from '../components/Layout'
import { Mapa } from '../components/Mapa'
import { SeloStatus } from '../components/Selos'
import { usePreferencias } from '../context/PreferenciasContext'
import { GRAVIDADES, TIPOS } from '../data/rotulos'
import { ApiError, mensagemDeErro } from '../services/api'
import { buscarEnderecoDoPonto, CENTRO_PADRAO } from '../services/mapaService'
import { classificarRelato, criarRelato } from '../services/relatoService'
import type { Classificacao, Coordenada, Gravidade, Relato, TipoObstaculo } from '../types'
import { comprimirImagem } from '../utils/imagem'
import { errosDaApi, temErros, type Erros } from '../utils/validacao'

type Etapa = 1 | 2 | 3
type CamposRelato = 'posicao' | 'endereco' | 'bairro' | 'descricao' | 'foto' | 'tipo' | 'gravidade'

const NOMES_ETAPAS: Record<Etapa, string> = { 1: 'Foto e local', 2: 'Revisão', 3: 'Confirmação' }

/** Reportar problema em 3 etapas (UC06 / HU06 e HU07): foto e local, revisão da sugestão, confirmação. */
export function NovoRelato() {
  const { localizacao, usarGps, buscandoGps, erroGps } = usePreferencias()

  const [etapa, setEtapa] = useState<Etapa>(1)
  const [foto, setFoto] = useState<string | null>(null)
  const [preparandoFoto, setPreparandoFoto] = useState(false)
  const [posicao, setPosicao] = useState<Coordenada | null>(null)
  const [endereco, setEndereco] = useState('')
  const [bairro, setBairro] = useState('')
  const [descricao, setDescricao] = useState('')
  const [erros, setErros] = useState<Erros<CamposRelato>>({})

  const [classificacao, setClassificacao] = useState<Classificacao | null>(null)
  const [tipo, setTipo] = useState<TipoObstaculo>('CALCADA_IRREGULAR')
  const [gravidade, setGravidade] = useState<Gravidade>('MEDIA')
  const [analisando, setAnalisando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erroApi, setErroApi] = useState<ApiError | string | null>(null)
  const [criado, setCriado] = useState<Relato | null>(null)

  /** Posiciona o pino e tenta preencher rua e bairro automaticamente. */
  async function definirPosicao(nova: Coordenada) {
    setPosicao(nova)
    setErros((atuais) => ({ ...atuais, posicao: undefined }))
    const local = await buscarEnderecoDoPonto(nova[0], nova[1])
    if (local) {
      // Só preenche o que a pessoa ainda não digitou
      setEndereco((atual) => atual || local.endereco)
      setBairro((atual) => atual || local.bairro)
    }
  }

  // Quando o GPS responde, coloca o pino na localização atual
  const posicaoGps = localizacao?.origem === 'gps' ? localizacao.posicao : null
  useEffect(() => {
    if (posicaoGps) void definirPosicao(posicaoGps)
  }, [posicaoGps])

  async function escolherFoto(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0]
    if (!arquivo) return
    setPreparandoFoto(true)
    setErros((atuais) => ({ ...atuais, foto: undefined }))
    try {
      setFoto(await comprimirImagem(arquivo))
    } catch (erro) {
      setFoto(null)
      setErros((atuais) => ({ ...atuais, foto: erro instanceof Error ? erro.message : 'Não conseguimos usar essa foto.' }))
    } finally {
      setPreparandoFoto(false)
    }
  }

  /** Etapa 1 -> 2: valida e pede a sugestão automática de tipo e gravidade. */
  async function continuar(evento: FormEvent) {
    evento.preventDefault()
    const novos: Erros<CamposRelato> = {}
    if (!posicao) novos.posicao = 'Marque no mapa onde está o problema.'
    if (endereco.trim().length < 3) novos.endereco = 'Informe a rua e, se souber, o número.'
    if (bairro.trim().length < 2) novos.bairro = 'Informe o bairro.'
    if (descricao.length > 500) novos.descricao = 'A descrição deve ter no máximo 500 caracteres.'
    setErros(novos)
    setErroApi(null)
    if (temErros(novos)) return

    setAnalisando(true)
    try {
      const sugestao = await classificarRelato(descricao.trim())
      setClassificacao(sugestao)
      setTipo(sugestao.tipoSugerido)
      setGravidade(sugestao.gravidadeSugerida)
      setEtapa(2)
    } catch (erro) {
      setErroApi(mensagemDeErro(erro))
    } finally {
      setAnalisando(false)
    }
  }

  /** Etapa 2 -> 3: POST /relatos */
  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (!posicao) return
    setEnviando(true)
    setErroApi(null)
    try {
      const relato = await criarRelato({
        tipo,
        gravidade,
        descricao: descricao.trim() || undefined,
        endereco: endereco.trim(),
        bairro: bairro.trim(),
        latitude: posicao[0],
        longitude: posicao[1],
        foto: foto ?? undefined,
      })
      setCriado(relato)
      setEtapa(3)
    } catch (erro) {
      if (erro instanceof ApiError) {
        setErroApi(erro)
        if (erro.campos.length > 0) {
          // A API recusou algum campo: volta para a etapa 1 mostrando o erro no campo certo
          setErros(errosDaApi<CamposRelato>(erro.campos))
          setEtapa(1)
        }
      } else {
        setErroApi(mensagemDeErro(erro))
      }
    } finally {
      setEnviando(false)
    }
  }

  const textoErroApi = erroApi instanceof ApiError ? erroApi.message : erroApi
  // 409 com protocolo = ja existe um relato igual perto dali (RF12): oferece o caminho para confirma-lo
  const relatoDuplicado = erroApi instanceof ApiError && erroApi.status === 409 && erroApi.message.includes('protocolo')

  return (
    <div className="mx-auto max-w-3xl">
      <TituloPagina titulo="Reportar problema">
        Encontrou um obstáculo na calçada? Conte para a comunidade e para a prefeitura em 3 passos.
      </TituloPagina>

      {/* Indicador de etapas (heurística H1 - visibilidade do status) */}
      <ol className="mb-6 grid grid-cols-3 gap-2" aria-label="Etapas do relato">
        {([1, 2, 3] as const).map((numero) => (
          <li
            key={numero}
            aria-current={numero === etapa ? 'step' : undefined}
            className={`rounded-xl px-3 py-2 text-center text-xs font-semibold md:text-sm ${
              numero === etapa
                ? 'bg-marca-700 text-white'
                : numero < etapa
                  ? 'bg-marca-100 text-marca-900'
                  : 'bg-slate-100 text-slate-600'
            }`}
          >
            {numero} de 3 - {NOMES_ETAPAS[numero]}
          </li>
        ))}
      </ol>

      {etapa === 1 && (
        <Cartao>
          <form onSubmit={continuar} noValidate className="space-y-5">
            <div>
              <label htmlFor="foto-relato" className="mb-1.5 block text-sm font-medium text-slate-800">
                Foto do obstáculo <span className="font-normal text-slate-500">(opcional)</span>
              </label>
              <input
                id="foto-relato"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={escolherFoto}
                aria-describedby="foto-relato-dica"
                className="block w-full text-sm text-slate-700 file:mr-3 file:min-h-11 file:cursor-pointer file:rounded-xl file:border-0 file:bg-marca-50 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-marca-800 hover:file:bg-marca-100"
              />
              <p id="foto-relato-dica" className="mt-1.5 text-sm text-slate-600">
                Enquadre o obstáculo e evite mostrar rostos ou placas de carros. A foto é reduzida antes do envio.
              </p>
              {preparandoFoto && <p role="status" className="mt-2 text-sm text-slate-600">Preparando a foto...</p>}
              {erros.foto && (
                <p role="alert" className="mt-1.5 text-sm font-medium text-red-700">
                  {erros.foto}
                </p>
              )}
              {foto && (
                <img src={foto} alt="Prévia da foto do obstáculo" className="mt-3 max-h-64 rounded-xl border border-slate-200 object-contain" />
              )}
            </div>

            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-800">Onde está o problema?</p>
              <Mapa
                centro={posicao ?? localizacao?.posicao ?? CENTRO_PADRAO}
                zoom={16}
                marcadores={posicao ? [{ id: 'pino', posicao, cor: '#dc2626', texto: '!', titulo: 'Local do problema' }] : []}
                aoClicarNoMapa={definirPosicao}
                descricao="Mapa para marcar o local do problema. Toque no ponto exato."
                className="h-72"
              />
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                <Botao variante="fantasma" onClick={usarGps} carregando={buscandoGps} className="-ml-3 px-3">
                  Usar minha localização atual
                </Botao>
                <p className="text-sm text-slate-600">Ou toque no mapa para colocar o pino no local exato.</p>
              </div>
              {erroGps && <p className="text-sm text-slate-600">{erroGps}</p>}
              {erros.posicao && (
                <p role="alert" className="mt-1.5 text-sm font-medium text-red-700">
                  {erros.posicao}
                </p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
              <Campo
                rotulo="Endereço"
                placeholder="Rua e número"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                erro={erros.endereco}
                maxLength={200}
                required
              />
              <Campo
                rotulo="Bairro"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                erro={erros.bairro}
                maxLength={80}
                required
              />
            </div>

            <AreaTexto
              rotulo="O que você encontrou?"
              opcional
              placeholder="Ex.: buraco grande no meio da calçada, perto do ponto de ônibus"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              erro={erros.descricao}
              dica="Com a descrição, a sugestão de tipo e gravidade fica mais precisa."
              maxLength={500}
            />

            {textoErroApi && <Mensagem tipo="erro">{textoErroApi}</Mensagem>}
            {analisando && <Carregando texto="Analisando o relato..." />}

            <Botao type="submit" carregando={analisando} disabled={preparandoFoto} larguraTotal>
              Continuar
            </Botao>
          </form>
        </Cartao>
      )}

      {etapa === 2 && classificacao && (
        <Cartao>
          <form onSubmit={enviar} noValidate className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Está certo?</h2>
              <p className="mt-1 text-sm text-slate-600">
                Sugestão automática com {classificacao.confianca}% de confiança. Você decide: confirme ou corrija antes de
                enviar.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Selecao rotulo="Tipo de obstáculo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoObstaculo)}>
                {Object.entries(TIPOS).map(([valor, rotulo]) => (
                  <option key={valor} value={valor}>
                    {rotulo}
                    {valor === classificacao.tipoSugerido ? ' (sugerido)' : ''}
                  </option>
                ))}
              </Selecao>
              <Selecao rotulo="Gravidade" value={gravidade} onChange={(e) => setGravidade(e.target.value as Gravidade)}>
                {Object.entries(GRAVIDADES).map(([valor, rotulo]) => (
                  <option key={valor} value={valor}>
                    {rotulo}
                    {valor === classificacao.gravidadeSugerida ? ' (sugerida)' : ''}
                  </option>
                ))}
              </Selecao>
            </div>

            {classificacao.vaiParaModeracao && (
              <Mensagem tipo="info" titulo="Este relato passará por moderação">
                A sugestão automática ficou com pouca confiança, então uma pessoa da equipe confere o relato antes de
                publicar. Uma descrição mais detalhada ajuda.
              </Mensagem>
            )}

            <dl className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
              <div className="flex gap-2">
                <dt className="text-slate-600">Local:</dt>
                <dd className="font-medium text-slate-900">
                  {endereco} - {bairro}
                </dd>
              </div>
              {descricao.trim() && (
                <div className="mt-1 flex gap-2">
                  <dt className="text-slate-600">Descrição:</dt>
                  <dd className="text-slate-900">{descricao.trim()}</dd>
                </div>
              )}
              <div className="mt-1 flex gap-2">
                <dt className="text-slate-600">Foto:</dt>
                <dd className="text-slate-900">{foto ? 'anexada' : 'sem foto'}</dd>
              </div>
            </dl>

            {textoErroApi && (
              <Mensagem tipo="erro">
                {textoErroApi}{' '}
                {relatoDuplicado && (
                  <Link to="/relatos" className="font-semibold underline">
                    Ver os relatos e confirmar o existente
                  </Link>
                )}
              </Mensagem>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <Botao variante="secundario" onClick={() => setEtapa(1)} disabled={enviando}>
                Voltar e corrigir
              </Botao>
              <Botao type="submit" carregando={enviando} className="flex-1">
                {enviando ? 'Enviando...' : 'Enviar relato'}
              </Botao>
            </div>
          </form>
        </Cartao>
      )}

      {etapa === 3 && criado && (
        <Cartao className="text-center">
          <span aria-hidden="true" className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">
            ✓
          </span>
          <h2 className="mt-4 text-xl font-bold text-slate-900" role="status">
            Relato enviado! Protocolo {criado.protocolo}
          </h2>
          <div className="mt-3 flex justify-center">
            <SeloStatus status={criado.status} />
          </div>
          <p className="mx-auto mt-3 max-w-md text-sm text-slate-600">
            {criado.status === 'EM_MODERACAO'
              ? 'Seu relato será conferido pela equipe antes de aparecer no mapa. Você acompanha tudo em "Meus relatos".'
              : 'Seu relato já está no mapa. Quem passar pelo local poderá confirmar, e o status aparece em "Meus relatos".'}
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <LinkBotao to="/minha-conta">Ver meus relatos</LinkBotao>
            <LinkBotao to={`/relatos/${criado.id}`} variante="secundario">
              Abrir este relato
            </LinkBotao>
          </div>
        </Cartao>
      )}
    </div>
  )
}
