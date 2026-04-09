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

## Operacao na Railway

Configuracao de deploy:

- `railway.json` na raiz do repositorio
- `api/Dockerfile` para a imagem da API

Configuracao operacional atual:

- aplicacao HTTP na porta definida por `PORT`, injetada pela Railway
- health check em `GET /api/health`
- processo principal executando `npm run start`

Configuracao sugerida no painel:

- `Builder`: `Dockerfile`
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

Variavel de ambiente para uso local/fallback:

- `API_PORT=4000`

Observacao sobre porta:

- na Railway, deixe a plataforma injetar `PORT` ou defina `PORT` manualmente se precisar fixar a porta
- `API_PORT` continua sendo aceito pelo servidor, mas deve ficar como fallback/local para nao desalinhar o roteamento e o health check da Railway

Contrato com o frontend:

- `NEXT_PUBLIC_API_BASE_URL` deve apontar para a URL publica da API
- `API_INTERNAL_BASE_URL` cobre o acesso server-side em redes internas ou containers separados
