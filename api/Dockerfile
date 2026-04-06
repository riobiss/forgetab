FROM node:22-alpine

WORKDIR /app

COPY api/package.json ./package.json
COPY api/package-lock.json ./package-lock.json

RUN npm ci

COPY api/ ./

RUN npm run prisma:generate

EXPOSE 4000

CMD ["npm", "run", "start"]
