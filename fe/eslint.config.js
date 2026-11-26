import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

// Config flat para ESLint 9.17 (sin `eslint/config`: defineConfig/globalIgnores
// solo existen desde ESLint 9.22, por eso la versión anterior de este archivo
// rompía con ERR_PACKAGE_PATH_NOT_EXPORTED). Los configs compartidos se
// componen a mano y se restringen a TypeScript/TSX.
const files = ['**/*.{ts,tsx}']

export default [
  { ignores: ['dist'] },
  { ...js.configs.recommended, files },
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: config.files ?? files,
  })),
  {
    ...reactRefresh.configs.vite,
    files,
    rules: {
      ...reactRefresh.configs.vite.rules,
      // AuthContext/CartContext exportan el objeto de contexto junto al
      // Provider en el mismo archivo; es el patrón estándar de React y no
      // rompe fast refresh en la práctica.
      'react-refresh/only-export-components': [
        'error',
        {
          allowConstantExport: true,
          allowExportNames: ['AuthContext', 'CartContext'],
        },
      ],
    },
  },
  {
    files,
    plugins: {
      'react-hooks': reactHooks,
    },
    // configs.recommended es el formato legacy (plugins: ['react-hooks']);
    // en flat config solo se reutilizan sus reglas con el plugin ya mapeado.
    rules: reactHooks.configs.recommended.rules,
    languageOptions: {
      globals: globals.browser,
    },
  },
]
