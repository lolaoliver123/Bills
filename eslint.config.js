import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const srcDirectory = fileURLToPath(new URL('./src', import.meta.url))
const srcAliases = new Set(['app', 'components', 'features'])

const localRules = {
  rules: {
    'prefer-relative-sibling-imports': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Require relative paths for imports from the same directory',
        },
        messages: {
          useRelative: 'Use a relative import for a module in the same directory.',
        },
        schema: [],
      },
      create(context) {
        const checkSource = (node) => {
          const importPath = node.source?.value

          if (typeof importPath !== 'string' || !srcAliases.has(importPath.split('/')[0])) return

          const importedDirectory = path.dirname(path.resolve(srcDirectory, importPath))
          const importingDirectory = path.dirname(context.filename)

          if (importedDirectory === importingDirectory) {
            context.report({ node: node.source, messageId: 'useRelative' })
          }
        }

        return {
          ExportAllDeclaration: checkSource,
          ExportNamedDeclaration: checkSource,
          ImportDeclaration: checkSource,
        }
      },
    },
  },
}

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      local: localRules,
    },
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      'func-style': ['error', 'expression', { allowArrowFunctions: true }],
      'local/prefer-relative-sibling-imports': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: "VariableDeclaration[kind='let']",
          message: 'Use immutable state and const declarations instead of let.',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../**'],
              message: 'Use an absolute import from src.',
            },
            {
              regex: String.raw`\.(?:ts|tsx)$`,
              message: 'Omit TypeScript file extensions from imports.',
            },
          ],
        },
      ],
    },
  },
])
