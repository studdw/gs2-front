import type { LoginResposta, Relato, Usuario, UsuarioAtualizacao, UsuarioCadastro } from '../types'
import { requisitar } from './api'

export function entrar(email: string, senha: string): Promise<LoginResposta> {
  return requisitar<LoginResposta>('/auth/login', { metodo: 'POST', corpo: { email, senha } })
}

export function cadastrarUsuario(dados: UsuarioCadastro): Promise<Usuario> {
  return requisitar<Usuario>('/usuarios', { metodo: 'POST', corpo: dados })
}

export function buscarUsuario(codigo: number, sinal?: AbortSignal): Promise<Usuario> {
  return requisitar<Usuario>(`/usuarios/${codigo}`, { sinal })
}

export function atualizarUsuario(codigo: number, dados: UsuarioAtualizacao): Promise<Usuario> {
  return requisitar<Usuario>(`/usuarios/${codigo}`, { metodo: 'PUT', corpo: dados })
}

export function listarRelatosDoUsuario(codigo: number, sinal?: AbortSignal): Promise<Relato[]> {
  return requisitar<Relato[]>(`/usuarios/${codigo}/relatos`, { sinal })
}
