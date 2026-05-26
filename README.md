# @sdd-method/cli-core

Upstream shared TypeScript/Node core for SDD adopter `partner-cli` and `platform-cli` binaries. Implements the method-defined surfaces every SDD adopter's code-CLI pair recurs against per [ADR 0118](https://github.com/tomfosteruk/sdd-method/blob/main/docs/method/adr/ADR%200118:%20Partner%20CLI%20Role%20Framework.md) + [ADR 0120](https://github.com/tomfosteruk/sdd-method/blob/main/docs/method/adr/ADR%200120:%20Upstream%20Code-CLI%20Core%20Library%20for%20Partner%20and%20Platform%20CLIs.md) + [ADR 0127](https://github.com/tomfosteruk/sdd-method/blob/main/docs/method/adr/ADR%200127:%20CLIs%20as%20the%20Method%20Enforcement%20Primitive.md).

Scope is locked in [ADR 0152](https://github.com/tomfosteruk/sdd-method/blob/main/docs/method/adr/ADR%200152:%20Upstream%20Code-CLI%20Core%20Library%20Scope%20and%20API%20Surface.md). The [LIBRARY_SPEC.md](LIBRARY_SPEC.md) in this repo records the v0.1.0 public surface contract per ADR 0152 §6.1.

## Installation

```bash
npm install @sdd-method/cli-core
```

Adopters consume sub-module exports directly:

```ts
import { findSddRoot, discoverSddRepos } from "@sdd-method/cli-core";
import { loadRegistry, renderArchetype } from "@sdd-method/cli-core/archetypes";
import { jsonContent, getSddClient } from "@sdd-method/cli-core/mcp";
import { checkManifest, checkArchetypeMetadata } from "@sdd-method/cli-core/validate";
import { runContractsVerb } from "@sdd-method/cli-core/pins/contracts";
import { runArtifactsVerb } from "@sdd-method/cli-core/pins/artifacts";
```

## v0.1.0 public surface

Eight sub-module export groups, per ADR 0152 §4.3:

| Sub-module export | Purpose | Anchored in |
|---|---|---|
| **root** (`@sdd-method/cli-core`) | Workspace + repo-kind discovery — `findSddRoot`, `discoverSddRepos`, `readRepoKind`, `profileFromRepoKind`, `isRepoKind`, `REPO_KIND_FILE`, types `Profile`, `RepoKind`, `DiscoveredRepo` | ADR 0045 sibling-SDD layout, ADR 0118 profile framework |
| `./archetypes` | Archetype registry + render primitives + repo-config writer — `loadRegistry`, `filterByProfile`, `findArchetype`, `renderArchetype`, `writeRepoConfigEntry`, types `ArchetypeRegistry`, `ArchetypeDeclaration`, `RenderOptions`, `RenderOutcome`, `RenderVars`, `WriteRepoConfigInputs`, `WriteRepoConfigResult` | ADR 0118 §6 archetype-output compliance |
| `./stability` | Stability-class surfacing shape — `checkStabilityClass`, types `StabilityContext`, `StabilityCheckResult` | ADR 0118 §4.5, ADR 0127 verb stability semantics |
| `./pins` (and split sub-paths) | Pin-verb delegation shims — `runContractsVerb`, `runArtifactsVerb`, types `ContractsVerbOptions`, `ContractsVerbResult`, `ArtifactsVerbOptions`, `ArtifactsVerbResult` | ADR 0110 cross-SDD contract pins, ADR 0113 runtime artefact pins |
| `./mcp` | MCP envelope + lifecycle + sdd-mcp composition client — `jsonContent`, `errorContent`, `dedupeSources`, `getSddClient`, `shutdownSddClient`, `parseSddToolResult`, `runMcpServer`, `McpEnvelopeError`, types `McpErrorEnvelope`, `CompositionResult`, `SddClientOptions`, `ParsedSddToolResult`, `RunMcpServerOptions` | ADR 0130 Adopter MCP Composition Pattern |
| `./validate` | Manifest + archetype-metadata validators — `checkManifest`, `checkArchetypeMetadata`, types `ManifestCheckIssue`, `ManifestCheckResult`, `ManifestVocabulary`, `ArchetypeMetadataCheckIssue`, `ArchetypeMetadataCheckResult`, `ArchetypeMetadataCheckOptions` | ADR 0143 – ADR 0147 canonical manifest schemas |

## Out of scope for v0.1.0

Six surfaces present in adopter reference implementations but explicitly NOT upstream (per ADR 0152 §4.3):

- Vocabulary validators (banned-vocabulary, README vocabulary, vocabulary config) — adopter-defined.
- Tsconfig compliance check — adopter-shaped tsconfig conventions.
- Eslint `any`-ban check — adopter-shaped lint config.
- Catalog operations — adopter catalogue portal; `sdd-cli catalogue` covers the method-CLI side.
- Doctor diagnostics — adopter-shaped environment checks (binary-version, container-runtime, linter, runtime).
- Telemetry emission — adopter-shaped observability stack.

Authentication flow is **candidate for v0.2.0+** pending a second-adopter signal on whether the OIDC/OAuth abstraction generalises (ADR 0152 §4.3).

## Semver discipline

Portable-contract semver per [ADR 0141](https://github.com/tomfosteruk/sdd-method/blob/main/docs/method/adr/ADR%200141:%20Agent-Harness-Neutral%20Skills%20and%20Hooks.md). The public surface documented above and in `LIBRARY_SPEC.md` is the source of truth — a change to a documented surface element is MAJOR. Pre-1.0 narrowing via `^0.x.y` per npm convention. v1.0.0 cuts after the surface stabilises across at least two adopters (ADR 0152 §4.4).

## Development

```bash
npm install
npm run build       # tsc -> dist/
npm run typecheck   # tsc --noEmit
npm test            # build + vitest run
```

Node ≥ 20 required.

## License

[Apache-2.0](LICENSE).
