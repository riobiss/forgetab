FROM node:22-alpine

WORKDIR /app/api

COPY packages/world-contracts /app/packages/world-contracts
COPY api/package.json ./package.json
COPY api/package-lock.json ./package-lock.json

RUN npm ci

COPY api ./

RUN npm run prisma:generate
RUN npm prune --omit=dev

# Shared sources live in /app/packages and resolve dependencies by walking up
# to /app/node_modules. Reuse the API's production dependencies there.
RUN ln -s /app/api/node_modules /app/node_modules

EXPOSE 4000

CMD ["npm", "run", "start"]
