/**
 * @effectorhq/studio HTTP server.
 *
 * Routes:
 *   GET  /           → app.html (single-page UI)
 *   GET  /api/types  → 40-type catalog as JSON
 *   POST /api/validate → validate TOML + SKILL.md
 *   POST /api/compile  → compile to target format
 */

import { createServer as httpCreateServer } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Lazy-load @effectorhq/core functions
let _core = null;
async function getCore() {
  if (_core) return _core;
  try {
    const tomlMod = await import('@effectorhq/core/toml');
    const skillMod = await import('@effectorhq/core/skill');
    const schemaMod = await import('@effectorhq/core/schema');
    const compileMod = await import('@effectorhq/core/compile');
    _core = {
      parseEffectorToml: tomlMod.parseEffectorToml,
      parseSkillFile: skillMod.parseSkillFile,
      validateManifest: schemaMod.validateManifest,
      compile: compileMod.compile,
    };
  } catch {
    const base = join(__dirname, '..', '..', 'effector-core', 'src');
    const tomlMod = await import(join(base, 'toml-parser.js'));
    const skillMod = await import(join(base, 'skill-parser.js'));
    const schemaMod = await import(join(base, 'schema-validator.js'));
    const compileMod = await import(join(base, 'compiler-targets.js'));
    _core = {
      parseEffectorToml: tomlMod.parseEffectorToml,
      parseSkillFile: skillMod.parseSkillFile,
      validateManifest: schemaMod.validateManifest,
      compile: compileMod.compile,
    };
  }
  return _core;
}

// Load type catalog
function loadTypeCatalog() {
  try {
    const catalogPath = join(__dirname, '..', '..', 'effector-core', 'src', 'types-catalog.json');
    return JSON.parse(readFileSync(catalogPath, 'utf-8'));
  } catch {
    try {
      // Try node_modules path
      const modPath = join(__dirname, '..', 'node_modules', '@effectorhq', 'core', 'src', 'types-catalog.json');
      return JSON.parse(readFileSync(modPath, 'utf-8'));
    } catch {
      return { types: { input: {}, output: {}, context: {} } };
    }
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
      catch (e) { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', reject);
  });
}

function json(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

export function createServer() {
  const appHtml = readFileSync(join(__dirname, 'app.html'), 'utf-8');

  return httpCreateServer(async (req, res) => {
    try {
      // GET / — serve the UI
      if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(appHtml);
        return;
      }

      // GET /api/types — return type catalog
      if (req.method === 'GET' && req.url === '/api/types') {
        const catalog = loadTypeCatalog();
        json(res, catalog);
        return;
      }

      // POST /api/validate
      if (req.method === 'POST' && req.url === '/api/validate') {
        const body = await readBody(req);
        const core = await getCore();
        const errors = [];
        let def = null;

        try {
          def = core.parseEffectorToml(body.toml || '');
        } catch (e) {
          errors.push({ type: 'error', message: `TOML parse error: ${e.message}` });
        }

        if (def) {
          const result = core.validateManifest(def);
          if (!result.valid) {
            for (const err of result.errors || []) {
              errors.push({ type: 'error', message: err });
            }
          }
        }

        json(res, { valid: errors.length === 0, errors });
        return;
      }

      // POST /api/compile
      if (req.method === 'POST' && req.url === '/api/compile') {
        const body = await readBody(req);
        const core = await getCore();
        try {
          const def = core.parseEffectorToml(body.toml || '');
          if (body.skill) def.skillContent = body.skill;
          const target = body.target || 'mcp';
          const output = core.compile(def, target);
          json(res, { success: true, output, target });
        } catch (e) {
          json(res, { success: false, error: e.message }, 400);
        }
        return;
      }

      // POST /api/scaffold — write project to disk
      if (req.method === 'POST' && req.url === '/api/scaffold') {
        const body = await readBody(req);
        const dir = body.outputDir || `./${body.name || 'my-effector'}`;
        try {
          mkdirSync(dir, { recursive: true });
          if (body.toml) writeFileSync(join(dir, 'effector.toml'), body.toml);
          if (body.skill) writeFileSync(join(dir, 'SKILL.md'), body.skill);
          writeFileSync(join(dir, '.gitignore'), 'node_modules/\ndist/\n.DS_Store\n*.log\n');
          // Scaffold project license from this package's LICENSE.md template.
          // Keep the year in sync with scaffold time.
          const year = new Date().getFullYear();
          const raw = readFileSync(join(__dirname, '..', 'LICENSE.md'), 'utf-8');
          const fenceOpen = '```text\n';
          const openIdx = raw.indexOf(fenceOpen);
          const closeIdx = raw.lastIndexOf('\n```');
          let licenseText;
          if (openIdx === -1 || closeIdx <= openIdx) {
            licenseText = raw.replace(/^(\s*Copyright\s*\(c\)\s*)\d{4}/m, `$1${year}`);
          } else {
            const inner = raw.slice(openIdx + fenceOpen.length, closeIdx);
            const updatedInner = inner.replace(
              /^(\s*Copyright\s*\(c\)\s*)\d{4}/m,
              `$1${year}`,
            );
            licenseText = raw.slice(0, openIdx + fenceOpen.length) + updatedInner + raw.slice(closeIdx);
          }
          writeFileSync(join(dir, 'LICENSE.md'), licenseText);
          json(res, { success: true, dir });
        } catch (e) {
          json(res, { success: false, error: e.message }, 500);
        }
        return;
      }

      // 404
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    } catch (e) {
      json(res, { error: e.message }, 500);
    }
  });
}
