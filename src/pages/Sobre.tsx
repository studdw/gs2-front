import { Cartao, TituloPagina } from '../components/Layout'

const ODS = [
  { numero: 11, nome: 'Cidades e comunidades sustentáveis', texto: 'Rotas a pé acessíveis e priorização de obras nas calçadas (metas 11.2 e 11.7).' },
  { numero: 10, nome: 'Redução das desigualdades', texto: 'Autonomia para circular, estudar e trabalhar (meta 10.2).' },
  { numero: 3, nome: 'Saúde e bem-estar', texto: 'Prevenção de quedas e incentivo à caminhada segura.' },
  { numero: 9, nome: 'Indústria, inovação e infraestrutura', texto: 'Dados para a manutenção da infraestrutura urbana (meta 9.1).' },
]

const TECNOLOGIAS = [
  { nome: 'React + Vite + TypeScript', texto: 'Aplicação de página única (SPA) com componentes reutilizáveis e tipagem.' },
  { nome: 'Tailwind CSS', texto: 'Layout responsivo para celular, tablet e desktop.' },
  { nome: 'Java + Spring Boot', texto: 'API REST com JDBC, validações e regras de negócio.' },
  { nome: 'Oracle', texto: 'Banco de dados relacional com usuários, relatos e validações.' },
  { nome: 'OpenStreetMap', texto: 'Mapa, busca de endereços e trajetos a pé (dados abertos).' },
]

export function Sobre() {
  return (
    <div className="space-y-10">
      <TituloPagina titulo="Sobre o Rota para Todos">
        Um mapa colaborativo que ajuda cada pessoa a chegar hoje e ajuda a cidade a consertar o caminho de amanhã.
      </TituloPagina>

      <div className="grid gap-4 md:grid-cols-2">
        <Cartao>
          <h2 className="text-lg font-semibold text-slate-900">O problema</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            Para pessoas com deficiência, pessoas idosas, gestantes e quem empurra um carrinho de bebê, uma calçada
            quebrada, um degrau sem rampa ou uma travessia mal iluminada pode significar uma queda, ou simplesmente
            desistir de sair de casa. Os aplicativos de mapa mostram o caminho mais curto, não o mais seguro, e os
            pedidos de reparo chegam à prefeitura dispersos e sem priorização.
          </p>
        </Cartao>
        <Cartao>
          <h2 className="text-lg font-semibold text-slate-900">A solução</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            Você informa origem, destino e perfil de mobilidade e recebe até três rotas com um índice de acessibilidade
            de 0 a 100. Qualquer pessoa cadastrada pode reportar um obstáculo com foto e localização. A comunidade
            confirma ou atualiza cada relato, e os dados validados alimentam um painel com os pontos críticos
            ordenados por um Índice de Impacto.
          </p>
        </Cartao>
      </div>

      <section aria-labelledby="titulo-indices">
        <h2 id="titulo-indices" className="text-xl font-bold text-slate-900">
          Como calculamos
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Cartao>
            <h3 className="text-base font-semibold text-slate-900">Índice de acessibilidade da rota (0 a 100)</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Toda rota começa com 100 pontos. Cada relato ativo a até 25 metros do caminho tira pontos, e o desconto
              depende do seu perfil: um degrau pesa muito para quem usa cadeira de rodas e pouco para uma gestante.
              Relatos confirmados pesam mais. Depois das 18h, iluminação ruim e local isolado valem o dobro. Um
              obstáculo crítico confirmado bloqueia o trecho para cadeira de rodas e carrinho de bebê.
            </p>
          </Cartao>
          <Cartao>
            <h3 className="text-base font-semibold text-slate-900">Índice de Impacto do ponto (0 a 100)</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Usado no ranking do painel: 40% gravidade, 25% confirmações da comunidade, 20% proximidade de hospitais,
              unidades de saúde e escolas, e 15% fluxo de pedestres do bairro. Assim a obra vai primeiro para onde ajuda
              mais gente.
            </p>
          </Cartao>
        </div>
      </section>

      <section aria-labelledby="titulo-ods">
        <h2 id="titulo-ods" className="text-xl font-bold text-slate-900">
          Objetivos de Desenvolvimento Sustentável
        </h2>
        <ul className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {ODS.map((ods) => (
            <li key={ods.numero} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="flex size-10 items-center justify-center rounded-xl bg-marca-700 text-base font-bold text-white">
                {ods.numero}
              </span>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">{ods.nome}</h3>
              <p className="mt-1 text-sm text-slate-600">{ods.texto}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="titulo-tecnologias">
        <h2 id="titulo-tecnologias" className="text-xl font-bold text-slate-900">
          Tecnologias
        </h2>
        <dl className="mt-4 grid gap-3 md:grid-cols-2">
          {TECNOLOGIAS.map((tecnologia) => (
            <div key={tecnologia.nome} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <dt className="text-sm font-semibold text-slate-900">{tecnologia.nome}</dt>
              <dd className="text-sm text-slate-600">{tecnologia.texto}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-sm text-slate-600">
          Nesta versão acadêmica, a classificação automática dos relatos é simulada a partir da descrição escrita, e
          as referências de equipamentos públicos e de fluxo de pedestres são uma amostra de demonstração.
        </p>
      </section>
    </div>
  )
}
