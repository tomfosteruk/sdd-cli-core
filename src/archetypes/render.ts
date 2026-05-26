/**
 * Archetype-render primitives. Materialises a declared archetype's
 * template_source tree into a target directory with `{{var_name}}`
 * substitution from RenderVars. Adopters compose their archetypes
 * against this primitive; the templates themselves ship in the adopter
 * archetype declarations, not in this library.
 */

import {
  access,
  copyFile,
  mkdir,
  readdir,
  readFile,
  stat,
  writeFile,
} from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import type {
  ArchetypeDeclaration,
  RenderOutcome,
  RenderVars,
} from "./types.js";

export interface RenderOptions {
  allowExisting: boolean;
  /**
   * Target-relative paths that MAY be overwritten when they already exist.
   * When `allowExisting` is true, any existing file NOT in this list is
   * preserved (skipped). When `allowExisting` is false this has no effect —
   * render refuses entirely on an occupied directory.
   *
   * Paths are compared by their final on-disk name (the template's `.hbs`
   * suffix is stripped before matching). Use forward slashes.
   */
  overwritePaths?: readonly string[];
  /**
   * Preview mode: compute the intended operations and return them without
   * writing anything. The target directory is not created. Useful for agent
   * workflows that want to confirm a scaffold plan before committing.
   */
  dryRun?: boolean;
}

const TEMPLATE_EXT = ".hbs";
const VAR_PATTERN = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function renderArchetype(
  archetype: ArchetypeDeclaration,
  vars: RenderVars,
  targetDir: string,
  options: RenderOptions,
): Promise<RenderOutcome> {
  validateVars(archetype, vars);

  if (!options.allowExisting && (await targetDirIsOccupied(targetDir))) {
    return {
      status: "refused",
      reason: `Target directory ${targetDir} already exists and is not empty. Pass --allow-existing to render on top of it.`,
    };
  }

  const dryRun = options.dryRun === true;
  const overwritePaths = new Set<string>(options.overwritePaths ?? []);
  const written: string[] = [];
  const skipped: string[] = [];
  const planned: string[] = [];

  if (!dryRun) {
    await mkdir(targetDir, { recursive: true });
  }

  for await (const templateFile of walkFiles(archetype.template_source)) {
    const rel = relative(archetype.template_source, templateFile);
    const outRel = rel.endsWith(TEMPLATE_EXT)
      ? rel.slice(0, -TEMPLATE_EXT.length)
      : rel;
    const outPath = join(targetDir, outRel);
    const normalisedRel = outRel.split("\\").join("/");

    if (options.allowExisting && !overwritePaths.has(normalisedRel)) {
      if (await fileExists(outPath)) {
        skipped.push(outPath);
        continue;
      }
    }

    planned.push(outPath);

    if (dryRun) {
      continue;
    }

    await mkdir(dirname(outPath), { recursive: true });
    if (rel.endsWith(TEMPLATE_EXT)) {
      const raw = await readFile(templateFile, "utf8");
      const rendered = substitute(raw, vars, templateFile);
      await writeFile(outPath, rendered, "utf8");
    } else {
      await copyFile(templateFile, outPath);
    }
    written.push(outPath);
  }

  return {
    status: "rendered",
    writtenFiles: written,
    skippedFiles: skipped,
    plannedFiles: planned,
  };
}

function validateVars(
  archetype: ArchetypeDeclaration,
  vars: RenderVars,
): void {
  const missing = archetype.required_vars.filter(
    (name) => typeof vars[name] !== "string" || vars[name]?.length === 0,
  );
  if (missing.length > 0) {
    throw new Error(
      `Archetype ${archetype.id} is missing required vars: ${missing.join(", ")}`,
    );
  }
}

async function targetDirIsOccupied(dir: string): Promise<boolean> {
  try {
    const entries = await readdir(dir);
    return entries.length > 0;
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw err;
  }
}

async function* walkFiles(dir: string): AsyncGenerator<string> {
  const entries = await readdir(dir);
  for (const entry of entries) {
    const full = join(dir, entry);
    const s = await stat(full);
    if (s.isDirectory()) {
      yield* walkFiles(full);
    } else {
      yield full;
    }
  }
}

function substitute(
  content: string,
  vars: RenderVars,
  sourcePath: string,
): string {
  return content.replace(VAR_PATTERN, (match, name: string) => {
    if (!(name in vars)) {
      throw new Error(
        `Unknown template variable "${name}" in ${sourcePath}. Provide it via --${name.replace(/_/g, "-")} or an archetype required_vars declaration.`,
      );
    }
    return vars[name] ?? "";
  });
}
