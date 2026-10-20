const {
  test
} = require('node:test');
const assert = require('node:assert/strict');
const {
  validateApiUrl
} = require('../../src/config/api.cjs');
test('MockAPI base URL validation rejects invalid URLs and credentials', () => {
  assert.equal(validateApiUrl(' https://example.mockapi.io/api/v1/ '), 'https://example.mockapi.io/api/v1');
  for (const url of ['', 'not a URL', 'http://example.com', 'https://user:secret@example.com', 'https://example.com?x=1', 'https://example.com/#hash', 'https://example.com/240245_Dish', 'https://YOUR_PROJECT.mockapi.io/api/v1']) assert.throws(() => validateApiUrl(url), {
    message: 'invalidApiUrl'
  });
});
