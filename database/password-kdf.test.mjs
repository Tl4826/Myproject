import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from './password-kdf.mjs';

test('salted scrypt hashes verify only the matching password', async () => {
  const hash1 = await hashPassword('StrongPass123!');
  const hash2 = await hashPassword('StrongPass123!');
  assert.notEqual(hash1, hash2, 'salt must be random per account');
  assert.ok(!hash1.includes('StrongPass123!'), 'plaintext must never be stored');
  assert.equal(await verifyPassword('StrongPass123!', hash1), true);
  assert.equal(await verifyPassword('WrongPass999!', hash1), false);
  assert.equal(await verifyPassword('AAAAAA123', hash1), false);
  assert.equal(await verifyPassword('BBBBBB123', hash1), false);
  assert.equal(await verifyPassword('StrongPass123!', 'garbage'), false);
});
