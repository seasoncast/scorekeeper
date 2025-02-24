import {
  env,
  createExecutionContext,
  waitOnExecutionContext,
} from 'cloudflare:test';
import worker from '../src';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';

describe('Worker', () => {
  it('responds with Hello World', async () => {
    const request = new Request('http://example.com/');
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(await response.text()).toMatchInlineSnapshot(`"Hello World!"`);
  });
});
