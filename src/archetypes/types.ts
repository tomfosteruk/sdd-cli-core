import type { Profile } from "../repo-kind.js";

export interface ArchetypeDeclaration {
  id: string;
  description: string;
  applies_to_profile: Profile;
  template_source: string;
  service_type: string;
  required_vars: string[];
  optional_vars: string[];
}

export interface ArchetypeRegistry {
  version: string;
  archetypes: ArchetypeDeclaration[];
}

export interface RenderVars {
  [key: string]: string;
}

export interface RenderedOutcome {
  status: "rendered";
  /** Files actually written to disk. Empty when `dryRun` is true. */
  writtenFiles: string[];
  /** Files skipped because they already existed and weren't in `overwritePaths`. */
  skippedFiles: string[];
  /** Files that would be written. Equal to writtenFiles outside dry-run; populated in dry-run. */
  plannedFiles: string[];
}

export type RenderOutcome =
  | RenderedOutcome
  | { status: "refused"; reason: string };
