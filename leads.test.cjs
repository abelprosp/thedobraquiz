const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Readable } = require('node:stream');
const { handleLead } = require('./leads.cjs');
let id = 0;
const valid = { nome: ' Teste local ', email: 'teste@example.com', telefone: '(11) 99999-9999', empresa: 'Teste local' };
async function run(payload, options = {}) {
  const req = Readable.from([Buffer.from(typeof payload === 'string' ? payload : JSON.stringify(payload))]);
  req.method = options.method || 'POST';
  req.headers = { host: 'localhost', 'content-type': 'application/json', ...options.headers };
  req.socket = { remoteAddress: options.ip || String(++id) };
  if (options.parsedBody) req.body = payload;
  const res = { setHeader() {}, writeHead(status) { this.status = status; }, end(body) { this.body = JSON.parse(body); } };
  await handleLead(req, res, { token: options.token === undefined ? 'local-test-token' : options.token, fetcher: options.fetcher || (() => { throw new Error('Unexpected request'); }) });
  return res;
}
test('forwards only the four agreed fields with server-side authorization', async () => {
  let calls = 0;
  const res = await run({ ...valid, score: 75 }, { fetcher: async (url, config) => {
    calls++;
    assert.equal(url, 'https://app.persoocrm.online/api/webhooks/leads');
    assert.equal(config.headers.Authorization, 'Bearer local-test-token');
    assert.equal(config.method, 'POST');
    assert.equal(config.redirect, 'error');
    assert.deepEqual(JSON.parse(config.body), { ...valid, nome: 'Teste local' });
    return { ok: true };
  } });
  assert.equal(calls, 1); assert.equal(res.status, 200); assert.equal(res.body.ok, true);
});
test('rejects malformed, missing and invalid fields before contacting CRM', async () => {
  for (const payload of ['{', null, {}, { ...valid, email: 'invalid' }, { ...valid, telefone: '123' }, { ...valid, empresa: ' ' }]) {
    assert.equal((await run(payload)).status, 400);
  }
  assert.equal((await run({ ...valid, empresa: 'x'.repeat(9000) })).status, 413);
});
test('rejects unsupported methods, cross-origin requests and missing configuration', async () => {
  assert.equal((await run(valid, { method: 'GET' })).status, 405);
  assert.equal((await run(valid, { headers: { origin: 'https://other.example' } })).status, 403);
  assert.equal((await run(valid, { token: '' })).status, 503);
});
test('does not report success or expose provider details on upstream failure', async () => {
  for (const fetcher of [async () => ({ ok: false }), async () => { throw new Error('secret provider detail'); }]) {
    const res = await run(valid, { fetcher });
    assert.equal(res.status, 502); assert.equal(res.body.ok, false);
    assert.ok(!JSON.stringify(res.body).includes('secret'));
  }
});
test('limits repeated submissions', async () => {
  for (let i = 0; i < 10; i++) await run({}, { ip: 'rate-test' });
  assert.equal((await run({}, { ip: 'rate-test' })).status, 429);
});
test('accepts parsed Vercel bodies and preserves the size limit', async () => {
  let calls = 0;
  const res = await run(valid, { parsedBody: true, fetcher: async () => { calls++; return { ok: true }; } });
  assert.equal(res.status, 200);
  assert.equal(calls, 1);
  assert.equal((await run({ ...valid, empresa: 'x'.repeat(9000) }, { parsedBody: true })).status, 413);
});
