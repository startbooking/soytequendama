// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'http://soytequenda.lan',
  output: 'static',
  build: {
    format: 'directory',
  },
});