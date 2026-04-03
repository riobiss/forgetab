# API separada

Esta pasta marca a consolidacao do backend fora do `src/app/api`.

## Estado atual

- servidor HTTP proprio em `api/src/server.ts`
- cobertura completa das rotas HTTP atuais da aplicacao
- `GET /api/health`
- handlers compartilhados com o Next em `src/backend/routes`

## Objetivo desta etapa

- manter o backend principal pronto para rodar fora da Vercel
- preservar `src/app/api` como camada adaptadora durante a transicao
- deixar a base pronta para adicionar transporte realtime no mesmo runtime Node

## Validacao

- rode `npm run api:build` para gerar o bundle Node da API
- rode `npm run api:dev` para subir a API
- rode `npm run api:start` para gerar o bundle e subir a API
- rode `npm run api:check`
- configure `NEXT_PUBLIC_API_BASE_URL` no frontend para apontar para esta API
- configure `NEXT_PUBLIC_WS_BASE_URL` quando as features realtime entrarem no projeto
