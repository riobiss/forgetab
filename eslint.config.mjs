import js from "@eslint/js"
import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"
import prettier from "eslint-config-prettier/flat"
import globals from "globals"
import tseslint from "typescript-eslint"

const frontendFiles = ["apps/web/src/**/*.{js,jsx,mjs,ts,tsx,mts,cts}"]
const nodeJavaScriptFiles = [
  "*.{js,mjs,cjs}",
  "api/**/*.{js,mjs,cjs}",
  "packages/**/*.{js,mjs,cjs}"
]
const nodeTypeScriptFiles = [
  "*.{ts,mts,cts}",
  "api/**/*.{ts,mts,cts}",
  "packages/**/*.{ts,mts,cts}"
]

const applyTo = (configs, files) =>
  configs.map((config) => ({ ...config, files }))

const eslintConfig = defineConfig([
  ...applyTo(nextVitals, frontendFiles),
  ...applyTo(nextTs, frontendFiles),
  {
    ...js.configs.recommended,
    files: nodeJavaScriptFiles,
    languageOptions: {
      globals: globals.node
    }
  },
  ...applyTo(tseslint.configs.recommended, nodeTypeScriptFiles),
  {
    files: nodeTypeScriptFiles,
    languageOptions: {
      globals: globals.node
    }
  },
  {
    files: frontendFiles,
    settings: {
      next: {
        rootDir: "apps/web/src/"
      }
    },
    rules: {
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off"
    }
  },
  {
    files: ["apps/web/src/components/**/*.{js,jsx,ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/app/**",
                "@/features/**",
                "@forgetab/world-contracts",
                "@forgetab/world-contracts/**"
              ],
              message:
                "Componentes compartilhados devem receber dependencias e regras de dominio por props; a composicao pertence ao app ou a feature."
            }
          ]
        }
      ]
    }
  },
  globalIgnores([
    ".next/**",
    "**/.next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "generated/**",
    "api/generated/**"
  ]),
  prettier
])

export default eslintConfig
