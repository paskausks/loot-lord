const { defineConfig } = require('eslint/config');
const globals = require('globals');
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');

module.exports = defineConfig([eslint.configs.recommended, tseslint.configs.recommendedTypeChecked, {
    files: ["**/*.ts"],
    languageOptions: {
        ecmaVersion: 2022,
        sourceType: 'commonjs',
        globals: {
            ...globals.node,
            Atomics: 'readonly',
            SharedArrayBuffer: 'readonly',
        },
        parser: require('@typescript-eslint/parser'),
        parserOptions: {
            projectService: true,
            tsconfigRootDir: __dirname,
        },
    },
    plugins: {
        'typescript-eslint': tseslint,
        'jest': require('eslint-plugin-jest'),
        'import': require('eslint-plugin-import'),
    },
    settings: {
        'import/resolver': {
            node: {
                extensions: ['.js', '.jsx', '.ts', '.tsx'],
            },
        },
    },
    rules: {
        indent: ['error', 4],
        'no-undef': 'off', // trust the compiler
        'no-await-in-loop': 'off',
        'lines-between-class-members': 'off',
        'class-methods-use-this': 'off',
        '@typescript-eslint/explicit-function-return-type': 'error',

        // FIXME(rp): these should actually be eventually addressed
        '@typescript-eslint/no-floating-promises': 'off',
        '@typescript-eslint/no-misused-promises': 'off',
        '@typescript-eslint/require-await': 'off',

        'import/no-unresolved': [2, { commonjs: true, amd: true }],
        'import/exports-last': ['error'],
        'import/extensions': ['error', 'ignorePackages',
            {
                js: 'never',
                jsx: 'never',
                ts: 'never',
                tsx: 'never',
            },
        ],

        // See https://stackoverflow.com/a/56848207/3775078
        // Ignore unused vars prefixed with an underscore.
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': ['error', {
            "args": "all",
            "argsIgnorePattern": "^_",
            "caughtErrors": "all",
            "caughtErrorsIgnorePattern": "^_",
            "destructuredArrayIgnorePattern": "^_",
            "varsIgnorePattern": "^_",
            "ignoreRestSiblings": true
        }],
        'no-empty-function': 'off',

        semi: 'error',

        camelcase: ['error', {
            allow: [
                // Database field whitelist
                'user_id',
                'reminder_at',
                'reminder_url',
                'killer_id',
                'victim_id',
                'author_id',
                'nominee_id',
                'message_id',
                'message_url',
                'created_at',
                'created_by_id',
                'updated_at',
                'ignorer_id',
                'entity_id',
                'previous_response_id',

                // OpenAI API fields
                'image_url',
                'max_output_tokens',
            ],
        }],
    },
    ignores: [
        'dist/*/*.js',
        '__tests__',
    ],
}]);
