# Rota para Todos - Front-end

Aplicação web (SPA) do **Rota para Todos**: rotas a pé mais seguras e acessíveis para cada perfil de
mobilidade, com relatos da comunidade sobre as calçadas de São Paulo.
Global Solution 2026/2 - CitizenTech - Front-End Design Engineering.

## Objetivo

Dar ao cidadão a rota mais acessível para o seu perfil (não só a mais curta), permitir reportar e
validar obstáculos nas calçadas e mostrar, em um painel público, onde a obra ajuda mais gente.

## Tecnologias

- React 19 + Vite + TypeScript
- Tailwind CSS 4
- React Router (rotas estáticas e dinâmicas)
- Fetch API (sem Axios)
- Leaflet + OpenStreetMap (mapa, busca de endereço e trajeto a pé)
- API REST em Java/Spring Boot

## Integrantes

| Nome | RM | Turma |
|---|---|---|
| Lucas Kaftan | 571302 | 1TDSPV |
| Matheus Ruas | 571047 | 1TDSPV |
| João Carlos Lopes | 568952 | 1TDSPV |
| Matheus Costa | 573146 | 1TDSPV |

## Links

- GitHub: ``
- Vercel: ``
- API Java (Render): ``
- Vídeo (YouTube): ``
- Contato: ``

## Como executar

```bash
npm install
```

Ajuste o endereço da API (`VITE_API_URL`) no .env
Depois:

```bash
npm run dev
```

O site abre em `http://localhost:5173`. Outros comandos: `npm run build` (checa os tipos e gera `dist/`)
e `npm run preview`.

## Deploy na Vercel

1. Importe o repositório na Vercel (Framework: Vite; Root Directory: a pasta do front).
2. Em **Environment Variables**, crie `VITE_API_URL` com a URL da API no Render.
3. O arquivo `vercel.json` já faz as rotas da SPA funcionarem ao abrir um link direto.

## Estrutura de pastas

```
src
├── components   componentes reutilizáveis (Botao, Campo, Mapa, CartaoRelato, Selos, Feedback, Layout...)
├── context      estado global: sessão (AuthContext) e perfil/localização (PreferenciasContext)
├── data         textos e dados fixos (rótulos, integrantes)
├── hooks        useRequisicao: carregando / erro / dados
├── pages        uma página por rota
├── services     chamadas HTTP com Fetch (API Java e serviços do OpenStreetMap)
├── types        tipos e interfaces TypeScript
└── utils        validação de formulários e compressão de imagem
```

## Páginas e rotas

| Rota | Página | Integração com a API Java |
|---|---|---|
| `/` | Home | GET `/painel/indicadores` |
| `/sobre` | Sobre | - |
| `/integrantes` | Integrantes | - |
| `/integrantes/:rm` | Integrante (rota com parâmetro) | - |
| `/faq` | FAQ | - |
| `/contato` | Contato (formulário com validação) | - |
| `/rotas` | Buscar rota | POST `/rotas/avaliacoes` |
| `/relatos` | Relatos no mapa e "perto de mim" | GET `/relatos` |
| `/relatos/novo` | Reportar problema (3 etapas) | POST `/relatos/classificacoes`, POST `/relatos` |
| `/relatos/:codigo` | Detalhe, validação e gestão | GET `/relatos/{id}`, GET/POST `/relatos/{id}/validacoes`, PATCH `/relatos/{id}/status`, DELETE `/relatos/{id}` |
| `/painel` | Painel público e ranking | GET `/painel/indicadores`, GET `/painel/ranking` |
| `/entrar`, `/cadastro` | Conta | POST `/auth/login`, POST `/usuarios` |
| `/minha-conta` | Perfil de mobilidade e meus relatos | PUT `/usuarios/{id}`, GET `/usuarios/{id}/relatos` |

O trajeto pelas ruas vem de serviços públicos do OpenStreetMap (Nominatim e OSRM). Eles são um
complemento: o índice de acessibilidade, os alertas e todos os dados do site vêm da API Java.
Esses serviços são gratuitos, têm limite de uso e podem oscilar.

## Contas de demonstração

Se o script `../java/sql/02_dados_iniciais.sql` foi executado, as contas e a senha de demonstração
estão descritas no cabeçalho desse arquivo (um gestor e quatro cidadãos).

## Uso de IA generativa

`Em andamento...`
