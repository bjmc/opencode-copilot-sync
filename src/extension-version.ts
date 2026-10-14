// Build-injected extension version (single source of truth for our User-Agent).
//
// The release build (scripts/build.mjs) defines `__EXTENSION_VERSION__` from
// package.json via esbuild `--define`, so the shipped bundle always carries
// the tagged version. Unbundled runs (tsc `out/` used by tests) fall back to
// 'dev'.
declare const __EXTENSION_VERSION__: string | undefined;

export const EXTENSION_VERSION: string =
  typeof __EXTENSION_VERSION__ !== 'undefined' ? __EXTENSION_VERSION__ : 'dev';

export function extensionUserAgent(): string {
  return `vscode-opencode-copilot-sync/${EXTENSION_VERSION}`;
}
