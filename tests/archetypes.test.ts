import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  loadRegistry,
  filterByProfile,
  findArchetype,
  renderArchetype,
  writeRepoConfigEntry,
  type ArchetypeRegistry,
  type RenderOptions,
} from "../src/archetypes/index.js";

let workDir: string;

beforeAll(async () => {
  workDir = await mkdtemp(join(tmpdir(), "cli-core-archetypes-"));
});

afterAll(async () => {
  await rm(workDir, { recursive: true, force: true });
});

describe("archetypes/registry", () => {
  it("loads a minimal registry and exposes filters", async () => {
    const templatesDir = join(workDir, "templates", "svc-a");
    await mkdir(templatesDir, { recursive: true });
    await writeFile(join(templatesDir, "README.md.hbs"), "# {{service_name}}", "utf8");

    const registryPath = join(workDir, "registry.yaml");
    await writeFile(
      registryPath,
      `version: "1.0.0"\narchetypes:\n  - id: svc-a\n    description: A test service archetype\n    applies_to_profile: platform\n    template_source: templates/svc-a\n    service_type: api_service\n    required_vars: [service_name]\n`,
      "utf8",
    );

    const registry: ArchetypeRegistry = await loadRegistry(registryPath);
    expect(registry.version).toBe("1.0.0");
    expect(registry.archetypes).toHaveLength(1);
    expect(filterByProfile(registry, "platform")).toHaveLength(1);
    expect(filterByProfile(registry, "application")).toHaveLength(0);
    expect(findArchetype(registry, "svc-a")?.id).toBe("svc-a");
    expect(findArchetype(registry, "missing")).toBeUndefined();
  });

  it("rejects an invalid registry", async () => {
    const bad = join(workDir, "bad.yaml");
    await writeFile(bad, "not: a registry\n", "utf8");
    await expect(loadRegistry(bad)).rejects.toThrow(/archetypes/);
  });
});

describe("archetypes/render", () => {
  it("renders templates with variable substitution", async () => {
    const templatesDir = join(workDir, "tmpl-render");
    await mkdir(templatesDir, { recursive: true });
    await writeFile(
      join(templatesDir, "hello.txt.hbs"),
      "Hello {{name}}!\n",
      "utf8",
    );

    const target = join(workDir, "rendered-output");
    const options: RenderOptions = { allowExisting: false };
    const outcome = await renderArchetype(
      {
        id: "test",
        description: "test",
        applies_to_profile: "platform",
        template_source: templatesDir,
        service_type: "api_service",
        required_vars: ["name"],
        optional_vars: [],
      },
      { name: "world" },
      target,
      options,
    );

    expect(outcome.status).toBe("rendered");
    if (outcome.status === "rendered") {
      expect(outcome.writtenFiles).toHaveLength(1);
    }
  });

  it("refuses an occupied target dir without allowExisting", async () => {
    const templatesDir = join(workDir, "tmpl-refuse");
    await mkdir(templatesDir, { recursive: true });
    await writeFile(join(templatesDir, "x.txt"), "", "utf8");

    const target = join(workDir, "occupied");
    await mkdir(target, { recursive: true });
    await writeFile(join(target, "preexisting"), "", "utf8");

    const outcome = await renderArchetype(
      {
        id: "test",
        description: "test",
        applies_to_profile: "platform",
        template_source: templatesDir,
        service_type: "api_service",
        required_vars: [],
        optional_vars: [],
      },
      {},
      target,
      { allowExisting: false },
    );

    expect(outcome.status).toBe("refused");
  });
});

describe("archetypes/repo-config", () => {
  it("writes a repo-config entry stub", async () => {
    const sddRoot = join(workDir, "sdd-root");
    await mkdir(sddRoot, { recursive: true });

    const result = await writeRepoConfigEntry({
      sddRoot,
      domain: "ecosystem",
      serviceName: "demo-service",
      serviceType: "api_service",
      archetypeId: "svc-a",
      repoOrg: "exampleorg",
      overwrite: false,
      scaffolderName: "platform-cli",
      scaffolderVersion: "1.0.0",
    });

    expect(result.status).toBe("written");
    expect(result.path).toContain("ecosystem/demo-service.yaml");
  });

  it("skips an existing entry when overwrite is false", async () => {
    const sddRoot = join(workDir, "sdd-root-2");
    await mkdir(join(sddRoot, "orchestration/repo-config/ecosystem"), {
      recursive: true,
    });
    await writeFile(
      join(sddRoot, "orchestration/repo-config/ecosystem/demo.yaml"),
      "preexisting",
      "utf8",
    );

    const result = await writeRepoConfigEntry({
      sddRoot,
      domain: "ecosystem",
      serviceName: "demo",
      serviceType: "api_service",
      archetypeId: "svc-a",
      repoOrg: "exampleorg",
      overwrite: false,
      scaffolderName: "platform-cli",
      scaffolderVersion: "1.0.0",
    });

    expect(result.status).toBe("skipped");
  });
});
