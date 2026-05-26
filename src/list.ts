/**
 * Sibling-SDD discovery — recursively walks one or more root paths and
 * returns every directory carrying a `.sdd-repo-kind` marker. Implements
 * the discovery half of the sibling-SDD layout convention from ADR 0045.
 */

import { opendir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { readRepoKind, type RepoKind } from "./repo-kind.js";

export interface DiscoveredRepo {
  path: string;
  kind: RepoKind;
}

const SKIP_DIRS: ReadonlySet<string> = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  ".turbo",
  ".cache",
  "coverage",
  "tmp",
  ".venv",
  "__pycache__",
]);

export async function discoverSddRepos(
  roots: readonly string[],
): Promise<DiscoveredRepo[]> {
  const seen = new Set<string>();
  const repos: DiscoveredRepo[] = [];

  for (const root of roots) {
    const abs = resolve(root);
    await walk(abs, seen, repos);
  }

  repos.sort((a, b) => a.path.localeCompare(b.path));
  return repos;
}

async function walk(
  dir: string,
  seen: Set<string>,
  repos: DiscoveredRepo[],
): Promise<void> {
  if (seen.has(dir)) return;
  seen.add(dir);

  const kind = await tryReadRepoKind(dir);
  if (kind) {
    repos.push({ path: dir, kind });
    return;
  }

  let entries: AsyncIterable<{ name: string; isDirectory(): boolean }>;
  try {
    entries = await opendir(dir);
  } catch {
    return;
  }

  for await (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (SKIP_DIRS.has(entry.name)) continue;
    await walk(join(dir, entry.name), seen, repos);
  }
}

async function tryReadRepoKind(dir: string): Promise<RepoKind | null> {
  try {
    return await readRepoKind(dir);
  } catch {
    return null;
  }
}
