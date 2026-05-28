'use strict';
const assert = require('assert');
const { describe, it } = require('node:test');
const {
  sanitizePath,
  sanitizeProject,
  clampLimit,
  truncateString,
  isValidId,
} = require('../scripts/sanitize');

describe('sanitizePath', () => {
  it('strips path traversal sequences', () => {
    assert.strictEqual(sanitizePath('../../../etc/passwd'), 'etc/passwd');
    assert.strictEqual(sanitizePath('..\\..\\windows\\system32'), 'windows\\system32');
  });

  it('strips bare .. segments', () => {
    assert.strictEqual(sanitizePath('/foo/../bar'), '/foo/bar');
    assert.strictEqual(sanitizePath('foo/..'), 'foo/');
    assert.strictEqual(sanitizePath('..'), '');
  });

  it('strips null bytes', () => {
    assert.strictEqual(sanitizePath('file\0.txt'), 'file.txt');
  });

  it('returns empty string for non-string input', () => {
    assert.strictEqual(sanitizePath(null), '');
    assert.strictEqual(sanitizePath(undefined), '');
    assert.strictEqual(sanitizePath(123), '');
  });
});

describe('sanitizeProject', () => {
  it('keeps valid project names', () => {
    assert.strictEqual(sanitizeProject('Engram'), 'Engram');
    assert.strictEqual(sanitizeProject('my-project'), 'my-project');
  });

  it('strips dangerous characters', () => {
    assert.strictEqual(sanitizeProject('../../../etc'), 'etc');
    assert.strictEqual(sanitizeProject('foo; rm -rf /'), 'foorm-rf');
  });

  it('returns empty string for empty input', () => {
    assert.strictEqual(sanitizeProject(''), '');
    assert.strictEqual(sanitizeProject('   '), '');
    assert.strictEqual(sanitizeProject(null), '');
  });
});

describe('clampLimit', () => {
  it('returns default for invalid input', () => {
    assert.strictEqual(clampLimit('abc', 10, 100), 10);
    assert.strictEqual(clampLimit(null, 10, 100), 10);
    assert.strictEqual(clampLimit(0, 10, 100), 10);
  });

  it('clamps to max', () => {
    assert.strictEqual(clampLimit(999, 10, 100), 100);
  });

  it('returns parsed integer for valid input', () => {
    assert.strictEqual(clampLimit('50', 10, 100), 50);
    assert.strictEqual(clampLimit(25, 10, 100), 25);
  });
});

describe('truncateString', () => {
  it('returns original if under limit', () => {
    assert.strictEqual(truncateString('hello', 10), 'hello');
  });

  it('truncates to max length', () => {
    assert.strictEqual(truncateString('hello world', 5), 'hello');
  });

  it('returns empty string for non-string input', () => {
    assert.strictEqual(truncateString(null, 10), '');
    assert.strictEqual(truncateString(undefined, 10), '');
  });
});

describe('isValidId', () => {
  it('accepts alphanumeric IDs', () => {
    assert.ok(isValidId('a_12345_abc'));
    assert.ok(isValidId('session-123'));
  });

  it('rejects empty or malformed IDs', () => {
    assert.ok(!isValidId(''));
    assert.ok(!isValidId('../etc'));
    assert.ok(!isValidId(null));
    assert.ok(!isValidId('id with spaces'));
  });
});
