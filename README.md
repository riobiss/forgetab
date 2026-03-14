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
  app/                 # paginas e rotas API (App Router)
  application/         # casos de uso e contratos da aplicacao
  infrastructure/      # repositorios, gateways e servicos concretos
  presentation/        # features e componentes de interface
  lib/                 # autenticacao, validacoes e utilitarios
  components/          # componentes compartilhados
prisma/
  schema.prisma        # modelo do banco
  migrations/          # historico de migrations
generated/
  prisma/              # cliente Prisma gerado
```

## Requisitos

- Node.js 22+
- npm 10+
- PostgreSQL 16+ (ou via Docker)

## Variaveis de ambiente

Use os exemplos:

- `.env.example`
- `.env.development.example`

Campos principais:

- `DATABASE_URL`: conexao do app com o Postgres
- `DIRECT_URL`: conexao direta usada em migrations
- `JWT_SECRET`: segredo principal do token JWT
- `NEXTAUTH_SECRET` / `APP_SECRET_KEY`: fallback para segredo JWT
- `IMAGEKIT_URL_ENDPOINT`
- `IMAGEKIT_PUBLIC_KEY`
- `IMAGEKIT_PRIVATE_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## Como rodar localmente (sem Docker)

1. Instale dependencias:

```bash
npm install
```

2. Configure `.env` e `.env.development` a partir dos exemplos.

3. Rode migrations e gere o client:

```bash
npx prisma migrate deploy
npx prisma generate
```

4. Suba o app:

```bash
npm run dev
```

5. Abra `http://localhost:3000`

## Como rodar com Docker

O `docker-compose.yml` sobe:

- `web` (Next.js)
- `db` (Postgres 16)

Comando:

```bash
docker compose up --build
```

O container `web` executa install, `prisma migrate deploy`, `prisma generate` e `npm run dev`.

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

## Upload de imagens

- Upload via endpoints backend que enviam para ImageKit
- Limite atual de 8 MB por arquivo
- O backend valida autenticacao e tenta remover imagem anterior quando uma nova e enviada

## Estado atual e observacoes

- A biblioteca e o dashboard de personagens receberam o maior volume de evolucao recente
- O projeto ja possui testes com Vitest em partes importantes da aplicacao
- O modulo de combate continua em desenvolvimento e ainda nao representa a experiencia final do produto

## Scripts

- `npm run dev` inicia em desenvolvimento
- `npm run build` build de producao
- `npm run start` inicia build de producao
- `npm run lint` lint
- `npm run test` executa os testes
- `npm run test:watch` executa os testes em modo watch
- `npm run test:ui` abre a interface do Vitest

## Seguranca

- Nao comitar arquivos `.env*` com segredos reais.
- Em caso de vazamento, rotacionar imediatamente:
  - segredos JWT
  - chaves ImageKit
  - credenciais de banco
