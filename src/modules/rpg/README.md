# RPG Module Structure

Este modulo consolida a logica de RPG em camadas para reduzir acoplamento nas rotas Next.

## Camadas

- `presentation/`: adaptadores HTTP e contrato de entrada/saida da API.
- `application/`: casos de uso (`getRpgById`, `updateRpg`, `deleteRpg`).
- `domain/`: erros e tipos de dominio usados no modulo.
- `contracts/`: interfaces para repositorios e gateways.
- `infrastructure/`: implementacoes concretas (Prisma, ImageKit, permissao legado).

## Estado atual

- Rotas `src/app/api/rpg/route.ts` e `src/app/api/rpg/[rpgId]/route.ts` estao finas e apenas reexportam adapters em `presentation`.
- Regras de negocio de `POST`, `GET`, `PATCH` e `DELETE` foram movidas para `application/useCases`.
- Acesso a dados de RPG foi extraido para `infrastructure/repositories/prismaRpgRepository.ts`.
- Integracao de limpeza de imagem foi extraida para `infrastructure/gateways/imageKitGateway.ts`.
- Verificacao de permissao foi encapsulada em `infrastructure/services/legacyRpgPermissionService.ts`.

## Proximos passos sugeridos

1. Expandir para `skills`, `items` e `library` com contratos por dominio.
2. Padronizar erros de modulo em um `shared/kernel` no projeto.
3. Extrair autenticacao de `rpgCollectionRoute.ts` para um adapter reutilizavel de sessao.
