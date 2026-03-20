import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../src/server.js';

function request(server, method, path, body = null) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const options = {
      hostname: '127.0.0.1',
      port: addr.port,
      path,
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
    };

    import('node:http').then(({ request: httpReq }) => {
      const req = httpReq(options, (res) => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString();
          resolve({ status: res.statusCode, headers: res.headers, text, json: () => JSON.parse(text) });
        });
      });
      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  });
}

describe('Studio server', () => {
  const server = createServer();
  let listening;

  // Start server on random port
  listening = new Promise(resolve => {
    server.listen(0, '127.0.0.1', resolve);
  });

  after(() => server.close());

  it('serves HTML on GET /', async () => {
    await listening;
    const res = await request(server, 'GET', '/');
    assert.equal(res.status, 200);
    assert.ok(res.headers['content-type'].includes('text/html'));
    assert.ok(res.text.includes('effector studio'));
  });

  it('returns type catalog on GET /api/types', async () => {
    await listening;
    const res = await request(server, 'GET', '/api/types');
    assert.equal(res.status, 200);
    const data = res.json();
    assert.ok(data.types, 'should have types property');
  });

  it('validates TOML on POST /api/validate', async () => {
    await listening;
    const toml = `[effector]\nname = "test"\nversion = "1.0.0"\ntype = "skill"\ndescription = "A test"`;
    const res = await request(server, 'POST', '/api/validate', { toml });
    assert.equal(res.status, 200);
    const data = res.json();
    assert.ok(typeof data.valid === 'boolean');
  });

  it('returns 404 for unknown routes', async () => {
    await listening;
    const res = await request(server, 'GET', '/nonexistent');
    assert.equal(res.status, 404);
  });
});
