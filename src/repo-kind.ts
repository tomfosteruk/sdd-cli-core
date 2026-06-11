/**
 * Repo-kind marker file conventions per ADR 0118 (Partner CLI Role
 * Framework) §6 — every SDD repo carries a `.sdd-repo-kind` marker
 * naming its profile. Adopter code-CLIs read the marker to choose
 * profile-conditional verb shapes.
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";

export type Profile = "platform" | "application" | "integration";

export type RepoKind =
  | "platform-product"
  | "application-product"
  | "integration-product";

export const REPO_KIND_FILE = ".sdd-repo-kind";

/**
 * Legacy pre-rebrand marker filename (the `iteraitive` → `sdd` rebrand).
 * Exported for adopters that detect or migrate legacy repos that still carry
 * the old marker. Note: {@link readRepoKind} below reads only the canonical
 * {@link REPO_KIND_FILE}; honouring the legacy marker as a read fallback is a
 * separate, deliberate behavioural choice left to the consumer (or a future
 * library enhancement), not implied by this constant's presence.
 */
export const LEGACY_REPO_KIND_FILE = ".iteraitive-repo-kind";

const PROFILE_BY_REPO_KIND: Readonly<Record<RepoKind, Profile>> = {
  "platform-product": "platform",
  "application-product": "application",
  "integration-product": "integration",
};

export function profileFromRepoKind(kind: RepoKind): Profile {
  return PROFILE_BY_REPO_KIND[kind];
}

export function isRepoKind(value: string): value is RepoKind {
  return value in PROFILE_BY_REPO_KIND;
}

export async function readRepoKind(repoRoot: string): Promise<RepoKind | null> {
  const path = join(repoRoot, REPO_KIND_FILE);
  const raw = await tryReadFile(path);
  if (raw === null) return null;
  const value = raw.trim();
  if (!isRepoKind(value)) {
    throw new Error(
      `Unrecognised ${REPO_KIND_FILE} value: ${JSON.stringify(value)} at ${path}`,
    );
  }
  return value;
}

async function tryReadFile(path: string): Promise<string | null> {
  try {
    return await readFile(path, "utf8");
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}
