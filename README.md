# ForgeTab

Plataforma web para criacao e gerenciamento de campanhas de RPG, pensada para centralizar mesa, ficha, biblioteca e apoio de jogo em um unico lugar.

## Objetivo do produto

Comecei esse projeto com o objetivo de atacar uma coisa que eu odiava em RPGs: o combate. Com o tempo fui me empolgando mais com a ideia, e hoje o ForgeTab está caminhando para se tornar um suporte completo, capaz de suprir as necessidades de qualquer RPG sem prender a mesa a um sistema específico.

A proposta é ser uma plataforma leve e versátil, porque a maior parte dos usuários acessa pelo celular. A ideia é que mestres e jogadores consigam consultar personagens, habilidades, inventário, biblioteca e configurações da campanha de forma rápida, sem transformar a sessão em uma luta contra a interface.

## Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Prisma + PostgreSQL
- Autenticacao com JWT em cookie HttpOnly
- Validacoes com Zod
- Upload de imagens com ImageKit
- Estilos com CSS Modules + Sass
- Testes com Vitest + Testing Library

## Principais funcionalidades

### 1) Conta e autenticacao

- Cadastro e login com hash de senha (`bcryptjs`)
- Sessao via cookie `auth_token` (JWT HS256)
- Protecao de rotas por proxy/middleware
- Protecao CSRF para metodos mutaveis da API (`POST`, `PUT`, `PATCH`, `DELETE`)
- Rate limit local para login/register

### 2) Campanhas (RPG)

- Criar, listar, editar e remover campanhas
- Campanhas publicas e privadas
- Solicitar entrada em campanhas
- Controle de membros aceitos e notificacoes para o dono
- Configuracoes avancadas por campanha:
  - sistema de custos habilitado/desabilitado
  - nome customizavel do recurso de custo
  - uso de mapa mundi
  - uso de bonus por raca/classe
  - limite de peso de inventario
  - progressao por niveis configuraveis
  - distribuicao de pontos por classe

### 3) Personagens

- Dashboard com filtros por `player`, `npc` e `monster`
- Criacao e edicao de player em fluxo dedicado
- Criacao e edicao de `npc` e `monster` em modal
- Visualizacao detalhada de personagem em modal
- Favoritos locais para acesso rapido no dashboard
- Permissao para criacao de personagem via solicitacao ao mestre
- Visibilidade por personagem (`public` e `private`)
- Ficha com:
  - identidade e caracteristicas customizaveis
  - atributos, status e pericias
  - habilidades
  - inventario e itens
  - status atuais
  - progressao atual da ficha

### 4) Racas e classes

- Templates de racas e classes por RPG
- Campos de bonus de atributo/pericia
- Categoria de classe
- Edicao avancada por template
- Vinculo entre habilidades e racas/classes

### 5) Habilidades

- Dashboard para criacao e edicao de habilidades por RPG
- Habilidade com multiplos levels
- Campos de combate e progressao
- Compra e gerenciamento de habilidades por personagem
- Pagina dedicada para habilidades de personagem
- Suporte a habilidades para player, npc e monster

### 6) Itens e inventario

- CRUD de itens base por RPG
- Entrega de item para personagens com quantidade
- Inventario por personagem com operacoes de adicionar/remover
- Paginas dedicadas para itens e inventario da ficha
- Suporte de loadout para npc e monster em evolucao

### 7) Biblioteca e lore

- Secoes da biblioteca por RPG
- Livros por secao
- Criacao e edicao de secoes em modal
- Controle de autoria em secoes e livros
- Controle de visibilidade por secao e por livro
- Livros com visibilidade `private`, `public` e `unlisted`
- Filtros por raca/classe/personagem permitido
- Editor rico com Tiptap para conteudo de livros
- Upload de imagens para o conteudo da biblioteca

### 8) Mapa

- Upload de imagem de mapa por RPG
- Visualizacao para membros permitidos
- Edicao do mapa restrita ao dono

### 9) Combate

- O projeto nasceu com foco em combate tatico
- Ja existem estruturas e rotas relacionadas ao modulo de combate
- A experiencia final de combate ainda esta em evolucao

## Estrutura do projeto (resumo)

```text
src/
  app/                 # paginas do App Router
  application/         # casos de uso e contratos da aplicacao
  infrastructure/      # repositorios, gateways e servicos concretos
  presentation/        # features e componentes de interface
  lib/                 # autenticacao, validacoes e utilitarios
  components/          # componentes compartilhados
api/
  package.json         # projeto proprio da API
  src/                 # API standalone para deploy separado
  prisma/              # schema e migrations da API
  generated/           # client Prisma gerado para a API
prisma/
  schema.prisma        # modelo do banco
  migrations/          # historico de migrations
generated/
  prisma/              # cliente Prisma gerado para o app web
```

## Requisitos

- Node.js 22+
- npm 10+
- PostgreSQL 16+ (ou via Docker)

## Configuracao de ambiente

Arquivos de referencia:

- `.env.example`
- `.env.development.example`

Campos principais:

