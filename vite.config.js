import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    server: {
        // 1. Tashqi ulanishlarni qabul qilish uchun '0.0.0.0' qiling
        host: '0.0.0.0',
        // 2. Ngrok manzilini ruxsat etilganlar ro'yxatiga qo'shing
        allowedHosts: ['.ngrok-free.app'],
        hmr: {
            // 3. Ngrok manzilini buni o'rniga yozing yoki hostni avtomatik aniqlashni yoqing
            host: 'https://1e2c-188-113-238-242.ngrok-free.app',
            protocol: 'wss', // Xavfsiz WebSocket ulanishi uchun
        },
    },
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/app.js',
                'resources/css/labs/lab1-bacterial-smear.css',
                'resources/js/labs/lab1-bacterial-smear.js',
            ],
            refresh: ['resources/views/**'],
        }),
    ],
});