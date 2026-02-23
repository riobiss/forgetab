# ForgeTab

Projeto Next.js para gerenciamento de RPG.

## Configuracao de ambiente

1. Copie os arquivos de exemplo:

```bash
cp .env.example .env
cp .env.development.example .env.development
```

2. Preencha os valores reais de segredo localmente:

- `JWT_SECRET`
- `NEXTAUTH_SECRET`
- `APP_SECRET_KEY`
- `IMAGEKIT_PRIVATE_KEY`
- `DIRECT_URL` (URL direta do Postgres para migrations do Prisma)

## Rodando em desenvolvimento

```bash
npm install
npm run dev
```

## Seguranca

- Arquivos `.env*` sao ignorados pelo git.
- Nunca commite segredos reais no repositorio.
- Em caso de vazamento, rotacione imediatamente todos os segredos expostos.
