import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Botao, LinkBotao } from '../components/Botao'
import { Selecao } from '../components/Campo'
import { CartaoRelato } from '../components/CartaoRelato'
import { Carregando, ErroCarregamento, EstadoVazio, Mensagem } from '../components/Feedback'
import { TituloPagina } from '../components/Layout'
import { Mapa, type MarcadorMapa } from '../components/Mapa'
import { usePreferencias } from '../context/PreferenciasContext'
import { CORES_GRAVIDADE, GRAVIDADES, TIPOS } from '../data/rotulos'
import { useRequisicao } from '../hooks/useRequisicao'
import { CENTRO_PADRAO } from '../services/mapaService'
import { listarRelatos } from '../services/relatoService'
import type { Coordenada, Gravidade, TipoObstaculo } from '../types'

const RAIO_PERTO_DE_MIM = 200

/**
 * Mapa e lista de relatos (GET /relatos).
 * No modo "perto de mim", mostra só os relatos ativos a até 200 m para validar (UC09 / RF18).
 */
export function Relatos() {
  const navegar = useNavigate()
  const { localizacao, usarGps, buscandoGps, erroGps, definirLocalizacaoManual } = usePreferencias()
  const [pertoDeMim, setPertoDeMim] = useState(false)
  const [tipo, setTipo] = useState<TipoObstaculo | ''>('')
  const [gravidade, setGravidade] = useState<Gravidade | ''>('')

  const posicao = localizacao?.posicao
  const filtrarPorPosicao = pertoDeMim && posicao !== undefined

  const { dados, carregando, erro, recarregar } = useRequisicao(
    (sinal) =>
      listarRelatos(
        {
          tipo: tipo || undefined,
          gravidade: gravidade || undefined,
          ...(filtrarPorPosicao ? { latitude: posicao[0], longitude: posicao[1], raio: RAIO_PERTO_DE_MIM } : {}),
        },
        sinal,
      ),
    [tipo, gravidade, filtrarPorPosicao, posicao?.[0], posicao?.[1]],
  )

  // Fora do modo "perto de mim", a lista mostra o que ainda precisa de atenção
  const relatos = useMemo(
    () => (dados ?? []).filter((relato) => filtrarPorPosicao || !['RESOLVIDO', 'EXPIRADO', 'REJEITADO'].includes(relato.status)),
    [dados, filtrarPorPosicao],
  )

  const marcadores = useMemo<MarcadorMapa[]>(() => {
    const lista: MarcadorMapa[] = relatos.map((relato) => ({
      id: relato.id,
      posicao: [relato.latitude, relato.longitude],
      cor: CORES_GRAVIDADE[relato.gravidade].hex,
      texto: '!',
      titulo: `${TIPOS[relato.tipo]} - ${relato.endereco} (gravidade ${GRAVIDADES[relato.gravidade].toLowerCase()})`,
      aoClicar: () => navegar(`/relatos/${relato.id}`),
    }))
    if (posicao) {
      lista.push({ id: 'eu', posicao, cor: '#2563eb', titulo: 'Você está aqui' })
    }
    return lista
  }, [relatos, posicao, navegar])

  const enquadrar = useMemo<Coordenada[] | undefined>(() => {
    if (filtrarPorPosicao) return [posicao, ...relatos.map((r): Coordenada => [r.latitude, r.longitude])]
    return relatos.length > 0 ? relatos.map((r): Coordenada => [r.latitude, r.longitude]) : undefined
  }, [relatos, filtrarPorPosicao, posicao])

  function alternarPertoDeMim() {
    if (!pertoDeMim && !posicao) usarGps()
    setPertoDeMim((ativo) => !ativo)
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <TituloPagina titulo="Relatos da comunidade">
          Obstáculos reportados nas calçadas. Passou por algum? Confirme se ainda existe ou se já foi resolvido.
        </TituloPagina>
        <LinkBotao to="/relatos/novo">Reportar problema</LinkBotao>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
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
        <Botao
          variante={pertoDeMim ? 'primario' : 'secundario'}
          aria-pressed={pertoDeMim}
          onClick={alternarPertoDeMim}
          carregando={buscandoGps}
        >
          Relatos perto de mim
        </Botao>
      </div>

      {pertoDeMim && (
        <div className="mb-4">
          {posicao ? (
            <Mensagem tipo="info">
              Mostrando relatos ativos a até {RAIO_PERTO_DE_MIM} m{' '}
              {localizacao?.origem === 'gps' ? 'da sua localização' : 'do ponto que você marcou'}. Toque no mapa para
              ajustar o ponto.
            </Mensagem>
          ) : (
            <Mensagem tipo="aviso">
              {erroGps ?? 'Buscando sua localização...'} Você também pode tocar no mapa para marcar onde está.
            </Mensagem>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="lg:order-2 lg:sticky lg:top-20 lg:self-start">
          <Mapa
            centro={CENTRO_PADRAO}
            zoom={13}
            marcadores={marcadores}
            enquadrar={enquadrar}
            aoClicarNoMapa={pertoDeMim ? definirLocalizacaoManual : undefined}
            descricao="Mapa com os relatos. Cada marcador abre os detalhes de um relato."
            className="h-80 md:h-96 lg:h-[calc(100vh-8rem)]"
          />
        </div>

        <div className="lg:order-1">
          {carregando && <Carregando texto="Buscando relatos..." />}
          {erro && <ErroCarregamento mensagem={erro} aoTentarDeNovo={recarregar} />}
          {!carregando && !erro && relatos.length === 0 && (
            <EstadoVazio
              titulo={pertoDeMim ? 'Nenhum relato por aqui' : 'Nenhum relato com esses filtros'}
              acao={<LinkBotao to="/relatos/novo">Reportar agora</LinkBotao>}
            >
              Viu algum problema? Reporte agora.
            </EstadoVazio>
          )}
          {!carregando && !erro && relatos.length > 0 && (
            <>
              <p className="mb-3 text-sm text-slate-600" role="status">
                {relatos.length === 1 ? '1 relato' : `${relatos.length} relatos`}
              </p>
              <ul className="space-y-4">
                {relatos.map((relato) => (
                  <li key={relato.id}>
                    <CartaoRelato relato={relato} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
