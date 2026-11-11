import { useCallback, useEffect, useState, type DependencyList } from 'react'
import { mensagemDeErro } from '../services/api'

interface EstadoRequisicao<T> {
  dados: T | null
  carregando: boolean
  erro: string | null
  recarregar: () => void
}

/**
 * Hook para buscar dados da API cuidando dos três estados da tela:
 * carregando, erro e dados. Cancela a requisição se a tela for fechada antes da resposta.
 */
export function useRequisicao<T>(
  buscar: (sinal: AbortSignal) => Promise<T>,
  dependencias: DependencyList,
): EstadoRequisicao<T> {
  const [dados, setDados] = useState<T | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    const controle = new AbortController()
    setCarregando(true)
    setErro(null)
    buscar(controle.signal)
      .then((resultado) => {
        if (!controle.signal.aborted) setDados(resultado)
      })
      .catch((falha: unknown) => {
        if (!controle.signal.aborted) setErro(mensagemDeErro(falha))
      })
      .finally(() => {
        if (!controle.signal.aborted) setCarregando(false)
      })
    return () => controle.abort()
    // A função "buscar" é recriada a cada render; quem decide quando refazer são as dependências
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencias, tentativa])

  const recarregar = useCallback(() => setTentativa((valor) => valor + 1), [])

  return { dados, carregando, erro, recarregar }
}
