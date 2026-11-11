import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Botao } from '../components/Botao'
import { AreaTexto, Campo, Selecao } from '../components/Campo'
import { Mensagem } from '../components/Feedback'
import { Cartao, TituloPagina } from '../components/Layout'
import { emailValido, temErros, type Erros } from '../utils/validacao'

const EMAIL_SUPORTE = 'suporte@passolivre.tech'
const ASSUNTOS = ['Dúvida sobre o uso', 'Problema no site', 'Parceria com prefeitura ou instituição', 'Imprensa', 'Outro']

type CamposContato = 'nome' | 'email' | 'assunto' | 'mensagem'

export function Contato() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [assunto, setAssunto] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [erros, setErros] = useState<Erros<CamposContato>>({})
  const [enviado, setEnviado] = useState(false)

  function validar(): Erros<CamposContato> {
    const novos: Erros<CamposContato> = {}
    if (nome.trim().length < 3) novos.nome = 'Informe o seu nome (pelo menos 3 letras).'
    if (!emailValido(email)) novos.email = 'Informe um e-mail válido, como nome@exemplo.com.'
    if (!assunto) novos.assunto = 'Escolha um assunto.'
    if (mensagem.trim().length < 10) novos.mensagem = 'Escreva a mensagem com pelo menos 10 caracteres.'
    return novos
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    const novos = validar()
    setErros(novos)
    setEnviado(false)
    if (temErros(novos)) return

    // O site não guarda mensagens de contato: ele abre o aplicativo de e-mail da pessoa com tudo preenchido
    const corpo = `${mensagem.trim()}\n\n${nome.trim()}\n${email.trim()}`
    window.location.href = `mailto:${EMAIL_SUPORTE}?subject=${encodeURIComponent(`[Rota para Todos] ${assunto}`)}&body=${encodeURIComponent(corpo)}`
    setEnviado(true)
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
          <Selecao rotulo="Assunto" value={assunto} onChange={(e) => setAssunto(e.target.value)} erro={erros.assunto} required>
            <option value="">Selecione...</option>
            {ASSUNTOS.map((opcao) => (
              <option key={opcao} value={opcao}>
                {opcao}
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

          {temErros(erros) && <Mensagem tipo="erro">Confira os campos destacados e tente de novo.</Mensagem>}
          {enviado && (
            <Mensagem tipo="sucesso" titulo="Mensagem pronta!">
              Abrimos o seu aplicativo de e-mail com a mensagem preenchida. É só enviar. Se nada abriu, escreva para{' '}
              <a className="font-semibold underline" href={`mailto:${EMAIL_SUPORTE}`}>
                {EMAIL_SUPORTE}
              </a>
              .
            </Mensagem>
          )}

          <Botao type="submit">Preparar e-mail</Botao>
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
