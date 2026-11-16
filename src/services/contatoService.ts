import type { Contato, ContatoEnvio } from '../types'
import { requisitar } from './api'

/** envia a mensagem da página Contato (POST /contatos), que fica gravada no banco */
export function enviarContato(dados: ContatoEnvio): Promise<Contato> {
  return requisitar<Contato>('/contatos', { metodo: 'POST', corpo: dados })
}
