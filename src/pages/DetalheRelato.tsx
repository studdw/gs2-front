import { useMemo, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Botao, LinkBotao } from '../components/Botao'
import { Campo, Selecao } from '../components/Campo'
import { Carregando, ErroCarregamento, EstadoVazio, Mensagem } from '../components/Feedback'
import { Cartao } from '../components/Layout'
import { Mapa, type MarcadorMapa } from '../components/Mapa'
import { SeloGravidade, SeloStatus } from '../components/Selos'
import { useAuth } from '../context/AuthContext'
import { usePreferencias } from '../context/PreferenciasContext'
import { CORES_GRAVIDADE, formatarData, formatarDistancia, STATUS, TIPOS, VOTOS } from '../data/rotulos'
import { useRequisicao } from '../hooks/useRequisicao'
import { mensagemDeErro } from '../services/api'
import { distanciaMetros } from '../services/mapaService'
import { alterarStatusRelato, buscarRelato, listarValidacoes, removerRelato, validarRelato } from '../services/relatoService'
import type { Coordenada, Relato, StatusRelato, TipoVoto, Validacao } from '../types'

type Retorno = { tipo: 'sucesso' | 'erro'; texto: string } | null

const STATUS_ATIVOS: StatusRelato[] = ['PUBLICADO', 'CONFIRMADO', 'EM_OBRA']

