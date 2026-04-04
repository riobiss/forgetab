# API separada

Esta pasta marca a consolidacao do backend fora do `src/app/api`.

## Estado atual

- servidor HTTP proprio em `api/src/server.ts`
- cobertura completa das rotas HTTP atuais da aplicacao
- `GET /api/health`
- handlers e adaptadores HTTP da API em `api/src/presentation`

## Objetivo desta etapa

- manter o backend principal pronto para rodar fora da Vercel
- substituir a API que antes vivia em `src/app/api`
- deixar o backend pronto para deploy dedicado em ambientes como Railway

## Validacao

- rode `npm run api:build` para gerar o bundle Node da API
- rode `npm run api:dev` para subir a API
- rode `npm run api:start` para gerar o bundle e subir a API
- rode `npm run api:check`
- configure `NEXT_PUBLIC_API_BASE_URL` no frontend para apontar para esta API
