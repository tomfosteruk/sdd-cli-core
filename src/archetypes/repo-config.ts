/**
 * Repo-config entry writer — emits an `orchestration/repo-config/<domain>/<service>.yaml`
 * stub for a newly-scaffolded service per the method-canonical layout from
 * ADR 0106. The scaffolder name + version are parameterised so adopters
 * stamp their own binary identity into the banner.
 */

import { access, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { stringify as stringifyYaml } from "yaml";

export interface WriteRepoConfigInputs {
  sddRoot: string;
  domain: string;
  serviceName: string;
  serviceType: string;
  archetypeId: string;
  repoOrg: string;
  /** If false and the file exists, refuse to write. Default semantics. */
  overwrite: boolean;
  /** Name of the scaffolding tool to stamp into the banner (e.g. the adopter binary name). */
  scaffolderName: string;
  /** Version string to stamp into the banner alongside the scaffolder name. */
  scaffolderVersion: string;
  /** Preview-only mode: compute the intended write path without writing. */
  dryRun?: boolean;
}

export interface WriteRepoConfigResult {
  /** `written` when the file was (or would be) created; `skipped` when it already existed and `overwrite` is false; `refused` for hard failures. */
  status: "written" | "skipped" | "refused";
  path: string;
  reason?: string;
}

export async function writeRepoConfigEntry(
  inputs: WriteRepoConfigInputs,
): Promise<WriteRepoConfigResult> {
  const {
    sddRoot,
    domain,
    serviceName,
    serviceType,
    archetypeId,
    repoOrg,
    overwrite,
    scaffolderName,
    scaffolderVersion,
    dryRun,
  } = inputs;
  const configDir = join(sddRoot, "orchestration/repo-config", domain);
  const configPath = join(configDir, `${serviceName}.yaml`);

  if (!overwrite && (await fileExists(configPath))) {
    return {
      status: "skipped",
      path: configPath,
      reason: `repo-config entry already exists at ${configPath} (pass overwrite: true to replace)`,
    };
  }

  if (dryRun === true) {
    return { status: "written", path: configPath };
  }

  await mkdir(configDir, { recursive: true });

  const body = {
    repo: `${repoOrg}/${serviceName}`,
    domain,
    service_type: serviceType,
    description: `Scaffolded by ${scaffolderName} v${scaffolderVersion} as ${archetypeId} archetype. Replace with a real description.`,
  };

  const yaml = `# ${serviceName} - scaffolded by ${scaffolderName} v${scaffolderVersion} (archetype: ${archetypeId})\n# Replace fields with real values as the service takes shape.\n\n${stringifyYaml(body)}`;
  await writeFile(configPath, yaml, "utf8");

  return { status: "written", path: configPath };
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
