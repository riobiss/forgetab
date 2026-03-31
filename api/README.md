# API separada

Esta pasta marca o inicio da extracao do backend para fora do `src/app/api`.

## Estado atual

- servidor HTTP proprio em `api/src/server.ts`
- rotas standalone de autenticacao, personagens, itens, skills, membership e biblioteca
- `GET /api/health`
- handlers compartilhados com o Next em `src/backend/routes`

## Objetivo desta etapa

- criar a base fisica da API fora de `src/app/api`
- comecar a extrair handlers compartilhados
- manter o projeto tipado enquanto a migracao do Prisma e dos demais modulos continua

## Validacao

- rode `npm run api:build` para gerar o bundle Node da API
- rode `npm run api:dev` para subir a API
- rode `npm run api:start` para gerar o bundle e subir a API
- rode `npm run api:check`
- quando a extracao do acesso a dados sair da camada atual do Next, esta pasta ja tera o ponto de entrada pronto para assumir as rotas
