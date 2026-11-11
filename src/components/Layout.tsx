import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Botao, LinkBotao } from './Botao'

const LINKS_SOLUCAO = [
  { para: '/rotas', texto: 'Buscar rota' },
  { para: '/relatos', texto: 'Relatos' },
  { para: '/painel', texto: 'Painel público' },
]

const LINKS_INSTITUCIONAIS = [
  { para: '/sobre', texto: 'Sobre' },
  { para: '/integrantes', texto: 'Integrantes' },
  { para: '/faq', texto: 'FAQ' },
  { para: '/contato', texto: 'Contato' },
]

function estiloLink({ isActive }: { isActive: boolean }): string {
  return `flex min-h-11 items-center rounded-lg px-3 text-sm font-medium transition-colors ${
    isActive ? 'bg-marca-50 text-marca-900' : 'text-slate-700 hover:bg-slate-100'
  }`
}

function Logo() {
  return (
    <Link to="/" className="flex min-h-11 items-center gap-2 text-lg font-bold text-marca-900">
      <img src="/favicon.svg" alt="" className="size-8" />
      Rota para Todos
    </Link>
  )
}

function Cabecalho() {
  const { usuario, sair } = useAuth()
  const [menuAberto, setMenuAberto] = useState(false)
  const local = useLocation()

  // Fecha o menu do celular sempre que a página muda
  useEffect(() => {
    setMenuAberto(false)
  }, [local.pathname])

  const links = [...LINKS_SOLUCAO, ...LINKS_INSTITUCIONAIS]

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2">
        <Logo />

        {/* Menu do desktop */}
        <nav aria-label="Principal" className="hidden items-center gap-0.5 xl:flex">
          {links.map((link) => (
            <NavLink key={link.para} to={link.para} className={estiloLink}>
              {link.texto}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 xl:flex">
          {usuario ? (
            <>
              <NavLink to="/minha-conta" className={estiloLink}>
                Olá, {usuario.nome.split(' ')[0]}
              </NavLink>
              <Botao variante="secundario" onClick={sair}>
                Sair
              </Botao>
            </>
          ) : (
            <>
              <LinkBotao to="/entrar" variante="fantasma">
                Entrar
              </LinkBotao>
              <LinkBotao to="/cadastro">Criar conta</LinkBotao>
            </>
          )}
        </div>

        {/* Botão do menu no celular e no tablet */}
        <button
          type="button"
          className="flex size-11 items-center justify-center rounded-lg text-slate-800 hover:bg-slate-100 xl:hidden"
          aria-expanded={menuAberto}
          aria-controls="menu-movel"
          aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => setMenuAberto((aberto) => !aberto)}
        >
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {menuAberto ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {menuAberto && (
        <nav id="menu-movel" aria-label="Principal" className="border-t border-slate-200 bg-white px-4 py-3 xl:hidden">
          <ul className="grid gap-1 sm:grid-cols-2">
            {links.map((link) => (
              <li key={link.para}>
                <NavLink to={link.para} className={estiloLink}>
                  {link.texto}
                </NavLink>
              </li>
            ))}
            {usuario && (
              <li>
                <NavLink to="/minha-conta" className={estiloLink}>
                  Minha conta
                </NavLink>
              </li>
            )}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-200 pt-3">
            {usuario ? (
              <Botao variante="secundario" onClick={sair} larguraTotal>
                Sair da conta de {usuario.nome.split(' ')[0]}
              </Botao>
            ) : (
              <>
                <LinkBotao to="/entrar" variante="secundario" className="flex-1">
                  Entrar
                </LinkBotao>
                <LinkBotao to="/cadastro" className="flex-1">
                  Criar conta
                </LinkBotao>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}

function Rodape() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <p className="text-base font-bold text-marca-900">Rota para Todos</p>
          <p className="mt-2 text-sm text-slate-600">
            Rotas a pé mais seguras e acessíveis para cada pessoa, com relatos da comunidade sobre as calçadas de São
            Paulo.
          </p>
        </div>
        <nav aria-label="Solução">
          <p className="text-sm font-semibold text-slate-900">Solução</p>
          <ul className="mt-2 space-y-1">
            {LINKS_SOLUCAO.map((link) => (
              <li key={link.para}>
                <Link to={link.para} className="inline-flex min-h-9 items-center text-sm text-slate-700 hover:underline">
                  {link.texto}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Institucional">
          <p className="text-sm font-semibold text-slate-900">Institucional</p>
          <ul className="mt-2 space-y-1">
            {LINKS_INSTITUCIONAIS.map((link) => (
              <li key={link.para}>
                <Link to={link.para} className="inline-flex min-h-9 items-center text-sm text-slate-700 hover:underline">
                  {link.texto}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <p className="border-t border-slate-200 px-4 py-4 text-center text-xs text-slate-600">
        Projeto acadêmico - FIAP Global Solution 2026/2 (CitizenTech) - Mapas © colaboradores do OpenStreetMap
      </p>
    </footer>
  )
}

/** Estrutura comum a todas as páginas: link para pular ao conteúdo, cabeçalho, conteúdo e rodapé. */
export function Layout() {
  const local = useLocation()

  // Ao trocar de página, volta ao topo
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [local.pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-30 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-marca-900 focus:shadow"
      >
        Pular para o conteúdo
      </a>
      <Cabecalho />
      <main id="conteudo" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <Rodape />
    </div>
  )
}

/** Título e subtítulo padrão das páginas. */
export function TituloPagina({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{titulo}</h1>
      {children && <p className="mt-2 max-w-3xl text-base text-slate-600">{children}</p>}
    </div>
  )
}

/** Cartão branco usado para agrupar conteúdo. */
export function Cartao({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</section>
}
