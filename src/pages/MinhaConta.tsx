import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Botao, LinkBotao } from '../components/Botao'
import { CartaoRelato } from '../components/CartaoRelato'
import { Carregando, ErroCarregamento, EstadoVazio, Mensagem } from '../components/Feedback'
import { Cartao, TituloPagina } from '../components/Layout'
import { SeletorPerfil } from '../components/SeletorPerfil'
import { useAuth } from '../context/AuthContext'
import { useRequisicao } from '../hooks/useRequisicao'
import { mensagemDeErro } from '../services/api'
import { atualizarUsuario, listarRelatosDoUsuario } from '../services/usuarioService'
import type { PerfilMobilidade, Usuario } from '../types'

/** troca o perfil de mobilidade da conta (HU02) pelo PUT /usuarios/{id} */
function PerfilDeMobilidade({ usuario }: { usuario: Usuario }) {
  /* função do contexto que atualiza o usuário logado depois de salvar */
  const { atualizarUsuario: atualizarNoContexto } = useAuth()
  /* perfil escolhido, se está salvando e a mensagem de retorno */
  const [perfil, setPerfil] = useState<PerfilMobilidade | null>(usuario.perfilMobilidade ?? null)
  const [salvando, setSalvando] = useState(false)
  const [retorno, setRetorno] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)

  /** salva o perfil na API e atualiza o usuário no contexto */
  async function salvar() {
    if (!perfil) return
    setSalvando(true)
    setRetorno(null)
    try {
      const atualizado = await atualizarUsuario(usuario.id, {
        nome: usuario.nome,
        email: usuario.email,
        perfilMobilidade: perfil,
      })
      atualizarNoContexto(atualizado)
      setRetorno({ tipo: 'sucesso', texto: 'Perfil salvo! Suas próximas rotas já usam esse perfil.' })
    } catch (erro) {
      setRetorno({ tipo: 'erro', texto: mensagemDeErro(erro) })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Cartao>
      <h2 className="text-lg font-semibold text-slate-900">Perfil de mobilidade</h2>
      <p className="mb-4 mt-1 text-sm text-slate-600">
        Usado só para calcular as suas rotas. Ninguém mais vê essa informação.
      </p>
      <SeletorPerfil valor={perfil} aoEscolher={setPerfil} nome="perfil-conta" />
      <div className="mt-4 space-y-3">
        {retorno && <Mensagem tipo={retorno.tipo}>{retorno.texto}</Mensagem>}
        <Botao onClick={salvar} carregando={salvando} disabled={!perfil || perfil === usuario.perfilMobilidade}>
          {salvando ? 'Salvando...' : 'Salvar perfil'}
        </Botao>
      </div>
    </Cartao>
  )
}

/** lista os relatos da pessoa (HU08), vem do GET /usuarios/{id}/relatos */
function MeusRelatos({ usuario }: { usuario: Usuario }) {
  /* hook que busca os relatos de quem está logado */
  const { dados, carregando, erro, recarregar } = useRequisicao(
    (sinal) => listarRelatosDoUsuario(usuario.id, sinal),
    [usuario.id],
  )

  return (
    <section aria-labelledby="titulo-meus-relatos">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="titulo-meus-relatos" className="text-lg font-semibold text-slate-900">
          Meus relatos
        </h2>
        <LinkBotao to="/relatos/novo">Reportar problema</LinkBotao>
      </div>

      {carregando && <Carregando texto="Buscando seus relatos..." />}
      {erro && <ErroCarregamento mensagem={erro} aoTentarDeNovo={recarregar} />}
      {dados && dados.length === 0 && (
        <EstadoVazio titulo="Você ainda não enviou nenhum relato">
          Viu um buraco, degrau ou trecho escuro no seu caminho? Reporte e ajude quem passa por ali.
        </EstadoVazio>
      )}
      {dados && dados.length > 0 && (
        <ul className="grid gap-4 md:grid-cols-2">
          {dados.map((relato) => (
            <li key={relato.id}>
              <CartaoRelato relato={relato} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** página "minha conta": perfil de mobilidade e os relatos da pessoa */
export function MinhaConta() {
  /* usuário logado vindo do contexto */
  const { usuario } = useAuth()
  /* a RotaProtegida já garante o login, isso aqui é só uma segurança a mais */
  if (!usuario) return null

  return (
    <div className="space-y-8">
      <TituloPagina titulo={`Olá, ${usuario.nome.split(' ')[0]}`}>
        {usuario.email} - {usuario.papel === 'GESTOR' ? 'Gestor público' : 'Cidadão'}
      </TituloPagina>

      {/* aviso pro gestor de onde ficam as ferramentas dele */}
      {usuario.papel === 'GESTOR' && (
        <Mensagem tipo="info" titulo="Você entrou como gestor">
          No <Link to="/painel" className="font-semibold underline">painel</Link> você aprova relatos em moderação e registra o andamento das obras.
        </Mensagem>
      )}

      <PerfilDeMobilidade usuario={usuario} />
      <MeusRelatos usuario={usuario} />
    </div>
  )
}
