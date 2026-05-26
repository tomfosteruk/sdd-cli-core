/**
 * Archetype-metadata validator — checks that an archetype-rendered
 * service repo carries the files an adopter expects to find after
 * scaffolding. The default expected-file list covers the common
 * Node + TypeScript shape; adopters with archetypes that produce
 * different layouts (Python services, Go services, etc.) can pass
 * their own `expectedFiles` list.
 */

import { access } from "node:fs/promises";
import { join } from "node:path";

export interface ArchetypeMetadataCheckIssue {
  level: "error" | "warn" | "info";
  message: string;
}

export interface ArchetypeMetadataCheckResult {
  serviceRepoPath: string;
  present: boolean;
  ok: boolean;
  issues: ArchetypeMetadataCheckIssue[];
}

export interface ArchetypeMetadataCheckOptions {
  /** Files (or directories) expected to exist under the service repo. Defaults to a Node + TypeScript scaffold shape. */
  readonly expectedFiles?: readonly string[];
}

const DEFAULT_EXPECTED_FILES: readonly string[] = [
  "package.json",
  "tsconfig.json",
  "src",
];

export async function checkArchetypeMetadata(
  serviceRepoPath: string,
  options: ArchetypeMetadataCheckOptions = {},
): Promise<ArchetypeMetadataCheckResult> {
  const expected = options.expectedFiles ?? DEFAULT_EXPECTED_FILES;
  const issues: ArchetypeMetadataCheckIssue[] = [];
  const present = await exists(serviceRepoPath);
  if (!present) {
    issues.push({
      level: "info",
      message: "service repo directory not present (normal if not yet scaffolded)",
    });
    return { serviceRepoPath, present: false, ok: true, issues };
  }

  for (const file of expected) {
    if (!(await exists(join(serviceRepoPath, file)))) {
      issues.push({ level: "warn", message: `missing expected ${file}` });
    }
  }

  const ok = !issues.some((i) => i.level === "error");
  return { serviceRepoPath, present: true, ok, issues };
}

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}
