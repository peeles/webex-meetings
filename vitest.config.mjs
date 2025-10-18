import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.mjs';

export default mergeConfig(
    viteConfig,
    defineConfig({
        test: {
            globals: true,
            environment: 'jsdom',
            setupFiles: ['./tests/setup.js'],
            include: ['tests/**/*.test.js'],
            coverage: {
                reporter: ['text', 'json', 'html'],
            },
            // Define globals before tests run
            environmentOptions: {
                jsdom: {
                    resources: 'usable',
                },
            },
        },
        define: {
            'global.MediaStream': 'globalThis.MediaStream',
        },
    })
);
