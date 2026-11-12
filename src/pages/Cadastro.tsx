import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Botao } from '../components/Botao'
import { Campo } from '../components/Campo'
import { Mensagem } from '../components/Feedback'
import { Cartao, TituloPagina } from '../components/Layout'
import { SeletorPerfil } from '../components/SeletorPerfil'
import { useAuth } from '../context/AuthContext'
import { usePreferencias } from '../context/PreferenciasContext'
import { ApiError, mensagemDeErro } from '../services/api'
import { cadastrarUsuario } from '../services/usuarioService'
import type { PerfilMobilidade } from '../types'
import { emailValido, errosDaApi, temErros, type Erros } from '../utils/validacao'

type CamposCadastro = 'nome' | 'email' | 'senha' | 'confirmacao' | 'consentimento'

export function Cadastro() {
  const { usuario, entrar } = useAuth()
  const { perfil: perfilVisitante } = usePreferencias()
  const navegar = useNavigate()
  const local = useLocation()
  const voltarPara = (local.state as { voltarPara?: string } | null)?.voltarPara ?? '/minha-conta'

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [perfil, setPerfil] = useState<PerfilMobilidade | null>(perfilVisitante)
  const [consentimento, setConsentimento] = useState(false)
  const [erros, setErros] = useState<Erros<CamposCadastro>>({})
  const [erroApi, setErroApi] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (usuario && !enviando) {
    return <Navigate to={voltarPara} replace />
  }

  function validar(): Erros<CamposCadastro> {
    const novos: Erros<CamposCadastro> = {}
    if (nome.trim().length < 3) novos.nome = 'Informe o seu nome (pelo menos 3 letras).'
    if (!emailValido(email)) novos.email = 'Informe um e-mail válido, como nome@exemplo.com.'
    if (senha.length < 8) novos.senha = 'A senha deve ter pelo menos 8 caracteres.'
    if (confirmacao !== senha) novos.confirmacao = 'As senhas não são iguais.'
    if (perfil && !consentimento) novos.consentimento = 'Marque a autorização para salvar o seu perfil de mobilidade.'
    return novos
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const novos = validar()
    setErros(novos)
    setErroApi(null)
    if (temErros(novos)) return

    setEnviando(true)
    try {
      await cadastrarUsuario({ nome: nome.trim(), email: email.trim(), senha, perfilMobilidade: perfil ?? undefined })
      await entrar(email.trim(), senha)
      navegar(voltarPara, { replace: true })
    } catch (erro) {
      if (erro instanceof ApiError && erro.campos.length > 0) {
        setErros(errosDaApi<CamposCadastro>(erro.campos))
      }
      setErroApi(mensagemDeErro(erro))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <TituloPagina titulo="Criar conta">
        Com a conta você reporta obstáculos, valida relatos e acompanha o que foi resolvido.
      </TituloPagina>
      <Cartao>
        <form onSubmit={enviar} noValidate className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Campo
              rotulo="Nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              erro={erros.nome}
              autoComplete="name"
              required
            />
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
              dica="Pelo menos 8 caracteres."
              autoComplete="new-password"
              required
            />
            <Campo
              rotulo="Repita a senha"
              type="password"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              erro={erros.confirmacao}
              autoComplete="new-password"
              required
            />
          </div>

          <div>
            <SeletorPerfil valor={perfil} aoEscolher={setPerfil} nome="perfil-cadastro" />
            <p className="mt-2 text-sm text-slate-600">Opcional. Você pode escolher ou trocar depois, em 1 toque.</p>
          </div>

          {perfil && (
            <div>
              <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={consentimento}
                  onChange={(e) => setConsentimento(e.target.checked)}
                  className="mt-0.5 size-5 shrink-0 accent-marca-700"
                  aria-invalid={erros.consentimento ? true : undefined}
                />
                <span>
                  Autorizo salvar o meu perfil de mobilidade na conta. Ele é usado só para calcular as minhas rotas e
                  nunca é exibido publicamente.
                </span>
              </label>
              {erros.consentimento && (
                <p role="alert" className="mt-1.5 text-sm font-medium text-red-700">
                  {erros.consentimento}
                </p>
              )}
            </div>
          )}

          {erroApi && <Mensagem tipo="erro">{erroApi}</Mensagem>}

          <Botao type="submit" carregando={enviando} larguraTotal>
            {enviando ? 'Criando conta...' : 'Criar conta'}
          </Botao>
        </form>
      </Cartao>
      <p className="mt-4 text-center text-sm text-slate-600">
        Já tem conta?{' '}
        <Link to="/entrar" state={local.state} className="font-semibold text-marca-800 underline">
          Entrar
        </Link>
      </p>
    </div>
  )
}
