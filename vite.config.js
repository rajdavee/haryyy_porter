import { defineConfig } from 'vite'
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export default defineConfig({
    root: 'src/',
    publicDir: '../public',  // Changed to point to correct public directory
    server: {
        host: true
    },
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        sourcemap: true
    }
});
