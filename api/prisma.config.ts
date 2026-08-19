import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { config } from "dotenv"
import { defineConfig } from "prisma/config"

const apiDirectory = dirname(fileURLToPath(import.meta.url))

if (!process.env.DATABASE_URL) {
  config({
    path: [resolve(apiDirectory, ".env"), resolve(apiDirectory, "../.env")],
    quiet: true
  })
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations"
  },
  datasource: {
    url: process.env.DATABASE_URL ?? ""
  }
})