/** Votação da comunidade: POST /relatos/{id}/validacoes (UC09 / HU09). */
function Votacao({ relato, validacoes, aoVotar }: { relato: Relato; validacoes: Validacao[]; aoVotar: () => void }) {
  const { usuario } = useAuth()
  const { localizacao, usarGps, buscandoGps, erroGps } = usePreferencias()
  const local = useLocation()
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState<TipoVoto | null>(null)
  const [retorno, setRetorno] = useState<Retorno>(null)

  const meuVoto = validacoes.find((validacao) => validacao.minha)
  const distancia = localizacao
    ? distanciaMetros(localizacao.posicao, [relato.latitude, relato.longitude])
    : null

  async function votar(voto: TipoVoto) {
    if (!localizacao) return
    setEnviando(voto)
    setRetorno(null)
    try {
      await validarRelato(relato.id, {
        voto,
        comentario: comentario.trim() || undefined,
        latitude: localizacao.posicao[0],
        longitude: localizacao.posicao[1],
      })
      setRetorno({ tipo: 'sucesso', texto: 'Obrigado! Seu voto foi registrado.' })
      setComentario('')
      aoVotar()
    } catch (erro) {
      // A API explica o motivo: longe demais, voto repetido, relato próprio...
      setRetorno({ tipo: 'erro', texto: mensagemDeErro(erro) })
    } finally {
      setEnviando(null)
    }
  }

  let conteudo
  if (!STATUS_ATIVOS.includes(relato.status)) {
    conteudo = <p className="text-sm text-slate-600">Este relato não está mais ativo e não recebe novos votos.</p>
  } else if (!usuario) {
    conteudo = (
      <div className="space-y-3">
        <p className="text-sm text-slate-600">Entre na sua conta para confirmar se o problema ainda existe.</p>
        <LinkBotao to="/entrar" state={{ voltarPara: local.pathname }}>
          Entrar para validar
        </LinkBotao>
      </div>
    )
  } else if (relato.meu) {
    conteudo = (
      <p className="text-sm text-slate-600">Você não pode validar o próprio relato. Peça a alguém que passe por aqui.</p>
    )
  } else if (meuVoto) {
    conteudo = (
      <Mensagem tipo="sucesso">
        Você já votou neste relato: <strong>{VOTOS[meuVoto.voto]}</strong>. Obrigado por ajudar!
      </Mensagem>
    )
  } else {
    conteudo = (
      <div className="space-y-4">
        {localizacao && distancia !== null ? (
          <p className="text-sm text-slate-700">
            Você está a <strong>{formatarDistancia(distancia)}</strong> do local
            {localizacao.origem === 'manual' ? ' (ponto marcado no mapa)' : ''}. É preciso estar a até 100 m para validar.
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-slate-700">
              Para validar, precisamos saber que você está perto do local (até 100 m).
            </p>
            <Botao variante="secundario" onClick={usarGps} carregando={buscandoGps}>
              Usar minha localização
            </Botao>
            <p className="text-sm text-slate-600">{erroGps ?? 'Sem GPS? Toque no mapa para marcar onde você está.'}</p>
          </div>
        )}

        <Campo
          rotulo="Comentário"
          opcional
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          maxLength={200}
          placeholder="Ex.: continua igual, cuidado ao passar"
        />

        <div className="grid gap-2 sm:grid-cols-3">
          {(Object.keys(VOTOS) as TipoVoto[]).map((voto) => (
            <Botao
              key={voto}
              variante={voto === 'AINDA_EXISTE' ? 'primario' : 'secundario'}
              onClick={() => votar(voto)}
              carregando={enviando === voto}
              disabled={!localizacao || enviando !== null}
            >
              {VOTOS[voto]}
            </Botao>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Cartao>
      <h2 className="text-lg font-semibold text-slate-900">O problema ainda existe?</h2>
      <p className="mb-4 mt-1 text-sm text-slate-600">
        {relato.confirmacoes === 1 ? '1 confirmação' : `${relato.confirmacoes} confirmações`}
        {relato.confirmacoesFaltantes > 0 &&
          ` - ${relato.confirmacoesFaltantes === 1 ? 'falta 1 confirmação' : `faltam ${relato.confirmacoesFaltantes} confirmações`} para o relato ficar "Confirmado"`}
      </p>
      {conteudo}
      {retorno && (
        <div className="mt-4">
          <Mensagem tipo={retorno.tipo}>{retorno.texto}</Mensagem>
        </div>
      )}
    </Cartao>
  )
}

/** Ações do gestor: PATCH /relatos/{id}/status (HU12 e moderação). */
function AcoesDoGestor({ relato, aoAlterar }: { relato: Relato; aoAlterar: () => void }) {
  const [status, setStatus] = useState<StatusRelato>(relato.status === 'EXPIRADO' ? 'PUBLICADO' : relato.status)
  const [previsao, setPrevisao] = useState(relato.dataPrevisaoObra ?? '')
  const [erroPrevisao, setErroPrevisao] = useState<string>()
  const [salvando, setSalvando] = useState(false)
  const [retorno, setRetorno] = useState<Retorno>(null)

  async function salvar(evento: FormEvent) {
    evento.preventDefault()
    setRetorno(null)
    if (status === 'EM_OBRA' && !previsao) {
      setErroPrevisao('Informe a data prevista para a conclusão da obra.')
      return
    }
    setErroPrevisao(undefined)
    setSalvando(true)
    try {
      await alterarStatusRelato(relato.id, status, status === 'EM_OBRA' ? previsao : undefined)
      setRetorno({ tipo: 'sucesso', texto: 'Status atualizado. Os cidadãos já veem a mudança.' })
      aoAlterar()
    } catch (erro) {
      setRetorno({ tipo: 'erro', texto: mensagemDeErro(erro) })
    } finally {
      setSalvando(false)
    }
  }

  const opcoes: StatusRelato[] = ['EM_MODERACAO', 'PUBLICADO', 'CONFIRMADO', 'EM_OBRA', 'RESOLVIDO', 'REJEITADO']

  return (
    <Cartao className="border-marca-200 bg-marca-50">
      <h2 className="text-lg font-semibold text-slate-900">Gestão do relato</h2>
      <p className="mb-4 mt-1 text-sm text-slate-600">Disponível só para gestores públicos.</p>
      <form onSubmit={salvar} noValidate className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Selecao rotulo="Status" value={status} onChange={(e) => setStatus(e.target.value as StatusRelato)}>
            {opcoes.map((opcao) => (
              <option key={opcao} value={opcao}>
                {STATUS[opcao].rotulo}
              </option>
            ))}
          </Selecao>
          {status === 'EM_OBRA' && (
            <Campo
              rotulo="Previsão de conclusão da obra"
              type="date"
              value={previsao}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setPrevisao(e.target.value)}
              erro={erroPrevisao}
              required
            />
          )}
        </div>
        {retorno && <Mensagem tipo={retorno.tipo}>{retorno.texto}</Mensagem>}
        <Botao type="submit" carregando={salvando}>
          {salvando ? 'Salvando...' : 'Salvar status'}
        </Botao>
      </form>
    </Cartao>
  )
}

/** Detalhe de um relato: GET /relatos/{id} e GET /relatos/{id}/validacoes. */
export function DetalheRelato() {
  const { codigo } = useParams<{ codigo: string }>()
  const numero = Number(codigo)
  const navegar = useNavigate()
  const { usuario } = useAuth()
  const { localizacao, definirLocalizacaoManual } = usePreferencias()
  const [removendo, setRemovendo] = useState(false)
  const [confirmandoRemocao, setConfirmandoRemocao] = useState(false)
  const [erroRemocao, setErroRemocao] = useState<string | null>(null)

  // usuario?.id nas dependências: ao entrar ou sair, busca de novo (muda o que a pessoa pode ver e fazer)
  const relato = useRequisicao((sinal) => buscarRelato(numero, sinal), [numero, usuario?.id])
  const validacoes = useRequisicao((sinal) => listarValidacoes(numero, sinal), [numero, usuario?.id])

  const posicaoRelato = useMemo<Coordenada | null>(
    () => (relato.dados ? [relato.dados.latitude, relato.dados.longitude] : null),
    [relato.dados],
  )

  const marcadores = useMemo<MarcadorMapa[]>(() => {
    if (!relato.dados || !posicaoRelato) return []
    const lista: MarcadorMapa[] = [
      {
        id: 'relato',
        posicao: posicaoRelato,
        cor: CORES_GRAVIDADE[relato.dados.gravidade].hex,
        texto: '!',
        titulo: `${TIPOS[relato.dados.tipo]} - ${relato.dados.endereco}`,
      },
    ]
    if (localizacao) {
      lista.push({ id: 'eu', posicao: localizacao.posicao, cor: '#2563eb', titulo: 'Você está aqui' })
    }
    return lista
  }, [relato.dados, posicaoRelato, localizacao])

  function recarregarTudo() {
    relato.recarregar()
    validacoes.recarregar()
  }

  async function remover() {
    setRemovendo(true)
    setErroRemocao(null)
    try {
      await removerRelato(numero)
      navegar('/minha-conta', { replace: true })
    } catch (erro) {
      setErroRemocao(mensagemDeErro(erro))
      setRemovendo(false)
      setConfirmandoRemocao(false)
    }
  }

  if (!Number.isInteger(numero) || numero <= 0) {
    return (
      <EstadoVazio titulo="Relato não encontrado" acao={<LinkBotao to="/relatos">Ver todos os relatos</LinkBotao>}>
        O endereço deste relato não é válido.
      </EstadoVazio>
    )
  }
  if (relato.carregando && !relato.dados) return <Carregando texto="Buscando o relato..." />
  if (relato.erro) return <ErroCarregamento mensagem={relato.erro} aoTentarDeNovo={relato.recarregar} />
  if (!relato.dados || !posicaoRelato) return null

  const dados = relato.dados

  return (
    <div className="space-y-6">
      <Link to="/relatos" className="inline-flex min-h-11 items-center text-sm font-semibold text-marca-800 hover:underline">
        ← Todos os relatos
      </Link>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <SeloStatus status={dados.status} />
          <SeloGravidade gravidade={dados.gravidade} />
          {dados.meu && (
            <span className="rounded-full bg-marca-100 px-2.5 py-0.5 text-xs font-semibold text-marca-900">Meu relato</span>
          )}
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{TIPOS[dados.tipo]}</h1>
        <p className="mt-1 text-base text-slate-600">
          {dados.endereco} - {dados.bairro}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Cartao>
            {dados.foto ? (
              <img
                src={dados.foto}
                alt={`Foto do relato: ${TIPOS[dados.tipo]} em ${dados.endereco}`}
                className="mb-4 max-h-96 w-full rounded-xl object-cover"
              />
            ) : (
              <p className="mb-4 rounded-xl bg-slate-100 px-4 py-6 text-center text-sm text-slate-600">Relato sem foto.</p>
            )}
            {dados.descricao && <p className="text-base text-slate-800">{dados.descricao}</p>}

            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-slate-600">Protocolo</dt>
                <dd className="font-medium text-slate-900">{dados.protocolo}</dd>
              </div>
              <div>
                <dt className="text-slate-600">Reportado em</dt>
                <dd className="font-medium text-slate-900">{formatarData(dados.dataCriacao)}</dd>
              </div>
              <div>
                <dt className="text-slate-600">Confiança da classificação</dt>
                <dd className="font-medium text-slate-900">{dados.confiancaIa}%</dd>
              </div>
              {dados.dataPrevisaoObra && (
                <div>
                  <dt className="text-slate-600">Previsão da obra</dt>
                  <dd className="font-medium text-slate-900">{formatarData(dados.dataPrevisaoObra)}</dd>
                </div>
              )}
              {dados.dataResolucao && (
                <div>
                  <dt className="text-slate-600">Resolvido em</dt>
                  <dd className="font-medium text-slate-900">{formatarData(dados.dataResolucao)}</dd>
                </div>
              )}
            </dl>
          </Cartao>

          {usuario?.papel === 'GESTOR' && <AcoesDoGestor key={dados.status} relato={dados} aoAlterar={recarregarTudo} />}

          <Votacao relato={dados} validacoes={validacoes.dados ?? []} aoVotar={recarregarTudo} />
        </div>

        <div className="space-y-6">
          <div>
            <Mapa
              centro={posicaoRelato}
              zoom={17}
              marcadores={marcadores}
              aoClicarNoMapa={definirLocalizacaoManual}
              descricao="Mapa com o local do relato. Toque para marcar onde você está."
              className="h-80"
            />
            <p className="mt-2 text-xs text-slate-600">
              ! = local do relato. Ponto azul = você. Toque no mapa para ajustar a sua posição.
            </p>
          </div>

          {/* Histórico de validações, sem identificar quem votou (RN20/RN22) */}
          <Cartao>
            <h2 className="text-lg font-semibold text-slate-900">Validações da comunidade</h2>
            {validacoes.carregando && !validacoes.dados && <Carregando texto="Buscando validações..." />}
            {validacoes.erro && <ErroCarregamento mensagem={validacoes.erro} aoTentarDeNovo={validacoes.recarregar} />}
            {validacoes.dados && validacoes.dados.length === 0 && (
              <p className="mt-2 text-sm text-slate-600">Ninguém validou este relato ainda.</p>
            )}
            {validacoes.dados && validacoes.dados.length > 0 && (
              <ul className="mt-3 divide-y divide-slate-200">
                {validacoes.dados.map((validacao) => (
                  <li key={validacao.id} className="py-3 text-sm">
                    <p className="font-medium text-slate-900">
                      {VOTOS[validacao.voto]}
                      {validacao.minha && <span className="font-normal text-marca-800"> (seu voto)</span>}
                      <span className="font-normal text-slate-600"> - {formatarData(validacao.dataValidacao)}</span>
                    </p>
                    {validacao.comentario && <p className="text-slate-700">{validacao.comentario}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Cartao>

          {/* Remoção pelo autor ou pelo gestor: DELETE /relatos/{id} */}
          {(dados.meu || usuario?.papel === 'GESTOR') && (
            <Cartao>
              <h2 className="text-lg font-semibold text-slate-900">Remover relato</h2>
              <p className="mb-3 mt-1 text-sm text-slate-600">
                Só é possível remover um relato que ainda não recebeu validações.
              </p>
              {erroRemocao && (
                <div className="mb-3">
                  <Mensagem tipo="erro">{erroRemocao}</Mensagem>
                </div>
              )}
              {confirmandoRemocao ? (
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm font-medium text-slate-800">Remover de vez? Não dá para desfazer.</p>
                  <Botao variante="perigo" onClick={remover} carregando={removendo}>
                    Sim, remover
                  </Botao>
                  <Botao variante="secundario" onClick={() => setConfirmandoRemocao(false)} disabled={removendo}>
                    Cancelar
                  </Botao>
                </div>
              ) : (
                <Botao variante="secundario" onClick={() => setConfirmandoRemocao(true)}>
                  Remover este relato
                </Botao>
              )}
            </Cartao>
          )}
        </div>
      </div>
    </div>
  )
}
