import { LinkBotao } from '../components/Botao'
import { Cartao } from '../components/Layout'
import { useRequisicao } from '../hooks/useRequisicao'
import { buscarIndicadores } from '../services/painelService'

const NUMEROS = [
  { valor: '2,02 mi', texto: 'de pessoas idosas (60+) vivem na cidade de São Paulo', fonte: 'Prefeitura de SP, Censo 2022' },
  { valor: '88%', texto: 'das calçadas da capital não têm infraestrutura adequada', fonte: 'Revista de Saúde Pública (USP)' },
  { valor: '33 dias', texto: 'de espera média por serviços de calçada no SP156', fonte: 'Câmara Municipal de SP, 2026' },
]

const PASSOS = [
  { titulo: 'Escolha seu perfil', texto: 'Cadeira de rodas, andador, carrinho de bebê, baixa visão... a rota se adapta a você.' },
  { titulo: 'Busque a rota', texto: 'Informe origem e destino e compare até 3 caminhos pelo índice de acessibilidade.' },
  { titulo: 'Reporte obstáculos', texto: 'Viu um buraco ou degrau? Tire uma foto, marque o local e envie em poucos toques.' },
  { titulo: 'Valide com a comunidade', texto: 'Quem passa pelo local confirma se o problema ainda existe ou já foi resolvido.' },
  { titulo: 'A cidade prioriza', texto: 'O painel mostra à prefeitura onde a obra ajuda mais gente.' },
]

/** Resumo ao vivo, vindo da API Java (GET /painel/indicadores). */
function ResumoDaCidade() {
  const { dados, carregando, erro } = useRequisicao((sinal) => buscarIndicadores(sinal), [])

  if (carregando) {
    return <p role="status" className="text-sm text-slate-600">Carregando os números da comunidade...</p>
  }
  if (erro || !dados) {
    return <p className="text-sm text-slate-600">Os números da comunidade não estão disponíveis agora.</p>
  }
  const itens = [
    { rotulo: 'relatos ativos', valor: dados.ativos },
    { rotulo: 'pontos em obra', valor: dados.emObra },
    { rotulo: 'problemas resolvidos', valor: dados.resolvidos },
  ]
  return (
    <dl className="grid grid-cols-3 gap-3">
      {itens.map((item) => (
        <div key={item.rotulo} className="rounded-xl bg-marca-50 px-3 py-4 text-center">
          <dd className="text-2xl font-bold text-marca-900">{item.valor}</dd>
          <dt className="text-xs font-medium text-marca-900">{item.rotulo}</dt>
        </div>
      ))}
    </dl>
  )
}

export function Home() {
  return (
    <div className="space-y-14">
      {/* Apresentação */}
      <section className="grid items-center gap-8 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-marca-700">CitizenTech - São Paulo</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">
            O caminho mais seguro para você, não só o mais curto.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-slate-600">
            O Rota para Todos traça rotas a pé de acordo com o seu perfil de mobilidade e transforma os relatos da
            comunidade em prioridade de obra para a cidade.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <LinkBotao to="/rotas">Buscar rota</LinkBotao>
            <LinkBotao to="/relatos/novo" variante="secundario">
              Reportar problema
            </LinkBotao>
          </div>
          <p className="mt-3 text-sm text-slate-600">Gratuito. Buscar rota não exige cadastro.</p>
        </div>

        <Cartao>
          <h2 className="text-base font-semibold text-slate-900">Agora na comunidade</h2>
          <p className="mb-4 mt-1 text-sm text-slate-600">Dados enviados e validados por quem caminha pela cidade.</p>
          <ResumoDaCidade />
          <LinkBotao to="/painel" variante="fantasma" className="mt-3 -ml-3">
            Ver o painel público →
          </LinkBotao>
        </Cartao>
      </section>

      {/* O problema */}
      <section aria-labelledby="titulo-problema">
        <h2 id="titulo-problema" className="text-2xl font-bold text-slate-900">
          Por que isso importa
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {NUMEROS.map((numero) => (
            <Cartao key={numero.valor}>
              <p className="text-4xl font-bold text-marca-700">{numero.valor}</p>
              <p className="mt-2 text-sm text-slate-700">{numero.texto}</p>
              <p className="mt-3 text-xs text-slate-500">Fonte: {numero.fonte}</p>
            </Cartao>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section aria-labelledby="titulo-como-funciona">
        <h2 id="titulo-como-funciona" className="text-2xl font-bold text-slate-900">
          Como funciona
        </h2>
        <ol className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {PASSOS.map((passo, indice) => (
            <li key={passo.titulo} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="flex size-9 items-center justify-center rounded-full bg-marca-700 text-sm font-bold text-white">
                {indice + 1}
              </span>
              <h3 className="mt-3 text-base font-semibold text-slate-900">{passo.titulo}</h3>
              <p className="mt-1 text-sm text-slate-600">{passo.texto}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Chamada final */}
      <section className="rounded-3xl bg-marca-800 px-6 py-10 text-center text-white md:px-12">
        <h2 className="text-2xl font-bold">Uma cidade acessível para quem mais precisa é melhor para todo mundo.</h2>
        <p className="mx-auto mt-2 max-w-2xl text-marca-100">
          Crie sua conta para reportar obstáculos e validar os relatos perto de você.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <LinkBotao to="/cadastro" variante="secundario">
            Criar conta gratuita
          </LinkBotao>
          <LinkBotao to="/relatos" className="bg-marca-600 hover:bg-marca-700">
            Ver relatos no mapa
          </LinkBotao>
        </div>
      </section>
    </div>
  )
}
