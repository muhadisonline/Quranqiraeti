import test from 'node:test';
import assert from 'node:assert/strict';
import { parseJsonSafely } from './quranClient';

test('parseJsonSafely returns null on non-JSON HTML responses instead of throwing SyntaxError', async () => {
  const htmlRes = new Response('<!doctype html><html>404</html>', {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
  assert.equal(await parseJsonSafely(htmlRes), null);

  const errRes = new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'content-type': 'application/json' },
  });
  assert.equal(await parseJsonSafely(errRes), null);

  const okRes = new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
  assert.deepEqual(await parseJsonSafely<{ ok: boolean }>(okRes), { ok: true });
});
