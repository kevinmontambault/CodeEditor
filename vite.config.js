const defineConfig = require('vite').defineConfig;

export default defineConfig({
    root: 'frontend', // Set the root directory to /www/
    publicDir: 'static',
    build: {
        outDir: 'docs',
    },
    server: {
        port: 5173, // Change if needed
    }
});