import type { LoginResposta, Relato, Usuario, UsuarioAtualizacao, UsuarioCadastro } from '../types'
import { requisitar } from './api'

/** fazer login e receber o token e os dados do usuário (POST /auth/login) */
export function entrar(email: string, senha: string): Promise<LoginResposta> {
  return requisitar<LoginResposta>('/auth/login', { metodo: 'POST', corpo: { email, senha } })
}

/** criar uma conta nova (POST /usuarios) */
export function cadastrarUsuario(dados: UsuarioCadastro): Promise<Usuario> {
  return requisitar<Usuario>('/usuarios', { metodo: 'POST', corpo: dados })
}

/** buscar os dados de um usuário pelo código (GET /usuarios/{id}) */
export function buscarUsuario(codigo: number, sinal?: AbortSignal): Promise<Usuario> {
  return requisitar<Usuario>(`/usuarios/${codigo}`, { sinal })
}

/** atualizar os dados da conta, como o perfil de mobilidade (PUT /usuarios/{id}) */
export function atualizarUsuario(codigo: number, dados: UsuarioAtualizacao): Promise<Usuario> {
  return requisitar<Usuario>(`/usuarios/${codigo}`, { metodo: 'PUT', corpo: dados })
}

/** listar os relatos que o usuário enviou (GET /usuarios/{id}/relatos) */
export function listarRelatosDoUsuario(codigo: number, sinal?: AbortSignal): Promise<Relato[]> {
  return requisitar<Relato[]>(`/usuarios/${codigo}/relatos`, { sinal })
}
