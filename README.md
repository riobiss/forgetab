# ForgeTab

Plataforma web para criacao e gerenciamento de campanhas de RPG, com foco em:

- gestao de campanhas e membros
- criacao e evolucao de personagens
- sistema de itens, inventario e habilidades por level
- biblioteca/lore por secoes e livros com editor rico
- modulo de combate tatico (em evolucao)

## Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Prisma + PostgreSQL
- Autenticacao com JWT em cookie HttpOnly
- Validacoes com Zod
- Upload de imagens com ImageKit
- Estilos com CSS Modules + Sass

## Principais funcionalidades

### 1) Conta e autenticacao

- Cadastro e login com hash de senha (`bcryptjs`)
- Sessao via cookie `auth_token` (JWT HS256)
- Protecao de rotas por proxy/middleware
- Protecao CSRF para metodos mutaveis da API (`POST`, `PUT`, `PATCH`, `DELETE`)
- Rate limit local para login/cadastro (com ponto de extensao para Upstash)

### 2) Campanhas (RPG)

- Criar, listar, editar e remover campanhas
- Campanhas publicas e privadas
- Solicitar entrada em campanhas (membro pendente/aceito/rejeitado)
- Controle de membros aceitos e notificacoes para o dono
- Configuracoes avancadas por campanha:
  - sistema de custos habilitado/desabilitado
  - nome customizavel do recurso de custo (ex.: "Skill Points")
  - uso de mapa mundi
  - uso de bonus por raca/classe
  - limite de peso de inventario

### 3) Personagens

- Criacao e listagem por tipo (`player`, `npc`, `monster`)
- Permissao para criacao de personagem via solicitacao ao mestre
- Visibilidade por personagem (publico/privado)
- Ficha com:
  - identidade e caracteristicas customizaveis
  - atributos, status e pericias
  - habilidades
  - inventario
  - status atuais

### 4) Racas e classes

- Templates de racas e classes por RPG
- Campos de bonus de atributo/pericia
- Categoria de classe
- Edicao avancada por template
- Vinculo entre habilidades e racas/classes

### 5) Habilidades (Skill Builder)

- Dashboard para criacao/edicao de habilidades por RPG
- Habilidade com multiplos levels
- Campos de combate e progressao:
  - categoria e tipo de uso (acao/bonus/reacao/passiva)
  - dano, alcance, recarga, duracao, conjuracao
  - custo de recurso e custo em pontos
  - notas por level
- Modelagem de efeitos por level:
  - dano, cura, buff/debuff, aplicar/remover status, escudo, zona, invocacao, movimento
  - valor fixo ou baseado em dados
- Compra de habilidade pelo personagem com consumo de pontos

### 6) Itens e inventario

- CRUD de itens base por RPG
- Tipos de item: `weapon`, `armor`, `consumable`, `accessory`, `material`, `quest`
- Campos avancados de item:
  - raridade, dano, alcance, peso, durabilidade, duracao, pre-requisito
  - habilidades/efeitos estruturados
- Entrega de item para personagens com quantidade
- Inventario por personagem com operacoes de adicionar/remover

### 7) Biblioteca e lore

- Secoes da biblioteca por RPG
- Livros por secao
- Editor rico (Tiptap) para conteudo de livros
- Controle de visibilidade por livro
- Filtros por raca/classe/personagem permitido

### 8) Mapa

- Upload de imagem de mapa por RPG
- Visualizacao para membros permitidos
- Edicao do mapa restrita ao dono

### 9) Combate

- Existe modulo de combate com:
  - fila de turnos
  - fases de turno
  - escolha de ataque/alvo
  - logs de batalha
- Observacao: a rota `/combat` ainda esta como "Em desenvolvimento...". O codigo do modulo esta em `src/app/combat/battle` e `src/app/combat/setup`.

## Estrutura do projeto (resumo)

```text
src/
  app/                 # paginas e rotas API (App Router)
  lib/                 # autenticacao, acesso a dados, validacoes, utilitarios de RPG
  components/          # componentes de UI e editor
  data/                # dados estaticos (world-of-clans etc.)
prisma/
  schema.prisma        # modelo do banco
  migrations/          # historico de migrations
generated/
  prisma/              # cliente Prisma gerado
```

