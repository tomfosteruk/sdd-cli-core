import { describe, it, expect } from "vitest";
import {
  REPO_KIND_FILE,
  isRepoKind,
  profileFromRepoKind,
  readRepoKind,
  findSddRoot,
  discoverSddRepos,
  type Profile,
  type RepoKind,
  type DiscoveredRepo,
} from "../src/index.js";

describe("root exports", () => {
  it("exposes the repo-kind marker filename", () => {
    expect(REPO_KIND_FILE).toBe(".sdd-repo-kind");
  });

  it("classifies the three profile values", () => {
    const platform: Profile = profileFromRepoKind("platform-product");
    const application: Profile = profileFromRepoKind("application-product");
    const integration: Profile = profileFromRepoKind("integration-product");
    expect(platform).toBe("platform");
    expect(application).toBe("application");
    expect(integration).toBe("integration");
  });

  it("isRepoKind narrows on valid values", () => {
    expect(isRepoKind("platform-product")).toBe(true);
    expect(isRepoKind("application-product")).toBe(true);
    expect(isRepoKind("integration-product")).toBe(true);
    expect(isRepoKind("not-a-kind")).toBe(false);
  });

  it("readRepoKind returns null for a non-SDD directory", async () => {
    const value = await readRepoKind("/tmp");
    expect(value).toBeNull();
  });

  it("findSddRoot returns null when no marker is found", async () => {
    const root = await findSddRoot("/tmp");
    expect(root).toBeNull();
  });

  it("discoverSddRepos returns an empty array for empty input", async () => {
    const repos: DiscoveredRepo[] = await discoverSddRepos([]);
    expect(repos).toEqual([]);
  });

  it("RepoKind type aliases compile", () => {
    const kinds: RepoKind[] = [
      "platform-product",
      "application-product",
      "integration-product",
    ];
    expect(kinds).toHaveLength(3);
  });
});
