import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import type { Application } from 'express';
import request from 'supertest';

import { disconnectPrisma } from '../config/prisma.js';
import { assertArchiveWithinLimit } from '../services/dataset.service.js';

describe('GET /health', () => {
  let app: Application;

  beforeAll(async () => {
    const { createTestApp } = await import('./helpers/createTestApp.js');
    app = await createTestApp();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  // The container HEALTHCHECK and the deploy verification both read this, so it
  // has to reflect the database rather than just that the process is alive.
  it('reports the database state', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.database).toBe('up');
  });
});

describe('assertArchiveWithinLimit', () => {
  let tmpDir: string;
  let archive: string;
  let payloadBytes: number;

  beforeAll(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'annotex-zip-'));
    const payload = path.join(tmpDir, 'payload.txt');

    // Highly compressible, so the archive on disk stays far smaller than what
    // it expands to — the shape of the attack this guards against.
    fs.writeFileSync(payload, 'a'.repeat(1024 * 512));
    payloadBytes = fs.statSync(payload).size;

    archive = path.join(tmpDir, 'bundle.zip');
    execFileSync('zip', ['-qj', archive, payload]);
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('allows an archive under the limit', () => {
    expect(() => assertArchiveWithinLimit(archive, payloadBytes * 2)).not.toThrow();
  });

  it('rejects an archive that expands past the limit', () => {
    expect(() => assertArchiveWithinLimit(archive, 1024)).toThrow(/over the/);
  });

  it('measures expanded size, not compressed size', () => {
    // The guard must fail on content size even though the .zip itself is small
    // enough to pass an upload check at the same threshold.
    expect(fs.statSync(archive).size).toBeLessThan(payloadBytes);
    expect(() => assertArchiveWithinLimit(archive, payloadBytes - 1)).toThrow();
  });

  it('rejects a file that is not a readable archive', () => {
    const bogus = path.join(tmpDir, 'not-a-zip.zip');
    fs.writeFileSync(bogus, 'this is not a zip file');
    expect(() => assertArchiveWithinLimit(bogus, 1024 * 1024)).toThrow();
  });
});
