import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ApiError, lerToken, salvarToken } from '../services/api'
import { buscarUsuario, entrar as entrarNaApi } from '../services/usuarioService'
import type { Usuario } from '../types'

/* aqui no contexto definimos o que ele entrega pras telas: o usuário logado, se ainda está carregando e as funções de entrar, sair e atualizar */
interface AuthContexto {
  usuario: Usuario | null
  carregando: boolean
  entrar: (email: string, senha: string) => Promise<Usuario>
  sair: () => void
  atualizarUsuario: (usuario: Usuario) => void
}

/* aqui no contexto criamos a "caixa" do login e a chave que salva o código do usuário no navegador */
const Contexto = createContext<AuthContexto | null>(null)
const CHAVE_USUARIO = 'rpt.usuario'

/** lê do localStorage o código do usuário do último login (null se não tiver nada válido) */
function lerCodigoSalvo(): number | null {
  const valor = Number(localStorage.getItem(CHAVE_USUARIO))
  return Number.isInteger(valor) && valor > 0 ? valor : null
}

/* aqui no contexto é onde o login acontece de verdade: o AuthProvider guarda o usuário e compartilha com o app inteiro */
export function AuthProvider({ children }: { children: ReactNode }) {
  /* hook que guarda o usuário logado e se ainda estamos conferindo a sessão salva */
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState<boolean>(() => lerToken() !== null && lerCodigoSalvo() !== null)

  /** logout: apaga o token, o código salvo e limpa o usuário */
  const sair = useCallback(() => {
    salvarToken(null)
    localStorage.removeItem(CHAVE_USUARIO)
    setUsuario(null)
  }, [])

  /* quando o site abre, busca na API o usuário que já estava logado; se o token não vale mais (401/403/404), desloga */
  useEffect(() => {
    const codigo = lerCodigoSalvo()
    if (!lerToken() || !codigo) {
      setCarregando(false)
      return
    }
    const controle = new AbortController()
    buscarUsuario(codigo, controle.signal)
      .then(setUsuario)
      .catch((erro: unknown) => {
        if (erro instanceof ApiError && (erro.status === 401 || erro.status === 403 || erro.status === 404)) {
          sair()
        }
      })
      .finally(() => {
        if (!controle.signal.aborted) setCarregando(false)
      })
    return () => controle.abort()
  }, [sair])

  /** faz o login na API, salva token e código no navegador e coloca o usuário no contexto */
  const entrar = useCallback(async (email: string, senha: string) => {
    const resposta = await entrarNaApi(email, senha)
    salvarToken(resposta.token)
    localStorage.setItem(CHAVE_USUARIO, String(resposta.usuario.id))
    setUsuario(resposta.usuario)
    return resposta.usuario
  }, [])

  /* useMemo só remonta o valor quando algo muda, evitando renderizar o app inteiro à toa */
  const valor = useMemo<AuthContexto>(
    () => ({ usuario, carregando, entrar, sair, atualizarUsuario: setUsuario }),
    [usuario, carregando, entrar, sair],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

/* hook serve para qualquer tela pegar o usuário logado e as funções de login; dá erro se usar fora do AuthProvider */
export function useAuth(): AuthContexto {
  const contexto = useContext(Contexto)
  if (!contexto) {
    throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  }
  return contexto
}
