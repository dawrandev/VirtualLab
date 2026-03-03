import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    server: {
        host: 'localhost',
    },
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/app.js',
                // Lab 1: Bacterial Smear
                'resources/css/labs/lab1-bacterial-smear.css',
                'resources/js/labs/lab1-bacterial-smear.js',
            ],
            refresh: ['resources/views/**'],
        }),
    ],
});
