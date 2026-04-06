# API

Esta pasta concentra o backend como um projeto proprio, independente do app Next.js da raiz.

## Estrutura

- `src/` contem a API HTTP, casos de uso, infraestrutura e utilitarios backend
- `prisma/` contem schema e migrations da API
- `generated/` recebe o client Prisma gerado para este projeto
- `package.json` define scripts e dependencias da API

## Operacao local

Fluxo recomendado dentro de `api/`:

- `npm install`
- `npm run prisma:generate`
- `npm run dev`

Comandos principais:

- `npm run dev` sobe a API em desenvolvimento
- `npm run start` sobe a API
- `npm run check` valida a tipagem da API
- `npm run test` executa a suite propria da API
- `npm run prisma:migrate:deploy` aplica migrations no banco configurado

Na raiz do repositorio, existem scripts proxy como `npm run api:dev` e `npm run api:check` para conveniencia operacional.

## Operacao no Render

Configuracao de deploy:

- `render.yaml` na raiz do repositorio
- `api/Dockerfile` para a imagem da API

Configuracao operacional atual:

- aplicacao HTTP em `PORT=4000`
- health check em `GET /api/health`
- processo principal executando `npm run start`

Configuracao sugerida no painel:

- `Runtime`: `Docker`
- `Dockerfile Path`: `api/Dockerfile`
- `Health Check Path`: `/api/health`
- `Branch`: `main`

Observacao operacional:

- se o banco usar migrations automatizadas no deploy, o fluxo pode executar `npm run prisma:migrate:deploy` antes de publicar a nova versao
- se preferir, esse passo pode ficar no pipeline em vez de rodar no startup da aplicacao

Secrets obrigatorios:

- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET`
- `FRONTEND_URL`
- `IMAGEKIT_URL_ENDPOINT`
- `IMAGEKIT_PUBLIC_KEY`
- `IMAGEKIT_PRIVATE_KEY`

Variavel de ambiente definida em configuracao:

- `API_PORT=4000`

Contrato com o frontend:

- `NEXT_PUBLIC_API_BASE_URL` deve apontar para a URL publica da API
- `API_INTERNAL_BASE_URL` cobre o acesso server-side em redes internas ou containers separados
