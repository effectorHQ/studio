#!/usr/bin/env node

/**
 * @effectorhq/studio CLI
 *
 * Usage:
 *   npx @effectorhq/studio [--port 7432] [--no-open]
 *   studio [--port 7432] [--no-open]
 *
 * Starts a local HTTP server and opens the interactive studio in the browser.
 */

import { createServer } from './server.js';
import { exec } from 'node:child_process';

const args = process.argv.slice(2);

function getArg(name, fallback) {
  const idx = args.indexOf(name);
  if (idx === -1) return fallback;
  return args[idx + 1] || fallback;
}

const port = parseInt(getArg('--port', '7432'), 10);
const noOpen = args.includes('--no-open');

const server = createServer();

server.listen(port, () => {
  const url = `http://localhost:${port}`;
  console.log(`✦ Studio running at ${url}`);

  if (!noOpen) {
    const platform = process.platform;
    let cmd;
    if (platform === 'darwin') cmd = `open "${url}"`;
    else if (platform === 'win32') cmd = `start "" "${url}"`;
    else cmd = `xdg-open "${url}"`;

    exec(cmd, (err) => {
      if (err) console.log(`Open ${url} in your browser to get started.`);
    });
  }
});
