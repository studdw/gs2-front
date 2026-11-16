import { useCallback, useEffect, useState, type DependencyList } from 'react'
import { mensagemDeErro } from '../services/api'

/** o que o hook devolve: dados, carregando, erro e a função de tentar de novo */
interface EstadoRequisicao<T> {
  dados: T | null
  carregando: boolean
  erro: string | null
  recarregar: () => void
}

/* hook serve para buscar dados da API cuidando dos três estados da tela (carregando, erro e dados); se a pessoa sair da tela antes da resposta, a requisição é cancelada */
export function useRequisicao<T>(
  buscar: (sinal: AbortSignal) => Promise<T>,
  dependencias: DependencyList,
): EstadoRequisicao<T> {
  /* estados dos dados, do carregando, do erro e um contador de tentativas (usado no "tentar de novo") */
  const [dados, setDados] = useState<T | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [tentativa, setTentativa] = useState(0)

  /* dispara a busca toda vez que as dependências mudam e ignora a resposta se a tela já fechou */
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
    /* a função "buscar" é recriada a cada render, então quem manda refazer a busca são as dependências */
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [...dependencias, tentativa])

  /** botão "tentar de novo": soma 1 na tentativa e o useEffect busca de novo */
  const recarregar = useCallback(() => setTentativa((valor) => valor + 1), [])

  return { dados, carregando, erro, recarregar }
}
