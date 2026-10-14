import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXTENSION_VERSION, extensionUserAgent } from '../out/extension-version.js';
import { createOpenCodeRequestHeaders } from '../out/chat/infrastructure/request-factory.js';

test('extension UA names this extension with the build-injected version', () => {
  assert.match(extensionUserAgent(), /^vscode-opencode-copilot-sync\/.+/);
  assert.equal(extensionUserAgent(), `vscode-opencode-copilot-sync/${EXTENSION_VERSION}`);
});

test('request headers use the build-injected UA as the single source of truth', () => {
  const headers = createOpenCodeRequestHeaders('sk-test', '72cc93f5-9d95-4a43-a94d-54c9ead4122d');
  assert.equal(headers['User-Agent'], extensionUserAgent());
  assert.ok(!String(headers['User-Agent']).startsWith('opencode/'));
});
