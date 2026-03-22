/**
 * Download chevrotain versions for benchmarking.
 */
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";

/**
 * Download the "latest" published chevrotain from a CDN URL.
 * Always fetches fresh — no caching — so the result is always
 * the actual latest published version.
 * Returns the downloaded content as a string.
 */
export async function downloadLatestVersion(url: string): Promise<string> {
  console.log(`Downloading latest chevrotain from ${url} ...`);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to download chevrotain from ${url}: ${response.status} ${response.statusText}`,
    );
  }

  const body = await response.text();

  // Basic sanity check — the file should contain an export statement
  if (!body.includes("export")) {
    throw new Error(
      `Downloaded file from ${url} does not appear to be a valid ESM module.`,
    );
  }

  return body;
}

/**
 * Resolve and verify the "next" (locally built) chevrotain version.
 * Returns the absolute path to the local .mjs file.
 *
 * @param relativePath Path relative to the benchmark package root.
 */
export function ensureNextVersion(relativePath: string): string {
  const packageRoot = resolve(dirname(import.meta.dirname!));
  const absPath = resolve(packageRoot, relativePath);

  if (!existsSync(absPath)) {
    throw new Error(
      `Next (local) chevrotain build not found at: ${absPath}\n` +
        `Run 'bun run compile && bun run --filter chevrotain bundle' from the repo root first.`,
    );
  }

  return absPath;
}
