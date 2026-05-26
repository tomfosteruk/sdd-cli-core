/**
 * Manifest schema validator — checks an SDD repo's `manifest.yaml` (or
 * equivalent) for the canonical fields and shape per ADR 0143 – ADR 0147.
 *
 * The shape checks (string typing, repo pattern `{org}/{repo}`,
 * description length window) are method-defined and universal. The
 * domain + service_type *vocabularies* are adopter-defined — every
 * adopter ships its own controlled vocabulary. To validate against an
 * adopter vocabulary, pass `ManifestVocabulary` with the allowed values;
 * to validate shape only, omit it.
 */

import { readFile } from "node:fs/promises";
import { parse as parseYaml } from "yaml";

const REPO_PATTERN = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/;

export interface ManifestCheckIssue {
  level: "error" | "warn";
  field: string;
  message: string;
}

export interface ManifestCheckResult {
  path: string;
  ok: boolean;
  issues: ManifestCheckIssue[];
}

export interface ManifestVocabulary {
  /** Allowed values for the `domain` field. If absent, only string typing is checked. */
  readonly domains?: readonly string[];
  /** Allowed values for the `service_type` field. If absent, only string typing is checked. */
  readonly serviceTypes?: readonly string[];
}

export async function checkManifest(
  manifestPath: string,
  vocabulary: ManifestVocabulary = {},
): Promise<ManifestCheckResult> {
  const issues: ManifestCheckIssue[] = [];
  let raw: string;
  try {
    raw = await readFile(manifestPath, "utf8");
  } catch (err: unknown) {
    issues.push({
      level: "error",
      field: "<file>",
      message: `cannot read manifest: ${(err as Error).message}`,
    });
    return { path: manifestPath, ok: false, issues };
  }

  let parsed: unknown;
  try {
    parsed = parseYaml(raw);
  } catch (err: unknown) {
    issues.push({
      level: "error",
      field: "<yaml>",
      message: `YAML parse error: ${(err as Error).message}`,
    });
    return { path: manifestPath, ok: false, issues };
  }
  if (!parsed || typeof parsed !== "object") {
    issues.push({
      level: "error",
      field: "<root>",
      message: "manifest must be an object",
    });
    return { path: manifestPath, ok: false, issues };
  }
  const doc = parsed as Record<string, unknown>;

  check(doc, "repo", issues, (value) => {
    if (typeof value !== "string") return "must be a string";
    if (!REPO_PATTERN.test(value)) return "must match {org}/{repo} pattern";
    return null;
  });
  check(doc, "domain", issues, (value) => {
    if (typeof value !== "string") return "must be a string";
    if (vocabulary.domains && !vocabulary.domains.includes(value)) {
      return `unknown domain; expected one of: ${vocabulary.domains.join(", ")}`;
    }
    return null;
  });
  check(doc, "service_type", issues, (value) => {
    if (typeof value !== "string") return "must be a string";
    if (
      vocabulary.serviceTypes &&
      !vocabulary.serviceTypes.includes(value)
    ) {
      return `unknown service_type; expected one of: ${vocabulary.serviceTypes.join(", ")}`;
    }
    return null;
  });
  check(doc, "description", issues, (value) => {
    if (typeof value !== "string") return "must be a string";
    if (value.length < 10) return "must be at least 10 characters";
    if (value.length > 500) return "must be at most 500 characters";
    return null;
  });

  const ok = !issues.some((i) => i.level === "error");
  return { path: manifestPath, ok, issues };
}

function check(
  doc: Record<string, unknown>,
  field: string,
  issues: ManifestCheckIssue[],
  validator: (value: unknown) => string | null,
): void {
  if (!(field in doc)) {
    issues.push({ level: "error", field, message: "required field missing" });
    return;
  }
  const err = validator(doc[field]);
  if (err) {
    issues.push({ level: "error", field, message: err });
  }
}
