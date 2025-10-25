import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import prettier from 'eslint-plugin-prettier/recommended';

export default [
    js.configs.recommended,
    ...pluginVue.configs['flat/recommended'],
    prettier,
    {
        files: ['**/*.{js,mjs,cjs,vue}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                // Browser globals
                window: 'readonly',
                document: 'readonly',
                navigator: 'readonly',
                console: 'readonly',
                // Node globals
                process: 'readonly',
                __dirname: 'readonly',
                // Vitest globals
                describe: 'readonly',
                it: 'readonly',
                expect: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                vi: 'readonly',
            },
        },
        rules: {
            // Vue-specific rules
            'vue/multi-word-component-names': 'warn',
            'vue/no-unused-vars': 'warn',
            'vue/require-default-prop': 'off',

            // General JavaScript rules
            'no-console':
                process.env.NODE_ENV === 'production' ? 'warn' : 'off',
            'no-debugger':
                process.env.NODE_ENV === 'production' ? 'error' : 'off',
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'no-undef': 'off',

            // Prettier integration
            'prettier/prettier': [
                'error',
                {
                    singleQuote: true,
                    semi: true,
                    trailingComma: 'es5',
                    tabWidth: 4,
                    useTabs: false,
                },
            ],
        },
    },
    {
        ignores: [
            'dist/',
            'docs/',
            'node_modules/',
            'public/',
            '*.config.js',
            'coverage/',
        ],
    },
];
