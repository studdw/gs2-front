import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Botao } from '../components/Botao'
import { AreaTexto, Campo, Selecao } from '../components/Campo'
import { Mensagem } from '../components/Feedback'
import { Cartao, TituloPagina } from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { ApiError, mensagemDeErro } from '../services/api'
import { enviarContato } from '../services/contatoService'
import type { AssuntoContato } from '../types'
import { emailValido, errosDaApi, temErros, type Erros } from '../utils/validacao'

const EMAIL_SUPORTE = 'suporte@rotaparatodos.app'

const ASSUNTOS: { valor: AssuntoContato; rotulo: string }[] = [
  { valor: 'DUVIDA', rotulo: 'Dúvida sobre o uso' },
  { valor: 'PROBLEMA_SITE', rotulo: 'Problema no site' },
  { valor: 'PARCERIA', rotulo: 'Parceria com prefeitura ou instituição' },
  { valor: 'IMPRENSA', rotulo: 'Imprensa' },
  { valor: 'OUTRO', rotulo: 'Outro' },
]

type CamposContato = 'nome' | 'email' | 'assunto' | 'mensagem'

export function Contato() {
  const { usuario } = useAuth()
  // Quem está logado já começa com nome e e-mail preenchidos
  const [nome, setNome] = useState(usuario?.nome ?? '')
  const [email, setEmail] = useState(usuario?.email ?? '')
  const [assunto, setAssunto] = useState<AssuntoContato | ''>('')
  const [mensagem, setMensagem] = useState('')
  const [erros, setErros] = useState<Erros<CamposContato>>({})
  const [erroApi, setErroApi] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [protocolo, setProtocolo] = useState<number | null>(null)

  function validar(): Erros<CamposContato> {
    const novos: Erros<CamposContato> = {}
    if (nome.trim().length < 3) novos.nome = 'Informe o seu nome (pelo menos 3 letras).'
    if (!emailValido(email)) novos.email = 'Informe um e-mail válido, como nome@exemplo.com.'
    if (!assunto) novos.assunto = 'Escolha um assunto.'
    if (mensagem.trim().length < 10) novos.mensagem = 'Escreva a mensagem com pelo menos 10 caracteres.'
    return novos
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const novos = validar()
    setErros(novos)
    setErroApi(null)
    setProtocolo(null)
    if (temErros(novos) || !assunto) return

    setEnviando(true)
    try {
      // POST /contatos: a mensagem fica gravada na tabela tb_contato
      const contato = await enviarContato({
        nome: nome.trim(),
        email: email.trim(),
        assunto,
        mensagem: mensagem.trim(),
      })
      setProtocolo(contato.id)
      setAssunto('')
      setMensagem('')
    } catch (erro) {
      if (erro instanceof ApiError && erro.campos.length > 0) {
        setErros(errosDaApi<CamposContato>(erro.campos))
      }
      setErroApi(mensagemDeErro(erro))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <TituloPagina titulo="Contato">
        Fale com a equipe. Dúvidas, sugestões e parcerias são bem-vindas.
      </TituloPagina>

      <Cartao>
        <form onSubmit={enviar} noValidate className="space-y-4">
          <Campo
            rotulo="Seu nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            erro={erros.nome}
            autoComplete="name"
            required
          />
          <Campo
            rotulo="Seu e-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            erro={erros.email}
            autoComplete="email"
            required
          />
          <Selecao
            rotulo="Assunto"
            value={assunto}
            onChange={(e) => setAssunto(e.target.value as AssuntoContato | '')}
            erro={erros.assunto}
            required
          >
            <option value="">Selecione...</option>
            {ASSUNTOS.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>
                {opcao.rotulo}
              </option>
            ))}
          </Selecao>
          <AreaTexto
            rotulo="Mensagem"
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            erro={erros.mensagem}
            rows={5}
            maxLength={1000}
            required
          />

          {temErros(erros) && !erroApi && <Mensagem tipo="erro">Confira os campos destacados e tente de novo.</Mensagem>}
          {erroApi && (
            <Mensagem tipo="erro" titulo="Não foi possível enviar">
              {erroApi} Se preferir, escreva para{' '}
              <a className="font-semibold underline" href={`mailto:${EMAIL_SUPORTE}`}>
                {EMAIL_SUPORTE}
              </a>
              .
            </Mensagem>
          )}
          {protocolo !== null && (
            <Mensagem tipo="sucesso" titulo="Mensagem enviada!">
              Recebemos a sua mensagem (protocolo nº {protocolo}). A equipe responde no e-mail informado.
            </Mensagem>
          )}

          <Botao type="submit" carregando={enviando}>
            {enviando ? 'Enviando...' : 'Enviar mensagem'}
          </Botao>
        </form>
      </Cartao>

      <p className="mt-4 text-sm text-slate-600">
        Para reportar um obstáculo na calçada, use a página{' '}
        <Link to="/relatos/novo" className="font-semibold text-marca-800 underline">
          Reportar problema
        </Link>
        : assim ele entra no mapa e no painel.
      </p>
    </div>
  )
}
