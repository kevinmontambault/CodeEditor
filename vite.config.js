const defineConfig = require('vite').defineConfig;

export default defineConfig({
    root: 'frontend', // Set the root directory to /www/
    publicDir: 'static',
    base: '/CodeEditor/',
    build: {
        outDir: '../docs',
    },
    server: {
        host: '0.0.0.0',
        port: 52066
    }
});