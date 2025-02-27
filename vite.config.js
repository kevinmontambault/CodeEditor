const { defineConfig } = require('vite');

export default defineConfig({
    root: 'frontend',  // Root directory
    publicDir: 'static', // Static assets
    base: '/CodeEditor', // Base path for built files
    build: {
        rollupOptions: {
            input: {
                main: 'editor.html'  // Path relative to 'frontend/'
            }
        },
        outDir: '../build',  // Output outside of 'frontend/'
    },
    server: {
        host: '0.0.0.0', // Allow external access
        port: 8000, // Serve on port 8000
        middlewareMode: false,
    },
    configureServer(server) {
        server.middlewares.use((req, res, next) => {
            if(req.url === '/editor'){ req.url = '/editor.html'; }
            next();
        });
    }
});
