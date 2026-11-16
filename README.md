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

Usamos IA generativa como apoio de estudo e de consulta em quatro momentos do projeto. Abaixo estão os
prompts usados e um resumo das respostas. Nenhum código foi colado direto: as respostas serviram de
ponto de partida, e o código final foi adaptado, testado e revisado pelo grupo.

### 1. Integração com OpenStreetMap e OSRM

**Ferramenta:** Claude (Anthropic)

**Prompt:**

> Como utilizar a API do OpenStreetMap e a OSRM?

**Resposta da IA (resumo):**

**Como funciona.** O OpenStreetMap (OSM) é um mapa colaborativo e gratuito. Ele não é uma única API,
e sim um conjunto de serviços públicos construídos em cima dos mesmos dados:

| Serviço | O que faz | Formato |
|---|---|---|
| **Tiles** (`tile.openstreetmap.org`) | Entrega as imagens do mapa em quadradinhos de 256 px, organizados por zoom (`{z}/{x}/{y}.png`). | PNG |
| **Nominatim** (`nominatim.openstreetmap.org`) | Faz a geocodificação. O `/search` transforma endereço em latitude/longitude, e o `/reverse` faz o caminho contrário. | JSON |
| **OSRM** (`routing.openstreetmap.de`) | Calcula rotas pelas ruas. Recebe uma lista de pontos e devolve a distância e o desenho do caminho. Existem perfis de carro, bicicleta e **a pé** (`routed-foot`). | JSON / GeoJSON |

Cuidados apontados:

- O OSRM usa a ordem **longitude,latitude**, ao contrário do Leaflet e do resto do projeto.
- O Nominatim tem limite de **1 requisição por segundo**. A busca precisa ter *debounce* e cancelar
  pedidos antigos com `AbortController`.
- Os créditos "© OpenStreetMap" são obrigatórios no mapa.
- São serviços comunitários sem garantia de disponibilidade, então toda chamada precisa tratar erro.

**Passo a passo aplicado ao nosso código:**

1. **Instalar o Leaflet** (`npm install leaflet @types/leaflet`) e importar `leaflet/dist/leaflet.css`
   no [`main.tsx`](src/main.tsx). Sem esse CSS o mapa aparece quebrado.
2. **Criar o componente [`Mapa.tsx`](src/components/Mapa.tsx)**: um `useEffect` cria o mapa uma única
   vez com `L.map(...)`, adiciona a camada de tiles com `L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png')`
   e remove o mapa no *cleanup*. O React só passa por props o que precisa ser desenhado
   (marcadores, linhas, centro), e outros `useEffect` redesenham quando essas props mudam.
3. **Centralizar as chamadas em [`mapaService.ts`](src/services/mapaService.ts)**, com as URLs base em
   constantes (`NOMINATIM` e `OSRM_A_PE`).
4. **Buscar endereço** (`buscarEndereco`): `fetch` em `/search` com `URLSearchParams`, usando
   `format=jsonv2`, `countrycodes=br`, `viewbox` + `bounded=1` (para limitar a São Paulo) e
   `accept-language=pt-BR`. O resultado é convertido para o nosso tipo `LocalEncontrado`.
5. **Endereço de um ponto clicado** (`buscarEnderecoDoPonto`): `fetch` em `/reverse?lat=...&lon=...`,
   que devolve rua e bairro para preencher o formulário de relato.
6. **Calcular o trajeto** (`buscarTrajetos`): montar a URL
   `.../route/v1/foot/{lng},{lat};{lng},{lat}?overview=full&geometries=geojson&alternatives=true`,
   inverter as coordenadas da resposta para `[lat, lng]` e reduzir a quantidade de pontos antes de
   mandar para a API Java.
7. **Tratar erros**: lançar um `MapaError` com mensagem pronta para a tela, e repassar o `AbortError`
   quando o usuário faz uma nova busca.
8. **Separar responsabilidades**: o OSRM só desenha o caminho. As rotas candidatas são enviadas para a
   API Java (`POST /rotas/avaliacoes`), que calcula o índice de acessibilidade.

### 2. Estilização com Tailwind CSS

**Ferramenta:** Claude (Anthropic)

**Prompt:**

> Me ajude a estilizar meu site, mostre ideias com referências e como transformar o UI dele com
> Tailwind CSS da melhor forma, seguindo um padrão e normas a serem respeitadas.

**Resposta da IA (resumo):**

**Como usar o Tailwind (v4).** O Tailwind é *utility-first*: em vez de criar classes como `.botao-azul`
num arquivo CSS, o estilo é montado direto no JSX com classes pequenas (`px-5`, `rounded-xl`,
`bg-marca-700`). Na versão 4:

- A instalação é feita pelo plugin do Vite (`@tailwindcss/vite`), sem `tailwind.config.js`.
- Um único `@import 'tailwindcss'` no `index.css` carrega tudo.
- As cores e fontes do projeto são declaradas como *tokens* dentro de `@theme`. Ao criar
  `--color-marca-700`, por exemplo, as classes `bg-marca-700`, `text-marca-700` e `ring-marca-700`
  passam a existir automaticamente.
- O `@apply` é usado só onde o JSX não alcança, como nos marcadores do Leaflet, que são HTML em string.

**Padrões e normas sugeridos:**

1. **Uma cor de marca e uma neutra.** Verde-azulado (`teal`) como marca, que transmite confiança e
   saúde e é comum em serviços públicos, e `slate` para textos, fundos e bordas.
