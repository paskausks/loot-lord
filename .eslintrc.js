module.exports = {
    env: {
        es6: true,
        node: true,
    },
    extends: [
        'airbnb-base',
        'plugin:jest/recommended'
    ],
    globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
    },
    plugins: [
        '@typescript-eslint',
        'jest'
    ],
    settings: {
        "import/resolver": {
            node: {
                extensions: ['.js', '.jsx', '.ts', '.tsx'],
            },
        },
    },
    rules: {
        indent: ['error', 4],
        'no-await-in-loop': 'off',
        'lines-between-class-members': ['off'],
        'class-methods-use-this': 'off',
        'import/no-unresolved': [2, { 'commonjs': true, 'amd': true }],
        'import/extensions': [ 'error', 'ignorePackages',
            {
                js: 'never',
                jsx: 'never',
                ts: 'never',
                tsx: 'never'
            }
        ],

        // See https://stackoverflow.com/a/56848207/3775078
        // Ignore unused vars prefixed with an underscore.
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': ['error', {
            'argsIgnorePattern': '^_',
            'varsIgnorePattern': '^_'
        }],
        'no-empty-function': 'off',

        // Weird stuff with missing and required semicolons
        // on default exports
        // https://github.com/typescript-eslint/typescript-eslint/issues/123
        "semi": "off",
        "@typescript-eslint/semi": ["error"]
    },
};
