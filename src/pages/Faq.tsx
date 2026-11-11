import { TituloPagina } from '../components/Layout'

const PERGUNTAS = [
  {
    pergunta: 'Preciso criar uma conta para usar?',
    resposta:
      'Não para buscar rotas e consultar o painel público. A conta é necessária para reportar obstáculos e validar relatos, porque assim evitamos spam e você consegue acompanhar seus relatos.',
  },
  {
    pergunta: 'O Rota para Todos é gratuito?',
    resposta:
      'Sim. O cidadão não paga nada. O modelo prevê que a prefeitura contrate a plataforma, porque os relatos validados ajudam a planejar as obras.',
  },
  {
    pergunta: 'Por que a rota sugerida não é a mais curta?',
    resposta:
      'Porque ordenamos as rotas pelo índice de acessibilidade para o seu perfil. Uma rota alguns minutos mais longa pode evitar um degrau sem rampa ou um trecho escuro.',
  },
  {
    pergunta: 'Como o índice de acessibilidade é calculado?',
    resposta:
      'Cada rota começa com 100 pontos e perde pontos a cada relato ativo no caminho. O desconto depende do tipo de obstáculo, da gravidade, do seu perfil de mobilidade e do horário. A página Sobre explica em detalhes.',
  },
  {
    pergunta: 'Quem pode ver o meu perfil de mobilidade?',
    resposta:
      'Só você. O perfil é um dado sensível: ele é usado apenas para calcular as suas rotas e nunca aparece no painel público nem para os gestores.',
  },
  {
    pergunta: 'O que acontece depois que eu envio um relato?',
    resposta:
      'Você recebe um número de protocolo. Se a classificação automática tiver boa confiança, o relato é publicado na hora; caso contrário, passa antes por moderação. Com três confirmações da comunidade ele vira "Confirmado".',
  },
  {
    pergunta: 'Por que preciso estar perto do local para validar?',
    resposta:
      'Para o mapa continuar confiável. Só vale o voto de quem está a até 100 metros do ponto, e ninguém pode validar o próprio relato.',
  },
  {
    pergunta: 'Os relatos ficam no mapa para sempre?',
    resposta:
      'Não. Um relato sem nenhuma confirmação em 90 dias expira. Relatos resolvidos saem dos alertas de rota e ficam no histórico do painel.',
  },
  {
    pergunta: 'O site funciona fora de São Paulo?',
    resposta: 'Por enquanto, não. O piloto cobre apenas o município de São Paulo.',
  },
]

export function Faq() {
  return (
    <div className="mx-auto max-w-3xl">
      <TituloPagina titulo="Perguntas frequentes">Respostas diretas para as dúvidas mais comuns.</TituloPagina>

      <div className="space-y-3">
        {PERGUNTAS.map((item) => (
          // <details> já é acessível por teclado e leitor de tela, sem precisar de JavaScript
          <details key={item.pergunta} className="group rounded-2xl border border-slate-200 bg-white shadow-sm">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 text-base font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
              {item.pergunta}
              <span aria-hidden="true" className="text-xl text-marca-700 transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="px-5 pb-5 text-sm leading-relaxed text-slate-700">{item.resposta}</p>
          </details>
        ))}
      </div>
    </div>
  )
}
