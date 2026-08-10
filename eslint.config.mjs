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
    files: [
      "api/src/features/**/application/**/*.ts",
      "apps/web/src/features/**/application/**/*.{ts,tsx}"
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/**/infrastructure/**",
                "@/**/presentation/**",
                "@/lib/**"
              ],
              message:
                "A camada de aplicacao deve depender apenas de contratos internos, dominio e modulos compartilhados estaveis."
            }
          ]
        }
      ]
    }
  },
  {
    files: ["api/src/features/**/presentation/**/*.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.type='MemberExpression'][callee.object.name='JSON'][callee.property.name='parse']",
          message:
            "Use features/http/presentation/fastifyJson para centralizar o parsing do corpo HTTP."
        }
      ]
    }
  },
  {
    files: ["api/src/features/http/presentation/fastifyJson.ts"],
    rules: {
      "no-restricted-syntax": "off"
    }
  },
  {
    files: frontendFiles,
    rules: {
      "no-restricted-globals": [
        "error",
        {
          name: "fetch",
          message:
            "Use features/http/infrastructure/apiFetch para centralizar URL, sessao e erros de transporte."
        }
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.type='MemberExpression'][callee.property.name='json']",
          message:
            "Use parseApiResponse/ensureApiResponse para centralizar o contrato HTTP."
        }
      ]
    }
  },
  {
    files: [
      "apps/web/src/features/http/infrastructure/apiFetch.ts",
      "apps/web/src/features/http/infrastructure/parseApiResponse.ts"
    ],
    rules: {
      "no-restricted-globals": "off",
      "no-restricted-syntax": "off"
    }
  },
  {
    files: [
      "api/src/features/**/application/**/*.ts",
      "apps/web/src/features/**/application/**/*.{ts,tsx}"
    ],
    ignores: ["**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "no-restricted-globals": [
        "error",
        ...[
          "Blob",
          "File",
          "FormData",
          "Headers",
          "Request",
          "Response",
          "document",
          "fetch",
          "window"
        ].map((name) => ({
          name,
          message:
            "A camada de aplicacao deve usar contratos proprios em vez de APIs de transporte ou navegador."
        }))
      ]
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