- `DATABASE_URL`: conexao do app com o Postgres
- `DIRECT_URL`: conexao direta usada em migrations
- `JWT_SECRET`: segredo principal do token JWT
- `NEXTAUTH_SECRET` / `APP_SECRET_KEY`: fallback para segredo JWT
- `NEXT_PUBLIC_API_BASE_URL`: URL base da API separada. Ex.: `http://localhost:4000`
- `API_INTERNAL_BASE_URL`: URL interna usada pelo servidor do Next quando frontend e API estiverem em containers diferentes. Ex.: `http://api:4000`
- `FRONTEND_URL`: origem do frontend autorizada pela API separada. Ex.: `http://localhost:3000`
- `API_PORT`: porta do servidor da API separada em desenvolvimento
- `IMAGEKIT_URL_ENDPOINT`
- `IMAGEKIT_PUBLIC_KEY`
- `IMAGEKIT_PRIVATE_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## Desenvolvimento local

Fluxo recomendado sem Docker:

1. Instalar dependencias do frontend:

```bash
npm install
```

2. Instalar dependencias da API:

```bash
cd api
npm install
cd ..
```

3. Preparar `.env` e `.env.development` a partir dos exemplos.

4. Aplicar migrations e gerar os clients Prisma:

```bash
npx prisma migrate deploy
npx prisma generate
npm --prefix api run prisma:generate
```

5. Subir a API:

```bash
npm run api:dev
```

6. Subir o frontend:

```bash
npm run dev
```

7. Acessar `http://localhost:3000`

O frontend depende da API separada. Em desenvolvimento, `NEXT_PUBLIC_API_BASE_URL` aponta para `http://localhost:4000` por padrao nos arquivos de exemplo.

## Ambiente local com Docker

O `docker-compose.yml` sobe:

- `web` (Next.js)
- `api` (servidor HTTP separado da pasta `api/`)
- `db` (Postgres 16)

Subida do ambiente:

```bash
docker compose up --build
```

Comportamento atual dos containers:

- `web`: install, `prisma migrate deploy`, `prisma generate` e `npm run dev`
- `api`: install, `npm run prisma:generate` e `npm run start`

## Rotas principais (UI)

- `/` Home
- `/login` Login
- `/register` Cadastro
- `/rpg` Listagem de campanhas
- `/rpg/new` Criacao de campanha
- `/rpg/[rpgId]` Hub da campanha
- `/rpg/[rpgId]/edit` Configuracoes da campanha
- `/rpg/[rpgId]/characters` Dashboard de personagens
- `/rpg/[rpgId]/characters/[characterId]` Ficha do personagem
- `/rpg/[rpgId]/characters/[characterId]/abilities` Habilidades do personagem
- `/rpg/[rpgId]/characters/[characterId]/inventory` Inventario do personagem
- `/rpg/[rpgId]/characters/[characterId]/items` Itens do personagem
- `/rpg/[rpgId]/characters/[characterId]/skills` Pericias do personagem
- `/rpg/[rpgId]/races` Racas
- `/rpg/[rpgId]/classes` Classes
- `/rpg/[rpgId]/items` Itens base do RPG
- `/rpg/[rpgId]/library` Biblioteca
- `/rpg/[rpgId]/map` Mapa
- `/rpg/[rpgId]/skills` Dashboard de habilidades
- `/combat` entrada atual do modulo de combate

## API (resumo)

Principais grupos:

- `/api/auth/*` autenticacao (`login`, `register`, `logout`)
- `/api/rpg/*` CRUD e configuracoes de RPG
- `/api/rpg/[rpgId]/characters/*` gestao de personagens, inventario e habilidades da campanha
- `/api/rpg/[rpgId]/library/*` secoes e livros da biblioteca
- `/api/skills/*` CRUD de habilidades e levels
- `/api/uploads/*` upload e remocao de imagens
- `/api/characters/*` acoes de pontos e compra de habilidades

## Arquitetura da API

- O frontend aceita uma base de API configuravel por `NEXT_PUBLIC_API_BASE_URL`.
- Em ambientes com containers separados, o frontend server-side pode usar `API_INTERNAL_BASE_URL` para acessar a API pela rede interna.
- A UI passa a consumir a API externa diretamente.
- As rotas em `src/app/api` foram removidas da aplicacao.
- A pasta `api/` concentra o backend standalone como projeto proprio.
- O servidor standalone passa a ser o backend principal para deploys dedicados, como Render.
- Scripts relacionados:
  - `npm run api:dev`
  - `npm run api:start`
  - `npm run api:check`
  - `npm run api:test`

## Operacao da API

- A API da pasta `api/` pode ser publicada separadamente do frontend.
- Para Render, a configuracao base pode usar `render.yaml` e o container usa `api/Dockerfile`.
- O health check configurado para deploy e `GET /api/health`.
- O deploy da API pode ser executado manualmente pela equipe ou automatizado no pipeline de entrega.
- O frontend deve usar `NEXT_PUBLIC_API_BASE_URL` apontando para a URL publica da API hospedada.
- Se o frontend server-side exigir uma URL interna diferente, `API_INTERNAL_BASE_URL` cobre esse cenario.

## Upload de imagens

- Upload via endpoints backend que enviam para ImageKit
- Limite atual de 8 MB por arquivo
- O backend valida autenticacao e tenta remover imagem anterior quando uma nova e enviada

## Estado atual

- A biblioteca e o dashboard de personagens receberam o maior volume de evolucao recente
- O projeto ja possui testes com Vitest em partes importantes da aplicacao
- O modulo de combate continua em desenvolvimento e ainda nao representa a experiencia final do produto

## Scripts principais

- `npm run dev` inicia em desenvolvimento
- `npm run api:build` executa `prisma generate` e a validacao da API separada
- `npm run api:dev` inicia a API separada
- `npm run api:start` inicia a API separada
- `npm run build` build de producao
- `npm run start` inicia build de producao
- `npm run lint` lint
- `npm run test` executa os testes
- `npm run api:test` executa a suite da API separada
- `npm run test:watch` executa os testes em modo watch
- `npm run test:ui` abre a interface do Vitest

## Seguranca

- Nao comitar arquivos `.env*` com segredos reais.
j- Em caso de vazamento, rotacionar imediatamente:
  - segredos JWT
  - chaves ImageKit
  - credenciais de banco
