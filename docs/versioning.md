# SDK Versioning Policy

## Semantic Versioning

This SDK follows Semantic Versioning:

- MAJOR → breaking changes
- MINOR → new backward-compatible features
- PATCH → bug fixes

---

## Public API Surface

Only exports from package root are public APIs.

Example:

```ts
import { SynqedClient } from '@synqedai/typescript';