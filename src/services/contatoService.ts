import type { Contato, ContatoEnvio } from '../types'
import { requisitar } from './api'

/** POST /contatos - grava a mensagem da página Contato no banco */
export function enviarContato(dados: ContatoEnvio): Promise<Contato> {
  return requisitar<Contato>('/contatos', { metodo: 'POST', corpo: dados })
}
