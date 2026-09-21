// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://tequendama.example.com',
  output: 'static',
  build: {
    format: 'directory',
  },
});