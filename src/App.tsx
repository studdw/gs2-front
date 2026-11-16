import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { RotaProtegida } from './components/RotaProtegida'
import { BuscarRota } from './pages/BuscarRota'
import { Cadastro } from './pages/Cadastro'
import { Contato } from './pages/Contato'
import { DetalheRelato } from './pages/DetalheRelato'
import { Entrar } from './pages/Entrar'
import { Faq } from './pages/Faq'
import { Home } from './pages/Home'
import { IntegranteDetalhe } from './pages/IntegranteDetalhe'
import { Integrantes } from './pages/Integrantes'
import { MinhaConta } from './pages/MinhaConta'
import { NaoEncontrada } from './pages/NaoEncontrada'
import { NovoRelato } from './pages/NovoRelato'
import { Painel } from './pages/Painel'
import { Relatos } from './pages/Relatos'
import { Sobre } from './pages/Sobre'

/** serve para declarar todas as rotas da SPA; o Layout (cabeçalho + rodapé) envolve todas as páginas */
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* páginas institucionais, abertas para qualquer pessoa */}
        <Route path="/" element={<Home />} />
        <Route path="/sobre" element={<Sobre />} />
        <Route path="/integrantes" element={<Integrantes />} />
        <Route path="/integrantes/:rm" element={<IntegranteDetalhe />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/contato" element={<Contato />} />

        {/* páginas da solução; o "novo relato" passa pela RotaProtegida porque precisa de login */}
        <Route path="/rotas" element={<BuscarRota />} />
        <Route path="/relatos" element={<Relatos />} />
        <Route
          path="/relatos/novo"
          element={
            <RotaProtegida>
              <NovoRelato />
            </RotaProtegida>
          }
        />
        <Route path="/relatos/:codigo" element={<DetalheRelato />} />
        <Route path="/painel" element={<Painel />} />

        {/* área da conta, a "minha conta" também é protegida */}
        <Route path="/entrar" element={<Entrar />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route
          path="/minha-conta"
          element={
            <RotaProtegida>
              <MinhaConta />
            </RotaProtegida>
          }
        />

        {/* o "*" pega qualquer endereço que não existe e cai na página 404 */}
        <Route path="*" element={<NaoEncontrada />} />
      </Route>
    </Routes>
  )
}
