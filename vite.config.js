import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/** Reads `.env.txt` if you keep the key there (Vite only auto-loads `.env`). */
function readAnthropicKeyFromEnvTxt() {
  try {
    const filePath = path.join(process.cwd(), '.env.txt');
    if (!fs.existsSync(filePath)) return '';
    const text = fs.readFileSync(filePath, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const m = trimmed.match(
        /^(?:ANTHROPIC_API_KEY|REACT_APP_ANTHROPIC_API_KEY|VITE_ANTHROPIC_API_KEY)\s*=\s*(.+)$/
      );
      if (m) return m[1].trim();
    }
  } catch {
    /* ignore */
  }
  return '';
}

function anthropicProxy(anthropicKey) {
  return {
    '/api/messages': {
      target: 'https://api.anthropic.com',
      changeOrigin: true,
      secure: true,
      rewrite: (path) => path.replace(/^\/api\/messages/, '/v1/messages'),
      configure(proxy) {
        proxy.on('proxyReq', (proxyReq) => {
          proxyReq.setHeader('anthropic-version', '2023-06-01');
          if (anthropicKey) {
            proxyReq.setHeader('x-api-key', anthropicKey);
          }
        });
      },
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const anthropicKey =
    env.ANTHROPIC_API_KEY ||
    env.REACT_APP_ANTHROPIC_API_KEY ||
    env.VITE_ANTHROPIC_API_KEY ||
    readAnthropicKeyFromEnvTxt();

  return {
    plugins: [react()],
    server: {
      proxy: anthropicProxy(anthropicKey),
    },
    preview: {
      proxy: anthropicProxy(anthropicKey),
    },
  };
});
