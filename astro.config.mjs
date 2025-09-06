// @ts-check
import { defineConfig } from 'astro/config';

import solidJs from '@astrojs/solid-js';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  integrations: [solidJs()],
  
  adapter: node({
    mode: 'standalone'
  }),
  
  // Configure server for Replit environment
  server: {
    host: '0.0.0.0',
    port: 5000
  },
  
  // Allow all hosts for Replit proxy
  vite: {
    server: {
      allowedHosts:["075b0e6f-bf1a-4c0a-a009-0512289691f9-00-3q32q9haeywe1.picard.replit.dev"]
    }
  },
  
  // Enable server-side functionality
  
  output: 'server'
});