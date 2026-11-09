import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' để deploy được cả ở thư mục con (vd. GitHub Pages)
export default defineConfig({ base: './', plugins: [react()] });
