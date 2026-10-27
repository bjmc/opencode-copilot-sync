import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as vscode from 'vscode';
import { formatProviderMessages } from '../out/chat/infrastructure/message-mapper.js';

// Copilot Chat marks prompt-cache breakpoints with a LanguageModelDataPart whose
// mimeType is "cache_control" and whose data is the base64 of "ephemeral".
function cacheControlPart() {
  return new vscode.LanguageModelDataPart(
    new TextEncoder().encode('ephemeral'),
    'cache_control'
  );
}

// Parts that cross the extension-host RPC boundary arrive as plain objects
// tagged with VS Code's marshalling id, which is how the bug reached users.
function marshalledCacheControlPart() {
  return { $mid: 24, mimeType: 'cache_control', data: 'ZXBoZW1lcmFs' };
}

test('drops a cache_control data part instead of serialising it into tool output', () => {
  const messages = formatProviderMessages([
    {
      role: vscode.LanguageModelChatMessageRole.User,
      content: [new vscode.LanguageModelTextPart('question')],
    },
    {
      role: vscode.LanguageModelChatMessageRole.User,
      content: [
        new vscode.LanguageModelToolResultPart('call-1', [
          { value: 'file contents' },
          cacheControlPart(),
        ]),
      ],
    },
  ]);

  assert.deepEqual(messages, [
    { role: 'user', content: 'question' },
    { role: 'tool', tool_call_id: 'call-1', content: 'file contents' },
  ]);

  const serialised = JSON.stringify(messages);
  assert.ok(!serialised.includes('cache_control'), 'mimeType must not reach the wire');
  assert.ok(!serialised.includes('ZXBoZW1lcmFs'), 'base64 payload must not reach the wire');
  assert.ok(!serialised.includes('$mid'), 'marshalling envelope must not reach the wire');
});

test('drops a marshalled data part that survives as a plain object', () => {
  const messages = formatProviderMessages([
    {
      role: vscode.LanguageModelChatMessageRole.User,
      content: [
        new vscode.LanguageModelToolResultPart('call-1', [
          marshalledCacheControlPart(),
          { value: 'file contents' },
        ]),
      ],
    },
  ]);

  assert.deepEqual(messages, [
    { role: 'tool', tool_call_id: 'call-1', content: 'file contents' },
  ]);
});

test('drops a data part that is the entire message content', () => {
  const messages = formatProviderMessages([
    {
      role: vscode.LanguageModelChatMessageRole.User,
      content: [cacheControlPart()],
    },
  ]);

  assert.deepEqual(messages, []);
});

test('drops a data part that is the entire tool result', () => {
  const messages = formatProviderMessages([
    {
      role: vscode.LanguageModelChatMessageRole.User,
      content: [new vscode.LanguageModelToolResultPart('call-1', cacheControlPart())],
    },
  ]);

  assert.deepEqual(messages, [{ role: 'tool', tool_call_id: 'call-1', content: '' }]);
});

test('keeps image data parts out of the transcript text', () => {
  const image = new vscode.LanguageModelDataPart(new Uint8Array([1, 2, 3]), 'image/png');

  const messages = formatProviderMessages([
    {
      role: vscode.LanguageModelChatMessageRole.User,
      content: [new vscode.LanguageModelToolResultPart('call-1', [image, { value: 'text' }])],
    },
  ]);

  assert.deepEqual(messages, [{ role: 'tool', tool_call_id: 'call-1', content: 'text' }]);
});

test('leaves ordinary tool output unchanged', () => {
  const messages = formatProviderMessages([
    {
      role: vscode.LanguageModelChatMessageRole.User,
      content: [new vscode.LanguageModelToolResultPart('call-1', ['first', { value: 'second' }])],
    },
  ]);

  assert.deepEqual(messages, [{ role: 'tool', tool_call_id: 'call-1', content: 'first\nsecond' }]);
});