2. **Cores com significado fixo, iguais no site todo:** `emerald` para sucesso, `red` para erro e
   gravidade crítica, `amber` para aviso, `sky` para informação. Cor nunca aparece sozinha: sempre vem
   acompanhada de texto ou ícone.
3. **Contraste WCAG 2.1 AA (mínimo 4,5:1)**: texto em tons `700`–`900` sobre fundos `50`–`100`.
4. **Toque e foco**: altura mínima de 44 px (`min-h-11`) em botões e campos, e `:focus-visible` com
   contorno na cor da marca para quem navega pelo teclado.
5. **Escala consistente**: arredondamento `rounded-xl` em controles e `rounded-2xl` em cartões;
   espaçamentos múltiplos de 4 (`gap-2`, `p-4`, `mt-3`).
6. **Mobile first**: a classe sem prefixo vale para o celular, e `sm:`, `md:`, `lg:` ajustam para
   telas maiores.
7. **Respeitar `prefers-reduced-motion`**, desligando animações para quem pediu menos movimento.
8. **Variantes em objetos**, e não classes espalhadas: um `Record<Variante, string>` por componente.

**Paleta adotada:**

| Uso | Classe / token | Hex |
|---|---|---|
| Marca (botões, links) | `marca-700` / `marca-800` | `#0f766e` / `#115e59` |
| Fundo de destaque | `marca-50` / `marca-100` | `#f0fdfa` / `#ccfbf1` |
| Fundo da página e texto | `slate-50` / `slate-800` | `#f8fafc` / `#1e293b` |
| Gravidade baixa | `sky` | `#0284c7` |
| Gravidade média | `amber` | `#d97706` |
| Gravidade alta | `orange` | `#ea580c` |
| Gravidade crítica | `red` | `#dc2626` |

**Referências citadas:** [gov.br Design System](https://www.gov.br/ds/) (serviços públicos claros e
acessíveis), [Tailwind UI / Tailwind Plus](https://tailwindcss.com/plus) (cartões, formulários e
selos), [Material Design 3 - estados e cores](https://m3.material.io/) e as
[WCAG 2.1](https://www.w3.org/TR/WCAG21/) para contraste e tamanho de toque.

### 3. Componente de botão reutilizável

**Ferramenta:** Claude (Anthropic)

**Prompt:**

> No meu projeto React + TypeScript + Tailwind, eu repito as mesmas classes de botão em várias páginas.
> Como crio um componente de botão reutilizável com variantes (principal, secundário, perigo),
> estado de carregamento, acessível, e que também funcione como link do React Router?

**Resposta da IA (resumo):**

- Criar um tipo `Variante` e guardar as classes de cada variante num `Record<Variante, string>`. Uma
  constante `BASE` fica com o que é comum a todas: altura mínima de 44 px, arredondamento, fonte e
  `disabled:opacity-60`.
- Estender `ButtonHTMLAttributes<HTMLButtonElement>` nas props. Assim o componente aceita `onClick`,
  `type`, `aria-*` etc. sem declarar um por um, e o `...resto` repassa tudo para o `<button>`.
- Definir `type="button"` como padrão, para o botão não enviar formulários sem querer.
- Com `carregando`, o botão fica desabilitado, mostra um *spinner* (`animate-spin`) com
  `aria-hidden` e recebe `aria-busy`, que avisa o leitor de tela.
- Criar um `LinkBotao` que reaproveita `BASE` e `VARIANTES` sobre o `<Link>` do React Router. Ele fica
  com a mesma aparência, mas a semântica correta de navegação: link para trocar de página, botão para
  executar ação.

Resultado no projeto: [`Botao.tsx`](src/components/Botao.tsx), com as variantes `primario`,
`secundario`, `perigo` e `fantasma`, usado em todas as páginas.

### 4. Componentes de feedback e formulário acessíveis

**Ferramenta:** Claude (Anthropic)

**Prompt:**

> Minhas páginas buscam dados de uma API Java e têm vários formulários. Como padronizo, em componentes
> React, os estados de carregando, erro, vazio e sucesso, e os campos de formulário com mensagem de
> erro, de forma acessível para leitores de tela?

**Resposta da IA (resumo):**

- **Toda tela que busca dados tem quatro estados.** Criar um componente para cada um em
  [`Feedback.tsx`](src/components/Feedback.tsx):
  - `Carregando`: *spinner* + texto, com `role="status"`.
  - `ErroCarregamento`: mensagem + botão "Tentar de novo", que chama a função de recarregar do hook.
  - `EstadoVazio`: explica que não há dados e oferece uma ação.
  - `Mensagem`: caixa de sucesso, erro, aviso ou informação.
- **Anunciar mudanças para o leitor de tela**: `role="alert"` em erros, que são lidos na hora, e
  `role="status"` nas demais mensagens, lidas sem interromper.
- **Uma fonte única de estilos**: um objeto `ESTILOS` com cor e ícone por tipo. O ícone fica com
  `aria-hidden`, porque o texto já carrega o significado.
- **Campos de formulário** em [`Campo.tsx`](src/components/Campo.tsx), com uma `Moldura` comum para
  `Campo`, `AreaTexto` e `Selecao`:
  - `useId()` gera um `id` único, que liga o `<label>` ao controle.
  - `aria-invalid` marca o campo com erro.
  - `aria-describedby` aponta para a mensagem de erro, ou para a dica quando não há erro.
  - A borda fica vermelha (`border-red-600`), mas o erro também aparece em texto: nunca só cor.
- **Combinar com o hook `useRequisicao`**, que devolve `carregando`, `erro` e `dados`, para que cada
  página só escolha qual componente de feedback mostrar.
