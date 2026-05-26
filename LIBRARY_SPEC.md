# @sdd-method/cli-core — Library Specification

This document records the public surface contract for `@sdd-method/cli-core` per [ADR 0152 §6.1](https://github.com/tomfosteruk/sdd-method/blob/main/docs/method/adr/ADR%200152:%20Upstream%20Code-CLI%20Core%20Library%20Scope%20and%20API%20Surface.md). The scope rationale, in/out decisions per domain, and pre-1.0 release-line discipline live in ADR 0152 — this file does not duplicate that content; it points at it.

## What's in scope for v0.1.0

The eight sub-module export groups enumerated in [README.md § v0.1.0 public surface](README.md#v010-public-surface), matching ADR 0152 §4.3 "In" rows.

## What's out of scope

The six sub-module export groups listed in [README.md § Out of scope for v0.1.0](README.md#out-of-scope-for-v010), matching ADR 0152 §4.3 "Out" rows. Authentication flow is the one "Candidate (v0.2.0+)" surface.

## Versioning

Portable-contract semver per ADR 0141. See [README.md § Semver discipline](README.md#semver-discipline) and ADR 0152 §4.4.

## What is the "public surface"?

Everything re-exported from:

- The package root (`./index.ts` → `@sdd-method/cli-core`).
- The sub-module entry points (`./archetypes/index.ts` → `@sdd-method/cli-core/archetypes`, etc.) declared in `package.json` `exports`.

Internal modules NOT re-exported from these entry points are free to change without MAJOR — for example, helper functions inside `src/archetypes/registry.ts` that aren't re-exported from `src/archetypes/index.ts` can move, rename, or disappear without a major bump.

## Cross-reference rule

This library MAY reference [sdd-method](https://github.com/tomfosteruk/sdd-method) (method canon — ADRs, methods, foundations). It MUST NOT reference sdd-method-gov anywhere (governance docs).

## What lands when

| Surface | When |
|---|---|
| Eight v0.1.0 sub-modules | v0.1.0 (this release) |
| Authentication flow | v0.2.0+ (pending second-adopter signal) |
| v1.0.0 surface lock | After two adopters validate against v0.x (parallel to ADR 0141 / 0148 / 0151 two-adopter discipline) |
