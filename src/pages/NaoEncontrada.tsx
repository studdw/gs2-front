import { LinkBotao } from '../components/Botao'
import { EstadoVazio } from '../components/Feedback'

export function NaoEncontrada() {
  return (
    <EstadoVazio titulo="Página não encontrada" acao={<LinkBotao to="/">Voltar para o início</LinkBotao>}>
      O endereço que você abriu não existe. Confira o link ou volte para a página inicial.
    </EstadoVazio>
  )
}
