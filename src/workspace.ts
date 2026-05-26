/**
 * Workspace-root discovery — walks up from a starting directory to find
 * the nearest SDD repo (one carrying the `.sdd-repo-kind` marker).
 * Implements the sibling-SDD layout convention from ADR 0045.
 */

import { access } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { REPO_KIND_FILE } from "./repo-kind.js";

export async function findSddRoot(startDir: string): Promise<string | null> {
  let current = resolve(startDir);
  while (true) {
    if (await markerExists(current)) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

async function markerExists(dir: string): Promise<boolean> {
  try {
    await access(join(dir, REPO_KIND_FILE));
    return true;
  } catch {
    return false;
  }
}