## Requisitos

- Node.js 22+ (alinhado ao `Dockerfile.dev`)
- npm 10+
- PostgreSQL 16+ (ou via Docker)

## Variaveis de ambiente

Use os exemplos:

- `.env.example` (execucao local)
- `.env.development.example` (docker-compose)

Campos principais:

- `DATABASE_URL`: conexao do app com o Postgres
- `DIRECT_URL`: conexao direta usada em migrations (quando aplicavel)
- `JWT_SECRET`: segredo principal do token JWT
- `NEXTAUTH_SECRET` / `APP_SECRET_KEY`: fallback para segredo JWT
- `IMAGEKIT_URL_ENDPOINT`
- `IMAGEKIT_PUBLIC_KEY`
- `IMAGEKIT_PRIVATE_KEY`
- `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` (opcional, ainda nao conectado na implementacao atual de rate limit distribuido)

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

5. Abra: `http://localhost:3000`

## Como rodar com Docker

O `docker-compose.yml` sobe:

- `web` (Next.js)
- `db` (Postgres 16)

Comando:

```bash
docker compose up --build
```

O container `web` ja executa: install, `prisma migrate deploy`, `prisma generate` e `npm run dev`.

## Rotas principais (UI)

- `/` Home
- `/login` Login
- `/cadastro` Cadastro
- `/rpg` Listagem de campanhas
- `/rpg/novo` Criacao de campanha
- `/rpg/[rpgId]` Hub da campanha
- `/rpg/[rpgId]/edit` Configuracoes da campanha
- `/rpg/[rpgId]/characters` Personagens
- `/rpg/[rpgId]/races` Racas
- `/rpg/[rpgId]/classes` Classes
- `/rpg/[rpgId]/items` Itens
- `/rpg/[rpgId]/library` Biblioteca
- `/rpg/[rpgId]/map` Mapa (quando habilitado)
- `/dashboard/skills` Dashboard de habilidades
- `/combat` entrada atual do modulo de combate (placeholder)

## API (resumo)

Principais grupos:

- `/api/auth/*` autenticacao (`login`, `register`, `logout`)
- `/api/rpg/*` CRUD e configuracoes de RPG (membros, personagens, itens, biblioteca, mapa, templates)
- `/api/skills/*` CRUD de habilidades e levels
- `/api/uploads/*` upload/remocao de imagens (rpg/mapa/item/personagem/biblioteca)
- `/api/characters/*` acoes de pontos e compra de habilidades

## Upload de imagens

- Upload via endpoints backend que enviam para ImageKit.
- Limite atual: 8 MB por arquivo.
- O backend valida autenticacao e tenta remover imagem anterior quando uma nova e enviada.

## Estado atual e observacoes

- Ha rotas de documentacao (`/docs`) e combate (`/combat`) ainda sem experiencia final completa.
- O projeto possui diversas validacoes e tratamentos de compatibilidade para bancos com migrations antigas, mas o ideal e manter todas as migrations aplicadas.

## Scripts

- `npm run dev` inicia em desenvolvimento
- `npm run build` build de producao
- `npm run start` inicia build de producao
- `npm run lint` lint

## O que vale completar manualmente neste README

Para deixar este README excelente, inclua manualmente:

1. Objetivo de produto em 1-2 paragrafos (problema que resolve e publico-alvo).
2. Screenshots ou GIFs das telas principais (Home, Hub do RPG, Skill Builder, Biblioteca, Itens).
3. Fluxo "primeiros 5 minutos" (cadastro -> criar RPG -> criar personagem -> criar skill -> testar).
4. Politica de deploy (onde sobe, como configurar secrets em producao, estrategia de migrations).
5. Padrao de contribuicao (branch naming, commit convention, PR checklist).
6. Roadmap curto (proximas features e o que esta "em desenvolvimento").
7. Decisoes de design importantes (ex.: por que JWT cookie + proxy, por que ImageKit, por que schema atual).
8. Exemplos de payload para 3-5 endpoints criticos da API.

## Seguranca

- Nao comitar arquivos `.env*` com segredos reais.
- Em caso de vazamento, rotacionar imediatamente:
  - segredos JWT
  - chaves ImageKit
  - credenciais de banco
