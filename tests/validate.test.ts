import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  checkManifest,
  checkArchetypeMetadata,
  type ManifestVocabulary,
} from "../src/validate/index.js";

let workDir: string;

beforeAll(async () => {
  workDir = await mkdtemp(join(tmpdir(), "cli-core-validate-"));
});

afterAll(async () => {
  await rm(workDir, { recursive: true, force: true });
});

describe("validate/manifest", () => {
  it("accepts a valid manifest with no vocabulary constraints", async () => {
    const path = join(workDir, "manifest-ok.yaml");
    await writeFile(
      path,
      `repo: exampleorg/svc-demo\ndomain: ecosystem\nservice_type: api_service\ndescription: A demo service used for testing purposes.\n`,
      "utf8",
    );
    const result = await checkManifest(path);
    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("flags an invalid repo pattern", async () => {
    const path = join(workDir, "manifest-bad-repo.yaml");
    await writeFile(
      path,
      `repo: not-a-valid-repo\ndomain: ecosystem\nservice_type: api_service\ndescription: Long enough description for the check.\n`,
      "utf8",
    );
    const result = await checkManifest(path);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.field === "repo")).toBe(true);
  });

  it("enforces vocabulary when provided", async () => {
    const path = join(workDir, "manifest-vocab.yaml");
    await writeFile(
      path,
      `repo: exampleorg/svc-x\ndomain: notinvocab\nservice_type: also_not_in_vocab\ndescription: Long enough description for the check.\n`,
      "utf8",
    );
    const vocab: ManifestVocabulary = {
      domains: ["a", "b"],
      serviceTypes: ["api_service"],
    };
    const result = await checkManifest(path, vocab);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.field === "domain")).toBe(true);
    expect(result.issues.some((i) => i.field === "service_type")).toBe(true);
  });

  it("flags missing required fields", async () => {
    const path = join(workDir, "manifest-incomplete.yaml");
    await writeFile(path, `repo: exampleorg/svc-x\n`, "utf8");
    const result = await checkManifest(path);
    expect(result.ok).toBe(false);
    expect(result.issues.map((i) => i.field)).toContain("domain");
  });
});

describe("validate/archetype-metadata", () => {
  it("returns present:false for a non-existent repo path", async () => {
    const result = await checkArchetypeMetadata(
      join(workDir, "does-not-exist"),
    );
    expect(result.present).toBe(false);
    expect(result.ok).toBe(true);
  });

  it("warns on missing expected files", async () => {
    const repoPath = join(workDir, "service-repo");
    await mkdir(repoPath, { recursive: true });
    const result = await checkArchetypeMetadata(repoPath);
    expect(result.present).toBe(true);
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues.every((i) => i.level === "warn")).toBe(true);
  });

  it("passes when all expected files are present", async () => {
    const repoPath = join(workDir, "service-repo-full");
    await mkdir(join(repoPath, "src"), { recursive: true });
    await writeFile(join(repoPath, "package.json"), "{}", "utf8");
    await writeFile(join(repoPath, "tsconfig.json"), "{}", "utf8");
    const result = await checkArchetypeMetadata(repoPath);
    expect(result.present).toBe(true);
    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("honours a custom expected-files list", async () => {
    const repoPath = join(workDir, "service-repo-custom");
    await mkdir(repoPath, { recursive: true });
    await writeFile(join(repoPath, "go.mod"), "", "utf8");
    const result = await checkArchetypeMetadata(repoPath, {
      expectedFiles: ["go.mod", "main.go"],
    });
    expect(result.issues.some((i) => i.message.includes("main.go"))).toBe(true);
    expect(result.issues.some((i) => i.message.includes("go.mod"))).toBe(false);
  });
});
