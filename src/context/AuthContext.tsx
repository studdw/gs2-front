import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ApiError, lerToken, salvarToken } from '../services/api'
import { buscarUsuario, entrar as entrarNaApi } from '../services/usuarioService'
import type { Usuario } from '../types'

interface AuthContexto {
  usuario: Usuario | null
  carregando: boolean
  entrar: (email: string, senha: string) => Promise<Usuario>
  sair: () => void
  atualizarUsuario: (usuario: Usuario) => void
}

const Contexto = createContext<AuthContexto | null>(null)
const CHAVE_USUARIO = 'rpt.usuario'

function lerCodigoSalvo(): number | null {
  const valor = Number(localStorage.getItem(CHAVE_USUARIO))
  return Number.isInteger(valor) && valor > 0 ? valor : null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState<boolean>(() => lerToken() !== null && lerCodigoSalvo() !== null)

  const sair = useCallback(() => {
    salvarToken(null)
    localStorage.removeItem(CHAVE_USUARIO)
    setUsuario(null)
  }, [])

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

  const entrar = useCallback(async (email: string, senha: string) => {
    const resposta = await entrarNaApi(email, senha)
    salvarToken(resposta.token)
    localStorage.setItem(CHAVE_USUARIO, String(resposta.usuario.id))
    setUsuario(resposta.usuario)
    return resposta.usuario
  }, [])

  const valor = useMemo<AuthContexto>(
    () => ({ usuario, carregando, entrar, sair, atualizarUsuario: setUsuario }),
    [usuario, carregando, entrar, sair],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useAuth(): AuthContexto {
  const contexto = useContext(Contexto)
  if (!contexto) {
    throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  }
  return contexto
}
