---
obs_id: 189
type: config
topic_key: sdd/portafolio/testing-capabilities
created_at: 2026-09-07 16:55:55
---

# sdd/portafolio/testing-capabilities

## Testing Capabilities

**Strict TDD Mode**: enabled (agent config marker; no local override or test runner found yet)
**Detected**: 2026-09-07

### Test Runner

- Command: — (none — no `package.json`, no scaffolded app yet)
- Framework: none

### Test Layers

| Layer       | Available | Tool |
| ----------- | --------- | ---- |
| Unit        | ❌ | — |
| Integration | ❌ | — |
| E2E         | ❌ | — |

### Coverage

- Available: ❌
- Command: —

### Quality Tools

| Tool         | Available | Command |
| ------------ | --------- | ------- |
| Linter       | ❌ | — |
| Type checker | ❌ | — |
| Formatter    | ❌ | — |

**Note**: This is a greenfield repo (no `package.json`, no app code). Strict TDD is marked enabled at the agent-config level, but there is no runner to enforce it yet. The first implementation change (Next.js scaffold) MUST add a test runner (recommended: Vitest + React Testing Library for unit/integration, Playwright for E2E) plus ESLint + TypeScript strict mode + Prettier before any TDD-governed feature work begins.
