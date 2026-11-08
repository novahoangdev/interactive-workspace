# Project Agent Instructions

## Project
**Name:** interactive-workspace  
**Purpose:** An interactive 3D workspace showcasing my desk setup, profile, projects, and professional journey.  
**Primary users:** Recruiters, hiring managers, and collaborators exploring my profile and projects

Read `README.md` before significant implementation.

Also read `DECISIONS.md` for durable decisions, `docs/architecture.md` when structure/data flow matters, and `docs/design-system.md` for UI work. Project skills live in `.agents/skills/` (`3d-interaction-quality`, `webgl-performance`).

## Safety
- Inside the dev-workspace, read and follow the workspace `../../AGENTS.md` and `../../WORKFLOW.md` (Claude Code loads them automatically; Codex and Copilot do not).
- Do not commit, push, create/merge PRs, deploy, or publish without explicit approval; each approval covers only that action.
- Ask before destructive or hard-to-reverse actions (`rm -rf`, `git reset --hard`, force push, data deletion, production changes).
- Never commit secrets (`.env`, keys, tokens).

## Priorities
1. Correctness
2. Simplicity
3. Existing-code consistency
4. Maintainability
5. Performance when relevant

## Stack
- Language: TypeScript
- Framework: React 19, Three.js, Tailwind CSS v4
- Package manager: Bun
- Build tool: Vite

## Commands
Install: `bun install`  
Dev: `bun run dev`  
Type check: `bun run lint`  
Build: `bun run build`

## Architecture boundaries
TODO: list only important boundaries agents must not violate.

## Coding conventions
Follow existing patterns. Prefer small focused functions/components. Keep business logic separate from presentation when practical. Avoid unsafe escape hatches without reason. Do not introduce competing state/styling/validation/data-fetching approaches.

Project-specific rules:
- TODO

## UI
If applicable, reuse existing components/tokens, preserve responsive behavior, support keyboard/focus behavior, handle relevant loading/empty/error/disabled states, and follow `docs/design-system.md`.

## Verification
Add/update the smallest useful test when tests exist. Reproduce bugs before fixing when practical. Run relevant commands before finishing. Never claim checks that were not run.

## Scope
No unrelated refactors, cleanup, redesign, or fashionable architecture changes. Mention unrelated issues rather than fixing them without permission.

## Documentation
Update durable knowledge only: README for setup, DECISIONS for decisions, architecture docs for structure/data flow, design system for reusable UI rules.

## Definition of done
Requested behavior works; relevant edge cases are handled; applicable verification passes; unrelated changes were avoided; durable docs are updated when necessary.
