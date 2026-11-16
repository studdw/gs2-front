import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Botao } from '../components/Botao'
import { Campo } from '../components/Campo'
import { Mensagem } from '../components/Feedback'
import { Cartao, TituloPagina } from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { mensagemDeErro } from '../services/api'
import { emailValido, temErros, type Erros } from '../utils/validacao'

/** campos do login que podem ter erro */
type CamposLogin = 'email' | 'senha'

/** página de login; depois de entrar, volta pra página que a pessoa queria */
export function Entrar() {
  /* login do contexto e navegação */
  const { usuario, entrar } = useAuth()
  const navegar = useNavigate()
  const local = useLocation()
  /* pra onde voltar depois do login: a página que pediu login ou a "minha conta" */
  const voltarPara = (local.state as { voltarPara?: string } | null)?.voltarPara ?? '/minha-conta'

  /* e-mail, senha, erros e se está enviando */
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erros, setErros] = useState<Erros<CamposLogin>>({})
  const [erroApi, setErroApi] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  /* já está logado? então vai direto pro destino */
  if (usuario) {
    return <Navigate to={voltarPara} replace />
  }

  /** valida, faz o login pelo contexto e redireciona */
  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const novos: Erros<CamposLogin> = {}
    if (!emailValido(email)) novos.email = 'Informe um e-mail válido.'
    if (!senha) novos.senha = 'Informe a sua senha.'
    setErros(novos)
    setErroApi(null)
    if (temErros(novos)) return

    setEnviando(true)
    try {
      await entrar(email.trim(), senha)
      navegar(voltarPara, { replace: true })
    } catch (erro) {
      setErroApi(mensagemDeErro(erro))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <TituloPagina titulo="Entrar">Entre para reportar obstáculos e validar relatos perto de você.</TituloPagina>
      <Cartao>
        <form onSubmit={enviar} noValidate className="space-y-4">
          <Campo
            rotulo="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            erro={erros.email}
            autoComplete="email"
            required
          />
          <Campo
            rotulo="Senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            erro={erros.senha}
            autoComplete="current-password"
            required
          />
          {erroApi && <Mensagem tipo="erro">{erroApi}</Mensagem>}
          <Botao type="submit" carregando={enviando} larguraTotal>
            {enviando ? 'Entrando...' : 'Entrar'}
          </Botao>
        </form>
      </Cartao>
      <p className="mt-4 text-center text-sm text-slate-600">
        Ainda não tem conta?{' '}
        <Link to="/cadastro" state={local.state} className="font-semibold text-marca-800 underline">
          Criar conta
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-slate-600">
        Só quer uma rota?{' '}
        <Link to="/rotas" className="font-semibold text-marca-800 underline">
          Continuar sem conta
        </Link>
      </p>
    </div>
  )
}
