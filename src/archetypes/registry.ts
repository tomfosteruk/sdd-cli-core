/**
 * Archetype-registry loader and filters. The registry mechanism is
 * upstream-shaped (ADR 0118 §6 archetype-output compliance); the
 * archetype *declarations* themselves are adopter-defined and ship
 * outside this library.
 */

import { readFile } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import type { Profile } from "../repo-kind.js";
import type {
  ArchetypeDeclaration,
  ArchetypeRegistry,
} from "./types.js";

interface RawArchetype {
  id?: unknown;
  description?: unknown;
  applies_to_profile?: unknown;
  template_source?: unknown;
  service_type?: unknown;
  required_vars?: unknown;
  optional_vars?: unknown;
}

interface RawRegistry {
  version?: unknown;
  archetypes?: unknown;
}

export async function loadRegistry(
  registryPath: string,
): Promise<ArchetypeRegistry> {
  const raw = await readFile(registryPath, "utf8");
  const parsed = parseYaml(raw) as RawRegistry;

  if (!parsed || typeof parsed !== "object") {
    throw new Error(`Registry at ${registryPath} did not parse to an object`);
  }

  const version = typeof parsed.version === "string" ? parsed.version : "0.0.0";
  if (!Array.isArray(parsed.archetypes)) {
    throw new Error(`Registry at ${registryPath} is missing "archetypes" array`);
  }

  const registryDir = dirname(registryPath);
  const archetypes = parsed.archetypes.map((entry, index) =>
    validateArchetype(entry, index, registryDir, registryPath),
  );
  return { version, archetypes };
}

export function filterByProfile(
  registry: ArchetypeRegistry,
  profile: Profile,
): ArchetypeDeclaration[] {
  return registry.archetypes.filter(
    (archetype) => archetype.applies_to_profile === profile,
  );
}

export function findArchetype(
  registry: ArchetypeRegistry,
  id: string,
): ArchetypeDeclaration | undefined {
  return registry.archetypes.find((archetype) => archetype.id === id);
}

function validateArchetype(
  raw: unknown,
  index: number,
  registryDir: string,
  registryPath: string,
): ArchetypeDeclaration {
  const ctx = `archetype[${index}] in ${registryPath}`;
  if (!raw || typeof raw !== "object") {
    throw new Error(`${ctx}: must be an object`);
  }
  const entry = raw as RawArchetype;

  const id = requireString(entry.id, `${ctx}.id`);
  const description = requireString(entry.description, `${ctx}.description`);
  const profile = requireProfile(
    entry.applies_to_profile,
    `${ctx}.applies_to_profile`,
  );
  const templateSourceRel = requireString(
    entry.template_source,
    `${ctx}.template_source`,
  );
  const serviceType = requireString(entry.service_type, `${ctx}.service_type`);
  const requiredVars = requireStringArray(
    entry.required_vars,
    `${ctx}.required_vars`,
  );
  const optionalVars = entry.optional_vars === undefined
    ? []
    : requireStringArray(entry.optional_vars, `${ctx}.optional_vars`);

  const absoluteTemplateSource = isAbsolute(templateSourceRel)
    ? templateSourceRel
    : resolve(registryDir, templateSourceRel);

  return {
    id,
    description,
    applies_to_profile: profile,
    template_source: absoluteTemplateSource,
    service_type: serviceType,
    required_vars: requiredVars,
    optional_vars: optionalVars,
  };
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function requireStringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array of strings`);
  }
  return value.map((v, i) => requireString(v, `${label}[${i}]`));
}

function requireProfile(value: unknown, label: string): Profile {
  const s = requireString(value, label);
  if (s !== "platform" && s !== "application" && s !== "integration") {
    throw new Error(
      `${label} must be one of: platform | application | integration (got ${s})`,
    );
  }
  return s;
}
