# SDK Deprecation Policy

This document explains how deprecated APIs are handled in the SynqedAI TypeScript SDK.

---

# What is a Deprecated API?

A deprecated API is an API that is still supported but scheduled for removal in a future major release.

Deprecated APIs should not be used in new implementations.

---

# Deprecation Rules

Deprecated APIs:

- must use the `@deprecated` TSDoc tag
- must include migration guidance
- must include removal timeline
- must remain supported until the next MAJOR release

---

# Example

```ts
/**
 * @deprecated Use client.chat.create instead.
 * Will be removed in v2.
 */
export function createChat() {}